import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { NotificationsService } from '@shared/services/notifications.service';
import { SuccessResponse } from '@shared/types/api.types';
import { Invitation } from '@shared/types/common.types';
import {
  Task,
  User,
  UserPreferences,
  UserSearchResult,
  UserSummary,
  UserWorkspace,
} from '@shared/types/entities.types';
import { parseDatesCustomizer } from '@shared/utils/object.utils';
import { environment } from 'environments/environment';
import _ from 'lodash';
import { catchError, EMPTY, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);
  private notificationsService = inject(NotificationsService);
  private apiUrl = environment.apiUrl;
  user = signal<User | undefined>(undefined);
  mappedPersonalList = computed(() => {
    const user = this.user();
    const tasksMap = new Map<string, Task>();

    if (!user) {
      return;
    }

    user.personalList.tasks.forEach((task) => {
      tasksMap.set(task.id, task);
    });

    return tasksMap;
  });

  signUp(
    username: string,
    password: string,
  ): Observable<SuccessResponse<User>> {
    return this.httpClient
      .post<SuccessResponse<User>>(`${this.apiUrl}/users/`, {
        username,
        password,
      })
      .pipe(
        tap((res) => {
          this.user.set(res.data);
        }),
      );
  }

  setLocalStorageUserSummary(userSummary: UserSummary): void {
    localStorage.setItem('userSummary', JSON.stringify(userSummary));
  }

  getUser(userId: string): Observable<SuccessResponse<User>> {
    return this.httpClient
      .get<SuccessResponse<User>>(`${this.apiUrl}/users/${userId}`)
      .pipe(
        tap((res) => {
          const parsedUser = _.cloneDeepWith(res.data, parseDatesCustomizer);

          this.user.set(parsedUser);
        }),
      );
  }

  getUsers(
    searchTerm: string,
    workspaceId: string,
  ): Observable<SuccessResponse<UserSearchResult[]>> {
    return this.httpClient.get<SuccessResponse<UserSearchResult[]>>(
      `${this.apiUrl}/users?search=${searchTerm}&workspaceId=${workspaceId}`,
    );
  }

  getUserInvitations(
    inviteeId: string,
  ): Observable<SuccessResponse<Invitation[]>> {
    return this.httpClient
      .get<
        SuccessResponse<Invitation[]>
      >(`${this.apiUrl}/invitations/${inviteeId}`)
      .pipe(
        tap((res) => {
          this.notificationsService.setInvitationNotifications(res.data);
        }),
      );
  }

  getFallbackWorkspaceId(user: User): string {
    const superAdminWorkspaces = user.workspaces.filter(
      (workspace) => workspace.role === 'super_admin',
    );

    superAdminWorkspaces.sort((a, b) => a.name.localeCompare(b.name));

    return superAdminWorkspaces[0].id;
  }

  updateUserPreferences(
    newPreferences: Partial<UserPreferences>,
    propagateError = false,
  ): Observable<void> {
    const user = this.user()!;
    const userId = user.id;
    const oldPreferences = user.preferences;
    const updatedPreferences = { ...oldPreferences, ...newPreferences };
    this.updateLocalUserPrefences(updatedPreferences);

    return this.httpClient
      .patch<void>(`${this.apiUrl}/users/${userId}/preferences`, newPreferences)
      .pipe(
        catchError((err) => {
          this.updateLocalUserPrefences(oldPreferences);
          if (propagateError) {
            return throwError(() => err);
          }

          return EMPTY;
        }),
      );
  }

  addWorkspaceToUser(newWorkspace: UserWorkspace): void {
    this.user.update((user) => {
      if (!user) {
        return;
      }
      return { ...user, workspaces: [...user.workspaces, newWorkspace] };
    });
  }

  deleteWorkspaceToUser(workspaceId: string): void {
    this.user.update((user) => {
      if (!user) {
        return;
      }
      return {
        ...user,
        workspaces: user.workspaces.filter(
          (workspace) => workspace.id !== workspaceId,
        ),
      };
    });
  }

  updateLocalUserWorkspaceName(
    workspaceId: string,
    workspaceName: string,
  ): string | undefined {
    let oldWorkspaceName: string | undefined;

    this.user.update((user) => {
      if (!user) {
        return;
      }

      const userWorkspaces = user?.workspaces.map((workspace) => {
        if (workspace.id !== workspaceId) {
          return workspace;
        } else {
          oldWorkspaceName = workspace.name;
          return { ...workspace, name: workspaceName };
        }
      });

      return {
        ...user,
        workspaces: userWorkspaces,
      };
    });

    return oldWorkspaceName;
  }

  private updateLocalUserPrefences(userPreferences: UserPreferences): void {
    this.user.update((user) => {
      if (!user) {
        return;
      }
      return {
        ...user,
        preferences: userPreferences,
      };
    });
  }
}
