import {
  StandaloneTask,
  TaskAncestorsData,
  TaskAncestorsIds,
} from '@shared/types/common.types';
import { List, Status, Task } from '@shared/types/entities.types';

export function extractTaskAncestorsIds(
  taskAncestorsData: TaskAncestorsData,
): TaskAncestorsIds {
  return {
    spaceId: taskAncestorsData.spaceData?.id || null,
    folderId: taskAncestorsData.folderData?.id || null,
    listId: taskAncestorsData.listData.id,
  };
}

export function getTaskStatusInList(
  list: List,
  statusId: string,
): Status | undefined {
  return list.statuses.find((status) => status.id === statusId);
}

export function turnTaskIntoStandalone(
  task: Task,
  status: Status,
  listStatuses: Status[],
  taskAncestorsData: TaskAncestorsData,
): StandaloneTask {
  return {
    task,
    status,
    listStatuses,
    taskAncestorsData,
  };
}

export function buildTaskPath(task: StandaloneTask): string {
  let finalPath = 'in ';
  const taskAncestorsData = task.taskAncestorsData;

  if (taskAncestorsData.spaceData) {
    finalPath += taskAncestorsData.spaceData.name + ' / ';
  }
  if (taskAncestorsData.folderData) {
    finalPath += taskAncestorsData.folderData.name + ' / ';
  }
  finalPath += taskAncestorsData.listData.name;

  return finalPath;
}
