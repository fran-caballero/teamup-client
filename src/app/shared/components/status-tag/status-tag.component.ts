import { NgStyle } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ColorThemeService } from '@core/services/color-theme.service';
import { ListService } from '@core/services/list.service';
import { ColorPickerMenuComponent } from '@shared/components/menus/color-picker-menu/color-picker-menu.component';
import { isEllipsedDirective } from '@shared/directives/is-ellipsed.directive';
import { Status } from '@shared/types/entities.types';
import { StatusColor } from '@shared/types/ui.types';
import {
  hasDuplicateStatusNameInList,
  normalizeStatusName,
} from '@shared/utils/list.utils';

@Component({
  selector: 'app-status-tag',
  imports: [
    NgStyle,
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltipModule,
    ColorPickerMenuComponent,
    isEllipsedDirective,
  ],
  templateUrl: './status-tag.component.html',
  styleUrl: './status-tag.component.css',
})
export class StatusTagComponent implements OnInit, AfterViewInit {
  private listService = inject(ListService);
  private colorThemeService = inject(ColorThemeService);
  private elementRef = inject(ElementRef);
  private currentDefaultColor = computed(() => {
    return this.getDefaultColor(this.status().defaultColorId!);
  });
  private currentList = computed(() => {
    return this.listService.getListWithAncestorsInWorkspace(this.listId())
      ?.list;
  });

  status = input.required<Status>();
  spaceId = input.required<string | null>();
  folderId = input.required<string | null>();
  listId = input.required<string>();
  isOpenOnInit = input<boolean>(false);
  isBtnDisabled = input<boolean>(false);
  menuClosed = output();

  @ViewChild('statusTag', { static: true })
  statusTag!: ElementRef;
  @ViewChild('colorPickerMenuTrigger', { static: true })
  protected colorPickerMenuTrigger!: MatMenuTrigger;

  protected currentColorTheme = this.colorThemeService.currentColorTheme;
  protected isStatusBeingRenamed = signal(false);
  protected renameStatusForm = computed(
    () =>
      new FormGroup({
        statusName: new FormControl<string>(this.status().name, {
          nonNullable: true,
        }),
      }),
  );
  protected selectedDefaultColor = signal<StatusColor | undefined>(undefined);

  ngOnInit() {
    if (this.currentDefaultColor()) {
      this.selectedDefaultColor.set(this.currentDefaultColor()!);
    }
  }

  ngAfterViewInit() {
    if (this.isOpenOnInit()) {
      this.isStatusBeingRenamed.set(true);
    }
  }

  protected getDefaultColor(defaultColorId: number): StatusColor | undefined {
    return this.listService.getDefaultColor(defaultColorId);
  }

  protected isSaveDisabled(): boolean {
    return !this.hasStatusName() || this.hasDuplicateStatusName();
  }

  protected getTooltipMessage(): string | undefined {
    if (!this.hasStatusName()) {
      return 'Please, enter a status name';
    }

    if (this.hasDuplicateStatusName()) {
      return 'A status with this name already exists in this list.';
    }

    return;
  }

  @HostListener('document:mousedown', ['$event.target'])
  protected onDocumentMouseDown(clickedElement: EventTarget | null): void {
    if (!this.isStatusBeingRenamed()) {
      return;
    }

    if (this.colorPickerMenuTrigger.menuOpen) {
      return;
    }

    if (
      clickedElement &&
      this.elementRef.nativeElement.contains(clickedElement)
    ) {
      return;
    }

    this.closeRenameForm();
  }

  protected updateStatus(): void {
    if (this.isSaveDisabled()) {
      return;
    }

    const updatedStatusName =
      this.renameStatusForm().controls.statusName.value?.trim();
    if (
      updatedStatusName &&
      (updatedStatusName !== this.status().name ||
        this.selectedDefaultColor()?.id !== this.status().defaultColorId)
    ) {
      const updatedStatus = {
        ...this.status(),
        name: updatedStatusName,
        defaultColorId: this.selectedDefaultColor()?.id || null,
      };

      this.listService.updateStatus(
        this.spaceId(),
        this.folderId(),
        this.listId(),
        this.status().id,
        updatedStatus,
      );
    }

    this.closeRenameForm();
    this.colorPickerMenuTrigger.closeMenu();
  }

  private hasStatusName(): boolean {
    return !!normalizeStatusName(
      this.renameStatusForm().controls.statusName.value,
    );
  }

  private hasDuplicateStatusName(): boolean {
    return hasDuplicateStatusNameInList(
      this.currentList()?.statuses,
      this.renameStatusForm().controls.statusName.value,
      this.status().id,
    );
  }

  private closeRenameForm(): void {
    this.isStatusBeingRenamed.set(false);
    this.menuClosed.emit();
  }
}
