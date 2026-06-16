import { Dialog } from '@angular/cdk/dialog';
import { NgStyle, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { CollapseExpandBtnComponent } from '@shared/components/buttons/collapse-expand-btn/collapse-expand-btn.component';
import { ToggleOptionsDropdownBtnComponent } from '@shared/components/buttons/toggle-options-dropdown-btn/toggle-options-dropdown-btn.component';
import { EntityOptionsDropdownComponent } from '@shared/components/menus/entity-options-dropdown/entity-options-dropdown.component';
import { DeleteWarningModalComponent } from '@shared/components/modals/delete-warning-modal/delete-warning-modal.component';
import { StatusTagComponent } from '@shared/components/status-tag/status-tag.component';
import { TaskGroupListComponent } from '@shared/components/task-group/task-group-list/task-group-list.component';
import { priorityFlagStyles } from '@shared/constants/priority-flags-styles.constants';
import { TaskAncestorsData } from '@shared/types/common.types';
import { List, Priority, Status } from '@shared/types/entities.types';
import {
  DeleteWarningModalData,
  GroupByOption,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
  TaskGroupType,
} from '@shared/types/ui.types';
import { hasProperty } from '@shared/utils/object.utils';

type FolderOrSpaceView = null;

@Component({
  selector: 'app-list-list-view',
  imports: [
    NgStyle,
    TitleCasePipe,
    CollapseExpandBtnComponent,
    ToggleOptionsDropdownBtnComponent,
    StatusTagComponent,
    TaskGroupListComponent,
    EntityOptionsDropdownComponent,
  ],
  templateUrl: './list-list-view.component.html',
  styleUrl: './list-list-view.component.css',
})
export class ListListViewComponent {
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private dialog = inject(Dialog);
  list = input.required<List | FolderOrSpaceView>();
  spaceId = input.required<string | null>();
  folderId = input.required<string | null>();
  selectedGroupByOption = input.required<GroupByOption>();
  taskGroups = input.required<
    | TaskGroupByStatus[]
    | TaskGroupByPriority[]
    | TaskGroupByDueDate[]
    | TaskGroupByAssignee[]
    | undefined
  >();
  tasksCommonAncestors = input.required<TaskAncestorsData | null | undefined>();
  taskGroupsType = input.required<TaskGroupType>();
  isAssignedToMe = input<boolean>();
  protected hasProperty = hasProperty;
  protected isListCollapsed = signal(false);
  protected isPersonal = computed(() => {
    return !this.tasksCommonAncestors()?.spaceData;
  });
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
  protected canEditStatuses = computed(() => {
    const list = this.list();

    return this.authorizationCheckerService.canEditStatusesInList(list?.id);
  });

  protected canDeleteStatus(status: Status): boolean {
    const list = this.list();

    return this.authorizationCheckerService.canDeleteStatusesInList(
      list?.id,
      status,
    );
  }

  protected openDeleteStatusWarningModal(status: Status): void {
    const list = this.list();
    if (!list) {
      return;
    }
    const modalData: DeleteWarningModalData = {
      workspaceId: null,
      spaceId: this.spaceId(),
      folderId: this.folderId(),
      listId: list.id,
      statusId: status.id,
      taskId: null,
      elementType: 'status',
      elementName: status.name,
    };
    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }

  protected onToggleListState(state: boolean): void {
    this.isListCollapsed.set(state);
  }

  protected getFontVariationSettings(priority: Priority): string {
    if (priority === null) {
      return '';
    }
    return priorityFlagStyles[priority].fontVariationSettings;
  }

  protected getFlagColor(priority: Priority): string {
    if (priority === null) {
      return 'var(--text-color-secondary)';
    }
    return `var(--${priorityFlagStyles[priority].flagColorVariableName})`;
  }
}
