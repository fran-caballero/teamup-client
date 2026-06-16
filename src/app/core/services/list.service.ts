import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@core/services/user.service';
import { defaultStatusColors } from '@shared/constants/status-colors.constants';
import { NotificationsService } from '@shared/services/notifications.service';
import {
  CreateListRequestBody,
  CreateStatusRequestBody,
  DefaultStatusSummary,
  ListSummary,
  SuccessResponse,
  UpdateListRequestBody,
  UpdateStatusRequestBody,
} from '@shared/types/api.types';
import {
  Folder,
  List,
  Space,
  Status,
  Task,
} from '@shared/types/entities.types';
import { StatusColor } from '@shared/types/ui.types';
import { environment } from 'environments/environment';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';

import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root',
})
export class ListService {
  private httpClient = inject(HttpClient);
  private loggerService = inject(LoggerService);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private notificationsService = inject(NotificationsService);
  private apiUrl = environment.apiUrl;
  assignedToMeList = computed<List | undefined>(() => {
    const mappedWorkspace = this.workspaceService.mappedWorkspace();
    const user = this.userService.user();

    if (!mappedWorkspace || !user) {
      return;
    }

    const assignedTasks: Task[] = [];
    const allStatuses = new Map<string, Status>();

    mappedWorkspace.listsMap.forEach((list) => {
      const assignedTasksInList = list.tasks.filter((task) =>
        task.assignees.some((assignee) => assignee.id === user.id),
      );

      if (assignedTasksInList.length > 0) {
        assignedTasks.push(...assignedTasksInList);
        list.statuses.forEach((status) => {
          if (!allStatuses.has(status.id)) {
            allStatuses.set(status.id, status);
          }
        });
      }
    });

    const assignedTasksInPersonalList = user.personalList.tasks.filter((task) =>
      task.assignees.some((assignee) => assignee.id === user.id),
    );

    if (assignedTasksInPersonalList.length > 0) {
      assignedTasks.push(...assignedTasksInPersonalList);
      user.personalList.statuses.forEach((status) => {
        if (!allStatuses.has(status.id)) {
          allStatuses.set(status.id, status);
        }
      });
    }

    const assignedToMeList: List = {
      id: 'assigned-to-me-virtual-list',
      name: 'Assigned to me',
      tasks: assignedTasks,
      statuses: Array.from(allStatuses.values()),
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };

    return assignedToMeList;
  });

  createDefaultStatuses(): Status[] | undefined {
    const user = this.userService.user();

    if (!user) {
      return;
    }

    const defaultNotStartedStatus: Status = {
      id: self.crypto.randomUUID(),
      name: 'TO DO',
      isDefault: true,
      colorHex: null,
      defaultColorId: 14,
      type: 'not_started',
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };

    const defaultActiveStatus: Status = {
      id: self.crypto.randomUUID(),
      name: 'IN PROGRESS',
      isDefault: true,
      colorHex: null,
      defaultColorId: 3,
      type: 'active',
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };

    const defaultDoneStatus: Status = {
      id: self.crypto.randomUUID(),
      name: 'COMPLETE',
      isDefault: true,
      colorHex: null,
      defaultColorId: 6,
      type: 'done',
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };

    return [defaultNotStartedStatus, defaultActiveStatus, defaultDoneStatus];
  }

  getDefaultColor(defaultColorId: number): StatusColor | undefined {
    return defaultStatusColors.find((color) => color.id === defaultColorId);
  }

