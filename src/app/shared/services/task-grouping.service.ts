import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { MembershipService } from '@core/services/authorization/membership.service';
import { ListService } from '@core/services/list.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { DateService } from '@shared/services/date.service';
import {
  DayOfTheWeek,
  EntityData,
  ListsWithAncestorsGroup,
  StandaloneTask,
  TaskAncestorsData,
  TaskGroupByStatusType,
} from '@shared/types/common.types';
import {
  Folder,
  List,
  Priority,
  Space,
  Status,
} from '@shared/types/entities.types';
import {
  DueDateCategory,
  FolderWithCollapsibleLists,
  GroupByOrderingOption,
  SpaceWithCollapsibleLists,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
} from '@shared/types/ui.types';
import {
  getTaskStatusInList,
  turnTaskIntoStandalone,
} from '@shared/utils/task.utils';

@Injectable({
  providedIn: 'root',
})
export class TaskGroupingService {
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private listService = inject(ListService);
  private membershipService = inject(MembershipService);
  private dateService = inject(DateService);
  private turnTaskIntoStandalone = turnTaskIntoStandalone;
  private getTaskStatusInList = getTaskStatusInList;

  orderTaskGroups<
    T extends
      | TaskGroupByStatus
      | TaskGroupByPriority
      | TaskGroupByDueDate
      | TaskGroupByAssignee,
  >(
    taskGroups: T[] | undefined,
    groupByOrderingOption: GroupByOrderingOption,
  ): T[] | undefined {
    if (!taskGroups || groupByOrderingOption === 'ascending') {
      return taskGroups;
    }

    return [...taskGroups].reverse();
  }

  groupTasksInSpaceByStatus(
    space: Space,
    includeClosedTasks: boolean,
  ): TaskGroupByStatus[] {
    const taskGroupByStatusArray: TaskGroupByStatus[] = [];

    space.lists.forEach((list) => {
      const taskAncestorsData: TaskAncestorsData = {
        spaceData: { name: space.name, id: space.id },
        folderData: null,
        listData: { name: list.name, id: list.id },
      };

      const taskGroupsByStatus = this.groupTasksInListByStatus(
        taskAncestorsData,
        list,
        includeClosedTasks,
      );
      taskGroupByStatusArray.push(...taskGroupsByStatus);
    });

    space.folders.forEach((folder) => {
      const spaceData = { name: space.name, id: space.id };
      const taskGroupByStatus = this.groupTasksInFolderByStatus(
        spaceData,
        folder,
        includeClosedTasks,
      );

      taskGroupByStatusArray.push(...taskGroupByStatus);
    });

    return taskGroupByStatusArray;
  }

  groupTasksInFolderByStatus(
    spaceData: EntityData,
    folder: Folder,
    includeClosedTasks: boolean,
  ): TaskGroupByStatus[] {
    const taskGroupByStatusArray: TaskGroupByStatus[] = [];

    folder.lists.forEach((list) => {
      const taskAncestorsData: TaskAncestorsData = {
        spaceData: spaceData,
        folderData: { name: folder.name, id: folder.id },
        listData: { name: list.name, id: list.id },
      };
      const taskGroupsByStatus = this.groupTasksInListByStatus(
        taskAncestorsData,
        list,
        includeClosedTasks,
      );

      taskGroupByStatusArray.push(...taskGroupsByStatus);
    });

    return taskGroupByStatusArray;
  }

  groupTasksInListByStatus(
    taskAncestorsData: TaskAncestorsData,
    list: List,
    includeClosedTasks: boolean,
  ): TaskGroupByStatus[] {
    const doneStatusId = list.statuses.find(
      (status) => status.type === 'done',
    )?.id;

    const tasks = includeClosedTasks
      ? list.tasks
      : list.tasks.filter((task) => task.statusId !== doneStatusId);

    const tasksGroupedByStatusId = Object.groupBy(
      tasks,
      ({ statusId }) => statusId,
    );

    const listStatuses = includeClosedTasks
      ? list.statuses
      : list.statuses.filter((status) => status.type !== 'done');

    const taskGroupsByStatusArray: TaskGroupByStatus[] | undefined =
      listStatuses.map((status) => {
        const standaloneTasks =
          tasksGroupedByStatusId[status.id]?.map((task) =>
            this.turnTaskIntoStandalone(
              task,
              status,
              list.statuses,
              taskAncestorsData,
            ),
          ) || [];

        return {
          status: status,
          standaloneTasks: standaloneTasks,
          isCollapsed: signal(false),
        };
      });

    return taskGroupsByStatusArray;
  }

