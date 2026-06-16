import { Component, computed, inject, input, signal } from '@angular/core';
import { WorkspaceService } from '@core/services/workspace.service';
import { SpaceBoardViewComponent } from '@features/space/space-board-view/space-board-view.component';
import { SpaceListViewComponent } from '@features/space/space-list-view/space-list-view.component';
import { GroupByBtnComponent } from '@shared/components/buttons/group-by-btn/group-by-btn.component';
import { ToggleClosedTasksBtnComponent } from '@shared/components/buttons/toggle-closed-tasks-btn/toggle-closed-tasks-btn.component';
import { ViewSelectorBarComponent } from '@shared/components/view-selector-bar/view-selector-bar.component';
import { TaskGroupingService } from '@shared/services/task-grouping.service';
import {
  GroupByOption,
  GroupByOrderingOption,
  SpaceWithCollapsibleLists,
} from '@shared/types/ui.types';

@Component({
  selector: 'app-space',
  imports: [
    SpaceBoardViewComponent,
    SpaceListViewComponent,
    GroupByBtnComponent,
    ToggleClosedTasksBtnComponent,
    ViewSelectorBarComponent,
  ],
  templateUrl: './space.component.html',
  styleUrl: './space.component.css',
})
export class SpaceComponent {
  private workspaceService = inject(WorkspaceService);
  private taskGroupingService = inject(TaskGroupingService);
  private workspace = this.workspaceService.currentWorkspace;
  protected view = input<'board' | 'list'>();
  protected viewParam = computed<'board' | 'list'>(
    () => this.view() ?? 'board',
  );
  protected spaceIdFromRoute = input<string>();
  protected selectedGroupByOption = signal<GroupByOption>('status');
  protected groupByOrderingOption = signal<GroupByOrderingOption>('ascending');
  protected showClosedTasks = signal<boolean>(false);
  protected spaceWithCollapsibleLists = computed<
    SpaceWithCollapsibleLists | undefined
  >(() => {
    if (this.workspace()) {
      const space = this.workspace()?.spaces.find(
        (space) => space.id === this.spaceIdFromRoute(),
      );

      if (space) {
        return {
          ...space,
          folders: space.folders.map((folder) => ({
            ...folder,
            lists: folder.lists.map((list) => ({
              ...list,
              isCollapsed: signal(false),
            })),
          })),
          lists: space.lists.map((list) => ({
            ...list,
            isCollapsed: signal(false),
          })),
        };
      }
    }

    return undefined;
  });
  protected taskGroups = computed(() => {
    if (this.spaceWithCollapsibleLists()) {
      switch (this.selectedGroupByOption()) {
        case 'status': {
          const taskGroupsByStatusInSpace =
            this.taskGroupingService.groupTasksInSpaceByStatus(
              this.spaceWithCollapsibleLists()!,
              this.showClosedTasks(),
            );

          if (this.viewParam() === 'board') {
            const taskGroups =
              this.taskGroupingService.regroupTasksForBoardViewByStatus(
                taskGroupsByStatusInSpace,
              );

            return this.taskGroupingService.orderTaskGroups(
              taskGroups,
              this.groupByOrderingOption(),
            );
          }
          return this.taskGroupingService.orderTaskGroups(
            taskGroupsByStatusInSpace,
            this.groupByOrderingOption(),
          );
        }
        case 'priority': {
          const taskGroups =
            this.taskGroupingService.groupTasksInSpaceByPriority(
              this.spaceWithCollapsibleLists()!,
              this.showClosedTasks(),
            );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.groupByOrderingOption(),
          );
        }
        case 'dueDate': {
          const taskGroups =
            this.taskGroupingService.groupTasksInSpaceByDueDate(
              this.spaceWithCollapsibleLists()!,
              this.showClosedTasks(),
            );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.groupByOrderingOption(),
          );
        }
        case 'assignee': {
          const taskGroups =
            this.taskGroupingService.groupTasksInSpaceByAssignee(
              this.spaceWithCollapsibleLists()!,
              this.showClosedTasks(),
            );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.groupByOrderingOption(),
          );
        }
      }
    }
    return;
  });
}
