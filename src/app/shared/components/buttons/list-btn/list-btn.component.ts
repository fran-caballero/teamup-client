import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  UrlSegment,
} from '@angular/router';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { ListService } from '@core/services/list.service';
import { ToggleOptionsDropdownBtnComponent } from '@shared/components/buttons/toggle-options-dropdown-btn/toggle-options-dropdown-btn.component';
import { ListSymbolComponent } from '@shared/components/icons/list-symbol/list-symbol.component';
import { EntityOptionsDropdownComponent } from '@shared/components/menus/entity-options-dropdown/entity-options-dropdown.component';
import { DeleteWarningModalComponent } from '@shared/components/modals/delete-warning-modal/delete-warning-modal.component';
import { isEllipsedDirective } from '@shared/directives/is-ellipsed.directive';
import { Folder, List, Space, Status } from '@shared/types/entities.types';
import { ButtonType, DeleteWarningModalData } from '@shared/types/ui.types';
import { getRoute } from '@shared/utils/route.utils';

@Component({
  selector: 'app-list-btn',
  imports: [
    CommonModule,
    MatTooltipModule,
    RouterModule,
    ReactiveFormsModule,
    ListSymbolComponent,
    isEllipsedDirective,
    EntityOptionsDropdownComponent,
    ToggleOptionsDropdownBtnComponent,
  ],
  templateUrl: './list-btn.component.html',
  styleUrl: './list-btn.component.css',
})
export class ListBtnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(Dialog);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private listService = inject(ListService);
  private injector = inject(Injector);
  space = input.required<Space>();
  folder = input.required<Folder | null>();
  list = input.required<List>();
  isDisabled = input.required<boolean>();
  columnStatus = input<Status>();
  buttonType = input.required<ButtonType>();
  isListBeingRenamed = signal(false);
  listSelection = output<List>();
  @ViewChild('listOptionsDropdownBtnComponent')
  private listOptionsDropdownBtnComponent?: ToggleOptionsDropdownBtnComponent;
  @ViewChild('renameListFormInput')
  private renameListFormInput?: ElementRef;
  protected isInList = signal(false);
  protected renameListForm = computed(() => {
    return new FormGroup({
      listName: new FormControl(this.list().name),
    });
  });
  protected isOptionsDropdownOpen = signal(false);

  ngOnInit() {
    const isInListSub = getRoute(this.route, this.router).subscribe((route) =>
      this.checkIfIsInList(route),
    );

    this.destroyRef.onDestroy(() => isInListSub.unsubscribe());
  }

  protected get tooltipText(): string {
    return `The status "${this.columnStatus()?.name}" does not exist in this list.`;
  }

  protected renameList() {
    const spaceId = this.space().id;
    const folderId = this.folder()?.id ?? null;
    const list = this.list();
    const newListName = this.renameListForm().controls.listName.value;

    if (newListName && newListName !== '') {
      this.listService.updateList(spaceId, folderId, list.id, newListName);
    } else {
      this.renameListForm().controls.listName.setValue(list.name);
    }

    this.isListBeingRenamed.set(false);
  }

  protected canRenameList = computed(() =>
    this.authorizationCheckerService.canRenameList(this.list()?.id),
  );

  protected canDeleteList = computed<boolean>(() =>
    this.authorizationCheckerService.canDeleteList(this.list()?.id),
  );

  protected onStartListRenaming(): void {
    this.listOptionsDropdownBtnComponent?.menuTriggerBtn.closeMenu();

    setTimeout(() => {
      this.isListBeingRenamed.set(true);

      afterNextRender(
        () => {
          this.renameListFormInput?.nativeElement.focus();
        },
        { injector: this.injector },
      );
    }, 0);
  }

  protected onStartListDeletion(): void {
    this.listOptionsDropdownBtnComponent?.menuTriggerBtn.closeMenu();
    this.openDeleteWarningModal();
  }

  private openDeleteWarningModal(): void {
    const modalData: DeleteWarningModalData = {
      workspaceId: null,
      spaceId: this.space().id,
      folderId: this.folder()?.id || null,
      listId: this.list().id,
      statusId: null,
      taskId: null,
      elementType: 'list',
      elementName: this.list().name,
    };
    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }

  private checkIfIsInList(route: UrlSegment[]): void {
    if (
      (route[3] && route[3].path === this.list().id) ||
      (route[5] && route[5].path === this.list().id)
    ) {
      this.isInList.set(true);
    } else {
      this.isInList.set(false);
    }
  }
}
