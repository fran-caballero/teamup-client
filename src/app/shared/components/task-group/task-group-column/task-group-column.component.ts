import { Dialog } from '@angular/cdk/dialog';
import { NgStyle } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  OnInit,
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
import { ColorThemeService } from '@core/services/color-theme.service';
import { ListService } from '@core/services/list.service';
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
import { StatusTagComponent } from '@shared/components/status-tag/status-tag.component';
import {
  ColumnType,
  ColumnVariant,
  taskGroupColumnVariants,
} from '@shared/constants/task-group-column-variants.constants';
import { isEllipsedDirective } from '@shared/directives/is-ellipsed.directive';
import { DateService } from '@shared/services/date.service';
import { CreateTaskRequestBody } from '@shared/types/api.types';
import {
  DayOfTheWeek,
  ListAncestorsIds,
  StandaloneTask,
  TaskAncestorsData,
  TaskAncestorsIds,
  TaskWithAncestorsData,
} from '@shared/types/common.types';
import {
  List,
  Priority,
  Status,
  SubsectionRole,
  Task,
} from '@shared/types/entities.types';
import {
  DeleteWarningModalData,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
  TaskGroupType,
} from '@shared/types/ui.types';
import {
  buildTaskLinkArray,
  getFolderLink,
  getListLink,
  getSpaceLink,
} from '@shared/utils/link.utils';
import { extractTaskAncestorsIds } from '@shared/utils/task.utils';

@Component({
  selector: 'app-task-group-column',
  imports: [
    NgStyle,
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltipModule,
    RouterModule,
    AssignTaskBtnComponent,
    SetPriorityBtnComponent,
    ToggleOptionsDropdownBtnComponent,
    PathSelectorDropdownComponent,
    AddDueDateBtnComponent,
    ToggleStatusBtnComponent,
    EntityOptionsDropdownComponent,
    ToggleStatusDropdownComponent,
    StatusTagComponent,
    isEllipsedDirective,
  ],
  templateUrl: './task-group-column.component.html',
  styleUrl: './task-group-column.component.css',
})
export class TaskGroupColumnComponent implements OnInit {
  private dialog = inject(Dialog);
  private elementRef = inject(ElementRef);
  private injector = inject(Injector);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private listService = inject(ListService);
  private taskService = inject(TaskService);
  private colorThemeService = inject(ColorThemeService);
  private dateService = inject(DateService);
  private currentColorTheme = this.colorThemeService.currentColorTheme;
  private columnVariantProperties = computed<ColumnVariant>(
    () => taskGroupColumnVariants[this.columnVariant()],
  );
  private editTaskFormArray = new FormArray<FormControl<string>>([]);
  private newTaskStatus = signal<Status | undefined>(undefined);
  private selectedListAncestorsIds = signal<ListAncestorsIds>({
    spaceId: null,
    folderId: null,
  });
  taskGroup = input<
    | TaskGroupByStatus
    | TaskGroupByPriority
    | TaskGroupByDueDate
    | TaskGroupByAssignee
  >();
  taskGroupType = input.required<TaskGroupType>();
  tasksCommonAncestors = input.required<TaskAncestorsData | null | undefined>();
  status = input<Status>();
  columnName = input<string>();
  columnVariant = input.required<ColumnType>();
  columnSubvariant = input.required<string | null>();
  assigneeId = input<string | null>();
  authorizationRole = input<SubsectionRole>();
  hasAllEditingPermissionsInList = input<boolean>();
  canCreateTasks = input<boolean>();
  omitAddTaskBtn = input<boolean>();
  @ViewChild('pathSelectorDropdownTrigger')
  private pathSelectorDropdownTrigger!: MatMenuTrigger;
  @ViewChild('editTaskFormInput')
  private editTaskFormInput?: ElementRef;

  protected backgroundColor = computed(() => {
    if (this.status()) {
      const defaultColorId = this.status()!.defaultColorId;

      const defaultColor = this.listService.getDefaultColor(defaultColorId!);
      if (this.currentColorTheme() === 'light') {
        return `color-mix(in sRGB, ${defaultColor!.light} 5%, white 95%)`;
      } else {
        return `color-mix(in sRGB, ${defaultColor!.dark} 5%, #2A2E34 95%)`;
      }
    } else {
      const textColor = `var(--${
        this.columnSubvariantProperties().textColorVariableName
      })`;
      if (this.currentColorTheme() === 'light') {
        return `color-mix(in sRGB, ${textColor} 5%, white 95%)`;
      } else {
        return `color-mix(in sRGB, ${textColor} 5%, #2A2E34 95%)`;
      }
    }
    return;
  });

  protected isStatusBeingEdited = signal<boolean>(false);