  createList(spaceId: string, listName: string, folderId: string | null): void {
    const newList = this.createLocalList(listName);
    let endpoint: string;

    if (!newList) {
      return;
    }

    const notStartedStatus = newList.statuses.find(
      (status) => status.type === 'not_started',
    );

    const activeStatus = newList.statuses.find(
      (status) => status.type === 'active',
    );

    const doneStatus = newList.statuses.find(
      (status) => status.type === 'done',
    );

    if (!notStartedStatus || !activeStatus || !doneStatus) {
      this.loggerService.internalError(
        'Error creating list: invalid default status creation logic.',
      );
      return;
    }

    if (folderId) {
      endpoint = `${this.apiUrl}/folders/${folderId}/lists`;
    } else {
      endpoint = `${this.apiUrl}/spaces/${spaceId}/lists`;
    }

    const notStartedStatusSummary: DefaultStatusSummary = {
      id: notStartedStatus.id,
      type: 'not_started',
    };

    const activeStatusSummary: DefaultStatusSummary = {
      id: activeStatus.id,
      type: 'active',
    };

    const doneStatusSummary: DefaultStatusSummary = {
      id: doneStatus.id,
      type: 'done',
    };

    const defaultStatusesSummary = [
      notStartedStatusSummary,
      activeStatusSummary,
      doneStatusSummary,
    ];

    this.notificationsService.showLoadingSnackbar();

    this.httpClient
      .post<SuccessResponse<ListSummary>>(endpoint, {
        id: newList.id,
        name: listName,
        defaultStatusesSummary,
      } satisfies CreateListRequestBody)
      .pipe(
        tap((res) => {
          this.addListLocally(spaceId, folderId, {
            ...newList,
            createdAt: res.data.createdAt,
          });
        }),
        catchError(() => {
          this.deleteListLocally(spaceId, folderId, newList.id);
          this.notificationsService.showError(
            'Failed to create list. Please try again later.',
          );
          return EMPTY;
        }),
        finalize(() => {
          this.notificationsService.closeLoadingSnackbar();
        }),
      )
      .subscribe();
  }

  getListWithAncestorsInWorkspace(
    listId: string,
  ):
    | { parentSpace: Space | null; parentFolder: Folder | null; list: List }
    | undefined {
    const personalList = this.userService.user()?.personalList;

    if (personalList && personalList.id === listId) {
      return { parentSpace: null, parentFolder: null, list: personalList };
    }

    const currentWorkspace = this.workspaceService.currentWorkspace();

    if (currentWorkspace) {
      for (const space of currentWorkspace.spaces) {
        const list = space.lists.find((list) => list.id === listId);
        if (list) {
          return { parentSpace: space, parentFolder: null, list: list };
        }

        for (const folder of space.folders) {
          const list = folder.lists.find((list) => list.id === listId);
          if (list) {
            return { parentSpace: space, parentFolder: folder, list: list };
          }
        }
      }
    }

    return;
  }

