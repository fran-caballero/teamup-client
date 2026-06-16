import { CommonModule, NgClass } from '@angular/common';
import { Component, computed, inject, input, model } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListSymbolComponent } from '@shared/components/icons/list-symbol/list-symbol.component';
import { PermissionsEditorMenuService } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.service';
import { SelectRoleBtnComponent } from '@shared/components/menus/permissions-editor-menu/select-role-btn/select-role-btn.component';
import { roleHierarchy } from '@shared/constants/role-hierarchy.constants';
import { EffectiveListMembershipData } from '@shared/types/common.types';
import {
  Folder,
  List,
  Space,
  SubsectionRole,
  TopLevelRole,
  UserMemberships,
} from '@shared/types/entities.types';
import { DisabledRoleButtons } from '@shared/types/ui.types';

@Component({
  selector: 'app-edit-list-permissions-btn',
  imports: [
    CommonModule,
    NgClass,
    MatTooltipModule,
    ListSymbolComponent,
    SelectRoleBtnComponent,
  ],
  templateUrl: './edit-list-permissions-btn.component.html',
  styleUrl: './edit-list-permissions-btn.component.css',
})
export class EditListPermissionsBtnComponent {
  private permissionsEditorMenuService = inject(PermissionsEditorMenuService);
  isDisabled = input.required<boolean>();
  isCheckboxDisabled = input.required<boolean>();
  space = input.required<Space>();
  folder = input.required<Folder | null>();
  list = input.required<List>();
  allowedAssignableRoles = input.required<TopLevelRole[]>();
  workspaceMemberId = input.required<string>();
  selectedMemberships = model.required<UserMemberships | undefined>();
  protected listMembershipData = computed<
    EffectiveListMembershipData | undefined
  >(() =>
    this.permissionsEditorMenuService
      .selectedMembershipsData()
      .effectiveListMembershipsData.find(
        (membershipData) => membershipData.listId === this.list().id,
      ),
  );
  protected disabledRoleButtons = computed<DisabledRoleButtons>(() => {
    const isSuperAdminBtnDisabled = false;
    let isAdminBtnDisabled = false;
    let isMemberBtnDisabled = false;
    let isGuestBtnDisabled = false;
    const folderId = this.folder()?.id;

    if (folderId) {
      const folderParentMembership =
        this.permissionsEditorMenuService.getFolderMembershipData(folderId);

      if (folderParentMembership) {
        const folderParentMembershipRole = folderParentMembership.role;
        isAdminBtnDisabled =
          roleHierarchy[folderParentMembershipRole] > roleHierarchy['admin'];

        isMemberBtnDisabled =
          roleHierarchy[folderParentMembershipRole] > roleHierarchy['member'];

        isGuestBtnDisabled =
          roleHierarchy[folderParentMembershipRole] > roleHierarchy['guest'];
      }
    } else {
      const spaceParentMembership =
        this.permissionsEditorMenuService.getSpaceMembershipData(
          this.space().id,
        );

      if (spaceParentMembership) {
        const spaceParentMembershipRole = spaceParentMembership.role;

        isAdminBtnDisabled =
          roleHierarchy[spaceParentMembershipRole] > roleHierarchy['admin'];

        isMemberBtnDisabled =
          roleHierarchy[spaceParentMembershipRole] > roleHierarchy['member'];

        isGuestBtnDisabled =
          roleHierarchy[spaceParentMembershipRole] > roleHierarchy['guest'];
      }
    }

    return {
      super_admin: isSuperAdminBtnDisabled,
      admin: isAdminBtnDisabled,
      member: isMemberBtnDisabled,
      guest: isGuestBtnDisabled,
    };
  });

  protected toggleListChecked(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!isChecked) {
      const listAncestorsIds = {
        spaceId: this.space().id,
        folderId: this.folder() ? this.folder()!.id : null,
      };
      this.permissionsEditorMenuService.deleteListMembership(
        listAncestorsIds,
        this.list().id,
      );
    }
  }

  protected onSelectRole(role: TopLevelRole | undefined) {
    const listRole = role as SubsectionRole;
    const listAncestorsIds = {
      spaceId: this.space().id,
      folderId: this.folder() ? this.folder()!.id : null,
    };
    this.permissionsEditorMenuService.updateListMemberships(
      this.list(),
      listAncestorsIds,
      listRole!,
    );
  }
}
