import { Dialog } from '@angular/cdk/dialog';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { TaskService } from '@core/services/task.service';
import { AddDueDateBtnComponent } from '@shared/components/buttons/add-due-date-btn/add-due-date-btn.component';
import { AssignTaskBtnComponent } from '@shared/components/buttons/assign-task-btn/assign-task-btn.component';
import { SetPriorityBtnComponent } from '@shared/components/buttons/set-priority-btn/set-priority-btn.component';
import { ToggleOptionsDropdownBtnComponent } from '@shared/components/buttons/toggle-options-dropdown-btn/toggle-options-dropdown-btn.component';
import { ToggleStatusBtnComponent } from '@shared/components/buttons/toggle-status-btn/toggle-status-btn.component';
import { EntityOptionsDropdownComponent } from '@shared/components/menus/entity-options-dropdown/entity-options-dropdown.component';
import { PathSelectorDropdownComponent } from '@shared/components/menus/path-selector-dropdown/path-selector-dropdown.component';
import { ToggleStatusDropdownComponent } from '@shared/components/menus/toggle-status-dropdown/toggle-status-dropdown.component';
import { DeleteWarningModalComponent } from '@shared/components/modals/delete-warning-modal/delete-warning-modal.component';
import {
  CreateTaskRequestBody,
  UpdateTaskRequestBody,
} from '@shared/types/api.types';
import {
  ListAncestorsIds,
  StandaloneTask,
  TaskAncestorsData,
  TaskAncestorsIds,
  TaskWithAncestorsData,
} from '@shared/types/common.types';
import { List, Priority, Status, Task } from '@shared/types/entities.types';
import {
  DeleteWarningModalData,
  TaskGroupSubtype,
  TaskGroupType,
} from '@shared/types/ui.types';
import { buildTaskLinkArray } from '@shared/utils/link.utils';
import { filterListStatuses } from '@shared/utils/list.utils';
import {
  buildTaskPath,
  extractTaskAncestorsIds,
} from '@shared/utils/task.utils';
@Component({
  selector: 'app-task-group-list',
  imports: [
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltipModule,
    RouterModule,
    SetPriorityBtnComponent,
    ToggleOptionsDropdownBtnComponent,
    ToggleStatusBtnComponent,
    PathSelectorDropdownComponent,
    ToggleStatusDropdownComponent,
    AddDueDateBtnComponent,
    AssignTaskBtnComponent,
    EntityOptionsDropdownComponent,
  ],
  templateUrl: './task-group-list.component.html',
  styleUrl: './task-group-list.component.css',
})
export class TaskGroupListComponent implements AfterViewInit, OnDestroy {
  private dialog = inject(Dialog);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private taskService = inject(TaskService);
  private filterListStatuses = filterListStatuses;
  private isToggleStatusDropdownOpen = signal<boolean>(false);
  private resizeObserver!: ResizeObserver;
  private nameColumnWidth = signal<number | undefined>(undefined);
  private selectedListAncestorsIds = signal<ListAncestorsIds>({
    spaceId: null,
    folderId: null,
  });
  private editTaskFormArray = new FormArray<FormControl<string>>([]);
  standaloneTasks = model.required<StandaloneTask[]>();
  taskGroupType = input.required<TaskGroupType>();
  taskGroupSubtype = input.required<TaskGroupSubtype | null>();
  commonListStatuses = input.required<Status[] | null>();
  tasksCommonAncestors = input.required<TaskAncestorsData | null | undefined>();
  hasAllEditingPermissionsInList = input<boolean>();
  canCreateTasks = input<boolean>();
  omitAddTaskBtn = input<boolean>();
  @ViewChild('editTaskFormElement')
  private editTaskFormElement?: ElementRef<HTMLElement>;
  @ViewChild('newTaskFieldElement')
  private newTaskFieldElement?: ElementRef<HTMLElement>;
  @ViewChild('pathSelectorDropdownTrigger')
  private pathSelectorDropdownTrigger!: MatMenuTrigger;
  @ViewChild('nameColumn') nameColumnElement!: ElementRef<HTMLSpanElement>;
  protected isTaskBeingRenamed = signal(false);
  protected taskBeingRenamedIndex = signal<number | undefined>(undefined);
  protected buildTaskLinkArray = buildTaskLinkArray;
  protected editTaskForm = new FormGroup({
    taskNames: this.editTaskFormArray,
  });
  protected buildTaskPath = buildTaskPath;
  protected taskNameControls = computed(() => {
    const taskNamesFormArray = this.editTaskForm.get('taskNames') as FormArray;
    this.standaloneTasks().forEach((standaloneTask) => {
      taskNamesFormArray.push(new FormControl(standaloneTask.task.name));
    });
    return taskNamesFormArray.controls;
  });
  protected extractTaskAncestorsIds = extractTaskAncestorsIds;
  protected isNewTaskFieldOpen = signal(false);
  protected isNewTaskAssignTaskMenuOpen = signal<boolean>(false);
  protected isNewTaskAddDueDateMenuOpen = signal<boolean>(false);
  protected isNewTaskSetPriorityMenuOpen = signal<boolean>(false);
  protected newTaskForm = new FormGroup({
    taskName: new FormControl(''),
  });
  protected selectedListInNewTask = signal<List | undefined>(undefined);
  protected newTaskStatus = signal<Status | undefined>(undefined);
  protected statusDropdownStatuses = computed(() => {
    return this.taskGroupType() === 'inMyWork'
      ? this.filterListStatuses(
          this.selectedListInNewTask()?.statuses,
          this.taskGroupSubtype()!.statusType,
        )
      : this.commonListStatuses() || this.selectedListInNewTask()?.statuses;
  });
  protected newTaskListId = computed<string | null>(() => {
    const ancestors = this.tasksCommonAncestors();

    if (ancestors) {
      return ancestors.listData.id;
    }

    return this.selectedListInNewTask()?.id || null;
  });
  protected newTaskAssigneesIds = signal<string[]>([]);
  protected newTaskDueDate = signal<Date | null>(null);
  protected newTaskPriority = signal<Priority>(null);

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const newWidth = entries[0].contentRect.width;
        this.nameColumnWidth.set(newWidth);
      }
    });

    this.resizeObserver.observe(this.nameColumnElement.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  protected onStatusSelection(
    selectedStatus: Status,
    taskWithAncestorsData: TaskWithAncestorsData,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: taskId, ...taskData } = taskWithAncestorsData.task;

    if (taskData.statusId === selectedStatus.id) {
      return;
    }

    const taskAncestorsIds: TaskAncestorsIds = this.extractTaskAncestorsIds(
      taskWithAncestorsData.taskAncestorsData,
    );

    const newTaskData: UpdateTaskRequestBody = {
      ...taskData,
      statusId: selectedStatus.id,
    };

    this.taskService.updateTask(
      taskAncestorsIds,
      taskWithAncestorsData.task,
      newTaskData,
    );
  }

  protected onEditTaskName(
    taskAncestorsIds: TaskAncestorsIds,
    task: Task,
    index: number,
  ): void {
    const taskNameControl = this.taskNameControls()[index];
    const oldTaskName = this.standaloneTasks()[index].task.name;
    this.isTaskBeingRenamed.set(false);

    if (taskNameControl.value !== '') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: taskId, ...taskData } = task;

      taskData.name = taskNameControl.value;

      this.taskService.updateTask(taskAncestorsIds, task, taskData);
    } else {
      taskNameControl.setValue(oldTaskName);
    }
  }

  protected canAssignTasks(listId: string): boolean {
    return this.authorizationCheckerService.canAssignTasks(listId);
  }

  protected hasAllEditingPermissionsInTask(
    standaloneTask: StandaloneTask,
  ): boolean {
    return this.authorizationCheckerService.hasAllEditingPermissionsInTask(
      standaloneTask.taskAncestorsData.listData.id,
      standaloneTask.task,
    );
  }

  protected canDeleteTask(listId: string): boolean {
    return this.authorizationCheckerService.canDeleteTasks(listId);
  }

  protected openDeleteWarningModal(standaloneTask: StandaloneTask): void {
    const modalData: DeleteWarningModalData = {
      workspaceId: null,
      spaceId: standaloneTask.taskAncestorsData.spaceData?.id || null,
      folderId: standaloneTask.taskAncestorsData.folderData?.id || null,
      listId: standaloneTask.taskAncestorsData.listData.id,
      statusId: null,
      taskId: standaloneTask.task.id,
      elementType: 'task',
      elementName: standaloneTask.task.name,
    };
    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }

  protected onAssigneeSelection(
    taskAncestorsIds: TaskAncestorsIds,
    task: Task,
    assigneeId: string,
  ): void {
    const isAssignee = !!task.assignees.find(
      (member) => member.id === assigneeId,
    );

    if (isAssignee) {
      this.taskService.removeTaskAssignee(taskAncestorsIds, task, assigneeId);
    } else {
      this.taskService.assignTask(taskAncestorsIds, task, assigneeId);
    }
  }

  protected onSelectedDateChange(
    taskAncestorsIds: TaskAncestorsIds,
    task: Task,
    selectedDate: Date | null,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...taskData } = task;

    taskData.dueDate = selectedDate;

    this.taskService.updateTask(taskAncestorsIds, task, taskData);
  }

  protected onTaskPriorityChange(
    taskAncestorsIds: TaskAncestorsIds,
    task: Task,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...taskData } = task;

    this.taskService.updateTask(taskAncestorsIds, task, taskData);
  }

  protected onOpenToggleStatusDropdown(): void {
    this.isToggleStatusDropdownOpen.set(true);
  }

  protected onCloseToggleStatusDropdown(): void {
    setTimeout(() => {
      this.isToggleStatusDropdownOpen.set(false);
    }, 0);
  }

  protected get newTaskNameFormControl(): FormControl<string | null> {
    return this.newTaskForm.controls.taskName;
  }

  protected onListSelection(
    selectedList: List,
    selectedListAncestorsIds: ListAncestorsIds,
  ): void {
    this.selectedListInNewTask.set(selectedList);
    this.selectedListAncestorsIds.set(selectedListAncestorsIds);

    const firstToDoStatus = this.selectedListInNewTask()!.statuses.find(
      (status) =>
        status.type ===
        (this.taskGroupSubtype()
          ? this.taskGroupSubtype()!.statusType
          : 'not_started'),
    );

    this.newTaskStatus.set(firstToDoStatus);
    this.newTaskForm.controls.taskName.setErrors(null);
    this.pathSelectorDropdownTrigger.closeMenu();
  }

  protected onSaveNewTask(): void {
    if (
      this.newTaskForm.controls.taskName.value &&
      this.newTaskForm.controls.taskName.value !== '' &&
      this.newTaskListId()
    ) {
      const taskData: CreateTaskRequestBody = {
        id: self.crypto.randomUUID(),
        name: this.newTaskForm.controls.taskName.value,
        priority: this.newTaskPriority(),
        dueDate: this.newTaskDueDate(),
        assigneesIds: this.newTaskAssigneesIds(),
        statusId: this.newTaskStatus()!.id,
        description: null,
      };

      const taskAncestorsIds: TaskAncestorsIds = this.tasksCommonAncestors()
        ? {
            spaceId: this.tasksCommonAncestors()!.spaceData?.id || null,
            folderId: this.tasksCommonAncestors()!.folderData?.id || null,
            listId: this.tasksCommonAncestors()!.listData.id,
          }
        : {
            ...this.selectedListAncestorsIds(),
            listId: this.selectedListInNewTask()!.id,
          };

      this.taskService.createTask(taskAncestorsIds, taskData);
      this.isNewTaskFieldOpen.set(false);
      this.resetNewTaskForm();
    } else {
      this.newTaskForm.controls.taskName.setErrors({ incorrect: true });
    }
  }

  protected onCloseNewTaskAssignTaskMenu(): void {
    setTimeout(() => {
      this.isNewTaskAssignTaskMenuOpen.set(false);
    });
  }

  protected onCloseNewTaskAddDueDateMenu(): void {
    setTimeout(() => {
      this.isNewTaskAddDueDateMenuOpen.set(false);
    }, 0);
  }

  protected onCloseNewTaskSetPriorityMenu(): void {
    setTimeout(() => {
      this.isNewTaskSetPriorityMenuOpen.set(false);
    }, 0);
  }

  protected initializeNewTaskStatus(): void {
    let defaultStatus: Status | undefined;

    if (this.commonListStatuses()) {
      defaultStatus = this.commonListStatuses()!.find(
        (status) =>
          status.type ===
          (this.taskGroupSubtype()
            ? this.taskGroupSubtype()?.statusType
            : 'not_started'),
      );
    } else {
      switch (this.taskGroupSubtype()?.statusType) {
        case undefined:
        case 'not_started':
          {
            defaultStatus = {
              id: self.crypto.randomUUID(),
              name: 'TO DO',
              isDefault: true,
              colorHex: null,
              defaultColorId: 14,
              type: 'not_started',
              createdBy: self.crypto.randomUUID(),
              createdAt: new Date(),
              updatedBy: null,
              updatedAt: null,
            };
          }
          break;
        case 'active':
          {
            defaultStatus = {
              id: self.crypto.randomUUID(),
              name: 'IN PROGRESS',
              isDefault: true,
              colorHex: null,
              defaultColorId: 3,
              type: 'active',
              createdBy: self.crypto.randomUUID(),
              createdAt: new Date(),
              updatedBy: null,
              updatedAt: null,
            };
          }
          break;
        case 'done':
          {
            defaultStatus = {
              id: self.crypto.randomUUID(),
              name: 'COMPLETE',
              isDefault: true,
              colorHex: null,
              defaultColorId: 6,
              type: 'done',
              createdBy: self.crypto.randomUUID(),
              createdAt: new Date(),
              updatedBy: null,
              updatedAt: null,
            };
          }
          break;
      }
    }
    this.newTaskStatus.set(defaultStatus!);
    this.isNewTaskFieldOpen.set(true);
  }

  @HostListener('document:click', ['$event'])
  protected clickOutside(event: Event): void {
    if (
      this.isTaskBeingRenamed() &&
      this.editTaskFormElement &&
      !this.editTaskFormElement.nativeElement.contains(event.target as Node)
    ) {
      this.isTaskBeingRenamed.set(false);
    }

    if (
      this.isNewTaskFieldOpen() &&
      this.newTaskFieldElement &&
      !this.newTaskFieldElement.nativeElement.contains(event.target as Node) &&
      !this.isNewTaskAssignTaskMenuOpen() &&
      !this.isNewTaskAddDueDateMenuOpen() &&
      !this.isNewTaskSetPriorityMenuOpen() &&
      !this.isToggleStatusDropdownOpen()
    ) {
      this.isNewTaskFieldOpen.set(false);
      this.resetNewTaskForm();
    }
  }

  private resetNewTaskForm(): void {
    this.newTaskForm.controls.taskName.reset();
    this.selectedListInNewTask.set(undefined);
    this.newTaskStatus.set(undefined);
    this.newTaskPriority.set(null);
    this.newTaskDueDate.set(null);
    this.newTaskAssigneesIds.set([]);
  }
}
