import { Component, computed, inject, input, signal } from '@angular/core';
import { WorkspaceService } from '@core/services/workspace.service';
import { FolderBoardViewComponent } from '@features/folder/folder-board-view/folder-board-view.component';
import { GroupByBtnComponent } from '@shared/components/buttons/group-by-btn/group-by-btn.component';
import { ToggleClosedTasksBtnComponent } from '@shared/components/buttons/toggle-closed-tasks-btn/toggle-closed-tasks-btn.component';
import { ViewSelectorBarComponent } from '@shared/components/view-selector-bar/view-selector-bar.component';
import { TaskGroupingService } from '@shared/services/task-grouping.service';
import {
  FolderWithCollapsibleLists,
  GroupByOption,
  GroupByOrderingOption,
} from '@shared/types/ui.types';

import { FolderListViewComponent } from './folder-list-view/folder-list-view.component';

@Component({
  selector: 'app-folder',
  imports: [
    GroupByBtnComponent,
    ViewSelectorBarComponent,
    ToggleClosedTasksBtnComponent,
    FolderBoardViewComponent,
    FolderListViewComponent,
  ],
  templateUrl: './folder.component.html',
  styleUrl: './folder.component.css',
})
export class FolderComponent {
  private workspaceService = inject(WorkspaceService);
  protected taskGroupingService = inject(TaskGroupingService);
  private workspace = this.workspaceService.currentWorkspace;
  protected view = input<'board' | 'list'>();
  protected viewParam = computed<'board' | 'list'>(
    () => this.view() ?? 'board',
  );
  spaceIdFromRoute = input<string>();
  folderIdFromRoute = input<string>();
  protected selectedGroupByOption = signal<GroupByOption>('status');
  protected groupByOrderingOption = signal<GroupByOrderingOption>('ascending');
  protected showClosedTasks = signal<boolean>(false);
  protected space = computed(() => {
    if (this.workspace()) {
      return this.workspace()?.spaces.find(
        (space) => space.id === this.spaceIdFromRoute(),
      );
    }
    return undefined;
  });

  protected folderWithCollapsibleLists = computed<
    FolderWithCollapsibleLists | undefined
  >(() => {
    if (this.space()) {
      const folder = this.space()!.folders.find(
        (folder) => folder.id === this.folderIdFromRoute(),
      );

      if (folder) {
        return {
          ...folder,
          lists: folder?.lists.map((list) => ({
            ...list,
            isCollapsed: signal(false),
          })),
        };
      }
    }
    return undefined;
  });

  protected taskGroups = computed(() => {
    if (this.space() && this.folderWithCollapsibleLists()) {
      switch (this.selectedGroupByOption()) {
        case 'status': {
          const spaceData = { name: this.space()!.name, id: this.space()!.id };
          const groupTasksByStatusInList =
            this.taskGroupingService.groupTasksInFolderByStatus(
              spaceData,
              this.folderWithCollapsibleLists()!,
              this.showClosedTasks(),
            );
          if (this.viewParam() === 'board') {
            const taskGroups =
              this.taskGroupingService.regroupTasksForBoardViewByStatus(
                groupTasksByStatusInList,
              );

            return this.taskGroupingService.orderTaskGroups(
              taskGroups,
              this.groupByOrderingOption(),
            );
          }
          return this.taskGroupingService.orderTaskGroups(
            groupTasksByStatusInList,
            this.groupByOrderingOption(),
          );
        }
        case 'priority': {
          const taskGroups =
            this.taskGroupingService.groupTasksInFolderByPriority(
              { name: this.space()!.name, id: this.space()!.id },
              this.folderWithCollapsibleLists()!,
              this.showClosedTasks(),
            );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.groupByOrderingOption(),
          );
        }

        case 'dueDate': {
          const taskGroups =
            this.taskGroupingService.groupTasksInFolderByDueDate(
              { name: this.space()!.name, id: this.space()!.id },
              this.folderWithCollapsibleLists()!,
              this.showClosedTasks(),
            );

          return this.taskGroupingService.orderTaskGroups(
            taskGroups,
            this.groupByOrderingOption(),
          );
        }
        case 'assignee': {
          const taskGroups =
            this.taskGroupingService.groupTasksInFolderByAssignee(
              {
                name: this.space()!.name,
                id: this.space()!.id,
              },
              this.folderWithCollapsibleLists()!,
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
