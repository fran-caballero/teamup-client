import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { LoadingService } from '@shared/services/loading.service';
import { NotificationsService } from '@shared/services/notifications.service';
import { SuccessResponse, WorkspaceSummary } from '@shared/types/api.types';
import {
  Folder,
  List,
  Space,
  Task,
  UserWorkspace,
  Workspace,
} from '@shared/types/entities.types';
import { parseDatesCustomizer } from '@shared/utils/object.utils';
import { environment } from 'environments/environment';
import _ from 'lodash';
import { catchError, EMPTY, finalize, Observable, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private httpClient = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private userService = inject(UserService);
  private notificationsService = inject(NotificationsService);
  private apiUrl = environment.apiUrl;
  currentWorkspace = signal<Workspace | undefined>(undefined);

  mappedWorkspace = computed(() => {
    const workspace = this.currentWorkspace();
    const spacesMap = new Map<string, Space>();
    const foldersMap = new Map<string, Folder>();
    const listsMap = new Map<string, List>();
    const tasksMap = new Map<string, Task>();

    if (!workspace) {
      return;
    }

    workspace.spaces.forEach((space) => {
      spacesMap.set(space.id, space);
      space.folders.forEach((folder) => {
        foldersMap.set(folder.id, folder);
        folder.lists.forEach((list) => {
          listsMap.set(list.id, list);
          list.tasks.forEach((task) => {
            tasksMap.set(task.id, task);
          });
        });
      });

      space.lists.forEach((list) => {
        listsMap.set(list.id, list);
        list.tasks.forEach((task) => {
          tasksMap.set(task.id, task);
        });
      });
    });

    return {
      spacesMap,
      foldersMap,
      listsMap,
      tasksMap,
    };
  });

  createWorkspace(name: string): Observable<SuccessResponse<Workspace>> {
    return this.httpClient
      .post<
        SuccessResponse<WorkspaceSummary>
      >(`${this.apiUrl}/workspaces`, { name })
      .pipe(
        tap(() => {
          this.loadingService.startLoading();
        }),
        switchMap((res) => this.getWorkspace(res.data.id)),
        tap((res) => {
          const newWorkspace: UserWorkspace = {
            id: res.data.id,
            name: name,
            role: 'super_admin',
          };
          this.userService.addWorkspaceToUser(newWorkspace);
        }),
        catchError(() => {
          this.notificationsService.showError(
            'Failed to create workspace. Please try again later.',
          );
          return EMPTY;
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  getWorkspace(workspaceId: string): Observable<SuccessResponse<Workspace>> {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      return EMPTY;
    }

    return this.httpClient
      .get<SuccessResponse<Workspace>>(
        `${this.apiUrl}/workspaces/${workspaceId}`,
        {
          headers: {
            token: accessToken,
          },
        },
      )
      .pipe(
        tap((res) => {
          const parsedWorkspace = _.cloneDeepWith(
            res.data,
            parseDatesCustomizer,
          );
          this.currentWorkspace.set(parsedWorkspace);
        }),
      );
  }

  updateWorkspace(workspaceId: string, workspaceName: string): void {
    const isCurrentWorkspace = workspaceId === this.currentWorkspace()?.id;
    const currentWorkspaceBackup = this.currentWorkspace();
    let otherWorkspaceNameBackup: string | undefined;

    if (isCurrentWorkspace) {
      this.currentWorkspace.update((workspace) => {
        if (!workspace) {
          return;
        }
        return {
          ...workspace,
          name: workspaceName,
        };
      });
    } else {
      otherWorkspaceNameBackup = this.userService.updateLocalUserWorkspaceName(
        workspaceId,
        workspaceName,
      );
    }

    if (!currentWorkspaceBackup) {
      return;
    }

    this.httpClient
      .patch<SuccessResponse<WorkspaceSummary>>(
        `${this.apiUrl}/workspaces/${workspaceId}`,
        { name: workspaceName },
      )
      .pipe(
        tap((res) => {
          if (isCurrentWorkspace) {
            this.currentWorkspace.update((workspace) => {
              if (!workspace) {
                return;
              }
              return {
                ...workspace,
                updatedBy: res.data.updatedBy,
                updatedAt: res.data.updatedAt,
              };
            });
          }
        }),
        catchError(() => {
          if (isCurrentWorkspace) {
            this.currentWorkspace.update((workspace) => {
              if (!workspace) {
                return;
              }
              return {
                ...currentWorkspaceBackup,
              };
            });
          } else {
            if (otherWorkspaceNameBackup) {
              this.userService.updateLocalUserWorkspaceName(
                workspaceId,
                otherWorkspaceNameBackup,
              );
            }
          }

          this.notificationsService.showError(
            'Failed to update workspace. Please try again later.',
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deleteWorkspace(workspaceId: string): Observable<void> {
    const user = this.userService.user();
    const backupWorkspace = this.currentWorkspace();

    if (!backupWorkspace || !user) {
      return EMPTY;
    }

    this.userService.deleteWorkspaceToUser(workspaceId);

    return this.httpClient
      .delete<void>(`${this.apiUrl}/workspaces/${workspaceId}`)
      .pipe(
        catchError(() => {
          this.currentWorkspace.set(backupWorkspace);

          const oldUserWorkspace: UserWorkspace = {
            id: backupWorkspace.id,
            name: backupWorkspace.name,
            role: 'super_admin',
          };

          this.userService.addWorkspaceToUser(oldUserWorkspace);

          this.notificationsService.showError(
            'Failed to delete workspace. Please try again later.',
          );

          return EMPTY;
        }),
      );
  }
}
