import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { EmptySectionComponent } from '@shared/components/empty-section/empty-section.component';
import { TaskGroupColumnComponent } from '@shared/components/task-group/task-group-column/task-group-column.component';
import {
  GroupByOption,
  SpaceWithCollapsibleLists,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
} from '@shared/types/ui.types';
import { hasProperty } from '@shared/utils/object.utils';

@Component({
  selector: 'app-space-board-view',
  imports: [
    MatMenuModule,
    TitleCasePipe,
    TaskGroupColumnComponent,
    EmptySectionComponent,
  ],
  templateUrl: './space-board-view.component.html',
  styleUrl: './space-board-view.component.css',
})
export class SpaceBoardViewComponent {
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  taskGroups = input.required<
    | TaskGroupByStatus[]
    | TaskGroupByPriority[]
    | TaskGroupByDueDate[]
    | TaskGroupByAssignee[]
    | undefined
  >();
  selectedGroupByOption = input.required<GroupByOption>();
  spaceWithCollapsibleLists = input<SpaceWithCollapsibleLists>();
  protected hasProperty = hasProperty;
  protected canCreateTasks = computed(() =>
    this.authorizationCheckerService.canCreateTasksInSpace(
      this.spaceWithCollapsibleLists(),
    )(),
  );
}
