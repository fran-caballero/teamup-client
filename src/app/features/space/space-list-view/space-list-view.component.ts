import { Dialog } from '@angular/cdk/dialog';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormRecord,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { ListService } from '@core/services/list.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { ListComponent } from '@features/list/list.component';
import { ListListViewComponent } from '@features/list/list-list-view/list-list-view.component';
import { CollapseExpandBtnComponent } from '@shared/components/buttons/collapse-expand-btn/collapse-expand-btn.component';
import { ToggleOptionsDropdownBtnComponent } from '@shared/components/buttons/toggle-options-dropdown-btn/toggle-options-dropdown-btn.component';
import { EmptySectionComponent } from '@shared/components/empty-section/empty-section.component';
import { EntityOptionsDropdownComponent } from '@shared/components/menus/entity-options-dropdown/entity-options-dropdown.component';
import { DeleteWarningModalComponent } from '@shared/components/modals/delete-warning-modal/delete-warning-modal.component';
import { List } from '@shared/types/entities.types';
import {
  DeleteWarningModalData,
  GroupByOption,
  GroupByOrderingOption,
  SpaceWithCollapsibleLists,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
} from '@shared/types/ui.types';
import { getFolderLink, getListLink } from '@shared/utils/link.utils';

@Component({
  selector: 'app-space-list-view',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    ListComponent,
    ListListViewComponent,
    CollapseExpandBtnComponent,
    ToggleOptionsDropdownBtnComponent,
    EmptySectionComponent,
    EntityOptionsDropdownComponent,
  ],
  templateUrl: './space-list-view.component.html',
  styleUrl: './space-list-view.component.css',
})
export class SpaceListViewComponent implements OnInit {
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private workspaceService = inject(WorkspaceService);
  private listService = inject(ListService);
  private dialog = inject(Dialog);
  private injector = inject(Injector);
  @ViewChild('editListNameFormInput')
  private editListNameFormInput?: ElementRef;
  private listNameControls = computed(() => {
    const listNamesFormRecord = this.editListNameForm.get(
      'listNames',
    ) as FormRecord;

    this.spaceWithCollapsibleLists().lists.forEach((list) => {
      listNamesFormRecord.addControl(list.id, new FormControl(list.name));
    });

    this.spaceWithCollapsibleLists().folders.forEach((folder) => {
      folder.lists.forEach((list) =>
        listNamesFormRecord.addControl(list.id, new FormControl(list.name)),
      );
    });

    return listNamesFormRecord.controls;
  });
  taskGroups = input.required<
    | TaskGroupByStatus[]
    | TaskGroupByPriority[]
    | TaskGroupByDueDate[]
    | TaskGroupByAssignee[]
    | undefined
  >();
  selectedGroupByOption = input.required<GroupByOption>();
  groupByOrderingOption = input.required<GroupByOrderingOption>();
  spaceWithCollapsibleLists = input.required<SpaceWithCollapsibleLists>();
  isListBeingRenamed = signal(false);
  listBeingRenamedId = signal<string | undefined>(undefined);
  showClosedTasks = input.required<boolean>();
  protected getFolderLink = getFolderLink;
  protected getListLink = getListLink;
  protected editListNameFormRecord = new FormRecord<FormControl<string>>({});
  protected editListNameForm = new FormGroup({
    listNames: this.editListNameFormRecord,
  });

  ngOnInit() {
    this.listNameControls();
  }

  protected onEditListName(folderId: string | null, listId: string): void {
    const mappedWorkspace = this.workspaceService.mappedWorkspace();

    if (!mappedWorkspace) {
      return;
    }

    const listNameControl = this.listNameControls()[listId];
    const oldListName = mappedWorkspace.listsMap.get(listId);

    this.isListBeingRenamed.set(false);

    if (listNameControl.value !== '') {
      this.listService.updateList(
        this.spaceWithCollapsibleLists().id,
        folderId,
        listId,
        listNameControl.value,
      );
    } else {
      listNameControl.setValue(oldListName);
    }
  }

  protected openDeleteListWarningModal(
    folderId: string | null,
    list: List,
  ): void {
    const modalData: DeleteWarningModalData = {
      workspaceId: null,
      spaceId: this.spaceWithCollapsibleLists().id,
      folderId: folderId,
      listId: list.id,
      statusId: null,
      taskId: null,
      elementType: 'list',
      elementName: list.name,
    };
    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }

  protected canRenameList(listId: string): boolean {
    return this.authorizationCheckerService.canRenameList(listId);
  }

  protected canDeleteList(listId: string): boolean {
    return this.authorizationCheckerService.canDeleteList(listId);
  }

  protected onStartListRenaming(listId: string): void {
    this.isListBeingRenamed.set(true);
    this.listBeingRenamedId.set(listId);

    afterNextRender(
      () => {
        this.editListNameFormInput?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }
}