  protected tagColor = computed(() => {
    if (!this.status()) {
      return;
    }

    const defaultColorId = this.status()!.defaultColorId;
    const defaultColor = this.listService.getDefaultColor(defaultColorId!);

    if (this.columnVariant() === 'status') {
      return defaultColor![this.currentColorTheme()!];
    }

    if (this.columnSubvariantProperties().isTagOpaque) {
      return `var(--${this.columnSubvariantProperties().tagColorVariableName})`;
    } else if (this.currentColorTheme() === 'dark') {
      return `color-mix(in sRGB, var(--${
        this.columnSubvariantProperties().tagColorVariableName
      }), #30343C 90%)`;
    } else {
      return `color-mix(in sRGB, var(--${
        this.columnSubvariantProperties().tagColorVariableName
      }), white 85%)`;
    }
  });

  protected textColor = computed(() => {
    if (!this.columnSubvariantProperties()) {
      return;
    }

    return `var(--${this.columnSubvariantProperties().textColorVariableName})`;
  });

  protected columnSubvariantProperties = computed(() => {
    const columnSubvariant = this.columnSubvariant();

    if (
      columnSubvariant &&
      this.dateService.daysOfTheWeek.includes(columnSubvariant as DayOfTheWeek)
    ) {
      return this.columnVariantProperties().subvariants['future'];
    }

    return this.columnVariantProperties().subvariants[
      columnSubvariant ?? 'null'
    ];
  });

  protected openedToggleStatusMenuTaskId = signal<string | null>(null);
  protected isTaskBeingRenamed = signal<boolean>(false);
  protected taskBeingRenamedIndex = signal<number | undefined>(undefined);
  protected buildTaskLinkArray = buildTaskLinkArray;
  protected editTaskForm = new FormGroup({
    taskNames: this.editTaskFormArray,
  });

  protected taskNameControls = computed(() => {
    const taskNamesFormArray = this.editTaskForm.get('taskNames') as FormArray;
    this.taskGroup()?.standaloneTasks.forEach((standaloneTask) => {
      taskNamesFormArray.push(new FormControl(standaloneTask.task.name));
    });
    return taskNamesFormArray.controls;
  });

  protected getSpaceLink = getSpaceLink;
  protected getFolderLink = getFolderLink;
  protected getListLink = getListLink;
  protected newTaskAssigneesIds = signal<string[]>([]);
  protected extractTaskAncestorsIds = extractTaskAncestorsIds;
  protected isNewTaskFieldOpen = signal<boolean>(false);
  protected newTaskForm = new FormGroup({
    taskName: new FormControl(''),
  });
  protected newTaskName = signal<string>('');
  protected selectedListInNewTask = signal<List | null>(null);

  protected isNewTaskAssignTaskMenuOpen = signal<boolean>(false);
  protected newTaskListId = computed<string | null>(() => {
    const ancestors = this.tasksCommonAncestors();

    if (ancestors) {
      return ancestors.listData.id;
    }

    return this.selectedListInNewTask()?.id || null;
  });
  protected newTaskDueDate = signal<Date | null>(null);
  protected isNewTaskAddDueDateMenuOpen = signal<boolean>(false);
  protected newTaskPriority = signal<Priority | null>(null);
  protected isNewTaskSetPriorityMenuOpen = signal<boolean>(false);

  ngOnInit() {
    this.setNewTaskAssigneesId();
    this.setNewTaskPriority();
    this.setNewTaskDueDate();
  }

  protected getFontVariationSettings(): string | undefined {
    if (this.columnSubvariantProperties()?.fontVariationSettings) {
      return this.columnSubvariantProperties().fontVariationSettings;
    } else {
      return '';
    }
  }

  protected canEditStatuses(): boolean {
    const tasksAncestorsData = this.tasksCommonAncestors();
    const status = this.status();

    if (!tasksAncestorsData || !status) {
      return false;
    }

    return this.authorizationCheckerService.canEditStatusesInList(
      tasksAncestorsData.listData.id,
    );
  }

  protected canDeleteStatuses(): boolean {
    const tasksAncestorsData = this.tasksCommonAncestors();
    const status = this.status();

    if (!tasksAncestorsData || !status) {
      return false;
    }

    const listId = tasksAncestorsData.listData.id;

    return this.authorizationCheckerService.canDeleteStatusesInList(
      listId,
      status,
    );
  }

  protected openDeleteStatusWarningModal(status: Status): void {
    const taskAncestorsData = this.tasksCommonAncestors();

    if (!taskAncestorsData) {
      return;
    }

    const modalData: DeleteWarningModalData = {
      workspaceId: null,
      spaceId: taskAncestorsData.spaceData!.id,
      folderId: taskAncestorsData.folderData?.id || null,
      listId: taskAncestorsData.listData.id,
      statusId: status.id,
      taskId: null,
      elementType: 'status',
      elementName: status.name,
    };

    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }

  protected onStartTaskRenaming(index: number): void {
    this.isTaskBeingRenamed.set(true);
    this.taskBeingRenamedIndex.set(index);

    afterNextRender(
      () => {
        this.editTaskFormInput?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected onEditTaskName(
    standaloneTask: TaskWithAncestorsData,
    index: number,
  ): void {
    const taskNameControl = this.taskNameControls()[index];
    const oldTaskName = this.taskGroup()?.standaloneTasks[index].task.name;
    this.isTaskBeingRenamed.set(false);

    if (taskNameControl.value !== '') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: taskId, ...taskData } = standaloneTask.task;

      const taskAncestorsIds: TaskAncestorsIds = this.extractTaskAncestorsIds(
        standaloneTask.taskAncestorsData,
      );

      taskData.name = taskNameControl.value;
      this.taskService.updateTask(
        taskAncestorsIds,
        standaloneTask.task,
        taskData,
      );
    } else {
      taskNameControl.setValue(oldTaskName);
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

    const newTaskData = {
      ...taskData,
      statusId: selectedStatus.id,
    };

    this.taskService.updateTask(
      taskAncestorsIds,
      taskWithAncestorsData.task,
      newTaskData,
    );
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

  protected canAssignTasks(listId: string): boolean {
    return this.authorizationCheckerService.canAssignTasks(listId);
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

  protected get newTaskNameFormControl(): FormControl<string | null> {
    return this.newTaskForm.controls.taskName;
  }

  protected onCloseNewTaskAssignTaskMenu(): void {
    setTimeout(() => {
      this.isNewTaskAssignTaskMenuOpen.set(false);
    }, 0);
  }

  protected openNewTaskField(): void {
    if (!this.isNewTaskFieldOpen()) {
      setTimeout(() => {
        this.isNewTaskFieldOpen.set(true);
      }, 0);
    }
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
        statusId:
          this.taskGroupType() === 'inList'
            ? this.status()!.id
            : this.newTaskStatus()!.id,
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
      this.newTaskForm.reset();
      this.setNewTaskAssigneesId();
      this.setNewTaskPriority();
      this.setNewTaskDueDate();
    } else {
      this.newTaskForm.controls.taskName.setErrors({ incorrect: true });
    }
  }

  protected onListSelection(
    selectedList: List,
    selectedListAncestorsIds: ListAncestorsIds,
  ): void {
    this.selectedListInNewTask.set(selectedList);
    this.selectedListAncestorsIds.set(selectedListAncestorsIds);

    const status = this.findMatchingStatusInList(selectedList);

    this.newTaskStatus.set(status);
    this.newTaskForm.controls.taskName.setErrors(null);
    this.pathSelectorDropdownTrigger.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  protected clickOutside(event: Event): void {
    if (
      this.isTaskBeingRenamed() &&
      this.elementRef.nativeElement.querySelector(
        '.task__name-row:has( > .task__edit-task-form)',
      ) &&
      !this.elementRef.nativeElement
        .querySelector('.task__name-row:has( > .task__edit-task-form)')
        .contains(event.target)
    ) {
      this.isTaskBeingRenamed.set(false);
    }

    if (
      this.isNewTaskFieldOpen() &&
      !this.elementRef.nativeElement
        .querySelector('.new-task-form')
        .contains(event.target) &&
      !this.isNewTaskAssignTaskMenuOpen() &&
      !this.isNewTaskAddDueDateMenuOpen() &&
      !this.isNewTaskSetPriorityMenuOpen()
    ) {
      this.isNewTaskFieldOpen.set(false);
      this.newTaskForm.reset();
      this.selectedListInNewTask.set(null);
    }
  }

  private setNewTaskAssigneesId(): void {
    if (this.columnVariant() === 'assignee' && this.assigneeId()) {
      this.newTaskAssigneesIds.set([this.assigneeId()!]);
    } else {
      this.newTaskPriority.set(null);
    }
  }

  private setNewTaskDueDate(): void {
    if (this.columnVariant() === 'dueDate') {
      let selectedDate: Date | null = null;
      const columnSubvariant = this.columnSubvariant();
      if (columnSubvariant === null || columnSubvariant === 'done') {
        return;
      }
      if (columnSubvariant === 'overdue') {
        selectedDate = this.dateService.getYesterday();
      } else if (columnSubvariant === 'today') {
        selectedDate = this.dateService.getEndOfToday();
      } else if (columnSubvariant === 'tomorrow') {
        selectedDate = this.dateService.getEndOfTomorrow();
      } else if (columnSubvariant === 'future') {
        selectedDate = this.dateService.getTwoWeeksFromNow();
      } else if (
        this.dateService.daysOfTheWeek.includes(
          columnSubvariant as DayOfTheWeek,
        )
      ) {
        const daysToDay = this.dateService.getDaysToNextDayOfTheWeek(
          columnSubvariant as DayOfTheWeek,
        );
        const dateToSet = new Date();
        dateToSet.setDate(dateToSet.getDate() + daysToDay);
        selectedDate = this.dateService.getEndOfDay(dateToSet);
      }
      this.newTaskDueDate.set(selectedDate);
    }
    return;
  }

  private setNewTaskPriority(): void {
    this.newTaskPriority.set(
      this.columnVariant() === 'priority'
        ? (this.columnSubvariant() as Priority)
        : null,
    );
  }

  private findMatchingStatusInList(list: List): Status | undefined {
    if (this.columnVariant() !== 'status') {
      return list.statuses.find((status) => status.type === 'not_started');
    }
    return list.statuses.find((status) => status.name === this.columnName());
  }
}