  groupAssignedToMeTasksByStatus(
    includeClosedTasks: boolean,
  ): TaskGroupByStatus[] | undefined {
    const workspace = this.workspaceService.currentWorkspace();
    const user = this.userService.user();

    if (!workspace || !user) {
      return;
    }

    const defaultStatuses = this.listService.createDefaultStatuses()!;

    const defaultStatusesGroups = defaultStatuses.map((status) => {
      return [
        status.type,
        {
          status: status,
          standaloneTasks: [] as StandaloneTask[],
          isCollapsed: signal(false),
        },
      ] as const;
    });

    const defaultStatusesGroupsMap = new Map(defaultStatusesGroups);

    const sortTasksInList = (
      space: Space | null,
      folder: Folder | null,
      list: List,
      defaultStatusesGroupsMap: Map<
        string,
        {
          status: Status;
          standaloneTasks: StandaloneTask[];
          isCollapsed: WritableSignal<boolean>;
        }
      >,
    ): void => {
      const assignedTasksInList = list.tasks.filter((task) =>
        task.assignees.some((assignee) => assignee.id === user.id),
      );

      const tasksGroupedByStatusId = Object.groupBy(
        assignedTasksInList,
        ({ statusId }) => statusId,
      );

      const listStatuses = includeClosedTasks
        ? list.statuses
        : list.statuses.filter((status) => status.type !== 'done');

      const taskAncestorsData: TaskAncestorsData = {
        spaceData: space ? { name: space.name, id: space.id } : null,
        folderData: folder ? { name: folder.name, id: folder.id } : null,
        listData: { name: list.name, id: list.id },
      };

      listStatuses.forEach((status) => {
        const standaloneTasks =
          tasksGroupedByStatusId[status.id]?.map((task) =>
            this.turnTaskIntoStandalone(
              task,
              status,
              list.statuses,
              taskAncestorsData,
            ),
          ) || [];

        defaultStatusesGroupsMap
          .get(status.type)
          ?.standaloneTasks.push(...standaloneTasks);
      });
    };

    workspace.spaces.forEach((space) => {
      space.folders.forEach((folder) => {
        folder.lists.forEach((list) => {
          return sortTasksInList(space, folder, list, defaultStatusesGroupsMap);
        });
      });

      space.lists.forEach((list) => {
        sortTasksInList(space, null, list, defaultStatusesGroupsMap);
      });
    });

    sortTasksInList(null, null, user.personalList, defaultStatusesGroupsMap);

    return Array.from(defaultStatusesGroupsMap.values()).filter(
      (group) => group.standaloneTasks.length > 0,
    );
  }

  groupTasksFromListGroupArrayByStatus(
    listsWithAncestorsGroupArray: ListsWithAncestorsGroup[],
  ): {
    notStartedTasks: TaskGroupByStatusType;
    activeTasks: TaskGroupByStatusType;
    doneTasks: TaskGroupByStatusType;
  } {
    const notStartedTasks: TaskGroupByStatusType = {
      statusType: 'not_started',
      standaloneTasks: [],
    };
    const activeTasks: TaskGroupByStatusType = {
      statusType: 'active',
      standaloneTasks: [],
    };
    const doneTasks: TaskGroupByStatusType = {
      statusType: 'done',
      standaloneTasks: [],
    };

    listsWithAncestorsGroupArray.forEach((listsWithAncestorsGroup) => {
      listsWithAncestorsGroup.lists.forEach((list) => {
        const listStatuses = list.statuses;

        listStatuses?.forEach((status) => {
          const tasksInGroup = list?.tasks.filter(
            (task) => task.statusId === status.id,
          );
          const tasksWithAncestorsDataInList: StandaloneTask[] =
            tasksInGroup.map((task) => {
              const taskAncestorsData: TaskAncestorsData = {
                ...listsWithAncestorsGroup.listsAncestorsData,
                listData: { name: list.name, id: list.id },
              };

              return {
                task: task,
                taskAncestorsData: taskAncestorsData,
                listStatuses: list.statuses,
                status: this.getTaskStatusInList(list, task.statusId)!,
              };
            });

          switch (status.type) {
            case 'not_started':
              notStartedTasks.standaloneTasks = [
                ...notStartedTasks.standaloneTasks,
                ...tasksWithAncestorsDataInList,
              ];
              break;
            case 'active':
              activeTasks.standaloneTasks = [
                ...activeTasks.standaloneTasks,
                ...tasksWithAncestorsDataInList,
              ];

              break;
            case 'done':
              doneTasks.standaloneTasks = [
                ...doneTasks.standaloneTasks,
                ...tasksWithAncestorsDataInList,
              ];

              break;
          }
        });
      });
    });

    return {
      notStartedTasks,
      activeTasks,
      doneTasks,
    };
  }

