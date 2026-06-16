import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { NotificationsService } from '@shared/services/notifications.service';
import {
  CreateTaskRequestBody,
  SuccessResponse,
  UpdateTaskRequestBody,
} from '@shared/types/api.types';
import { TaskAncestorsIds } from '@shared/types/common.types';
import {
  Assignee,
  Folder,
  List,
  Space,
  Task,
} from '@shared/types/entities.types';
import { environment } from 'environments/environment';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private httpClient = inject(HttpClient);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private notificationsService = inject(NotificationsService);
  private apiUrl = environment.apiUrl;

  createTask(
    taskAncestorsIds: TaskAncestorsIds,
    taskData: CreateTaskRequestBody,
  ): void {
    const newTask = this.createTaskWithData(taskData);

    if (!newTask) {
      return;
    }

    if (!this.workspaceService.currentWorkspace()) {
      return;
    }

    this.notificationsService.showLoadingSnackbar();

    const endpoint = `${this.apiUrl}/lists/${taskAncestorsIds.listId}/tasks`;

    this.httpClient
      .post<SuccessResponse<Task>>(endpoint, taskData)
      .pipe(
        tap((res) => {
          this.addTaskLocally(taskAncestorsIds, {
            ...newTask,
            createdAt: res.data.createdAt,
          });
        }),
        catchError(() => {
          this.deleteTaskLocally(taskAncestorsIds, newTask.id);
          this.notificationsService.showError(
            'Failed to create task. Please try again later.',
          );
          return EMPTY;
        }),
        finalize(() => {
          this.notificationsService.closeLoadingSnackbar();
        }),
      )
      .subscribe();
  }

  updateTask(
    taskAncestorsIds: TaskAncestorsIds,
    task: Task,
    taskData: UpdateTaskRequestBody,
  ): void {
    const tempTask: Task = {
      id: task.id,
      name: taskData.name ?? task.name,
      dueDate: taskData.dueDate !== undefined ? taskData.dueDate : task.dueDate,
      priority: taskData.priority ?? task.priority,
      statusId: taskData.statusId ?? task.statusId,
      description: taskData.description ?? task.description,
      assignees: task.assignees,
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      updatedAt: new Date(),
      updatedBy: this.userService.user()!.id,
    };

    const listId = taskAncestorsIds.listId;
    const personalList = this.userService.user()?.personalList;
    let oldTaskBackup: Task | undefined;

    if (listId === personalList?.id) {
      oldTaskBackup = this.userService.mappedPersonalList()?.get(task.id);
    } else {
      oldTaskBackup = this.workspaceService
        .mappedWorkspace()
        ?.tasksMap.get(task.id);
    }

    if (!oldTaskBackup) {
      return;
    }

    this.updateLocalTask(taskAncestorsIds, task.id, tempTask);

    this.httpClient
      .patch<SuccessResponse<Task>>(`${this.apiUrl}/tasks/${task.id}`, taskData)
      .pipe(
        tap((res) => {
          this.updateLocalTask(taskAncestorsIds, task.id, {
            ...tempTask,
            updatedAt: res.data.updatedAt,
          });
        }),
        catchError(() => {
          this.updateLocalTask(taskAncestorsIds, task.id, oldTaskBackup);
          this.notificationsService.showError(
            'Failed to update task. Please try again later.',
          );

          return EMPTY;
        }),
      )
      .subscribe();
  }

  assignTask(
    taskAncestorsIds: TaskAncestorsIds,
    task: Task,
    assigneeId: string,
  ): void {
    const user = this.userService.user();
    const listId = taskAncestorsIds.listId;
    const personalList = this.userService.user()?.personalList;
    let oldTaskBackup: Task | undefined;

    if (listId === personalList?.id) {
      oldTaskBackup = this.userService.mappedPersonalList()?.get(task.id);
    } else {
      oldTaskBackup = this.workspaceService
        .mappedWorkspace()
        ?.tasksMap.get(task.id);
    }

    if (!user || !oldTaskBackup) {
      return;
    }

    const newAssignee: Assignee = {
      id: assigneeId,
      createdBy: user.id,
      createdAt: new Date(),
    };

    const tempTask: Task = {
      id: task.id,
      name: task.name,
      dueDate: task.dueDate,
      priority: task.priority,
      statusId: task.statusId,
      description: task.description,
      assignees: [...task.assignees, newAssignee],
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      updatedAt: new Date(),
      updatedBy: this.userService.user()!.id,
    };

    this.updateLocalTask(taskAncestorsIds, task.id, tempTask);

    this.httpClient
      .post<void>(`${this.apiUrl}/tasks/${task.id}/assignments`, {
        assigneeId: assigneeId,
      })
      .pipe(
        catchError(() => {
          this.updateLocalTask(taskAncestorsIds, task.id, oldTaskBackup);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  removeTaskAssignee(
    taskAncestorsIds: TaskAncestorsIds,
    task: Task,
    assigneeId: string,
  ): void {
    const user = this.userService.user();
    const listId = taskAncestorsIds.listId;
    const personalList = this.userService.user()?.personalList;
    let oldTaskBackup: Task | undefined;

    if (listId === personalList?.id) {
      oldTaskBackup = this.userService.mappedPersonalList()?.get(task.id);
    } else {
      oldTaskBackup = this.workspaceService
        .mappedWorkspace()
        ?.tasksMap.get(task.id);
    }

    if (!user || !oldTaskBackup) {
      return;
    }

    const updatedAssignees = task.assignees.filter(
      (assignee) => assignee.id !== assigneeId,
    );

    const tempTask: Task = {
      id: task.id,
      name: task.name,
      dueDate: task.dueDate,
      priority: task.priority,
      statusId: task.statusId,
      description: task.description,
      assignees: updatedAssignees,
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      updatedAt: new Date(),
      updatedBy: this.userService.user()!.id,
    };

    this.updateLocalTask(taskAncestorsIds, task.id, tempTask);

    this.httpClient
      .delete<void>(`${this.apiUrl}/tasks/${task.id}/assignments/${assigneeId}`)
      .pipe(
        catchError(() => {
          this.updateLocalTask(taskAncestorsIds, task.id, oldTaskBackup);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  deleteTask(taskAncestorsIds: TaskAncestorsIds, taskId: string): void {
    let backupTask: Task | undefined;

    if (taskAncestorsIds.spaceId) {
      backupTask = this.workspaceService
        .mappedWorkspace()
        ?.tasksMap.get(taskId);
    } else {
      backupTask = this.userService.mappedPersonalList()?.get(taskId);
    }

    this.deleteTaskLocally(taskAncestorsIds, taskId);

    if (!backupTask) {
      return;
    }

    this.httpClient
      .delete(`${this.apiUrl}/tasks/${taskId}`)
      .pipe(
        catchError(() => {
          this.addTaskLocally(taskAncestorsIds, backupTask);
          this.notificationsService.showError(
            'Failed to delete task. Please try again later.',
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private createTaskAssignees(
    taskAssigneesIds: string[],
  ): Assignee[] | undefined {
    const assignees: Assignee[] = [];
    const userId = this.userService.user()?.id;

    if (!userId) {
      return;
    }

    taskAssigneesIds.forEach((assigneeId) => {
      const assignee = {
        id: assigneeId,
        createdBy: userId,
        createdAt: new Date(),
      };
      assignees.push(assignee);
    });

    return assignees;
  }

  private createTaskWithData(
    taskData: CreateTaskRequestBody,
  ): Task | undefined {
    const assignees = this.createTaskAssignees(taskData.assigneesIds);
    const user = this.userService.user();

    if (!assignees || !user) {
      return;
    }

    return {
      id: taskData.id,
      name: taskData.name,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      statusId: taskData.statusId,
      description: taskData.description,
      assignees: assignees,
      createdBy: user.id,
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: null,
    };
  }

  private addTaskToList(list: List, taskToAdd: Task): List {
    return { ...list, tasks: [...list.tasks, taskToAdd] };
  }

  private addTaskToListInFolder(
    folder: Folder,
    taskAncestorsIds: TaskAncestorsIds,
    taskToAdd: Task,
  ): Folder {
    return {
      ...folder,
      lists: folder.lists.map((list) =>
        list.id === taskAncestorsIds.listId
          ? this.addTaskToList(list, taskToAdd)
          : list,
      ),
    };
  }

  private addTaskToListInSpace(
    space: Space,
    taskAncestorsIds: TaskAncestorsIds,
    taskToAdd: Task,
  ): Space {
    return {
      ...space,
      lists: space.lists.map((list) =>
        list.id === taskAncestorsIds.listId
          ? this.addTaskToList(list, taskToAdd)
          : list,
      ),
    };
  }

  private addTaskToListInFolderInSpace(
    space: Space,
    taskAncestorsIds: TaskAncestorsIds,
    taskToAdd: Task,
  ): Space {
    return {
      ...space,
      folders: space.folders.map((folder) =>
        folder.id === taskAncestorsIds.folderId
          ? this.addTaskToListInFolder(folder, taskAncestorsIds, taskToAdd)
          : folder,
      ),
    };
  }

  private addTaskLocally(
    taskAncestorsIds: TaskAncestorsIds,
    taskToAdd: Task,
  ): void {
    if (taskAncestorsIds.spaceId === null) {
      this.userService.user.update((user) => {
        if (!user) {
          return;
        }
        return {
          ...user,
          personalList: this.addTaskToList(user.personalList, taskToAdd),
        };
      });
    } else {
      this.workspaceService.currentWorkspace.update((workspace) => {
        if (!workspace) {
          return;
        }

        return {
          ...workspace,
          spaces: workspace.spaces.map((space) => {
            if (space.id !== taskAncestorsIds.spaceId) {
              return space;
            }

            if (taskAncestorsIds.folderId) {
              return this.addTaskToListInFolderInSpace(
                space,
                taskAncestorsIds,
                taskToAdd,
              );
            }
            return this.addTaskToListInSpace(
              space,
              taskAncestorsIds,
              taskToAdd,
            );
          }),
        };
      });
    }
  }

  private updateTaskInList(
    list: List,
    taskId: string,
    updatedTask: Task,
  ): List {
    return {
      ...list,
      tasks: list.tasks.map((task) =>
        task.id === taskId ? updatedTask : task,
      ),
    };
  }

  private updateTaskInListInSpace(
    space: Space,
    listId: string,
    taskId: string,
    updatedTask: Task,
  ): Space {
    return {
      ...space,
      lists: space.lists.map((list) =>
        list.id === listId
          ? this.updateTaskInList(list, taskId, updatedTask)
          : list,
      ),
    };
  }

  private updateTaskInListInFolder(
    folder: Folder,
    listId: string,
    taskId: string,
    updatedTask: Task,
  ): Folder {
    return {
      ...folder,
      lists: folder.lists.map((list) =>
        list.id === listId
          ? this.updateTaskInList(list, taskId, updatedTask)
          : list,
      ),
    };
  }

  private updateTaskInListInFolderInSpace(
    space: Space,
    taskAncestorsIds: TaskAncestorsIds,
    taskId: string,
    updatedTask: Task,
  ): Space {
    return {
      ...space,
      folders: space.folders.map((folder) =>
        folder.id === taskAncestorsIds.folderId
          ? this.updateTaskInListInFolder(
              folder,
              taskAncestorsIds.listId,
              taskId,
              updatedTask,
            )
          : folder,
      ),
    };
  }

  private updateLocalTask(
    taskAncestorsIds: TaskAncestorsIds | null,
    taskId: string,
    updatedTask: Task,
  ): void {
    if (!taskAncestorsIds?.spaceId) {
      this.userService.user.update((user) => {
        if (!user) {
          return;
        }
        return {
          ...user,
          personalList: this.updateTaskInList(
            user.personalList,
            taskId,
            updatedTask,
          ),
        };
      });
    } else {
      this.workspaceService.currentWorkspace.update((workspace) => {
        if (!workspace) {
          return;
        }
        return {
          ...workspace,
          spaces: workspace.spaces.map((space) => {
            if (space.id !== taskAncestorsIds.spaceId) {
              return space;
            }
            if (taskAncestorsIds.folderId) {
              return this.updateTaskInListInFolderInSpace(
                space,
                taskAncestorsIds,
                taskId,
                updatedTask,
              );
            } else {
              return this.updateTaskInListInSpace(
                space,
                taskAncestorsIds.listId,
                taskId,
                updatedTask,
              );
            }
          }),
        };
      });
    }
  }

  private deleteTaskInList(list: List, taskId: string): List {
    return {
      ...list,
      tasks: list.tasks.filter((task) => task.id !== taskId),
    };
  }

  private deleteTaskInListInFolder(
    folder: Folder,
    taskAncestorsIds: TaskAncestorsIds,
    taskId: string,
  ): Folder {
    return {
      ...folder,
      lists: folder.lists.map((list) =>
        list.id === taskAncestorsIds.listId
          ? this.deleteTaskInList(list, taskId)
          : list,
      ),
    };
  }

  private deleteTaskInListInSpace(
    space: Space,
    taskAncestorsIds: TaskAncestorsIds,
    taskId: string,
  ): Space {
    return {
      ...space,
      lists: space.lists.map((list) =>
        list.id === taskAncestorsIds.listId
          ? this.deleteTaskInList(list, taskId)
          : list,
      ),
    };
  }

  private deleteTaskInListInFolderInSpace(
    space: Space,
    taskAncestorsIds: TaskAncestorsIds,
    taskId: string,
  ): Space {
    return {
      ...space,
      folders: space.folders.map((folder) =>
        folder.id === taskAncestorsIds.folderId
          ? this.deleteTaskInListInFolder(folder, taskAncestorsIds, taskId)
          : folder,
      ),
    };
  }

  private deleteTaskLocally(
    taskAncestorsIds: TaskAncestorsIds,
    taskId: string,
  ): void {
    if (taskAncestorsIds.spaceId === null) {
      this.userService.user.update((user) => {
        if (!user) {
          return;
        }
        return {
          ...user,
          personalList: this.deleteTaskInList(user.personalList, taskId),
        };
      });
    } else {
      this.workspaceService.currentWorkspace.update((workspace) => {
        if (!workspace) {
          return;
        }

        return {
          ...workspace,
          spaces: workspace.spaces.map((space) => {
            if (space.id !== taskAncestorsIds.spaceId) {
              return space;
            }
            if (taskAncestorsIds.folderId) {
              return this.deleteTaskInListInFolderInSpace(
                space,
                taskAncestorsIds,
                taskId,
              );
            } else {
              return this.deleteTaskInListInSpace(
                space,
                taskAncestorsIds,
                taskId,
              );
            }
          }),
        };
      });
    }
  }
}
