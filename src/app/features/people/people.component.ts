import { A11yModule } from '@angular/cdk/a11y';
import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { MembershipService } from '@core/services/authorization/membership.service';
import { FolderService } from '@core/services/folder.service';
import { ListService } from '@core/services/list.service';
import { SpaceService } from '@core/services/space.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { CollapseExpandBtnComponent } from '@shared/components/buttons/collapse-expand-btn/collapse-expand-btn.component';
import { PermissionsEditorMenuService } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.service';
import { CancelInvitationWarningModalComponent } from '@shared/components/modals/cancel-invitation-warning-modal/cancel-invitation-warning-modal.component';
import { EditPermissionsModalComponent } from '@shared/components/modals/edit-permissions-modal/edit-permissions-modal.component';
import { InviteUserModalComponent } from '@shared/components/modals/invite-user-modal/invite-user-modal.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { RoleFormatterPipe } from '@shared/pipes/role-formatter.pipe';
import { Space, UserSearchResult } from '@shared/types/entities.types';
import {
  CancelInvitationWarningModalData,
  CollapsibleWorkspaceMember,
  EditPermissionsModalData,
  InviteUserModalData,
} from '@shared/types/ui.types';
import { hasSubsectionMemberships } from '@shared/utils/membership.utils';

@Component({
  selector: 'app-people',
  imports: [
    ReactiveFormsModule,
    MatTooltipModule,
    RouterModule,
    RoleFormatterPipe,
    CollapseExpandBtnComponent,
    UserAvatarComponent,
    A11yModule,
  ],
  templateUrl: './people.component.html',
  styleUrl: './people.component.css',
})
export class PeopleComponent {
  private dialog = inject(Dialog);
  private workspaceService = inject(WorkspaceService);
  private spaceService = inject(SpaceService);
  private folderService = inject(FolderService);
  private listService = inject(ListService);
  private userService = inject(UserService);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private membershipService = inject(MembershipService);
  private permissionsEditorMenuService = inject(PermissionsEditorMenuService);
  view = input<'my-team' | 'search-people'>();
  protected mappedWorkspace = this.workspaceService.mappedWorkspace;
  protected workspaceMembers = this.membershipService.workspaceMembers;
  protected workspace = this.workspaceService.currentWorkspace;
  protected collapsibleWorkspaceMembers = computed<
    CollapsibleWorkspaceMember[] | undefined
  >(() => {
    const workspaceMembers = this.membershipService.workspaceMembers();
    if (workspaceMembers) {
      const collapsibleWorkspaceMembers = workspaceMembers.map(
        (workspaceMember) => {
          return { isCollapsed: signal(false), ...workspaceMember };
        },
      );
      return collapsibleWorkspaceMembers;
    }
    return;
  });
  protected user = this.userService.user;
  protected hasSubsectionMemberships = hasSubsectionMemberships;
  protected isFormSubmitted = signal<boolean>(false);
  protected userSearchForm = new FormGroup({
    username: new FormControl(),
  });
  protected searchUsersResult = signal<UserSearchResult[] | undefined>(
    undefined,
  );

  protected submitUserSearchForm(): void {
    if (this.userSearchForm.value.username !== '') {
      this.isFormSubmitted.set(true);
      this.userService
        .getUsers(this.userSearchForm.value.username, this.workspace()!.id)
        .subscribe({
          next: (res) => {
            this.searchUsersResult.set(res.data);
          },
        });
    }
  }

  protected canEditMemberPermissions(memberId: string): boolean {
    const userId = this.userService.user()?.id;

    return this.authorizationCheckerService.canEditMemberPermissions(
      userId,
      memberId,
    );
  }

  protected isSpaceInWorkspace(spaceId: string): boolean {
    return !!this.workspaceService.mappedWorkspace()?.spacesMap.has(spaceId);
  }

  protected getLocalSpace(spaceId: string): Space | undefined {
    return this.workspaceService.mappedWorkspace()?.spacesMap.get(spaceId);
  }

  protected isFolderInWorkspace(folderId: string): boolean {
    return !!this.workspaceService.mappedWorkspace()?.foldersMap.has(folderId);
  }