  regroupTasksForBoardViewByStatus(
    taskGroupsByStatusArray: TaskGroupByStatus[],
  ): TaskGroupByStatus[] | undefined {
    const restructuredGroupsByStatusArray: TaskGroupByStatus[] = [];
    const defaultStatuses = this.listService.createDefaultStatuses();

    if (!defaultStatuses) {
      return;
    }

    const notStartedStatusGroup: TaskGroupByStatus = {
      status: defaultStatuses[0],
      standaloneTasks: [] as StandaloneTask[],
      isCollapsed: signal(false),
    };
    const activeStatusGroup: TaskGroupByStatus = {
      status: defaultStatuses[1],
      standaloneTasks: [] as StandaloneTask[],
      isCollapsed: signal(false),
    };
    const doneStatusGroup: TaskGroupByStatus = {
      status: defaultStatuses[2],
      standaloneTasks: [] as StandaloneTask[],
      isCollapsed: signal(false),
    };

    const defaultColorIds = {
      not_started: 14,
      active: 3,
      done: 6,
    };

    function readjustGroupStatusColor(
      defaultTaskGroupByStatus: TaskGroupByStatus,
      customTaskGroupByStatus: TaskGroupByStatus,
    ): void {
      if (
        defaultTaskGroupByStatus.status.defaultColorId !==
          customTaskGroupByStatus.status.defaultColorId ||
        defaultTaskGroupByStatus.status.colorHex !==
          customTaskGroupByStatus.status.colorHex
      ) {
        defaultTaskGroupByStatus.status.defaultColorId =
          defaultColorIds[defaultTaskGroupByStatus.status.type];
        defaultTaskGroupByStatus.status.colorHex = null;
      }
    }

    if (taskGroupsByStatusArray.length === 0) {
      return [];
    }

    let hasNotStarted = false;
    let hasActive = false;

    const customGroupsByNameAndType = new Map<string, TaskGroupByStatus[]>();

    taskGroupsByStatusArray.forEach((taskGroup) => {
      if (this.isStatusNameDefault(taskGroup.status)) {
        switch (taskGroup.status.type) {
          case 'not_started':
            readjustGroupStatusColor(notStartedStatusGroup, taskGroup);
            notStartedStatusGroup.standaloneTasks.push(
              ...taskGroup.standaloneTasks,
            );
            hasNotStarted = true;
            break;
          case 'active':
            readjustGroupStatusColor(activeStatusGroup, taskGroup);
            activeStatusGroup.standaloneTasks.push(
              ...taskGroup.standaloneTasks,
            );
            hasActive = true;
            break;
          case 'done':
            readjustGroupStatusColor(doneStatusGroup, taskGroup);
            doneStatusGroup.standaloneTasks.push(...taskGroup.standaloneTasks);
            break;
        }
      } else {
        const key = `${taskGroup.status.name}-${taskGroup.status.type}`;
        const existingGroups = customGroupsByNameAndType.get(key);
        if (existingGroups) {
          existingGroups.push(taskGroup);
        } else {
          customGroupsByNameAndType.set(key, [taskGroup]);
        }
      }
    });

    customGroupsByNameAndType.forEach((groups) => {
      if (groups.length === 1) {
        restructuredGroupsByStatusArray.push(groups[0]);
      } else {
        const firstGroup = groups[0];
        const allTasksFromGroups = groups.flatMap((g) => g.standaloneTasks);

        const firstColorHex = firstGroup.status.colorHex;
        const firstDefaultColorId = firstGroup.status.defaultColorId;
        const allSameColor = groups.every(
          (g) =>
            g.status.colorHex === firstColorHex &&
            g.status.defaultColorId === firstDefaultColorId,
        );

        const unionGroup: TaskGroupByStatus = {
          status: {
            ...firstGroup.status,
            defaultColorId: allSameColor
              ? firstDefaultColorId
              : defaultColorIds[firstGroup.status.type],
            colorHex: allSameColor ? firstColorHex : null,
          },
          standaloneTasks: allTasksFromGroups,
          isCollapsed: signal(false),
        };

        restructuredGroupsByStatusArray.push(unionGroup);
      }
    });

    if (hasNotStarted) {
      restructuredGroupsByStatusArray.push(notStartedStatusGroup);
    }

    if (hasActive) {
      restructuredGroupsByStatusArray.push(activeStatusGroup);
    }

    if (doneStatusGroup.standaloneTasks.length > 0) {
      restructuredGroupsByStatusArray.push(doneStatusGroup);
    }

    const typePriorityLevel = {
      not_started: 1,
      active: 2,
      done: 3,
    };

    function compareStatusesFn(a: TaskGroupByStatus, b: TaskGroupByStatus) {
      return (
        typePriorityLevel[a.status.type] - typePriorityLevel[b.status.type]
      );
    }

    return restructuredGroupsByStatusArray.sort(compareStatusesFn);
  }

