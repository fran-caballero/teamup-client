import { DialogRef } from '@angular/cdk/dialog';
import { NgStyle } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ColorThemeService } from '@core/services/color-theme.service';
import { ListService } from '@core/services/list.service';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { AddDueDateBtnComponent } from '@shared/components/buttons/add-due-date-btn/add-due-date-btn.component';
import { SetPriorityBtnComponent } from '@shared/components/buttons/set-priority-btn/set-priority-btn.component';
import { ListSymbolComponent } from '@shared/components/icons/list-symbol/list-symbol.component';
import { PathSelectorDropdownComponent } from '@shared/components/menus/path-selector-dropdown/path-selector-dropdown.component';
import { ToggleStatusDropdownComponent } from '@shared/components/menus/toggle-status-dropdown/toggle-status-dropdown.component';
import { ListAncestorsIds } from '@shared/types/common.types';
import { List, Priority, Status } from '@shared/types/entities.types';
import { StatusColor } from '@shared/types/ui.types';

@Component({
  selector: 'app-new-task-modal',
  imports: [
    NgStyle,
    ReactiveFormsModule,
    MatMenuModule,
    SetPriorityBtnComponent,
    ListSymbolComponent,
    PathSelectorDropdownComponent,
    ToggleStatusDropdownComponent,
    AddDueDateBtnComponent,
  ],
  templateUrl: './new-task-modal.component.html',
  styleUrl: './new-task-modal.component.css',
})
export class NewTaskModalComponent {
  private dialogRef = inject(DialogRef);
  private userService = inject(UserService);
  private taskService = inject(TaskService);
  private listService = inject(ListService);
  private colorThemeService = inject(ColorThemeService);
  private personalList = computed(() => this.userService.user()?.personalList);
  private selectedListAncestorsIds = signal<ListAncestorsIds>({
    spaceId: null,
    folderId: null,
  });
  private newTaskAssigneesIds = signal<string[]>([]);
  @ViewChild('pathSelectorDropdownTrigger', { static: true })
  private pathSelectorDropdownTrigger!: MatMenuTrigger;
  protected newTaskForm = new FormGroup({
    taskName: new FormControl('', { validators: [Validators.required] }),
  });
  protected selectedList = signal<List | undefined>(this.personalList());
  protected formSubmitted = signal<boolean>(false);
  protected selectedStatus = signal<Status | undefined>(
    this.personalList()?.statuses.find(
      (status) => status.type === 'not_started',
    ),
  );
  protected currentColorTheme = this.colorThemeService.currentColorTheme;
  protected selectedDate = signal<Date | null>(null);
  protected selectedPriority = signal<Priority>(null);

  protected onSubmit(): void {
    const selectedListAncestorsIds = this.selectedListAncestorsIds();
    this.formSubmitted.set(true);

    if (
      !this.newTaskForm.invalid &&
      this.selectedList() &&
      (selectedListAncestorsIds || selectedListAncestorsIds === null) &&
      this.selectedStatus()
    ) {
      const taskAncestorsIds = {
        ...selectedListAncestorsIds,
        listId: this.selectedList()!.id,
      };

      this.taskService.createTask(taskAncestorsIds, {
        id: self.crypto.randomUUID(),
        name: this.taskName.value!,
        dueDate: this.selectedDate() || null,
        priority: this.selectedPriority() || null,
        assigneesIds: this.newTaskAssigneesIds(),
        statusId: this.selectedStatus()!.id,
        description: null,
      });
      this.dialogRef.close();
    }
  }

  protected onClickClose(): void {
    this.dialogRef.close();
  }

  protected onListSelection(
    selectedList: List,
    selectedListAncestorsIds: ListAncestorsIds,
  ): void {
    this.selectedList.set(selectedList);
    this.selectedListAncestorsIds.set(selectedListAncestorsIds);
    this.pathSelectorDropdownTrigger.closeMenu();
  }

  protected get taskName() {
    return this.newTaskForm.controls.taskName;
  }

  protected getDefaultColor(defaultColorId: number): StatusColor | undefined {
    return this.listService.getDefaultColor(defaultColorId);
  }
}
