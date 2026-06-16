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
  FolderWithCollapsibleLists,
  GroupByOption,
  GroupByOrderingOption,
  TaskGroupByAssignee,
  TaskGroupByDueDate,
  TaskGroupByPriority,
  TaskGroupByStatus,
} from '@shared/types/ui.types';
import { getListLink } from '@shared/utils/link.utils';

@Component({
  selector: 'app-folder-list-view',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ListListViewComponent,
    ListComponent,
    CollapseExpandBtnComponent,
    ToggleOptionsDropdownBtnComponent,
    EmptySectionComponent,
    EntityOptionsDropdownComponent,
  ],
  templateUrl: './folder-list-view.component.html',
  styleUrl: './folder-list-view.component.css',
})
export class FolderListViewComponent implements OnInit {
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

    this.folder().lists.forEach((list) =>
      listNamesFormRecord.addControl(list.id, new FormControl(list.name)),
    );
    return listNamesFormRecord.controls;
  });
  folder = input.required<FolderWithCollapsibleLists>();
  selectedGroupByOption = input.required<GroupByOption>();
  groupByOrderingOption = input.required<GroupByOrderingOption>();
  taskGroups = input.required<
    | TaskGroupByStatus[]
    | TaskGroupByPriority[]
    | TaskGroupByDueDate[]
    | TaskGroupByAssignee[]
    | undefined
  >();
  spaceId = input.required<string>();
  showClosedTasks = input.required<boolean>();
  protected getListLink = getListLink;
  protected isListBeingRenamed = signal(false);
  protected listBeingRenamedId = signal<string | undefined>(undefined);
  protected editListNameFormRecord = new FormRecord<FormControl<string>>({});
  protected editListNameForm = new FormGroup({
    listNames: this.editListNameFormRecord,
  });

  ngOnInit() {
    this.listNameControls();
  }

  protected canRenameList(list: List): boolean {
    return this.authorizationCheckerService.canRenameList(list.id);
  }

  protected canDeleteList(list: List): boolean {
    return this.authorizationCheckerService.canDeleteList(list.id);
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
        this.spaceId(),
        folderId,
        listId,
        listNameControl.value,
      );
    } else {
      listNameControl.setValue(oldListName);
    }
  }

  protected openDeleteWarningModal(list: List): void {
    const modalData: DeleteWarningModalData = {
      workspaceId: null,
      spaceId: this.spaceId(),
      folderId: this.folder().id,
      listId: list.id,
      statusId: null,
      taskId: null,
      elementType: 'list',
      elementName: list.name,
    };
    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
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