  groupTasksInSpaceByPriority(
    space: SpaceWithCollapsibleLists | Space,
    includeClosedTasks: boolean,
  ): TaskGroupByPriority[] {
    const priorities: Priority[] = ['urgent', 'high', 'normal', 'low', null];
    const spaceData = { name: space.name, id: space.id };

    const taskGroupsByPriorityInListsInFolders = space.folders.flatMap(
      (folder) =>
        this.groupTasksInFolderByPriority(
          spaceData,
          folder,
          includeClosedTasks,
        ),
    );

    const taskGroupsByPriorityInListsInSpace = space.lists.flatMap((list) => {
      const taskAncestorsData: TaskAncestorsData = {
        spaceData: { name: space.name, id: space.id },
        folderData: null,
        listData: { name: list.name, id: list.id },
      };

      return this.groupTasksInListByPriority(
        taskAncestorsData,
        list,
        includeClosedTasks,
      );
    });

    const tasksGroupedByPriority = Object.groupBy(
      [
        ...taskGroupsByPriorityInListsInSpace,
        ...taskGroupsByPriorityInListsInFolders,
      ],
      ({ priority }) => priority ?? 'null',
    );

    const taskGroupsByPriority = priorities.map((priority) => {
      const key = priority || 'null';
      const standaloneTasks: StandaloneTask[] = [];

      tasksGroupedByPriority[key]?.forEach((group) => {
        standaloneTasks.push(...group.standaloneTasks);
      });

      return {
        priority: priority,
        standaloneTasks: standaloneTasks,
        isCollapsed: signal(false),
      };
    });

    return taskGroupsByPriority;
  }

  groupTasksInFolderByPriority(
    spaceData: EntityData,
    folder: Folder | FolderWithCollapsibleLists,
    includeClosedTasks: boolean,
  ): TaskGroupByPriority[] {
    const priorities: Priority[] = ['urgent', 'high', 'normal', 'low', null];

    const taskGroupsInAllLists = folder.lists.flatMap((list) => {
      if (!list) {
        return [];
      }

      const taskAncestorsData: TaskAncestorsData = {
        spaceData: spaceData,
        folderData: { name: folder.name, id: folder.id },
        listData: { name: list.name, id: list.id },
      };

      return this.groupTasksInListByPriority(
        taskAncestorsData,
        list,
        includeClosedTasks,
      );
    });

    const tasksGroupedByPriority = Object.groupBy(
      taskGroupsInAllLists,
      ({ priority }) => priority ?? 'null',
    );

    const taskGroupsByPriority = priorities.map((priority) => {
      const key = priority || 'null';
      const standaloneTasks: StandaloneTask[] = [];

      tasksGroupedByPriority[key]?.forEach((group) => {
        standaloneTasks.push(...group.standaloneTasks);
      });

      return {
        priority: priority,
        standaloneTasks: standaloneTasks,
        isCollapsed: signal(false),
      };
    });

    return taskGroupsByPriority;
  }