  updateList(
    spaceId: string,
    folderId: string | null,
    listId: string,
    newListName: string,
  ): void {
    const backupList = this.workspaceService
      .mappedWorkspace()
      ?.listsMap.get(listId);

    if (!backupList) {
      return;
    }

    const tempList = { ...backupList, name: newListName };

    this.updateListLocally(spaceId, folderId, listId, tempList);

    this.httpClient
      .patch<SuccessResponse<ListSummary>>(`${this.apiUrl}/lists/${listId}`, {
        name: newListName,
      } satisfies UpdateListRequestBody)
      .pipe(
        tap((res) => {
          this.updateListLocally(spaceId, folderId, listId, {
            ...tempList,
            updatedBy: res.data.updatedBy,
            updatedAt: res.data.updatedAt,
          });
        }),
        catchError(() => {
          this.updateListLocally(spaceId, folderId, listId, backupList);
          this.notificationsService.showError(
            'Failed to update list. Please try again later.',
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deleteList(
    spaceId: string,
    listId: string,
    folderId: string | null,
  ): Observable<void> {
    const backupList = this.workspaceService
      .mappedWorkspace()
      ?.listsMap.get(listId);

    this.deleteListLocally(spaceId, folderId, listId);

    if (!backupList) {
      return EMPTY;
    }

    return this.httpClient.delete<void>(`${this.apiUrl}/lists/${listId}`).pipe(
      catchError(() => {
        this.addListLocally(spaceId, folderId, backupList);
        this.notificationsService.showError(
          'Failed to delete list. Please try again later.',
        );
        return EMPTY;
      }),
    );
  }

  createStatus(
    spaceId: string,
    folderId: string | null,
    listId: string,
    statusData: CreateStatusRequestBody,
  ): void {
    const backupList = this.workspaceService
      .mappedWorkspace()
      ?.listsMap.get(listId);
    const tempStatus = this.createTempStatus(statusData);

    if (!backupList || !tempStatus) {
      return;
    }

    this.notificationsService.showLoadingSnackbar();

    this.httpClient
      .post<SuccessResponse<Status>>(
        `${this.apiUrl}/lists/${listId}/statuses`,
        statusData,
      )
      .pipe(
        tap((res) => {
          const updatedStatus = {
            ...tempStatus,
            id: res.data.id,
            createdAt: res.data.createdAt,
          };

          const updatedList = this.addStatusInList(backupList, updatedStatus);

          this.updateListLocally(spaceId, folderId, listId, updatedList);
        }),
        catchError(() => {
          this.updateListLocally(spaceId, folderId, listId, backupList);
          this.notificationsService.showError(
            'Failed to create status. Please try again later.',
          );
          return EMPTY;
        }),
        finalize(() => {
          this.notificationsService.closeLoadingSnackbar();
        }),
      )
      .subscribe();
  }

  updateStatus(
    spaceId: string | null,
    folderId: string | null,
    listId: string,
    statusId: string,
    updatedStatus: Status,
  ): void {
    const backupList = this.workspaceService
      .mappedWorkspace()
      ?.listsMap.get(listId);

    if (!backupList) {
      return;
    }

    const tempUpdatedList = this.updateStatusInList(
      backupList,
      statusId,
      updatedStatus,
    );

    this.updateListLocally(spaceId, folderId, listId, tempUpdatedList);

    this.httpClient
      .patch<SuccessResponse<Status>>(
        `${this.apiUrl}/statuses/${statusId}`,
        updatedStatus satisfies UpdateStatusRequestBody,
      )
      .pipe(
        tap((res) => {
          const updatedList = this.updateStatusInList(backupList, statusId, {
            ...updatedStatus,
            updatedBy: res.data.updatedBy,
            updatedAt: res.data.updatedAt,
          });

          this.updateListLocally(spaceId, folderId, listId, updatedList);
        }),
        catchError(() => {
          this.updateListLocally(spaceId, folderId, listId, backupList);
          this.notificationsService.showError(
            'Failed to update status. Please try again later.',
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deleteStatus(
    spaceId: string | null,
    folderId: string | null,
    listId: string,
    statusId: string,
  ): void {
    const backupList = this.workspaceService
      .mappedWorkspace()
      ?.listsMap.get(listId);

    if (!backupList) {
      return;
    }

    const tempUpdatedList = this.deleteStatusInList(backupList, statusId);

    if (!tempUpdatedList) {
      return;
    }

    this.updateListLocally(spaceId, folderId, listId, tempUpdatedList);

    this.httpClient
      .delete(`${this.apiUrl}/statuses/${statusId}`)
      .pipe(
        catchError(() => {
          this.updateListLocally(spaceId, folderId, listId, backupList);
          this.notificationsService.showError(
            'Failed to delete status. Please try again later.',
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private createLocalList(listName: string): List | undefined {
    const user = this.userService.user();
    const defaultStatuses = this.createDefaultStatuses();

    if (!user || !defaultStatuses) {
      return;
    }

    return {
      id: self.crypto.randomUUID(),
      name: listName,
      tasks: [],
      statuses: defaultStatuses,
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };
  }

  private createTempStatus(
    statusData: CreateStatusRequestBody,
  ): Status | undefined {
    const user = this.userService.user();

    if (!user) {
      return;
    }

    return {
      id: self.crypto.randomUUID(),
      name: statusData.name,
      type: statusData.type,
      isDefault: false,
      defaultColorId: statusData.defaultColorId,
      colorHex: statusData.colorHex,
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };
  }

  private addListToFolder(folder: Folder, listToAdd: List): Folder {
    return { ...folder, lists: [...folder.lists, listToAdd] };
  }

  private addListToSpace(space: Space, listToAdd: List): Space {
    return { ...space, lists: [...space.lists, listToAdd] };
  }

  private addListToFolderInSpace(
    space: Space,
    folderId: string,
    listToAdd: List,
  ): Space {
    return {
      ...space,
      folders: space.folders.map((folder) =>
        folder.id === folderId
          ? this.addListToFolder(folder, listToAdd)
          : folder,
      ),
    };
  }

  private addListLocally(
    spaceId: string,
    folderId: string | null,
    listToAdd: List,
  ) {
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

          if (folderId) {
            return this.addListToFolderInSpace(space, folderId, listToAdd);
          }
          return this.addListToSpace(space, listToAdd);
        }),
      };
    });
  }

  private addStatusInList(list: List, statusToAdd: Status): List {
    const typePriorityLevel = {
      not_started: 1,
      active: 2,
      done: 3,
    };

    function compareStatusesFn(a: Status, b: Status) {
      return typePriorityLevel[a.type] - typePriorityLevel[b.type];
    }

    const statuses = [...list.statuses, statusToAdd];

    return {
      ...list,
      statuses: statuses.sort(compareStatusesFn),
    };
  }

  private updateStatusInList(
    list: List,
    statusId: string,
    updatedStatus: Status,
  ): List {
    return {
      ...list,
      statuses: list.statuses.map((status) =>
        status.id === statusId ? updatedStatus : status,
      ),
    };
  }

  private deleteStatusInList(list: List, statusId: string): List | undefined {
    const statusToDelete = list.statuses.find(
      (status) => status.id === statusId,
    );

    const defaultStatus = list.statuses.find(
      (status) => status.type === statusToDelete?.type,
    );

    if (!defaultStatus) {
      return;
    }

    const tasksWithDefaultStatuses = list.tasks.map((task) => {
      if (task.statusId === statusId) {
        return {
          ...task,
          statusId: defaultStatus.id,
        };
      }
      return task;
    });

    return {
      ...list,
      tasks: tasksWithDefaultStatuses,
      statuses: list.statuses.filter((status) => status.id !== statusId),
    };
  }

  private updateListInFolder(
    folder: Folder,
    listId: string,
    updatedList: List,
  ): Folder {
    return {
      ...folder,
      lists: folder.lists.map((list) =>
        list.id === listId ? updatedList : list,
      ),
    };
  }

  private updateListInFolderInSpace(
    space: Space,
    folderId: string,
    listId: string,
    updatedList: List,
  ): Space {
    return {
      ...space,
      folders: space.folders.map((folder) => {
        if (folder.id !== folderId) {
          return folder;
        }
        return this.updateListInFolder(folder, listId, updatedList);
      }),
    };
  }

  private updateListInSpace(
    space: Space,
    listId: string,
    updatedList: List,
  ): Space {
    return {
      ...space,
      lists: space.lists.map((list) => {
        if (list.id !== listId) {
          return list;
        }
        return updatedList;
      }),
    };
  }

  private updateListLocally(
    spaceId: string | null,
    folderId: string | null,
    listId: string,
    updatedList: List,
  ): void {
    this.workspaceService.currentWorkspace.update((workspace) => {
      if (!workspace) {
        return;
      }

      if (!spaceId) {
        return {
          ...workspace,
          personalList: updatedList,
        };
      }

      return {
        ...workspace,
        spaces: workspace.spaces.map((space) => {
          if (space.id !== spaceId) {
            return space;
          }
          if (folderId) {
            return this.updateListInFolderInSpace(
              space,
              folderId,
              listId,
              updatedList,
            );
          }
          return this.updateListInSpace(space, listId, updatedList);
        }),
      };
    });
  }

  private deleteListInFolder(folder: Folder, listId: string): Folder {
    return {
      ...folder,
      lists: folder.lists.filter((list) => list.id !== listId),
    };
  }

  private deleteListInSpace(space: Space, listId: string): Space {
    return {
      ...space,
      lists: space.lists.filter((list) => list.id !== listId),
    };
  }

  private deleteListInFolderInSpace(
    space: Space,
    folderId: string,
    listId: string,
  ): Space {
    return {
      ...space,
      folders: space.folders.map((folder) =>
        folder.id !== folderId
          ? folder
          : this.deleteListInFolder(folder, listId),
      ),
    };
  }

  private deleteListLocally(
    spaceId: string,
    folderId: string | null,
    listId: string,
  ) {
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
          if (folderId) {
            return this.deleteListInFolderInSpace(space, folderId, listId);
          } else return this.deleteListInSpace(space, listId);
        }),
      };
    });
  }
}
