import {
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { CollapseExpandBtnComponent } from '@shared/components/buttons/collapse-expand-btn/collapse-expand-btn.component';
import { EditFolderPermissionsBtnComponent } from '@shared/components/menus/permissions-editor-menu/edit-folder-permissions-btn/edit-folder-permissions-btn.component';
import { EditListPermissionsBtnComponent } from '@shared/components/menus/permissions-editor-menu/edit-list-permissions-btn/edit-list-permissions-btn.component';
import { PermissionsEditorMenuService } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.service';
import { SelectRoleBtnComponent } from '@shared/components/menus/permissions-editor-menu/select-role-btn/select-role-btn.component';
import { roleHierarchy } from '@shared/constants/role-hierarchy.constants';
import { TrimNamePipe } from '@shared/pipes/trim-name.pipe';
import { EffectiveSpaceMembershipData } from '@shared/types/common.types';
import {
  Space,
  SubsectionRole,
  TopLevelRole,
  UserMemberships,
} from '@shared/types/entities.types';
import { DisabledRoleButtons } from '@shared/types/ui.types';

@Component({
  selector: 'app-edit-space-permissions-btn',
  imports: [
    MatTooltipModule,
    CollapseExpandBtnComponent,
    EditFolderPermissionsBtnComponent,
    EditListPermissionsBtnComponent,
    SelectRoleBtnComponent,
    TrimNamePipe,
  ],
  templateUrl: './edit-space-permissions-btn.component.html',
  styleUrl: './edit-space-permissions-btn.component.css',
})
export class EditSpacePermissionsBtnComponent {
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private workspaceService = inject(WorkspaceService);
  private permissionsEditorService = inject(PermissionsEditorMenuService);
  private workspace = this.workspaceService.currentWorkspace;
  isDisabled = input.required<boolean>();
  isCheckboxDisabled = input.required<boolean>();
  space = input.required<Space>();
  workspaceMemberId = input.required<string>();
  allowedAssignableRoles = input.required<TopLevelRole[]>();
  selectedMemberships = model<UserMemberships>();
  protected isSpaceCollapsed = signal(true);
  protected spaceMembershipData = computed<
    EffectiveSpaceMembershipData | undefined
  >(() => {
    return this.permissionsEditorService
      .selectedMembershipsData()
      .effectiveSpaceMembershipsData.find(
        (membershipData) => membershipData.spaceId === this.space().id,
      );
  });
  protected disabledRoleButtons = computed<DisabledRoleButtons>(() => {
    const isSuperAdminBtnDisabled = false;
    let isAdminBtnDisabled = false;
    let isMemberBtnDisabled = false;
    let isGuestBtnDisabled = false;

    const workspaceMembership =
      this.permissionsEditorService.selectedMembershipsData()
        .workspaceMembershipData;

    if (workspaceMembership) {
      const workspaceMembershipRole = workspaceMembership.role;
      isAdminBtnDisabled =
        roleHierarchy[workspaceMembershipRole] > roleHierarchy['admin'];

      isMemberBtnDisabled =
        roleHierarchy[workspaceMembershipRole] > roleHierarchy['member'];

      isGuestBtnDisabled =
        roleHierarchy[workspaceMembershipRole] > roleHierarchy['guest'];
    }

    return {
      super_admin: isSuperAdminBtnDisabled,
      admin: isAdminBtnDisabled,
      member: isMemberBtnDisabled,
      guest: isGuestBtnDisabled,
    };
  });



  protected toggleSpaceChecked(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!isChecked) {
      this.permissionsEditorService.deleteSpaceMembership(this.space());
    }
  }

  protected onSelectRole(role: TopLevelRole | undefined): void {
    const spaceRole = role as SubsectionRole;

    if (!this.workspace()) {
      return;
    }
    this.permissionsEditorService.updateSpaceMemberships(
      this.space(),
      spaceRole!,
    );
  }

  protected isAllowedToEditFolderPermissions(folderId: string): boolean {
    return this.authorizationCheckerService.canEditFolderPermissions(
      folderId,
      this.workspaceMemberId(),
    );
  }

  protected getAllowedAssignableFolderRoles(folderId: string): TopLevelRole[] {
    return this.authorizationCheckerService.getAllowedAssignableFolderRoles(
      folderId,
    );
  }

  protected canEditListPermissions(listId: string): boolean {
    return this.authorizationCheckerService.canEditListPermissions(
      listId,
      this.workspaceMemberId(),
    );
  }

  protected getAllowedAssignableListRoles(listId: string): TopLevelRole[] {
    return this.authorizationCheckerService.getAllowedAssignableListRoles(
      listId,
    );
  }
}