  groupTasksInListByPriority(
    taskAncestorsData: TaskAncestorsData,
    list: List,
    includeClosedTasks: boolean,
  ): TaskGroupByPriority[] {
    const priorities: Priority[] = ['urgent', 'high', 'normal', 'low', null];

    const statusMap = new Map(
      list.statuses.map((status) => [status.id, status]),
    );

    const doneStatusId = list.statuses.find(
      (status) => status.type === 'done',
    )?.id;

    const tasks = includeClosedTasks
      ? list.tasks
      : list.tasks.filter((task) => task.statusId !== doneStatusId);

    const tasksGroupedByPriority = Object.groupBy(
      tasks,
      ({ priority }) => priority ?? 'null',
    );

    const taskGroupsByPriorityArray = priorities.map((priority) => {
      const key = priority || 'null';
      const standaloneTasks =
        tasksGroupedByPriority[key]?.map((task) => ({
          task: task,
          listStatuses: list.statuses,
          taskAncestorsData: taskAncestorsData,
          status: statusMap.get(task.statusId)!,
        })) || [];

      return {
        priority: priority,
        standaloneTasks: standaloneTasks,
        isCollapsed: signal(false),
      };
    });

    return taskGroupsByPriorityArray;
  }

  groupAssignedToMeTasksByPriority(
    includeClosedTasks: boolean,
  ): TaskGroupByPriority[] | undefined {
    const workspace = this.workspaceService.currentWorkspace();
    const user = this.userService.user();

    if (!workspace || !user) {
      return;
    }

    const taskGroupsByPriorityInSpaces = workspace.spaces.flatMap((space) =>
      this.groupTasksInSpaceByPriority(space, includeClosedTasks),
    );

    const taskGroupsByPriorityInPersonalList = this.groupTasksInListByPriority(
      {
        spaceData: null,
        folderData: null,
        listData: { name: user.personalList.name, id: user.personalList.id },
      },
      user.personalList,
      includeClosedTasks,
    );

    const tasksGroupedByPriority = Object.groupBy(
      [...taskGroupsByPriorityInSpaces, ...taskGroupsByPriorityInPersonalList],
      ({ priority }) => priority ?? 'null',
    );

    const taskGroupedByPriorityArray = Object.keys(tasksGroupedByPriority).map(
      (key) => {
        const standaloneTasks: StandaloneTask[] = [];

        tasksGroupedByPriority[
          key as keyof typeof tasksGroupedByPriority
        ]?.forEach((group) => {
          const filteredTasks = group.standaloneTasks.filter((standaloneTask) =>
            standaloneTask.task.assignees.some(
              (assignee) => assignee.id === user.id,
            ),
          );

          standaloneTasks.push(...filteredTasks);
        });

        return {
          priority: key === 'null' ? null : (key as Priority),
          standaloneTasks: standaloneTasks,
          isCollapsed: signal(false),
        };
      },
    );

    return taskGroupedByPriorityArray.filter(
      (group) => group.standaloneTasks.length > 0,
    );
  }

  groupTasksInSpaceByDueDate(
    space: Space,
    includeClosedTasks: boolean,
  ): TaskGroupByDueDate[] {
    const taskGroupsByDueDateMap = this.createDueDateMap(includeClosedTasks);

    space.folders.forEach((folder) => {
      folder.lists.forEach((list) => {
        const taskAncestorsData: TaskAncestorsData = {
          spaceData: { name: space.name, id: space.id },
          folderData: { name: folder.name, id: folder.id },
          listData: { name: list.name, id: list.id },
        };

        this.groupTasksInListByDueDateIntoMap(
          list,
          taskAncestorsData,
          includeClosedTasks,
          taskGroupsByDueDateMap,
        );
      });
    });

    space.lists.forEach((list) => {
      const taskAncestorsData: TaskAncestorsData = {
        spaceData: { name: space.name, id: space.id },
        folderData: null,
        listData: { name: list.name, id: list.id },
      };

      this.groupTasksInListByDueDateIntoMap(
        list,
        taskAncestorsData,
        includeClosedTasks,
        taskGroupsByDueDateMap,
      );
    });

    return Array.from(taskGroupsByDueDateMap.values());
  }

