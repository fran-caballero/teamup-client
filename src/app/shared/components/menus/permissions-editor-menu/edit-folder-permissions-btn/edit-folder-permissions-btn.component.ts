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
import { CollapseExpandBtnComponent } from '@shared/components/buttons/collapse-expand-btn/collapse-expand-btn.component';
import { EditListPermissionsBtnComponent } from '@shared/components/menus/permissions-editor-menu/edit-list-permissions-btn/edit-list-permissions-btn.component';
import { PermissionsEditorMenuService } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.service';
import { SelectRoleBtnComponent } from '@shared/components/menus/permissions-editor-menu/select-role-btn/select-role-btn.component';
import { roleHierarchy } from '@shared/constants/role-hierarchy.constants';
import { EffectiveFolderMembershipData } from '@shared/types/common.types';
import {
  Folder,
  Space,
  SubsectionRole,
  TopLevelRole,
  UserMemberships,
} from '@shared/types/entities.types';
import { DisabledRoleButtons } from '@shared/types/ui.types';

@Component({
  selector: 'app-edit-folder-permissions-btn',
  imports: [
    MatTooltipModule,
    CollapseExpandBtnComponent,
    EditListPermissionsBtnComponent,
    SelectRoleBtnComponent,
  ],
  templateUrl: './edit-folder-permissions-btn.component.html',
  styleUrl: './edit-folder-permissions-btn.component.css',
})
export class EditFolderPermissionsBtnComponent {
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private permissionsEditorService = inject(PermissionsEditorMenuService);
  isDisabled = input.required<boolean>();
  isCheckboxDisabled = input.required<boolean>();
  space = input.required<Space>();
  folder = input.required<Folder>();
  allowedAssignableRoles = input.required<TopLevelRole[]>();
  workspaceMemberId = input.required<string>();
  selectedMemberships = model.required<UserMemberships | undefined>();
  protected isFolderCollapsed = signal(true);
  protected folderMembershipData = computed<
    EffectiveFolderMembershipData | undefined
  >(() =>
    this.permissionsEditorService
      .selectedMembershipsData()
      .effectiveFolderMembershipsData.find(
        (membershipData) => membershipData.folderId === this.folder().id,
      ),
  );
  protected disabledRoleButtons = computed<DisabledRoleButtons>(() => {
    const isSuperAdminBtnDisabled = false;
    let isAdminBtnDisabled = false;
    let isMemberBtnDisabled = false;
    let isGuestBtnDisabled = false;

    const spaceParentMembership =
      this.permissionsEditorService.getSpaceMembershipData(this.space().id);

    if (spaceParentMembership) {
      const spaceMembershipRole = spaceParentMembership.role;
      isAdminBtnDisabled =
        roleHierarchy[spaceMembershipRole] > roleHierarchy['admin'];
      isMemberBtnDisabled =
        roleHierarchy[spaceMembershipRole] > roleHierarchy['member'];
      isGuestBtnDisabled =
        roleHierarchy[spaceMembershipRole] > roleHierarchy['guest'];
    }

    return {
      super_admin: isSuperAdminBtnDisabled,
      admin: isAdminBtnDisabled,
      member: isMemberBtnDisabled,
      guest: isGuestBtnDisabled,
    };
  });

  protected toggleFolderChecked(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!isChecked) {
      this.permissionsEditorService.deleteFolderMembership(
        this.folder(),
        this.space().id,
      );
    }
  }

  protected onSelectRole(role: TopLevelRole | undefined): void {
    const folderRole = role as SubsectionRole;
    this.permissionsEditorService.updateFolderMemberships(
      this.folder(),
      this.space().id,
      folderRole!,
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
