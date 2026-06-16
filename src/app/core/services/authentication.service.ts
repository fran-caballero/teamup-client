import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Injector, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MembershipService } from '@core/services/authorization/membership.service';
import { SocketService } from '@core/services/socket.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { LoadingService } from '@shared/services/loading.service';
import { NotificationsService } from '@shared/services/notifications.service';
import {
  AccessTokenResponse,
  LoginResponse,
  SuccessResponse,
} from '@shared/types/api.types';
import { Invitation } from '@shared/types/common.types';
import { UserSummary } from '@shared/types/entities.types';
import {
  isDemoResetInProgressError,
  isUnrecoverableAuthError,
} from '@shared/utils/api-error.utils';
import { environment } from 'environments/environment';
import {
  catchError,
  EMPTY,
  finalize,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private injector = inject(Injector);
  private router = inject(Router);
  private httpClient = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private notificationsService = inject(NotificationsService);
  private membershipService = inject(MembershipService);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private apiUrl = environment.apiUrl;
  isAuthenticated = signal<boolean>(false);

  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  shouldRefreshAccessToken(tokenRefreshThresholdSeconds = 60): boolean {
    const expiresAtSeconds = this.getAccessTokenExpiresAtSeconds();

    if (!expiresAtSeconds) {
      return false;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    return expiresAtSeconds - nowSeconds <= tokenRefreshThresholdSeconds;
  }

  getLocalStorageUserSummary(): UserSummary | null {
    const userSummary = localStorage.getItem('userSummary');
    if (userSummary && userSummary !== 'undefined') {
      return JSON.parse(userSummary);
    }
    return null;
  }

  setMemoryAuthState(): void {
    const authState = localStorage.getItem('isAuth') === 'true' ? true : false;
    this.isAuthenticated.set(authState);
  }

  refreshAccessToken(): Observable<SuccessResponse<AccessTokenResponse>> {
    const refreshToken = this.getRefreshToken();

    return this.httpClient
      .post<SuccessResponse<AccessTokenResponse>>(
        `${this.apiUrl}/refresh-token`,
        {
          refreshToken,
        },
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.data.accessToken);
          this.setAccessTokenExpiresAtSeconds(
            response.data.accessTokenExpiresInSeconds,
          );
        }),
      );
  }

  signup(
    username: string,
    password: string,
  ): Observable<SuccessResponse<UserSummary>> {
    return this.httpClient
      .post<SuccessResponse<UserSummary>>(`${this.apiUrl}/user`, {
        username,
        password,
      })
      .pipe(
        tap((res) => {
          this.userService.setLocalStorageUserSummary(res.data);
        }),
      );
  }

  login(
    username: string,
    password: string,
  ): Observable<SuccessResponse<Invitation[]>> {
    let tokensStored = false;

    return this.httpClient
      .post<SuccessResponse<LoginResponse>>(`${this.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(
        tap((res) => {
          this.loadingService.startLoading();
          this.setLocalStorageAuthState(true);
          this.isAuthenticated.set(true);
          this.setAccessToken(res.data.accessToken);
          this.setAccessTokenExpiresAtSeconds(
            res.data.accessTokenExpiresInSeconds,
          );
          this.setRefreshToken(res.data.refreshToken);
          this.userService.setLocalStorageUserSummary(res.data.userSummary);
          tokensStored = true;
        }),
        switchMap((res) => this.userService.getUser(res.data.userSummary.id)),
        switchMap(() => {
          const workspaceId = this.getPreferredWorkspaceId();

          if (!workspaceId) {
            return EMPTY;
          }

          return this.workspaceService.getWorkspace(workspaceId);
        }),
        switchMap((res) => {
          return this.userService.updateUserPreferences(
            {
              lastActiveWorkspaceId: res.data.id,
            },
            true,
          );
        }),
        switchMap(() => this.membershipService.getWorkspaceMembers()),
        switchMap(() => {
          const userId = this.userService.user()!.id;
          return this.userService.getUserInvitations(userId);
        }),
        tap(() => {
          this.connectSocket();
          this.router.navigate(['/home']);
        }),
        catchError((err) => {
          if (isDemoResetInProgressError(err)) {
            if (this.userService.user()?.id === environment.demoUserId) {
              this.loadingService.setDemoOwnerResetActive();
            } else {
              this.loadingService.setDemoOwnerWorkspaceResetActive({
                workspaceId: this.getPreferredWorkspaceId(),
              });
            }
            this.connectSocket();
            return of<SuccessResponse<Invitation[]>>({
              status: 'success',
              data: [],
            });
          }

          if (!tokensStored) {
            return throwError(() => err);
          }

          if (isUnrecoverableAuthError(err)) {
            this.logoutLocally();
            this.router.navigate(['/login'], { replaceUrl: true });
            return EMPTY;
          }

          this.loadingService.clearResetState();
          this.loadingService.stopLoading();
          this.router.navigate(['/unexpected-error']);

          return EMPTY;
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  logoutLocally(): void {
    this.disconnectSocket();
    this.notificationsService.clearTransientUi();
    localStorage.clear();
    this.isAuthenticated.set(false);
    this.loadingService.clearResetState();
    this.loadingService.stopLoading();
  }

  logout(): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/logout`).pipe(
      tap(() => {
        this.logoutLocally();
        this.router.navigate(['/login'], { replaceUrl: true });
      }),
      catchError(() => {
        this.logoutLocally();
        this.router.navigate(['/login'], { replaceUrl: true });
        return EMPTY;
      }),
    );
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  private setAccessTokenExpiresAtSeconds(expiresInSeconds: number): void {
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + expiresInSeconds;

    localStorage.setItem(
      'accessTokenExpiresAtSeconds',
      expiresAtSeconds.toString(),
    );
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private getAccessTokenExpiresAtSeconds(): number | null {
    const expiresAtSeconds = localStorage.getItem(
      'accessTokenExpiresAtSeconds',
    );

    if (!expiresAtSeconds) {
      return null;
    }

    return Number(expiresAtSeconds);
  }

  private setLocalStorageAuthState(authState: boolean): void {
    localStorage.setItem('isAuth', JSON.stringify(authState));
  }

  private connectSocket(): void {
    this.injector.get(SocketService).connect();
  }

  private disconnectSocket(): void {
    this.injector.get(SocketService).disconnect();
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
}
