import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
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
import { Router } from '@angular/router';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { MembershipService } from '@core/services/authorization/membership.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { ToggleOptionsDropdownBtnComponent } from '@shared/components/buttons/toggle-options-dropdown-btn/toggle-options-dropdown-btn.component';
import { EntityOptionsDropdownComponent } from '@shared/components/menus/entity-options-dropdown/entity-options-dropdown.component';
import { AdditionalInfoModalComponent } from '@shared/components/modals/additional-info-modal/additional-info-modal.component';
import { DeleteWarningModalComponent } from '@shared/components/modals/delete-warning-modal/delete-warning-modal.component';
import { NewWorkspaceModalComponent } from '@shared/components/modals/new-workspace-modal/new-workspace-modal.component';
import { RoleFormatterPipe } from '@shared/pipes/role-formatter.pipe';
import { LoadingService } from '@shared/services/loading.service';
import { isDemoResetInProgressError } from '@shared/utils/api-error.utils';
import { catchError, EMPTY, finalize, switchMap, tap, throwError } from 'rxjs';

@Component({
  selector: 'app-workspace-btn',
  imports: [
    ReactiveFormsModule,
    MatMenuModule,
    ToggleOptionsDropdownBtnComponent,
    EntityOptionsDropdownComponent,
    RoleFormatterPipe,
  ],
  templateUrl: './workspace-btn.component.html',
  styleUrl: './workspace-btn.component.css',
})
export class WorkspaceButtonComponent {
  private dialog = inject(Dialog);
  private overlay = inject(Overlay);
  private router = inject(Router);
  private userService = inject(UserService);
  private membershipService = inject(MembershipService);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private workspaceService = inject(WorkspaceService);
  private loadingService = inject(LoadingService);
  private renameOtherWorkspacesFormArray = new FormArray<FormControl<string>>(
    [],
  );
  private injector = inject(Injector);
  private infoMessage =
    "Keep in mind info can't be transferred across Workspaces.";

  sidebarWidth = input.required<number>();
  @ViewChild('workspaceBtn')
  private workspaceBtn?: MatMenuTrigger;
  @ViewChild('editCurrentWorkspaceNameFormInput')
  private editCurrentWorkspaceNameFormInput?: ElementRef;
  @ViewChild('currentWorkspaceOptionsDropdownBtn')
  private currentWorkspaceOptionsDropdownBtn?: ToggleOptionsDropdownBtnComponent;
  @ViewChild('editOtherWorkspaceNameFormInput')
  private editOtherWorkspaceNameFormInput?: ElementRef;
  @ViewChild('otherWorkspaceOptionsDropdownBtn')
  private otherWorkspaceOptionsDropdownBtn?: ToggleOptionsDropdownBtnComponent;
  protected currentWorkspace = this.workspaceService.currentWorkspace;
  protected workspacesBeingRenamedMap = signal<Map<string, boolean>>(new Map());
  protected renameCurrentWorkspaceForm = computed(() => {
    return new FormGroup({
      workspaceName: new FormControl(this.currentWorkspace()?.name),
    });
  });
  protected renameOtherWorkspacesForm = new FormGroup({
    workspaceNames: this.renameOtherWorkspacesFormArray,
  });

  protected otherWorkspacesNamesControls = computed(() => {
    const workspaceNamesFormArray = this.renameOtherWorkspacesForm.get(
      'workspaceNames',
    ) as FormArray;

    this.user()?.workspaces.forEach((workspace) => {
      workspaceNamesFormArray.push(new FormControl(workspace.name));
    });

    return workspaceNamesFormArray.controls;
  });

  protected workspaceBeingRenamedIndex = signal<number | null | undefined>(
    undefined,
  );

  protected isSuperAdminOfMoreWorkspaces = computed<boolean>(() => {
    const user = this.userService.user();
    const currentWorkspace = this.currentWorkspace();

    return this.authorizationCheckerService.isSuperAdminOfMoreWorkspaces(
      user,
      currentWorkspace,
    );
  });

  protected user = this.userService.user;

  protected onCloseWorkspaceOptionsMenu(workspaceId: string): void {
    setTimeout(() => {
      this.workspacesBeingRenamedMap.update((workspacesMap) => {
        const updatedMap = new Map(workspacesMap);
        updatedMap.set(workspaceId, false);

        return updatedMap;
      });
    }, 300);
  }

