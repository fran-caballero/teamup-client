import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { NotificationsService } from '@shared/services/notifications.service';
import {
  CreateFolderRequestBody,
  FolderSummary,
  SuccessResponse,
  UpdateFolderRequestBody,
} from '@shared/types/api.types';
import { Folder, Space } from '@shared/types/entities.types';
import { environment } from 'environments/environment';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';

import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root',
})
export class FolderService {
  private httpClient = inject(HttpClient);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private notificationsService = inject(NotificationsService);
  private apiUrl = environment.apiUrl;

  createFolder(spaceId: string, folderName: string): void {
    const newFolder = this.createLocalFolder(folderName);

    if (!newFolder) {
      return;
    }

    this.notificationsService.showLoadingSnackbar();

    this.httpClient
      .post<SuccessResponse<FolderSummary>>(
        `${this.apiUrl}/spaces/${spaceId}/folders`,
        {
          id: newFolder.id,
          name: folderName,
        } satisfies CreateFolderRequestBody,
      )
      .pipe(
        tap((res) => {
          this.addFolderLocally(spaceId, {
            ...newFolder,
            createdAt: res.data.createdAt,
          });
        }),
        catchError(() => {
          this.deleteFolderLocally(spaceId, newFolder.id);
          this.notificationsService.showError(
            'Failed to create folder. Please try again later.',
          );
          return EMPTY;
        }),
        finalize(() => {
          this.notificationsService.closeLoadingSnackbar();
        }),
      )
      .subscribe();
  }

  getFolderWithAncestorsInWorkspace(
    folderId: string,
  ): { parentSpace: Space; folder: Folder } | undefined {
    const currentWorkspace = this.workspaceService.currentWorkspace()!;

    for (const space of currentWorkspace.spaces) {
      const folder = space.folders.find((folder) => folder.id === folderId);
      if (folder) {
        return { parentSpace: space, folder: folder };
      }
    }

    return;
  }

  updateFolder(spaceId: string, folderId: string, newFolderName: string): void {
    const backupFolder = this.workspaceService
      .mappedWorkspace()
      ?.foldersMap.get(folderId);

    if (!backupFolder) {
      return;
    }

    const tempFolder = { ...backupFolder, name: newFolderName };

    this.updateFolderLocally(spaceId, folderId, tempFolder);

    this.httpClient
      .patch<SuccessResponse<FolderSummary>>(
        `${this.apiUrl}/folders/${folderId}`,
        {
          name: newFolderName,
        } satisfies UpdateFolderRequestBody,
      )
      .pipe(
        tap((res) => {
          this.updateFolderLocally(spaceId, folderId, {
            ...tempFolder,
            updatedBy: res.data.updatedBy,
            updatedAt: res.data.updatedAt,
          });
        }),
        catchError(() => {
          this.updateFolderLocally(spaceId, folderId, backupFolder);
          this.notificationsService.showError(
            'Failed to update folder. Please try again later.',
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deleteFolder(spaceId: string, folderId: string): Observable<void> {
    const backupFolder = this.workspaceService
      .mappedWorkspace()
      ?.foldersMap.get(folderId);
    if (!backupFolder) {
      return EMPTY;
    }

    this.deleteFolderLocally(spaceId, folderId);

    return this.httpClient
      .delete<void>(`${this.apiUrl}/folders/${folderId}`)
      .pipe(
        catchError(() => {
          this.addFolderLocally(spaceId, backupFolder);
          this.notificationsService.showError(
            'Failed to delete folder. Please try again later.',
          );
          return EMPTY;
        }),
      );
  }

  private createLocalFolder(folderName: string): Folder | undefined {
    const user = this.userService.user();

    if (!user) {
      return;
    }

    return {
      id: self.crypto.randomUUID(),
      name: folderName,
      lists: [],
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };
  }

  private addFolderLocally(spaceId: string, folderToAdd: Folder): void {
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
          return {
            ...space,
            folders: [...space.folders, folderToAdd],
          };
        }),
      };
    });
  }

  private updateFolderInSpace(
    space: Space,
    folderId: string,
    updatedFolder: Folder,
  ): Space {
    return {
      ...space,
      folders: space.folders.map((folder) => {
        if (folder.id !== folderId) {
          return folder;
        }
        return updatedFolder;
      }),
    };
  }

  private updateFolderLocally(
    spaceId: string,
    folderId: string,
    updatedFolder: Folder,
  ): void {
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
          return this.updateFolderInSpace(space, folderId, updatedFolder);
        }),
      };
    });
  }

  private deleteFolderLocally(spaceId: string, localFolderId: string): void {
    this.workspaceService.currentWorkspace.update((workspace) => {
      if (!workspace) {
        return;
      }

      return {
        ...workspace,
        spaces: workspace.spaces.map((space) => {
          if (space.id === spaceId) {
            return {
              ...space,
              folders: space.folders.filter(
                (folder) => folder.id !== localFolderId,
              ),
            };
          }
          return space;
        }),
      };
    });
  }
}
