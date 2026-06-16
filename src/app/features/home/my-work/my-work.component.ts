import { Component, computed, inject, signal } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { TaskGroupListComponent } from '@shared/components/task-group/task-group-list/task-group-list.component';
import { TaskGroupingService } from '@shared/services/task-grouping.service';
import { ListsWithAncestorsGroup } from '@shared/types/common.types';
import { Status } from '@shared/types/entities.types';

@Component({
  selector: 'app-my-work',
  imports: [TaskGroupListComponent],
  templateUrl: './my-work.component.html',
  styleUrl: './my-work.component.css',
})
export class MyWorkComponent {
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private taskGroupingService = inject(TaskGroupingService);
  private workspace = this.workspaceService.currentWorkspace;

  private listsWithAncestorsGroupArray = computed(() => {
    const listsWithAncestorsGroupArray: ListsWithAncestorsGroup[] = [];
    const spaces = this.workspace()?.spaces;
    const personalList = this.userService.user()?.personalList;

    if (spaces) {
      spaces.forEach((space) => {
        space?.folders.forEach((folder) =>
          listsWithAncestorsGroupArray.push({
            lists: folder.lists,
            listsAncestorsData: {
              spaceData: { name: space.name, id: space.id },
              folderData: { name: folder.name, id: folder.id },
            },
          }),
        );
        listsWithAncestorsGroupArray.push({
          lists: space.lists,
          listsAncestorsData: {
            spaceData: { name: space.name, id: space.id },
            folderData: null,
          },
        });
      });
    }

    if (personalList) {
      listsWithAncestorsGroupArray.push({
        lists: [personalList],
        listsAncestorsData: {
          spaceData: null,
          folderData: null,
        },
      });
    }

    return listsWithAncestorsGroupArray;
  });
  protected selectedStatus = signal<Status['type']>('not_started');
  protected taskGroupsByStatus = computed(() => {
    return this.taskGroupingService.groupTasksFromListGroupArrayByStatus(
      this.listsWithAncestorsGroupArray(),
    );
  });

  protected updateSelectedStatus(newStatus: Status['type']): void {
    this.selectedStatus.set(newStatus);
  }
}