  protected isListInWorkspace(listId: string): boolean {
    return !!this.workspaceService.mappedWorkspace()?.listsMap.has(listId);
  }

  protected buildFolderPath(folderId: string): string {
    const space = this.spaceService.getLocalSpaceContainingFolder(folderId);
    const folder = space?.folders.find((folder) => folder.id === folderId);

    return `${space?.name} -> ${folder?.name}`;
  }

  protected isUserInWorkspace(id: string): boolean {
    return this.workspaceMembers()?.some((member) => member.id === id) ?? false;
  }

  protected openInviteUserDialog(userId: string, username: string): void {
    const inviteUserModalData: InviteUserModalData = {
      userId,
      username,
      onInvitationSent: () => this.setUserInvited(userId, true),
    };

    this.permissionsEditorMenuService.invitedUserId.set(userId);

    this.dialog.open(InviteUserModalComponent, {
      data: inviteUserModalData,
    });
  }

  protected openCancelInvitationDialog(
    userId: string,
    username: string,
  ): void {
    const cancelInvitationWarningModalData: CancelInvitationWarningModalData = {
      userId,
      username,
      onInvitationCancelled: () => this.setUserInvited(userId, false),
    };

    this.dialog.open(CancelInvitationWarningModalComponent, {
      data: cancelInvitationWarningModalData,
    });
  }

  protected buildListPath(listId: string): string | void {
    const result = this.listService.getListWithAncestorsInWorkspace(listId);

    if (!result) {
      return;
    }
    const { parentSpace, parentFolder, list } = result;
    if (!parentSpace) {
      return `Personal list`;
    }

    if (parentFolder) {
      return `${parentSpace!.name} -> ${parentFolder.name} -> ${list.name}`;
    }

    return `${parentSpace!.name} -> ${list.name}`;
  }

  protected addMemberPermissionsToService(
    member: CollapsibleWorkspaceMember,
  ): void {
    const userMemberships = member.memberships;
    this.permissionsEditorMenuService.updateWorkspaceMembership(
      userMemberships.workspaceMembership.role,
    );

    for (const spaceMembership of userMemberships.spaceMemberships) {
      const space = this.workspaceService
        .mappedWorkspace()
        ?.spacesMap.get(spaceMembership.spaceId);

      if (!space) {
        continue;
      }

      this.permissionsEditorMenuService.updateSpaceMemberships(
        space,
        spaceMembership.role,
      );
    }

    for (const folderMembership of userMemberships.folderMemberships) {
      const result = this.folderService.getFolderWithAncestorsInWorkspace(
        folderMembership.folderId,
      );

      if (!result) {
        continue;
      }

      const { parentSpace, folder } = result;

      this.permissionsEditorMenuService.updateFolderMemberships(
        folder,
        parentSpace.id,
        folderMembership.role,
      );
    }

    for (const listMembership of userMemberships.listMemberships) {
      const result = this.listService.getListWithAncestorsInWorkspace(
        listMembership.listId,
      );

      if (!result) {
        continue;
      }

      const { parentSpace, parentFolder, list } = result;

      const listAncestorsIds = {
        spaceId: parentSpace?.id || null,
        folderId: parentFolder?.id || null,
      };

      this.permissionsEditorMenuService.updateListMemberships(
        list,
        listAncestorsIds,
        listMembership.role,
      );
    }
  }

  protected openEditPermissionsModal(member: CollapsibleWorkspaceMember): void {
    this.permissionsEditorMenuService.invitedUserId.set(member.id);
    this.addMemberPermissionsToService(member);

    const editPermissionsModalData: EditPermissionsModalData = {
      id: member.id,
      username: member.username,
      memberships: member.memberships,
    };

    this.dialog.open(EditPermissionsModalComponent, {
      data: editPermissionsModalData,
    });
  }

  private setUserInvited(userId: string, isInvited: boolean): void {
    this.searchUsersResult.update((users) => {
      return users?.map((user) => {
        if (user.id !== userId) {
          return user;
        }

        return { ...user, isInvited };
      });
    });
  }
}
