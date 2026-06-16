import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { UserService } from '@core/services/user.service';
import { AddStatusBtnComponent } from '@shared/components/buttons/add-status-btn/add-status-btn.component';
import { TaskGroupColumnComponent } from '@shared/components/task-group/task-group-column/task-group-column.component';
import { TaskAncestorsData } from '@shared/types/common.types';
import { List } from '@shared/types/entities.types';
import {
  GroupByOption,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
} from '@shared/types/ui.types';
import { hasProperty } from '@shared/utils/object.utils';

@Component({
  selector: 'app-list-board-view',
  imports: [TitleCasePipe, AddStatusBtnComponent, TaskGroupColumnComponent],
  templateUrl: './list-board-view.component.html',
  styleUrl: './list-board-view.component.css',
})
export class ListBoardViewComponent {
  private userService = inject(UserService);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  selectedGroupByOption = input.required<GroupByOption>();
  list = input<List | null>();
  taskGroups = input.required<
    | TaskGroupByStatus[]
    | TaskGroupByPriority[]
    | TaskGroupByDueDate[]
    | TaskGroupByAssignee[]
    | undefined
  >();
  tasksCommonAncestors = input.required<TaskAncestorsData | null | undefined>();
  isAssignedToMe = input<boolean>();
  protected hasProperty = hasProperty;
  protected canCreateTasks = computed(() => {
    const list = this.list();

    return this.authorizationCheckerService.canCreateTasks(list?.id);
  });
  protected hasAllEditingPermissions = computed(() => {
    const list = this.list();

    return this.authorizationCheckerService.hasAllEditingPermissionsInList(
      list?.id,
    );
  });

  protected getAssigneeGroupingColumnName(
    assignee: {
      id: string;
      username: string;
    } | null,
  ): string {
    if (assignee) {
      if (assignee.username === this.userService.user()?.username) {
        return `Me (${assignee.username})`;
      } else return assignee.username;
    }
    return 'No assignee';
  }
}
