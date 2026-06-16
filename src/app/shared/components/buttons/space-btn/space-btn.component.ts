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
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  UrlSegment,
} from '@angular/router';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { FolderService } from '@core/services/folder.service';
import { ListService } from '@core/services/list.service';
import { SpaceService } from '@core/services/space.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { CollapseExpandBtnComponent } from '@shared/components/buttons/collapse-expand-btn/collapse-expand-btn.component';
import { FolderBtnComponent } from '@shared/components/buttons/folder-btn/folder-btn.component';
import { ListBtnComponent } from '@shared/components/buttons/list-btn/list-btn.component';
import { ToggleOptionsDropdownBtnComponent } from '@shared/components/buttons/toggle-options-dropdown-btn/toggle-options-dropdown-btn.component';
import { ListSymbolComponent } from '@shared/components/icons/list-symbol/list-symbol.component';
import { EntityOptionsDropdownComponent } from '@shared/components/menus/entity-options-dropdown/entity-options-dropdown.component';
import { DeleteWarningModalComponent } from '@shared/components/modals/delete-warning-modal/delete-warning-modal.component';
import { isEllipsedDirective } from '@shared/directives/is-ellipsed.directive';
import { ListAncestorsIds } from '@shared/types/common.types';
import { List, Status } from '@shared/types/entities.types';
import { getRoute } from '@shared/utils/route.utils';

type ButtonType = 'link' | 'formElement';

@Component({
  selector: 'app-space-btn',
  imports: [
    NgStyle,
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltip,
    MatTooltipModule,
    RouterModule,
    CollapseExpandBtnComponent,
    FolderBtnComponent,
    ListBtnComponent,
    ToggleOptionsDropdownBtnComponent,
    ListSymbolComponent,
    isEllipsedDirective,
    EntityOptionsDropdownComponent,
  ],
  templateUrl: './space-btn.component.html',
  styleUrl: './space-btn.component.css',
})
export class SpaceBtnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(Dialog);
  private destroyRef = inject(DestroyRef);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private workspaceService = inject(WorkspaceService);
  private spaceService = inject(SpaceService);
  private folderService = inject(FolderService);
  private listService = inject(ListService);
  private injector = inject(Injector);
  spaceId = input.required<string>();
  buttonType = input.required<ButtonType>();
  sidebarWidth = input.required<number | null>();
  columnStatus = input<Status>();
  listSelection = output<{
    selectedList: List;
    listAncestorsIds: ListAncestorsIds;
  }>();
  @ViewChild('spaceOptionsDropdownBtnComponent')
  private spaceOptionsDropdownBtnComponent?: ToggleOptionsDropdownBtnComponent;
  @ViewChild('editSpaceNameFormInput')
  private editSpaceNameFormInput?: ElementRef;
  @ViewChild('newFolderFormInput')
  private newFolderFormInput?: ElementRef;
  @ViewChild('newListFormInput')
  private newListFormInput?: ElementRef;
  protected space = computed(() =>
    this.workspaceService.mappedWorkspace()?.spacesMap.get(this.spaceId()),
  );
  protected isInSpace = signal(false);
  protected isSpaceCollapsed = signal(true);
  protected isSpaceBeingRenamed = signal(false);
  protected editSpaceNameForm = computed(() => {
    return new FormGroup({
      spaceName: new FormControl(this.space()?.name),
    });
  });
  protected isOptionsDropdownOpen = signal(false);
  protected isAddChildDropdownOpen = signal(false);
  protected isNewFolderBeingCreated = signal(false);
  protected canCreateEntitiesInSpace = computed<boolean>(() => {
    return this.authorizationCheckerService.canCreateEntitiesInSpace(
      this.space()?.id,
    );
  });
  protected isNewListBeingCreated = signal(false);
  protected newFolderForm = new FormGroup({
    folderName: new FormControl(''),
  });
  protected newListForm = new FormGroup({
    listName: new FormControl(''),
  });
  protected canRenameSpace = computed<boolean>(() => {
    return this.authorizationCheckerService.canRenameSpace(this.space()?.id);
  });
  protected canDeleteSpace = computed<boolean>(() => {
    return this.authorizationCheckerService.canDeleteSpace(this.space()?.id);
  });

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

  ngOnInit() {
    const isInSpaceSub = getRoute(this.route, this.router).subscribe((route) =>
      this.checkIfIsInSpace(route),
    );

    this.destroyRef.onDestroy(() => isInSpaceSub.unsubscribe());

    if (
      this.space() &&
      (this.space()!.folders.length !== 0 || this.space()!.lists.length !== 0)
    ) {
      this.isSpaceCollapsed.set(false);
    }
  }

  protected onStartSpaceRenaming(): void {
    this.spaceOptionsDropdownBtnComponent?.menuTriggerBtn.closeMenu();

    setTimeout(() => {
      this.isSpaceBeingRenamed.set(true);

      afterNextRender(
        () => {
          this.editSpaceNameFormInput?.nativeElement.focus();
        },
        { injector: this.injector },
      );
    }, 0);
  }

  protected onStartSpaceDeletion(): void {
    this.spaceOptionsDropdownBtnComponent?.menuTriggerBtn.closeMenu();
    this.openDeleteWarningModal();
  }

  protected onStartFolderCreation(): void {
    this.isNewFolderBeingCreated.set(true);
    this.isSpaceCollapsed.set(false);

    afterNextRender(
      () => {
        this.newFolderFormInput?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected onStartListCreation(): void {
    this.isNewListBeingCreated.set(true);
    this.isSpaceCollapsed.set(false);

    afterNextRender(
      () => {
        this.newListFormInput?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected editSpace(): void {
    const spaceId = this.space()?.id;
    const newSpaceName = this.editSpaceNameForm().controls.spaceName.value;

    this.isSpaceBeingRenamed.set(false);

    if (spaceId && newSpaceName && newSpaceName !== '') {
      this.spaceService.updateSpace(spaceId, newSpaceName);
    } else {
      this.editSpaceNameForm().controls.spaceName.setValue(this.space()?.name);
    }
  }

  protected createFolder(): void {
    if (
      this.newFolderForm.controls.folderName.value &&
      this.newFolderForm.controls.folderName.value !== ''
    ) {
      this.folderService.createFolder(
        this.spaceId(),
        this.newFolderForm.controls.folderName.value,
      );
    }

    this.newFolderForm.controls.folderName.reset();
    this.isNewFolderBeingCreated.set(false);
  }

  protected createList(): void {
    if (
      this.newListForm.controls.listName.value &&
      this.newListForm.controls.listName.value !== ''
    ) {
      this.listService.createList(
        this.spaceId(),
        this.newListForm.controls.listName.value,
        null,
      );
    }

    this.newListForm.controls.listName.reset();
    this.isNewListBeingCreated.set(false);
  }

  private checkIfIsInSpace(route: UrlSegment[]): void {
    this.isInSpace.set(
      route[0].path === 'spaces' &&
        !!route[1].path &&
        route[1].path === this.space()?.id &&
        !route[2],
    );
  }

  private openDeleteWarningModal(): void {
    const space = this.space();

    if (!space) {
      return;
    }

    const modalData = {
      workspaceId: null,
      spaceId: space.id,
      folderId: null,
      listId: null,
      taskId: null,
      elementType: 'space',
      elementName: space.name,
    };

    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }
}
