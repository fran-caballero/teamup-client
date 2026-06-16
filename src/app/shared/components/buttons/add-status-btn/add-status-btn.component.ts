import { NgStyle } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ColorThemeService } from '@core/services/color-theme.service';
import { ListService } from '@core/services/list.service';
import { ColorPickerMenuComponent } from '@shared/components/menus/color-picker-menu/color-picker-menu.component';
import { defaultStatusColorIds } from '@shared/constants/status-colors.constants';
import { TaskAncestorsData } from '@shared/types/common.types';
import { Status } from '@shared/types/entities.types';
import { StatusColor } from '@shared/types/ui.types';
import {
  hasDuplicateStatusNameInList,
  normalizeStatusName,
} from '@shared/utils/list.utils';

@Component({
  selector: 'app-add-status-btn',
  imports: [
    NgStyle,
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltipModule,
    ColorPickerMenuComponent,
  ],
  templateUrl: './add-status-btn.component.html',
  styleUrl: './add-status-btn.component.css',
})
export class AddStatusBtnComponent implements OnInit {
  private listService = inject(ListService);
  private colorThemeService = inject(ColorThemeService);
  private destroyRef = inject(DestroyRef);
  private defaultStatusColorIds = defaultStatusColorIds;
  private currentList = computed(() => {
    const listId = this.tasksAncestorsData().listData.id;

    return this.listService.getListWithAncestorsInWorkspace(listId)?.list;
  });

  tasksAncestorsData = input.required<TaskAncestorsData>();

  @ViewChild('addStatusMenu', { static: true })
  private addStatusMenu!: MatMenu;

  protected addStatusForm = new FormGroup({
    statusType: new FormControl<Status['type'] | undefined>(undefined, [
      Validators.required,
    ]),
    statusName: new FormControl<string | undefined>(undefined, [
      Validators.required,
    ]),
    statusColor: new FormControl<StatusColor | undefined>(undefined, [
      Validators.required,
    ]),
  });
  protected currentColorTheme = this.colorThemeService.currentColorTheme;

  ngOnInit() {
    const subscription = this.addStatusMenu.closed.subscribe(() => {
      this.addStatusForm.reset();
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected getDefaultColor(defaultColorId: number): StatusColor | undefined {
    return this.listService.getDefaultColor(defaultColorId);
  }

  protected onClickSelectStatus(selectedValue: Status['type']): void {
    if (
      !this.addStatusForm.controls.statusColor.value ||
      (this.addStatusForm.controls.statusType.value &&
        this.addStatusForm.controls.statusType.value !== selectedValue)
    ) {
      const defaultStatusColorId = this.defaultStatusColorIds[selectedValue];
      this.addStatusForm.controls.statusColor.setValue(
        this.getDefaultColor(defaultStatusColorId),
      );
    }

    this.addStatusForm.controls.statusType.setValue(selectedValue);
  }

  protected isSaveDisabled(): boolean {
    return (
      !this.hasStatusName() ||
      this.addStatusForm.controls.statusType.invalid ||
      this.addStatusForm.controls.statusColor.invalid ||
      this.hasDuplicateStatusName()
    );
  }

  protected getTooltipMessage(): string | undefined {
    if (!this.hasStatusName()) {
      return 'Please, enter a status name';
    }

    if (this.hasDuplicateStatusName()) {
      return 'A status with this name already exists in this list.';
    }

    if (this.addStatusForm.controls.statusType.invalid) {
      return 'Please, select a status type';
    }

    return;
  }

  protected onClickSave(): void {
    const taskAncestorsData = this.tasksAncestorsData();
    const statusName = this.addStatusForm.controls.statusName.value?.trim();

    if (!taskAncestorsData?.spaceData || !statusName || this.isSaveDisabled()) {
      return;
    }

    const statusData = {
      id: self.crypto.randomUUID(),
      name: statusName,
      type: this.addStatusForm.controls.statusType.value!,
      defaultColorId: this.addStatusForm.controls.statusColor.value!.id,
      colorHex: null,
    };

    this.listService.createStatus(
      taskAncestorsData.spaceData.id,
      taskAncestorsData.folderData ? taskAncestorsData.folderData.id : null,
      taskAncestorsData.listData.id,
      statusData,
    );
  }

  protected onColorChange(color: StatusColor | null | undefined): void {
    if (color) {
      this.addStatusForm.controls.statusColor.setValue(color);
    }
  }

  private hasStatusName(): boolean {
    return !!normalizeStatusName(this.addStatusForm.controls.statusName.value);
  }

  private hasDuplicateStatusName(): boolean {
    return hasDuplicateStatusNameInList(
      this.currentList()?.statuses,
      this.addStatusForm.controls.statusName.value,
    );
  }
}
