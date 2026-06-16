import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import {
  afterNextRender,
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { AddDueDateBtnComponent } from '@shared/components/buttons/add-due-date-btn/add-due-date-btn.component';
import { AssignTaskBtnComponent } from '@shared/components/buttons/assign-task-btn/assign-task-btn.component';
import { SetPriorityBtnComponent } from '@shared/components/buttons/set-priority-btn/set-priority-btn.component';
import { ToggleStatusBtnComponent } from '@shared/components/buttons/toggle-status-btn/toggle-status-btn.component';
import { ToggleStatusDropdownComponent } from '@shared/components/menus/toggle-status-dropdown/toggle-status-dropdown.component';
import { StatusTagComponent } from '@shared/components/status-tag/status-tag.component';
import { UpdateTaskRequestBody } from '@shared/types/api.types';
import { TaskAncestorsIds } from '@shared/types/common.types';
import { List, Priority, Status } from '@shared/types/entities.types';
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';

@Component({
  selector: 'app-task-full-view',
  imports: [
    TextFieldModule,
    ReactiveFormsModule,
    MatMenuModule,
    AddDueDateBtnComponent,
    AssignTaskBtnComponent,
    SetPriorityBtnComponent,
    ToggleStatusBtnComponent,
    ToggleStatusDropdownComponent,
    StatusTagComponent,
    QuillModule,
  ],
  templateUrl: './task-full-view.component.html',
  styleUrl: './task-full-view.component.css',
})
export class TaskFullViewComponent implements AfterViewInit {
  private elementRef = inject(ElementRef);
  private injector = inject(Injector);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private taskService = inject(TaskService);
  private taskAncestorsIds = computed<TaskAncestorsIds>(() => {
    let listId = this.listIdFromRoute();
    if (!listId) {
      listId = this.userService.user()?.personalList.id;
    }

    return {
      spaceId: this.spaceIdFromRoute() || null,
      folderId: this.folderIdFromRoute() || null,
      listId: listId!,
    };
  });
  private newDueDate = signal<Date | null | undefined>(undefined);
  private newPriority = signal<Priority | undefined>(undefined);
  spaceIdFromRoute = input<string | null>();
  folderIdFromRoute = input<string | null>();
  listIdFromRoute = input<string>();
  taskIdFromRoute = input<string>();
  @ViewChild('autosizeTextArea') private autosizeTextArea!: CdkTextareaAutosize;

  protected task = computed(() => {
    const taskId = this.taskIdFromRoute();

    if (!taskId) {
      return;
    }

    if (this.listIdFromRoute()) {
      return this.workspaceService.mappedWorkspace()?.tasksMap.get(taskId);
    } else {
      return this.userService
        .user()
        ?.personalList.tasks.find((task) => task.id === taskId);
    }
  });

  protected taskNameForm = computed(
    () =>
      new FormGroup({
        name: new FormControl(this.task()?.name),
      }),
  );

  protected status = computed(() => {
    if (!this.listIdFromRoute()) {
      return this.userService
        .user()
        ?.personalList?.statuses.find(
          (status) => status.id === this.task()?.statusId,
        );
    } else {
      return this.workspaceService
        .mappedWorkspace()
        ?.listsMap.get(this.listIdFromRoute()!)
        ?.statuses.find((status) => status.id === this.task()?.statusId);
    }
  });

  protected list = computed<List | undefined>(() => {
    if (!this.listIdFromRoute()) {
      return this.userService.user()?.personalList;
    } else {
      return this.workspaceService
        .mappedWorkspace()
        ?.listsMap.get(this.listIdFromRoute()!);
    }
  });

  protected hasAllEditingPermissionsInTask = computed(() => {
    const list = this.list();
    const task = this.task();

    return this.authorizationCheckerService.hasAllEditingPermissionsInTask(
      list?.id,
      task,
    );
  });

  protected canEditStatuses = computed(() => {
    const list = this.list();

    return this.authorizationCheckerService.canEditStatusesInList(list?.id);
  });

  protected isDescriptionBeingEdited = signal<boolean>(false);

  protected canUpdateDescription = computed(() => {
    const list = this.list();
    const task = this.task();

    return this.authorizationCheckerService.canUpdateTaskDescription(
      list?.id,
      task,
    );
  });

  protected taskDescriptionForm = computed(
    () =>
      new FormGroup({
        description: new FormControl(this.task()?.description),
      }),
  );

  ngAfterViewInit(): void {
    afterNextRender(() => this.autosizeTextArea.resizeToFitContent(true), {
      injector: this.injector,
    });
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const targetElement = event.target as HTMLElement;

    if (event.key === 'Enter') {
      targetElement.blur();
    }
  }

  protected updateTaskStatus(selectedStatus: Status): void {
    const updateTaskData: UpdateTaskRequestBody = {
      ...this.task()!,
      statusId: selectedStatus.id,
    };

    this.taskService.updateTask(
      this.taskAncestorsIds(),
      this.task()!,
      updateTaskData,
    );
  }

  protected canAssignTasks(): boolean {
    const list = this.list();
    return this.authorizationCheckerService.canAssignTasks(list?.id);
  }

  protected handleEditorCreated(quill: Quill): void {
    quill.focus();
    quill.setSelection(quill.getLength(), 0);
    this.setupCtrlEnterBinding(quill);
  }

  protected onAssigneeSelection(assigneeId: string): void {
    const task = this.task();
    const taskAncestorsIds = this.taskAncestorsIds();

    if (!task) {
      return;
    }

    const isAssignee = !!task.assignees.find(
      (member) => member.id === assigneeId,
    );

    if (isAssignee) {
      this.taskService.removeTaskAssignee(taskAncestorsIds, task, assigneeId);
    } else {
      this.taskService.assignTask(taskAncestorsIds, task, assigneeId);
    }
  }

  protected onTaskDueDateChange(dueDate: Date | null): void {
    this.newDueDate.set(dueDate);
    this.updateTask();
  }

  protected onTaskPriorityChange(priority: Priority): void {
    this.newPriority.set(priority);
    this.updateTask();
  }

  protected updateTask(): void {
    const oldName = this.task()!.name;
    const newName = this.taskNameForm().value.name;
    const newDescription = this.taskDescriptionForm().value.description;

    if (!this.task() || !this.isTaskBeingEdited()) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: taskId, ...taskData } = this.task()!;

    taskData.name = newName || oldName;
    taskData.description = newDescription ?? taskData.description;
    taskData.dueDate = this.newDueDate() ?? taskData.dueDate;
    taskData.priority = this.newPriority() ?? taskData.priority;

    this.taskService.updateTask(
      this.taskAncestorsIds(),
      this.task()!,
      taskData,
    );
  }

  private isTaskBeingEdited(): boolean {
    const oldName = this.task()?.name;
    const newName = this.taskNameForm().value.name;
    const oldDescription = this.task()?.description;
    const newDescription = this.taskDescriptionForm().value.description;
    const oldDueDate = this.task()?.dueDate;
    const newDueDate = this.newDueDate();
    const oldPriority = this.task()?.priority;
    const newPriority = this.newPriority();

    return (
      oldName !== newName ||
      oldDescription !== newDescription ||
      oldDueDate !== newDueDate ||
      oldPriority !== newPriority
    );
  }

  @HostListener('document:click', ['$event'])
  protected clickOutside(event: Event): void {
    if (
      this.isDescriptionBeingEdited() &&
      this.elementRef.nativeElement.querySelector('.task-description-editor') &&
      !this.elementRef.nativeElement
        .querySelector('.task-description-editor')
        .contains(event.target)
    ) {
      this.isDescriptionBeingEdited.set(false);
      this.updateTask();
    }
  }

  private setupCtrlEnterBinding(quill: Quill): void {
    quill.keyboard.addBinding(
      {
        key: 'Enter',
        shortKey: true,
      },
      () => {
        this.isDescriptionBeingEdited.set(false);
        this.updateTask();
        return true;
      },
    );
  }
}
