import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@core/services/authentication.service';
import { MembershipService } from '@core/services/authorization/membership.service';
import { UserService } from '@core/services/user.service';
import { AcceptInvitationModalComponent } from '@shared/components/modals/accept-invitation-modal/accept-invitation-modal.component';
import { InfoModalComponent } from '@shared/components/modals/info-modal/info-modal.component';
import { LoadingService } from '@shared/services/loading.service';
import { NotificationsService } from '@shared/services/notifications.service';
import { Invitation, Notification } from '@shared/types/common.types';
import { User } from '@shared/types/entities.types';
import { isUnrecoverableAuthError } from '@shared/utils/api-error.utils';
import { environment } from 'environments/environment';
import { defaultIfEmpty, EMPTY, map, Observable, of, switchMap } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private dialog = inject(Dialog);
  private router = inject(Router);
  private authenticationService = inject(AuthenticationService);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private membershipService = inject(MembershipService);
  private notificationsService = inject(NotificationsService);
  private loadingService = inject(LoadingService);
  private isRefreshingAfterReset = false;
  socket?: Socket;

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
    this.isRefreshingAfterReset = false;
  }

  connect(): void {
    const accessToken = this.authenticationService.getAccessToken();

    if (!accessToken) {
      return;
    }

    if (this.socket) {
      const socketAuth = this.socket.auth as { token?: string };
      const shouldReconnectWithNewToken = socketAuth.token !== accessToken;

      socketAuth.token = accessToken;

      if (shouldReconnectWithNewToken && this.socket.connected) {
        this.socket.disconnect();
      }

      if (!this.socket.connected) {
        this.socket.connect();
      }

      return;
    }

    this.socket = io(environment.apiUrl, {
      auth: { token: accessToken },
      autoConnect: false,
    });

    this.socket.on('invitationCreated', (data: Invitation) => {
      const newNotification: Notification = {
        type: 'invitation',
        description: `You've received an invitation from ${data.inviterUsername}`,
        data: data,
        id: self.crypto.randomUUID(),
      };

      this.notificationsService.addNotification(newNotification);
      this.dialog.open(AcceptInvitationModalComponent, {
        data: newNotification,
      });
    });

    this.socket.on(
      'invitationResponded',
      (data: {
        inviteeId: string;
        inviteeUsername: string;
        isAccepted: boolean;
      }) => {
        const result = data.isAccepted ? 'accepted' : 'declined';
        this.dialog.open(InfoModalComponent, {
          data: {
            mainMessage: `${data.inviteeUsername} has ${result} your invitation.`,
          },
        });

        if (data.isAccepted) {
          this.membershipService.getWorkspaceMembers().subscribe();
        }
      },
    );

    this.socket.on(
      'demoOwnerResetScheduled',
      (data: { scheduledFor: string }) => {
        this.loadingService.setDemoOwnerResetScheduled(data.scheduledFor);

        const expiresAt = new Date(data.scheduledFor);
        const closeTime = new Date(Date.now() + 2000);

        if (expiresAt > closeTime) {
          const secondsUntilReset = Math.ceil(
            (expiresAt.getTime() - Date.now()) / 1000,
          );
          const resetInMessage = this.formatResetCountdown(secondsUntilReset);

          const mainMessage =
            'This demo account will be reset in ' + resetInMessage;
          const secondaryMessage = 'All the current changes will be lost';

          this.notificationsService.openInfoModal({
            mainMessage,
            secondaryMessage,
          });
        }
      },
    );

    this.socket.on('demoOwnerResetStarted', () => {
      this.loadingService.setDemoOwnerResetActive();
    });

    this.socket.on('demoOwnerResetCompleted', () => {
      this.refreshResetState(
        this.workspaceService.currentWorkspace()?.id ??
          this.getResetStateWorkspaceId(),
      );
    });

    this.socket.on(
      'demoOwnerWorkspaceResetScheduled',
      (data: {
        workspaceId: string;
        scheduledFor: string;
        cause: 'demoOwnerAccountReset';
        ownerId: string;
      }) => {
        if (
          this.userService.user()?.id === data.ownerId ||
          this.workspaceService.currentWorkspace()?.id !== data.workspaceId
        ) {
          return;
        }

        const expiresAt = new Date(data.scheduledFor);
        const closeTime = new Date(Date.now() + 2000);

        if (expiresAt > closeTime) {
          const secondsUntilReset = Math.ceil(
            (expiresAt.getTime() - Date.now()) / 1000,
          );
          const resetInMessage = this.formatResetCountdown(secondsUntilReset);

          const mainMessage =
            'This workspace will be reset in ' + resetInMessage;
          const secondaryMessage = 'All the current changes will be lost';

          this.notificationsService.openInfoModal({
            mainMessage,
            secondaryMessage,
          });
        }
      },
    );

    this.socket.on(
      'demoOwnerWorkspaceResetStarted',
      (data: {
        workspaceId: string;
        cause: 'demoOwnerAccountReset';
        ownerId: string;
      }) => {
        if (
          this.userService.user()?.id === data.ownerId ||
          (this.workspaceService.currentWorkspace()?.id !== data.workspaceId &&
            this.getResetStateWorkspaceId() !== data.workspaceId)
        ) {
          return;
        }

        this.loadingService.setDemoOwnerWorkspaceResetActive({
          workspaceId: data.workspaceId,
          ownerId: data.ownerId,
        });
      },
    );

    this.socket.on(
      'demoOwnerWorkspaceResetCompleted',
      (data: {
        oldWorkspaceId: string;
        newWorkspaceId: string;
        cause: 'demoOwnerAccountReset';
        ownerId: string;
      }) => {
        const currentWorkspaceId = this.workspaceService.currentWorkspace()?.id;
        const resetStateWorkspaceId = this.getResetStateWorkspaceId();

        if (
          this.userService.user()?.id === data.ownerId ||
          (currentWorkspaceId !== data.oldWorkspaceId &&
            resetStateWorkspaceId !== data.oldWorkspaceId)
        ) {
          return;
        }

        this.refreshResetState(data.newWorkspaceId);
      },
    );

    this.socket.on('connect_error', (err: Error) => {
      if (err.message === 'Invalid or expired token') {
        this.authenticationService.refreshAccessToken().subscribe({
          next: (res) => {
            (this.socket!.auth as { token: string }).token =
              res.data.accessToken;
            this.socket!.disconnect().connect();
          },
          error: (err) => {
            if (isUnrecoverableAuthError(err)) {
              this.authenticationService.logoutLocally();
              this.router.navigate(['/login'], { replaceUrl: true });
            }
          },
        });
      }
    });

    this.socket.connect();
  }

  private refreshResetState(preferredWorkspaceId?: string): void {
    if (this.isRefreshingAfterReset) {
      return;
    }

    const userId = this.userService.user()?.id;

    if (!userId) {
      this.finishResetLoading();
      return;
    }

    this.isRefreshingAfterReset = true;
    if (this.loadingService.resetUiState().kind === 'demoOwnerResetActive') {
      this.loadingService.startLoading();
    } else {
      this.loadingService.setDemoOwnerWorkspaceResetActive({
        workspaceId: preferredWorkspaceId,
      });
    }

    this.userService
      .getUser(userId)
      .pipe(
        switchMap(() => this.reloadWorkspaceContext(preferredWorkspaceId)),
        switchMap(() => this.reloadInvitations()),
      )
      .subscribe({
        next: () => {
          this.isRefreshingAfterReset = false;
          this.router.navigate(['/home']);
          this.finishResetLoading();
        },
        error: () => {
          this.isRefreshingAfterReset = false;
          this.routeToUnexpectedError();
        },
      });
  }

  private reloadWorkspaceContext(
    workspaceIdToRestore?: string,
  ): Observable<string | null> {
    const user = this.userService.user();

    if (!user) {
      return EMPTY;
    }

    const workspaceId = this.getValidWorkspaceId(user, workspaceIdToRestore);

    if (!workspaceId) {
      this.workspaceService.currentWorkspace.set(undefined);
      this.membershipService.workspaceMembers.set(undefined);
      return of(null);
    }

    return this.workspaceService.getWorkspace(workspaceId).pipe(
      switchMap((res) => this.syncLastActiveWorkspaceId(res.data.id)),
      switchMap((resolvedWorkspaceId) =>
        this.membershipService
          .getWorkspaceMembers()
          .pipe(map(() => resolvedWorkspaceId)),
      ),
    );
  }

  private syncLastActiveWorkspaceId(workspaceId: string): Observable<string> {
    const user = this.userService.user();

    if (!user || user.preferences.lastActiveWorkspaceId === workspaceId) {
      return of(workspaceId);
    }

    return this.userService
      .updateUserPreferences(
        {
          lastActiveWorkspaceId: workspaceId,
        },
        true,
      )
      .pipe(map(() => workspaceId));
  }

  private getValidWorkspaceId(
    user: User,
    workspaceIdToRestore?: string,
  ): string | null {
    if (
      workspaceIdToRestore &&
      user.workspaces.some((workspace) => workspace.id === workspaceIdToRestore)
    ) {
      return workspaceIdToRestore;
    }

    const lastActiveWorkspaceId = user.preferences.lastActiveWorkspaceId;

    if (
      lastActiveWorkspaceId &&
      user.workspaces.some(
        (workspace) => workspace.id === lastActiveWorkspaceId,
      )
    ) {
      return lastActiveWorkspaceId;
    }

    return this.userService.getFallbackWorkspaceId(user);
  }

  private finishResetLoading(): void {
    this.loadingService.clearResetState();
    this.loadingService.stopLoading();
  }

  private routeToUnexpectedError(): void {
    this.loadingService.clearResetState();
    this.loadingService.stopLoading();
    this.router.navigate(['/unexpected-error']);
  }

  private reloadInvitations(): Observable<null> {
    const userId = this.userService.user()?.id;

    if (!userId) {
      return of(null);
    }

    return this.userService.getUserInvitations(userId).pipe(
      defaultIfEmpty(undefined),
      map(() => null),
    );
  }

  private formatResetCountdown(secondsUntilReset: number): string {
    if (secondsUntilReset >= 60) {
      const minutesUntilReset = Math.round(secondsUntilReset / 60);
      return `${minutesUntilReset} ${minutesUntilReset === 1 ? 'minute' : 'minutes'}.`;
    }

    return `${secondsUntilReset} ${secondsUntilReset === 1 ? 'second' : 'seconds'}.`;
  }

  private getResetStateWorkspaceId(): string | undefined {
    const resetState = this.loadingService.resetUiState();

    if (resetState.kind !== 'demoOwnerWorkspaceResetActive') {
      return undefined;
    }

    return resetState.workspaceId;
  }
}