  protected renameWorkspace(
    workspaceId: string,
    workspaceIndex: number | null,
  ): void {
    this.currentWorkspaceOptionsDropdownBtn?.menuTriggerBtn.closeMenu();

    const workspace = this.currentWorkspace();
    let oldWorkspaceName: string | undefined;
    let newWorkspaceName: string | undefined;

    if (workspaceIndex === null) {
      oldWorkspaceName = workspace?.name;
      newWorkspaceName =
        this.renameCurrentWorkspaceForm().controls.workspaceName.value ?? '';
    } else {
      oldWorkspaceName = this.user()?.workspaces.find(
        (workspace) => workspace.id === workspaceId,
      )?.name;
      newWorkspaceName =
        this.otherWorkspacesNamesControls()[workspaceIndex].value;
    }

    this.workspacesBeingRenamedMap.update((workspacesMap) => {
      const updatedMap = new Map(workspacesMap);
      updatedMap.set(workspaceId, false);

      return updatedMap;
    });

    if (
      workspace &&
      newWorkspaceName &&
      newWorkspaceName !== '' &&
      newWorkspaceName !== oldWorkspaceName
    ) {
      this.workspaceService.updateWorkspace(workspaceId, newWorkspaceName);
    } else if (workspaceIndex === null) {
      this.renameCurrentWorkspaceForm().controls.workspaceName.setValue(
        oldWorkspaceName,
      );
    } else {
      this.otherWorkspacesNamesControls()[workspaceIndex].setValue(
        oldWorkspaceName,
      );
    }

    this.workspacesBeingRenamedMap.update((workspacesMap) => {
      const updatedMap = new Map(workspacesMap);
      updatedMap.set(workspaceId, false);

      return updatedMap;
    });

    this.workspaceBeingRenamedIndex.set(null);
  }

  protected canRenameWorkspace(workspaceId: string): boolean {
    return this.authorizationCheckerService.canRenameWorkspace(workspaceId);
  }

  protected canDeleteWorkspace(workspaceId: string): boolean {
    return this.authorizationCheckerService.canDeleteWorkspace(workspaceId);
  }

  protected onStartWorkspaceRenaming(
    workspaceId: string,
    workspaceIndex: number | null,
    workspaceType: 'current' | 'other',
  ): void {
    this.currentWorkspaceOptionsDropdownBtn?.menuTriggerBtn.closeMenu();
    this.otherWorkspaceOptionsDropdownBtn?.menuTriggerBtn.closeMenu();

    this.workspaceBeingRenamedIndex.set(workspaceIndex);

    setTimeout(() => {
      this.workspacesBeingRenamedMap.update((workspacesMap) => {
        const updatedMap = new Map(workspacesMap);
        updatedMap.set(workspaceId, true);
        return updatedMap;
      });

      afterNextRender(
        () => {
          if (workspaceType === 'current') {
            this.editCurrentWorkspaceNameFormInput?.nativeElement.focus();
          } else {
            this.editOtherWorkspaceNameFormInput?.nativeElement.focus();
          }
        },
        { injector: this.injector },
      );
    }, 0);
  }

  protected onStartWorkspaceDeletion(workspaceId: string): void {
    this.currentWorkspaceOptionsDropdownBtn?.menuTriggerBtn.closeMenu();
    this.otherWorkspaceOptionsDropdownBtn?.menuTriggerBtn.closeMenu();

    this.openDeleteWarningModal(workspaceId);
  }

  protected onClickSwitchWorkspace(workspaceId: string): void {
    this.workspaceBtn?.closeMenu();
    this.loadingService.startLoading();

    this.workspaceService
      .getWorkspace(workspaceId)
      .pipe(
        catchError((err) => {
          if (isDemoResetInProgressError(err)) {
            this.loadingService.setDemoOwnerWorkspaceResetActive({
              workspaceId,
            });
            return EMPTY;
          }

          return throwError(() => err);
        }),
        switchMap(() => this.membershipService.getWorkspaceMembers()),
        switchMap(() => {
          const user = this.userService.user();

          if (!user) {
            return EMPTY;
          }

          return this.userService.updateUserPreferences({
            lastActiveWorkspaceId: workspaceId,
          });
        }),
        tap(() => this.router.navigate(['/home'])),
        finalize(() => this.loadingService.stopLoading()),
      )
      .subscribe();
  }

  protected openNewWorkspaceDialog(): void {
    const mainDialogRef = this.dialog.open(NewWorkspaceModalComponent, {
      backdropClass: 'new-workspace-modal-backdrop',
    });

    setTimeout(() => {
      const overlayElement = mainDialogRef.overlayRef.overlayElement;
      if (mainDialogRef.overlayRef) {
        const infoModalPositionStrategy = this.overlay
          .position()
          .flexibleConnectedTo(overlayElement)
          .withPositions([
            {
              originX: 'center',
              originY: 'top',
              overlayX: 'center',
              overlayY: 'bottom',
              offsetY: -25,
            },
          ]);

        const infoDialogRef = this.dialog.open(AdditionalInfoModalComponent, {
          data: { infoMessage: this.infoMessage },
          hasBackdrop: false,
          positionStrategy: infoModalPositionStrategy,
        });

        mainDialogRef.closed.subscribe(() => {
          infoDialogRef.close();
        });
      }
    }, 0);
  }

  private openDeleteWarningModal(workspaceId: string): void {
    let workspaceName: string | undefined;

    if (workspaceId == this.currentWorkspace()?.id) {
      workspaceName = this.currentWorkspace()?.name;
    } else {
      workspaceName = this.user()?.workspaces.find(
        (workspace) => workspace.id === workspaceId,
      )?.name;
    }

    if (!workspaceName) {
      return;
    }

    const modalData = {
      workspaceId: workspaceId,
      spaceId: null,
      folderId: null,
      listId: null,
      taskId: null,
      elementType: 'workspace',
      elementName: workspaceName,
    };

    this.dialog.open(DeleteWarningModalComponent, { data: modalData });
  }
}
