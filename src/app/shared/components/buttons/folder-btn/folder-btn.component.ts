import { Dialog } from '@angular/cdk/dialog';
import { NgStyle } from '@angular/common';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  UrlSegment,
} from '@angular/router';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { FolderService } from '@core/services/folder.service';
import { ListService } from '@core/services/list.service';
import { CollapseExpandBtnComponent } from '@shared/components/buttons/collapse-expand-btn/collapse-expand-btn.component';
import { ListBtnComponent } from '@shared/components/buttons/list-btn/list-btn.component';
import { ToggleOptionsDropdownBtnComponent } from '@shared/components/buttons/toggle-options-dropdown-btn/toggle-options-dropdown-btn.component';
import { ListSymbolComponent } from '@shared/components/icons/list-symbol/list-symbol.component';
import { EntityOptionsDropdownComponent } from '@shared/components/menus/entity-options-dropdown/entity-options-dropdown.component';
import { DeleteWarningModalComponent } from '@shared/components/modals/delete-warning-modal/delete-warning-modal.component';
import { isEllipsedDirective } from '@shared/directives/is-ellipsed.directive';
import { Folder, List, Space, Status } from '@shared/types/entities.types';
import { ButtonType } from '@shared/types/ui.types';
import { getRoute } from '@shared/utils/route.utils';

@Component({
  selector: 'app-folder-btn',
  imports: [
    NgStyle,
    ReactiveFormsModule,
    MatMenuModule,
    RouterModule,
    MatTooltipModule,
    CollapseExpandBtnComponent,
    ListBtnComponent,
    ToggleOptionsDropdownBtnComponent,
    ListSymbolComponent,
    isEllipsedDirective,
    EntityOptionsDropdownComponent,
  ],
  templateUrl: './folder-btn.component.html',
  styleUrl: './folder-btn.component.css',
})
export class FolderBtnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(Dialog);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private folderService = inject(FolderService);
  private listService = inject(ListService);
  private injector = inject(Injector);
  folder = input.required<Folder>();
  space = input.required<Space>();
  buttonType = input.required<ButtonType>();
  columnStatus = input<Status>();
  listSelection = output<List>();
  @ViewChild('folderOptionsDropdownBtnComponent')
  private folderOptionsDropdownBtnComponent?: ToggleOptionsDropdownBtnComponent;
  @ViewChild('editFolderNameFormInput')
  private editFolderNameFormInput?: ElementRef;
  @ViewChild('newListFormInput')
  private newListFormInput?: ElementRef;

  protected isInFolder = signal(false);
  protected isFolderCollapsed = signal(true);
  protected isFolderBeingRenamed = signal(false);
  protected renameForm = computed(() => {
    return new FormGroup({
      folderName: new FormControl(this.folder()?.name),
    });
  });
  protected isOptionsDropdownOpen = signal<boolean>(false);
  protected isAddChildDropdownOpen = signal(false);
  protected isNewListBeingCreated = signal(false);
  protected newListForm = new FormGroup({
    listName: new FormControl(''),
  });
  protected canRenameFolder = computed(() => {
    return this.authorizationCheckerService.canRenameFolder(this.folder()?.id);
  });

  protected canDeleteFolder = computed(() => {
    return this.authorizationCheckerService.canDeleteFolder(this.folder().id);
  });

  protected onToggleFolderState(): void {
    this.isFolderCollapsed.update((state) => !state);
  }

  protected canCreateListsInFolder(folderId: string): boolean {
    return this.authorizationCheckerService.canCreateListsInFolder(folderId);
  }

  protected renameFolder(): void {
    const spaceId = this.space().id;
    const folder = this.folder();
    const newFolderName = this.renameForm().controls.folderName.value;

    this.isFolderBeingRenamed.set(false);

    if (folder && newFolderName && newFolderName !== '') {
      this.folderService.updateFolder(spaceId, folder.id, newFolderName);
    } else {
      this.renameForm().controls.folderName.setValue(folder?.name);
    }
  }

  protected createList(): void {
    if (
      this.newListForm.controls.listName.value &&
      this.newListForm.controls.listName.value !== ''
    ) {
      this.listService.createList(
        this.space().id,
        this.newListForm.controls.listName.value,
        this.folder().id,
      );
    }

    this.newListForm.controls.listName.reset();
    this.isNewListBeingCreated.set(false);
  }

  protected isListBtnDisabled(list: List): boolean {
    if (!this.columnStatus()) {
      return false;
    }
    return list.statuses.find(
      (status) => status.name === this.columnStatus()?.name,
    )
      ? false
      : true;
  }

  protected onStartFolderRenaming(): void {
    this.folderOptionsDropdownBtnComponent?.menuTriggerBtn.closeMenu();

    setTimeout(() => {
      this.isFolderBeingRenamed.set(true);

      afterNextRender(
        () => {
          this.editFolderNameFormInput?.nativeElement.focus();
        },
        { injector: this.injector },
      );
    }, 0);
  }

  protected onStartListCreation(): void {
    this.isNewListBeingCreated.set(true);
    this.isFolderCollapsed.set(false);

    afterNextRender(
      () => {
        this.newListFormInput?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected onStartFolderDeletion(): void {
    this.folderOptionsDropdownBtnComponent?.menuTriggerBtn.closeMenu();
    this.openDeleteWarningModal();
  }

  protected openDeleteWarningModal(): void {
    const space = this.space();
    const folder = this.folder();

    if (!folder) {
      return;
    }

    const modalData = {
      workspaceId: null,
      spaceId: space.id,
      folderId: folder.id,
      listId: null,
      taskId: null,
      elementType: 'folder',
      elementName: folder.name,
    };

    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }

  ngOnInit() {
    const isInFolderSub = getRoute(this.route, this.router).subscribe((route) =>
      this.checkIfIsInFolder(route),
    );

    this.destroyRef.onDestroy(() => isInFolderSub.unsubscribe());
  }

  private checkIfIsInFolder(route: UrlSegment[]): void {
    if (route[3] && route[3].path === this.folder()?.id && !route[4]) {
      this.isInFolder.set(true);
    } else {
      this.isInFolder.set(false);
    }
  }
}
