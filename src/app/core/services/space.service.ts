import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { NotificationsService } from '@shared/services/notifications.service';
import {
  CreateSpaceRequestBody,
  SpaceSummary,
  SuccessResponse,
  UpdateSpaceRequestBody,
} from '@shared/types/api.types';
import { Space } from '@shared/types/entities.types';
import { environment } from 'environments/environment';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';

import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root',
})
export class SpaceService {
  private httpClient = inject(HttpClient);
  private workspaceService = inject(WorkspaceService);
  private userService = inject(UserService);
  private notificationsService = inject(NotificationsService);
  private apiUrl = environment.apiUrl;

  createSpace(spaceName: string): void {
    const currentWorkspaceId = this.workspaceService.currentWorkspace()?.id;
    const newSpace = this.createLocalSpace(spaceName);

    if (!currentWorkspaceId || !newSpace) {
      return;
    }

    this.notificationsService.showLoadingSnackbar();

    this.httpClient
      .post<SuccessResponse<SpaceSummary>>(
        `${this.apiUrl}/workspaces/${currentWorkspaceId}/spaces`,
        {
          id: newSpace.id,
          name: spaceName,
        } satisfies CreateSpaceRequestBody,
      )
      .pipe(
        tap((res) => {
          this.addSpaceLocally({
            ...newSpace,
            createdAt: res.data.createdAt,
          });
        }),
        catchError(() => {
          this.deleteSpaceLocally(newSpace.id);
          this.notificationsService.showError(
            'Failed to create space. Please try again later.',
          );
          return EMPTY;
        }),
        finalize(() => {
          this.notificationsService.closeLoadingSnackbar();
        }),
      )
      .subscribe();
  }

  getLocalSpaceContainingFolder(folderId: string): Space | undefined {
    return this.workspaceService
      .currentWorkspace()
      ?.spaces.find((space) =>
        space.folders.some((folder) => folder.id === folderId),
      );
  }

  updateSpace(spaceId: string, newSpaceName: string): void {
    const backupSpace = this.workspaceService
      .mappedWorkspace()
      ?.spacesMap.get(spaceId);

    if (!backupSpace) {
      return;
    }

    const tempSpace = { ...backupSpace, name: newSpaceName };

    this.updateSpaceLocally(spaceId, tempSpace);

    this.httpClient
      .patch<SuccessResponse<SpaceSummary>>(
        `${this.apiUrl}/spaces/${spaceId}`,
        {
          name: newSpaceName,
        } satisfies UpdateSpaceRequestBody,
      )
      .pipe(
        tap((res) => {
          this.updateSpaceLocally(spaceId, {
            ...tempSpace,
            updatedBy: res.data.updatedBy,
            updatedAt: res.data.updatedAt,
          });
        }),
        catchError(() => {
          this.updateSpaceLocally(spaceId, backupSpace);
          this.notificationsService.showError(
            'Failed to update space. Please try again later.',
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deleteSpace(spaceId: string): Observable<void> {
    const backupSpace = this.workspaceService
      .mappedWorkspace()
      ?.spacesMap.get(spaceId);

    if (!backupSpace) {
      return EMPTY;
    }

    this.deleteSpaceLocally(spaceId);

    return this.httpClient
      .delete<void>(`${this.apiUrl}/spaces/${spaceId}`)
      .pipe(
        catchError(() => {
          this.addSpaceLocally(backupSpace);
          this.notificationsService.showError(
            'Failed to delete space. Please try again later.',
          );
          return EMPTY;
        }),
      );
  }

  private createLocalSpace(spaceName: string): Space | undefined {
    const user = this.userService.user();

    if (!user) {
      return;
    }

    return {
      id: self.crypto.randomUUID(),
      name: spaceName,
      folders: [],
      lists: [],
      createdAt: new Date(),
      createdBy: user.id,
      updatedBy: null,
      updatedAt: null,
    };
  }

  private addSpaceLocally(spaceToAdd: Space): void {
    this.workspaceService.currentWorkspace.update((workspace) => {
      if (!workspace) {
        return;
      }
      return {
        ...workspace,
        spaces: [...workspace.spaces, spaceToAdd],
      };
    });
  }

  private updateSpaceLocally(spaceId: string, updatedSpace: Space): void {
    this.workspaceService.currentWorkspace.update((workspace) => {
      if (!workspace) {
        return;
      }
      return {
        ...workspace,
        spaces: workspace.spaces.map((space) => {
          if (space.id !== spaceId) {
            return space;
          }
          return updatedSpace;
        }),
      };
    });
  }

  private deleteSpaceLocally(spaceId: string): void {
    this.workspaceService.currentWorkspace.update((workspace) => {
      if (!workspace) {
        return;
      }
      return {
        ...workspace,
        spaces: workspace.spaces.filter((space) => space.id !== spaceId),
      };
    });
  }
}