  groupTasksInFolderByDueDate(
    spaceData: EntityData,
    folder: Folder | FolderWithCollapsibleLists,
    includeClosedTasks: boolean,
  ): TaskGroupByDueDate[] {
    const taskGroupsByDueDateMap = this.createDueDateMap(includeClosedTasks);

    folder.lists.forEach((list) => {
      const taskAncestorsData: TaskAncestorsData = {
        spaceData: spaceData,
        folderData: { name: folder.name, id: folder.id },
        listData: { name: list.name, id: list.id },
      };

      this.groupTasksInListByDueDateIntoMap(
        list,
        taskAncestorsData,
        includeClosedTasks,
        taskGroupsByDueDateMap,
      );
    });

    return Array.from(taskGroupsByDueDateMap.values());
  }

  groupTasksInListByDueDate(
    taskAncestorsData: TaskAncestorsData,
    list: List,
    includeClosedTasks: boolean,
  ): TaskGroupByDueDate[] {
    const taskGroupsByDueDateMap = this.createDueDateMap(includeClosedTasks);

    this.groupTasksInListByDueDateIntoMap(
      list,
      taskAncestorsData,
      includeClosedTasks,
      taskGroupsByDueDateMap,
    );

    return Array.from(taskGroupsByDueDateMap.values());
  }

  groupAssignedToMeTasksByDueDate(
    includeClosedTasks: boolean,
  ): TaskGroupByDueDate[] | undefined {
    const workspace = this.workspaceService.currentWorkspace();
    const user = this.userService.user();

    if (!workspace || !user) {
      return;
    }

    const taskGroupsByDueDateMap = this.createDueDateMap(includeClosedTasks);

    const createListWithTasksAssignedToUser = (list: List) => {
      const filteredTasks = list.tasks.filter((task) =>
        task.assignees.some((assignee) => assignee.id === user.id),
      );
      return { ...list, tasks: filteredTasks };
    };

    workspace.spaces.forEach((space) => {
      space.folders.forEach((folder) => {
        folder.lists.forEach((list) => {
          const listWithTasksAssignedToUser =
            createListWithTasksAssignedToUser(list);
          const taskAncestorsData: TaskAncestorsData = {
            spaceData: { name: space.name, id: space.id },
            folderData: { name: folder.name, id: folder.id },
            listData: { name: list.name, id: list.id },
          };

          this.groupTasksInListByDueDateIntoMap(
            listWithTasksAssignedToUser,
            taskAncestorsData,
            includeClosedTasks,
            taskGroupsByDueDateMap,
          );
        });
      });

      space.lists.forEach((list) => {
        const listWithTasksAssignedToUser =
          createListWithTasksAssignedToUser(list);
        const taskAncestorsData: TaskAncestorsData = {
          spaceData: { name: space.name, id: space.id },
          folderData: null,
          listData: { name: list.name, id: list.id },
        };

        this.groupTasksInListByDueDateIntoMap(
          listWithTasksAssignedToUser,
          taskAncestorsData,
          includeClosedTasks,
          taskGroupsByDueDateMap,
        );
      });
    });

    const personalList = user.personalList;
    const personalListWithTasksAssignedToUser =
      createListWithTasksAssignedToUser(personalList);
    const personalListTaskAncestorsData: TaskAncestorsData = {
      spaceData: null,
      folderData: null,
      listData: { name: personalList.name, id: personalList.id },
    };

    this.groupTasksInListByDueDateIntoMap(
      personalListWithTasksAssignedToUser,
      personalListTaskAncestorsData,
      includeClosedTasks,
      taskGroupsByDueDateMap,
    );

    return Array.from(taskGroupsByDueDateMap.values()).filter(
      (group) => group.standaloneTasks.length > 0,
    );
  }

