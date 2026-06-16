import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { ListBoardViewComponent } from '@features/list/list-board-view/list-board-view.component';
import { ListListViewComponent } from '@features/list/list-list-view/list-list-view.component';
import { GroupByBtnComponent } from '@shared/components/buttons/group-by-btn/group-by-btn.component';
import { ToggleClosedTasksBtnComponent } from '@shared/components/buttons/toggle-closed-tasks-btn/toggle-closed-tasks-btn.component';
import { ViewSelectorBarComponent } from '@shared/components/view-selector-bar/view-selector-bar.component';
import { TaskGroupingService } from '@shared/services/task-grouping.service';
import { TaskAncestorsData } from '@shared/types/common.types';
import { List } from '@shared/types/entities.types';
import {
  GroupByOption,
  GroupByOrderingOption,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
} from '@shared/types/ui.types';

@Component({
  selector: 'app-list',
  imports: [
    ListBoardViewComponent,
    ListListViewComponent,
    GroupByBtnComponent,
    ToggleClosedTasksBtnComponent,
    ViewSelectorBarComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css',
})
export class ListComponent implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private taskGroupingService = inject(TaskGroupingService);
  private readonly defaultGroupByOrderingOption: GroupByOrderingOption =
    'ascending';
  private readonly defaultShowClosedTasks = false;
  isStandalone = input.required();
  selectedGroupByOption = model<GroupByOption>('status');
  groupByOrderingOption = model<GroupByOrderingOption>('ascending');
  showClosedTasks = model<boolean>(false);
  isPersonal = model(false);
  isEmbedded = input.required();
  isAssignedToMe = input(false);
  view = model<'board' | 'list'>();
  spaceIdFromRoute = input<string | null>();
  inputSpaceId = input.required<string | null>();
  folderIdFromRoute = input<string | null>();
  inputFolderId = input.required<string | null>();
  listIdFromRoute = input<string>();
  folderName = input<string>();
  inputList = input.required<List | null>();
  inputTaskGroups = input<
    | TaskGroupByStatus[]
    | TaskGroupByPriority[]
    | TaskGroupByDueDate[]
    | TaskGroupByAssignee[]
  >();
  protected isListInRoute = signal<boolean>(false);
  protected effectiveGroupByOrderingOption = computed<GroupByOrderingOption>(
    () => this.groupByOrderingOption() ?? this.defaultGroupByOrderingOption,
  );
  protected effectiveShowClosedTasks = computed<boolean>(
    () => this.showClosedTasks() ?? this.defaultShowClosedTasks,
  );
  protected computedSpaceId = computed(() => {
    if (this.spaceIdFromRoute()) {
      return this.spaceIdFromRoute();
    } else if (this.inputSpaceId()) {
      return this.inputSpaceId();
    }
    return null;
  });
  protected computedFolderId = computed(() => {
    if (this.folderIdFromRoute()) {
      return this.folderIdFromRoute();
    } else if (this.inputFolderId()) {
      return this.inputFolderId();
    }
    return null;
  });
  protected computedList = computed(() => {
    if (this.isPersonal()) {
      return this.userService.user()?.personalList;
    } else if (this.inputList()) {
      return this.inputList();
    } else {
      const mappedWorkspace = this.workspaceService.mappedWorkspace();
      const listId = this.listIdFromRoute();

      if (!listId) {
        return;
      }

      return mappedWorkspace?.listsMap.get(listId);
    }
  });
  protected tasksAncestorsData = computed<TaskAncestorsData | undefined>(() => {
    if (this.workspaceService.currentWorkspace() && this.computedList()) {
      const taskAncestorsData = {
        spaceData: this.computedSpaceId()
          ? {
              name: this.getSpaceName(this.computedSpaceId()!)!,
              id: this.computedSpaceId()!,
            }
          : null,
        folderData: this.computedFolderId()
          ? {
              name: this.getFolderName(
                this.computedSpaceId()!,
                this.computedFolderId()!,
              )!,
              id: this.computedFolderId()!,
            }
          : null,
        listData: {
          name: this.computedList()!.name,
          id: this.computedList()!.id,
        },
      };

      return taskAncestorsData;
    }
    return;
  });
  protected taskGroups = computed(() => {
    if (this.tasksAncestorsData() && this.computedList()) {
      switch (this.selectedGroupByOption()) {
        case 'status': {
          const groupTasksByStatusInList =
            this.taskGroupingService.groupTasksInListByStatus(
              this.tasksAncestorsData()!,
              this.computedList()!,
              this.effectiveShowClosedTasks(),
            );
          return this.taskGroupingService.orderTaskGroups(
            groupTasksByStatusInList,
            this.effectiveGroupByOrderingOption(),
          );
        }

        case 'priority': {
          const taskGroups =
            this.taskGroupingService.groupTasksInListByPriority(
              this.tasksAncestorsData()!,
              this.computedList()!,
              this.effectiveShowClosedTasks(),
            );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.effectiveGroupByOrderingOption(),
          );
        }
        case 'dueDate': {
          const taskGroups = this.taskGroupingService.groupTasksInListByDueDate(
            this.tasksAncestorsData()!,
            this.computedList()!,
            this.effectiveShowClosedTasks(),
          );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.effectiveGroupByOrderingOption(),
          );
        }
        case 'assignee': {
          const taskGroups =
            this.taskGroupingService.groupTasksInListByAssignee(
              this.tasksAncestorsData()!,
              this.computedList()!,
              this.effectiveShowClosedTasks(),
            );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.effectiveGroupByOrderingOption(),
          );
        }
      }
    }

    return;
  });

  ngOnInit() {
    this.selectedGroupByOption.set('status');

    const routeDataSub = this.route.data.subscribe((data) => {
      this.isPersonal.set(data['isPersonal']);
    });

    const routeUrlSub = this.route.pathFromRoot[1].url.subscribe((val) => {
      if (
        val[0]?.path === 'personal-list' ||
        val[2]?.path === 'lists' ||
        val[4]?.path === 'lists'
      ) {
        this.isListInRoute.set(true);
      }
    });

    this.destroyRef.onDestroy(() => {
      routeDataSub.unsubscribe();
      routeUrlSub.unsubscribe();
    });
  }

  private getSpaceName(spaceId: string): string | undefined {
    const currentWorkspace = this.workspaceService.currentWorkspace();
    if (!currentWorkspace) {
      return;
    }
    return currentWorkspace.spaces.find((space) => space.id === spaceId)?.name;
  }

  private getFolderName(spaceId: string, folderId: string): string | undefined {
    const currentWorkspace = this.workspaceService.currentWorkspace();

    if (!currentWorkspace) {
      return;
    }
    const space = currentWorkspace.spaces.find((space) => space.id === spaceId);
    return space?.folders.find((folder) => folder.id === folderId)?.name;
  }
}
