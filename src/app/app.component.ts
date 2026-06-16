import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthenticationService } from '@core/services/authentication.service';
import { MembershipService } from '@core/services/authorization/membership.service';
import { SocketService } from '@core/services/socket.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { MaterialSymbolsNoTranslateDirective } from '@shared/directives/material-symbols-no-translate.directive';
import { LoadingService } from '@shared/services/loading.service';
import { ResetUIState } from '@shared/types/ui.types';
import {
  isDemoResetInProgressError,
  isUnrecoverableAuthError,
} from '@shared/utils/api-error.utils';
import { environment } from 'environments/environment';
import {
  catchError,
  EMPTY,
  finalize,
  iif,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { LoadingSpinnerComponent } from './core/components/loading-spinner/loading-spinner.component';
import { ColorThemeService } from './core/services/color-theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    LoadingSpinnerComponent,
    MaterialSymbolsNoTranslateDirective,
    UserAvatarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private document = inject(DOCUMENT);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private authenticationService = inject(AuthenticationService);
  private userService = inject(UserService);
  private socketService = inject(SocketService);
  private membershipService = inject(MembershipService);
  private workspaceService = inject(WorkspaceService);
  private colorThemeService = inject(ColorThemeService);
  private isAuthenticated = this.authenticationService.isAuthenticated;
  private rendererEffect = effect(() => {
    if (this.colorThemeService.currentColorTheme() === 'dark') {
      const rootElement = this.renderer.selectRootElement('body', true);
      this.renderer.addClass(rootElement, 'dark-theme');
    }
  });
  protected loadingState = this.loadingService.loadingState;
  protected resetUiState = this.loadingService.resetUiState;
  protected user = this.userService.user;
  protected scheduledResetNotice = computed(() => {
    const resetState = this.resetUiState();

    if (resetState.kind !== 'demoOwnerResetScheduled') {
      return null;
    }

    return this.getResetUiCopy(resetState);
  });

  protected loadingResetCopy = computed(() => {
    const resetState = this.resetUiState();

    if (resetState.kind === 'none') {
      return null;
    }

    return this.getResetUiCopy(resetState);
  });

  ngOnInit() {
    this.loadMaterialSymbolsFont();
    this.loadingService.startLoading();
    this.authenticationService.setMemoryAuthState();
    if (this.isAuthenticated()) {
      const userSummary =
        this.authenticationService.getLocalStorageUserSummary();

      if (!userSummary) {
        this.authenticationService
          .logout()
          .pipe(finalize(() => this.loadingService.stopLoading()))
          .subscribe();
        return;
      }
      this.userService
        .getUser(userSummary.id)
        .pipe(
          switchMap(() => {
            const user = this.userService.user();
            return iif(
              () => !user,
              this.authenticationService.logout().pipe(
                tap(() => this.loadingService.stopLoading()),
                switchMap(() => EMPTY),
              ),
              of(user!).pipe(
                switchMap((currentUser) => {
                  const workspaceId =
                    this.userService.user()?.preferences
                      .lastActiveWorkspaceId ??
                    this.userService.getFallbackWorkspaceId(currentUser);
                  return this.workspaceService.getWorkspace(workspaceId);
                }),
              ),
            );
          }),
          catchError((err: HttpErrorResponse) => {
            const user = this.userService.user();

            if (err.status === 403 && user) {
              const fallbackWorkspaceId =
                this.userService.getFallbackWorkspaceId(user);
              return this.workspaceService.getWorkspace(fallbackWorkspaceId);
            }
            return throwError(() => err);
          }),
          switchMap((workspace) => {
            const currentWorkspaceId =
              this.workspaceService.currentWorkspace()?.id;
            if (
              currentWorkspaceId &&
              this.userService.user()!.preferences.lastActiveWorkspaceId !==
                currentWorkspaceId
            ) {
              return this.userService.updateUserPreferences(
                {
                  lastActiveWorkspaceId: currentWorkspaceId,
                },
                true,
              );
            }
            return of(workspace);
          }),
          switchMap(() => this.membershipService.getWorkspaceMembers()),
          switchMap(() => this.membershipService.workspaceMembersMapDefined$),
          switchMap(() =>
            this.userService.getUserInvitations(this.userService.user()!.id),
          ),
          tap(() => {
            this.socketService.connect();
            this.loadingService.stopLoading();
          }),
          catchError((err) => {
            if (isDemoResetInProgressError(err)) {
              this.enterWorkspaceResetState(this.getPreferredWorkspaceId());
              return EMPTY;
            }

            if (isUnrecoverableAuthError(err)) {
              this.authenticationService.logoutLocally();
              this.router.navigate(['/login'], { replaceUrl: true });
              return EMPTY;
            }

            this.routeToUnexpectedError();
            return EMPTY;
          }),
          finalize(() => this.loadingService.stopLoading()),
        )

        .subscribe();
    } else {
      this.loadingService.stopLoading();
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  protected onClickSignout(): void {
    this.authenticationService.logout().subscribe();
  }

  private loadMaterialSymbolsFont(): void {
    const fonts = this.document.fonts;

    if (!fonts) {
      return;
    }

    fonts
      .load('24px "Material Symbols Outlined"')
      .then((loadedFonts) => {
        if (loadedFonts.length > 0) {
          this.document.documentElement.classList.add('material-symbols-ready');
        }
      })
      .catch(() => undefined);
  }

  private enterWorkspaceResetState(workspaceId?: string): void {
    if (this.userService.user()?.id === environment.demoUserId) {
      this.loadingService.setDemoOwnerResetActive();
    } else {
      this.loadingService.setDemoOwnerWorkspaceResetActive({
        workspaceId,
      });
    }
    this.socketService.connect();
  }

  private routeToUnexpectedError(): void {
    const retryUrl = this.router.url;

    this.loadingService.clearResetState();
    this.loadingService.stopLoading();
    this.router.navigate(['/unexpected-error'], {
      replaceUrl: true,
      state: { retryUrl },
    });
  }

  private getPreferredWorkspaceId(): string | undefined {
    const user = this.userService.user();

    if (!user) {
      return undefined;
    }

    return (
      user.preferences.lastActiveWorkspaceId ??
      this.userService.getFallbackWorkspaceId(user)
    );
  }

  private getResetUiCopy(
    resetState: ResetUIState,
  ): { mainMessage: string; secondaryMessage: string } | null {
    switch (resetState.kind) {
      case 'none':
        return null;
      case 'demoOwnerResetScheduled':
        return {
          mainMessage: 'This demo account will be reset soon.',
          secondaryMessage: `Scheduled for ${this.formatScheduledFor(resetState.scheduledFor)}. Current changes will be lost when the reset starts.`,
        };
      case 'demoOwnerResetActive':
        return {
          mainMessage: 'This demo account is being reset.',
          secondaryMessage: 'This can take a couple of minutes.',
        };
      case 'demoOwnerWorkspaceResetActive':
        return {
          mainMessage: 'This workspace is temporarily unavailable.',
          secondaryMessage:
            "Its owner's demo account is being reset. Current changes in this workspace will be lost when the reset starts.",
        };
    }
  }

  private formatScheduledFor(scheduledFor: string): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(scheduledFor));
  }
}