  groupTasksInSpaceByAssignee(
    space: Space,
    includeClosedTasks: boolean,
  ): TaskGroupByAssignee[] {
    const spaceData = { name: space.name, id: space.id };

    const taskGroupsByAssigneeInListsInFolders = space.folders.flatMap(
      (folder) =>
        this.groupTasksInFolderByAssignee(
          spaceData,
          folder,
          includeClosedTasks,
        ),
    );

    const taskGroupsByAssigneeInListsInSpace = space.lists.flatMap((list) => {
      const taskAncestorsData: TaskAncestorsData = {
        spaceData: { name: space.name, id: space.id },
        folderData: null,
        listData: { name: list.name, id: list.id },
      };

      return this.groupTasksInListByAssignee(
        taskAncestorsData,
        list,
        includeClosedTasks,
      );
    });

    const tasksGroupedByAssignee = Object.groupBy(
      [
        ...taskGroupsByAssigneeInListsInFolders,
        ...taskGroupsByAssigneeInListsInSpace,
      ],
      ({ assignee }) => assignee?.id ?? 'null',
    );

    const assigneesIds = Object.keys(tasksGroupedByAssignee);

    const taskGroupsByAssignee = assigneesIds.map((assigneeId) => {
      const groupsForAssignee = tasksGroupedByAssignee[assigneeId];
      const standaloneTasks = groupsForAssignee!.flatMap(
        (group) => group.standaloneTasks,
      );
      const assignee = groupsForAssignee![0].assignee;

      return {
        assignee: assignee,
        standaloneTasks: standaloneTasks,
        isCollapsed: signal(false),
      };
    });

    return taskGroupsByAssignee;
  }

  groupTasksInFolderByAssignee(
    spaceData: EntityData,
    folder: Folder | FolderWithCollapsibleLists,
    includeClosedTasks: boolean,
  ): TaskGroupByAssignee[] {
    const taskGroupsInAllLists = folder.lists.flatMap((list) => {
      const taskAncestorsData: TaskAncestorsData = {
        spaceData: spaceData,
        folderData: { name: folder.name, id: folder.id },
        listData: { name: list.name, id: list.id },
      };

      if (!list) {
        return [];
      }

      return this.groupTasksInListByAssignee(
        taskAncestorsData,
        list,
        includeClosedTasks,
      );
    });

    const taskGroupedByAssignee = Object.groupBy(
      taskGroupsInAllLists,
      ({ assignee }) => assignee?.id ?? 'null',
    );

    const assigneesIds = Object.keys(taskGroupedByAssignee);

    const taskGroupsByAssignee = assigneesIds.map((assigneeId) => {
      const groupsForAssignee = taskGroupedByAssignee[assigneeId];

      const standaloneTasks = groupsForAssignee!.flatMap(
        (group) => group.standaloneTasks,
      );

      const assignee = groupsForAssignee![0].assignee;
      return {
        assignee: assignee,
        standaloneTasks: standaloneTasks,
        isCollapsed: signal(false),
      };
    });

    return taskGroupsByAssignee;
  }

  groupTasksInListByAssignee(
    taskAncestorsData: TaskAncestorsData,
    list: List,
    includeClosedTasks: boolean,
  ): TaskGroupByAssignee[] {
    const assigneesGroupMap = new Map<string, TaskGroupByAssignee>();

    const doneStatusId = list.statuses.find(
      (status) => status.type === 'done',
    )?.id;

    const tasks = includeClosedTasks
      ? list.tasks
      : list.tasks.filter((task) => task.statusId !== doneStatusId);

    const noAssigneeGroup: TaskGroupByAssignee = {
      assignee: null,
      standaloneTasks: [],
      isCollapsed: signal(false),
    };

    this.membershipService.workspaceMembersMap()?.forEach((member) => {
      if (
        member.effectiveMembershipsMaps.effectiveListMembershipsMap.has(list.id)
      ) {
        assigneesGroupMap.set(member.id, {
          assignee: { id: member.id, username: member.username },
          standaloneTasks: [],
          isCollapsed: signal(false),
        });
      }
    });

    tasks.forEach((task) => {
      const status = list.statuses.find(
        (status) => status.id === task.statusId,
      );

      if (status) {
        const standaloneTask = this.turnTaskIntoStandalone(
          task,
          status,
          list.statuses,
          taskAncestorsData,
        );

        if (task.assignees.length > 0) {
          task.assignees.forEach((assignee) => {
            if (assigneesGroupMap.has(assignee.id)) {
              const group = assigneesGroupMap.get(assignee.id);
              group?.standaloneTasks.push(standaloneTask);
            }
          });
        } else {
          noAssigneeGroup.standaloneTasks.push(standaloneTask);
        }
      }
    });

    const groupArray = Array.from(assigneesGroupMap.values());

    groupArray.push(noAssigneeGroup);

    return groupArray;
  }

