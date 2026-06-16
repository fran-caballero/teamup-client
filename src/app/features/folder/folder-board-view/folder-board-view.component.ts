import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { EmptySectionComponent } from '@shared/components/empty-section/empty-section.component';
import { TaskGroupColumnComponent } from '@shared/components/task-group/task-group-column/task-group-column.component';
import {
  FolderWithCollapsibleLists,
  GroupByOption,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
} from '@shared/types/ui.types';
import { hasProperty } from '@shared/utils/object.utils';

@Component({
  selector: 'app-folder-board-view',
  imports: [TitleCasePipe, TaskGroupColumnComponent, EmptySectionComponent],
  templateUrl: './folder-board-view.component.html',
  styleUrl: './folder-board-view.component.css',
})
export class FolderBoardViewComponent {
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  folder = input<FolderWithCollapsibleLists>();
  selectedGroupByOption = input.required<GroupByOption>();
  taskGroups = input.required<
    | TaskGroupByStatus[]
    | TaskGroupByPriority[]
    | TaskGroupByDueDate[]
    | TaskGroupByAssignee[]
    | undefined
  >();
  spaceId = input.required<string>();
  protected hasProperty = hasProperty;
  protected canCreateTasks = computed(() => {
    return this.authorizationCheckerService.canCreateTasksInFolder(
      this.folder(),
    )();
  });
}