  private isStatusNameDefault(status: Status): boolean {
    return (
      (status.type === 'not_started' && status.name === 'TO DO') ||
      (status.type === 'active' && status.name === 'IN PROGRESS') ||
      (status.type === 'done' && status.name === 'COMPLETE')
    );
  }

  private createDueDateMap(
    includeClosedTasks: boolean,
  ): Map<string, TaskGroupByDueDate> {
    const currentDayNumber = new Date().getDay();
    const daysToAdd: DayOfTheWeek[] = [];
    let rawDayIndex = currentDayNumber;
    let dayToAdd = currentDayNumber;

    for (let i = 1; i < 6; ++i) {
      rawDayIndex += 1;

      if (rawDayIndex > 6) {
        dayToAdd = rawDayIndex - 7;
      } else {
        dayToAdd = rawDayIndex;
      }

      daysToAdd.push(this.dateService.daysOfTheWeek[dayToAdd]);
    }

    const initialCategories: DueDateCategory[] = [
      'overdue',
      'today',
      'tomorrow',
    ];
    const dueDateCategories: DueDateCategory[] =
      initialCategories.concat(daysToAdd);

    dueDateCategories.push('future', null);

    if (includeClosedTasks) {
      dueDateCategories.push('done');
    }

    return new Map(
      dueDateCategories.map((category) => {
        return [
          category ?? 'null',
          {
            dueDate: category,
            standaloneTasks: [] as StandaloneTask[],
            isCollapsed: signal(false),
          },
        ];
      }),
    );
  }

  private groupTasksInListByDueDateIntoMap(
    list: List,
    taskAncestorsData: TaskAncestorsData,
    includeClosedTasks: boolean,
    taskGroupsByDueDateMap: Map<string, TaskGroupByDueDate>,
  ): void {
    const statusMap = new Map(
      list.statuses.map((status) => [status.id, status]),
    );

    for (const task of list.tasks) {
      const standaloneTask = {
        task: task,
        listStatuses: list.statuses,
        taskAncestorsData: taskAncestorsData,
        status: statusMap.get(task.statusId)!,
      };

      const taskDueDate = task.dueDate;

      if (standaloneTask.status.type === 'done') {
        if (includeClosedTasks) {
          taskGroupsByDueDateMap
            .get('done')
            ?.standaloneTasks.push(standaloneTask);
        }
      } else {
        if (!taskDueDate) {
          taskGroupsByDueDateMap
            .get('null')
            ?.standaloneTasks.push(standaloneTask);
        } else {
          const today = new Date();
          const now = new Date();
          today.setHours(0, 0, 0, 0);

          if (taskDueDate < now) {
            taskGroupsByDueDateMap
              .get('overdue')
              ?.standaloneTasks.push(standaloneTask);
          } else {
            const dateCopyAtStartOfDay = new Date(taskDueDate);
            dateCopyAtStartOfDay.setHours(0, 0, 0, 0);

            if (dateCopyAtStartOfDay.getTime() === today.getTime()) {
              taskGroupsByDueDateMap
                .get('today')
                ?.standaloneTasks.push(standaloneTask);
            } else {
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);

              if (dateCopyAtStartOfDay.getTime() === tomorrow.getTime()) {
                taskGroupsByDueDateMap
                  .get('tomorrow')
                  ?.standaloneTasks.push(standaloneTask);
              } else {
                const dateInAWeek = new Date(today);
                dateInAWeek.setDate(today.getDate() + 7);

                if (taskDueDate < dateInAWeek) {
                  const dayOfTheWeekNumber = taskDueDate.getDay();
                  const dayOfTheWeek =
                    this.dateService.daysOfTheWeek[dayOfTheWeekNumber];

                  taskGroupsByDueDateMap
                    .get(dayOfTheWeek)
                    ?.standaloneTasks.push(standaloneTask);
                } else {
                  taskGroupsByDueDateMap
                    .get('future')
                    ?.standaloneTasks.push(standaloneTask);
                }
              }
            }
          }
        }
      }
    }
  }
}
