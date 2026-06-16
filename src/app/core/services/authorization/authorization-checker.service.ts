import { computed, inject, Injectable, Signal } from '@angular/core';
import { MembershipService } from '@core/services/authorization/membership.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import {
  Folder,
  Space,
  Status,
  SubsectionRole,
  Task,
  TopLevelRole,
  User,
  Workspace,
} from '@shared/types/entities.types';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationCheckerService {
  private membershipService = inject(MembershipService);
  private workspaceService = inject(WorkspaceService);
  private userService = inject(UserService);
  private workspaceMembersMap = this.membershipService.workspaceMembersMap;

  canCreateSpace(workspaceId: string | undefined): boolean {
    if (workspaceId) {
      return this.isUserAuthorized('workspace', workspaceId, [
        'super_admin',
        'admin',
        'member',
      ]);
    }

    return false;
  }

  canRenameWorkspace(workspaceId: string | undefined): boolean {
    if (workspaceId) {
      return this.isUserAuthorized('workspace', workspaceId, [
        'super_admin',
        'admin',
      ]);
    }
    return false;
  }

  canDeleteWorkspace(workspaceId: string | undefined): boolean {
    if (workspaceId) {
      return this.isUserAuthorized('workspace', workspaceId, ['super_admin']);
    }
    return false;
  }

  isSuperAdminOfMoreWorkspaces(
    user: User | undefined,
    currentWorkspace: Workspace | undefined,
  ): boolean {
    if (!user || !currentWorkspace) {
      return false;
    }

    return user.workspaces.some(
      (workspace) =>
        workspace.id !== currentWorkspace.id &&
        workspace.role === 'super_admin',
    );
  }

  canCreateEntitiesInSpace(spaceId: string | undefined): boolean {
    if (!spaceId) {
      return false;
    }
    return this.isUserAuthorized('space', spaceId, [
      'super_admin',
      'admin',
      'member',
    ]);
  }

  canCreateTasksInSpace(space: Space | null | undefined): Signal<boolean> {
    return computed<boolean>(() => {
      const membersMap = this.workspaceMembersMap();

      if (!space || !membersMap) {
        return false;
      }

      for (const list of space.lists) {
        const isAuthorized = this.isUserAuthorized('list', list.id, [
          'super_admin',
          'admin',
          'member',
        ]);
        if (isAuthorized) {
          return true;
        }
      }

      for (const folder of space.folders) {
        for (const list of folder.lists) {
          const isAuthorized = this.isUserAuthorized('list', list.id, [
            'super_admin',
            'admin',
            'member',
          ]);
          if (isAuthorized) {
            return true;
          }
        }
      }
      return false;
    });
  }

  canRenameSpace(spaceId: string | null | undefined): boolean {
    if (!spaceId) {
      return false;
    }
    return this.isUserAuthorized('space', spaceId, ['super_admin']);
  }

  canDeleteSpace(spaceId: string | null | undefined): boolean {
    if (!spaceId) {
      return false;
    }
    return this.isUserAuthorized('space', spaceId, ['super_admin']);
  }

  canCreateListsInFolder(folderId: string | null | undefined): boolean {
    if (!folderId) {
      return false;
    }

    return this.isUserAuthorized('folder', folderId, [
      'super_admin',
      'admin',
      'member',
    ]);
  }

  canCreateTasksInFolder(folder: Folder | null | undefined): Signal<boolean> {
    return computed<boolean>(() => {
      const membersMap = this.workspaceMembersMap();

      if (!folder || !membersMap) {
        return false;
      }

      for (const list of folder.lists) {
        const isAuthorized = this.isUserAuthorized('list', list.id, [
          'super_admin',
          'admin',
          'member',
        ]);

        if (isAuthorized) {
          return true;
        }
      }
      return false;
    });
  }

  canRenameFolder(folderId: string | null | undefined): boolean {
    if (!folderId) {
      return false;
    }

    return this.isUserAuthorized('folder', folderId, [
      'super_admin',
      'admin',
      'member_creator',
    ]);
  }

  canDeleteFolder(folderId: string | null | undefined): boolean {
    if (!folderId) {
      return false;
    }

    return this.isUserAuthorized('folder', folderId, ['super_admin', 'admin']);
  }

  canCreateTasks(listId: string | null | undefined): boolean {
    if (!listId) {
      return false;
    }

    const personalList = this.userService.user()?.personalList;
    const isListPersonal = personalList && personalList.id === listId;

    if (isListPersonal) {
      return true;
    }

    return this.isUserAuthorized('list', listId, [
      'super_admin',
      'admin',
      'member',
    ]);
  }

  canAssignTasks(listId: string | undefined | null): boolean {
    if (!listId) {
      return false;
    }

    const personalListId = this.userService.user()?.personalList.id;

    if (listId === personalListId) {
      return true;
    }
    return this.isUserAuthorized('list', listId, ['super_admin', 'admin']);
  }

  canRenameList(listId: string | null | undefined): boolean {
    if (listId) {
      return this.isUserAuthorized('list', listId, [
        'super_admin',
        'admin',
        'member_creator',
      ]);
    }
    return false;
  }

  canEditStatusesInList(listId: string | null | undefined): boolean {
    const personalList = this.userService.user()?.personalList;
    const isPersonal = personalList && personalList.id === listId;

    if (!listId || isPersonal) {
      return false;
    }

    return this.isUserAuthorized('list', listId, ['super_admin', 'admin']);
  }

  canDeleteStatusesInList(
    listId: string | null | undefined,
    status: Status,
  ): boolean {
    const personalList = this.userService.user()?.personalList;
    const isPersonal = personalList && personalList.id === listId;

    if (!listId || isPersonal || status.isDefault) {
      return false;
    }

    return this.isUserAuthorized('list', listId, ['super_admin', 'admin']);
  }

  hasAllEditingPermissionsInList(listId: string | null | undefined): boolean {
    if (!listId) {
      return false;
    }

    const personalListId = this.userService.user()?.personalList.id;

    if (listId === personalListId) {
      return true;
    }

    return this.isUserAuthorized('list', listId, ['super_admin', 'admin']);
  }

  canDeleteList(listId: string | undefined): boolean {
    if (!listId) {
      return false;
    }
    return this.isUserAuthorized('list', listId, [
      'super_admin',
      'admin',
      'member_creator',
    ]);
  }

  canDeleteTasks(listId: string | null | undefined): boolean {
    if (!listId) {
      return false;
    }

    const personalListId = this.userService.user()?.personalList.id;

    if (listId === personalListId) {
      return true;
    }

    return this.isUserAuthorized('task', listId, [
      'super_admin',
      'member_creator',
    ]);
  }

  hasAllEditingPermissionsInTask(
    listId: string | null | undefined,
    task: Task | null | undefined,
  ) {
    if (!listId || !task) {
      return false;
    }

    const personalListId = this.userService.user()?.personalList.id;
    if (listId === personalListId) {
      return true;
    }

    return this.isUserAuthorized(
      'task',
      listId,
      ['super_admin', 'admin', 'member_creator'],
      task,
    );
  }

  canUpdateTaskDescription(
    listId: string | null | undefined,
    task: Task | null | undefined,
  ): boolean {
    if (!task || !listId) {
      return false;
    }

    return this.isUserAuthorized(
      'task',
      listId,
      ['super_admin', 'admin', 'member'],
      task,
    );
  }

  canEditMemberPermissions(
    userId: string | undefined,
    memberId: string,
  ): boolean {
    if (!userId) {
      return false;
    }

    const userMembershipsMap =
      this.workspaceMembersMap()?.get(userId)?.effectiveMembershipsMaps;

    const memberMembershipsMap =
      this.workspaceMembersMap()?.get(memberId)?.effectiveMembershipsMaps;

    if (!userMembershipsMap || !memberMembershipsMap) {
      return false;
    }

    const userWorkspaceRole = userMembershipsMap.workspaceMembership.role;
    const memberWorkspaceRole = memberMembershipsMap.workspaceMembership.role;

    if (userWorkspaceRole === 'super_admin') {
      return true;
    }

    if (
      memberWorkspaceRole === 'super_admin' ||
      memberWorkspaceRole === 'admin'
    ) {
      return false;
    }

    if (userWorkspaceRole === 'member' || userWorkspaceRole === 'guest') {
      for (const userMembership of userMembershipsMap.effectiveSpaceMembershipsMap.values()) {
        const memberMembership =
          memberMembershipsMap.effectiveSpaceMembershipsMap.get(
            userMembership.spaceId,
          );

        if (!memberMembership) {
          continue;
        }

        if (
          userMembership.role === 'super_admin' ||
          (userMembership.role === 'admin' &&
            (memberMembership.role === 'member' ||
              memberMembership.role === 'guest'))
        ) {
          return true;
        }
      }

      for (const userMembership of userMembershipsMap.effectiveFolderMembershipsMap.values()) {
        const memberMembership =
          memberMembershipsMap.effectiveFolderMembershipsMap.get(
            userMembership.folderId,
          );

        if (!memberMembership) {
          return false;
        }

        if (
          userMembership.role === 'super_admin' ||
          (userMembership.role === 'admin' &&
            (memberMembership.role === 'member' ||
              memberMembership.role === 'guest'))
        ) {
          return true;
        }
      }

      for (const userMembership of userMembershipsMap.effectiveFolderMembershipsMap.values()) {
        const memberMembership =
          memberMembershipsMap.effectiveListMembershipsMap.get(
            userMembership.folderId,
          );

        if (!memberMembership) {
          return false;
        }

        if (
          userMembership.role === 'super_admin' ||
          (userMembership.role === 'admin' &&
            (memberMembership.role === 'member' ||
              memberMembership.role === 'guest'))
        ) {
          return true;
        }
      }
    }

    return false;
  }

  canEditWorkspacePermissions(
    workspaceId: string | null | undefined,

    workspaceMemberId: string | null | undefined,
  ): boolean {
    if (!workspaceId || !workspaceMemberId) {
      return false;
    }

    const workspaceMembership =
      this.workspaceMembersMap()?.get(workspaceMemberId)
        ?.effectiveMembershipsMaps.workspaceMembership;

    const allowedRoles: ('super_admin' | 'admin')[] = [];

    if (
      workspaceMembership &&
      (workspaceMembership.role === 'super_admin' ||
        workspaceMembership.role === 'admin')
    ) {
      allowedRoles.push('super_admin');
    } else {
      allowedRoles.push('super_admin', 'admin');
    }

    return this.isUserAuthorized('workspace', workspaceId, allowedRoles);
  }

  canEditSpacePermissions(
    spaceId: string | null | undefined,
    workspaceMemberId: string | null | undefined,
  ): boolean {
    if (!spaceId || !workspaceMemberId) {
      return false;
    }

    const spaceMembership = this.workspaceMembersMap()
      ?.get(workspaceMemberId)
      ?.effectiveMembershipsMaps.effectiveSpaceMembershipsMap.get(spaceId);
    const allowedRoles: ('super_admin' | 'admin')[] = [];

    if (
      spaceMembership &&
      (spaceMembership.role === 'super_admin' ||
        spaceMembership.role === 'admin')
    ) {
      allowedRoles.push('super_admin');
    } else {
      allowedRoles.push('super_admin', 'admin');
    }

    return this.isUserAuthorized('space', spaceId, allowedRoles);
  }

  canEditFolderPermissions(
    folderId: string | null | undefined,
    workspaceMemberId: string | null | undefined,
  ): boolean {
    if (!folderId || !workspaceMemberId) {
      return false;
    }

    const folderMembership = this.workspaceMembersMap()
      ?.get(workspaceMemberId)
      ?.effectiveMembershipsMaps.effectiveFolderMembershipsMap.get(folderId);
    const allowedRoles: ('super_admin' | 'admin')[] = [];

    if (
      folderMembership &&
      (folderMembership.role === 'super_admin' ||
        folderMembership.role === 'admin')
    ) {
      allowedRoles.push('super_admin');
    } else {
      allowedRoles.push('super_admin', 'admin');
    }

    return this.isUserAuthorized('folder', folderId, allowedRoles);
  }

  canEditListPermissions(
    listId: string | null | undefined,
    workspaceMemberId: string | null | undefined,
  ): boolean {
    if (!listId || !workspaceMemberId) {
      return false;
    }

    const listMembership = this.workspaceMembersMap()
      ?.get(workspaceMemberId)
      ?.effectiveMembershipsMaps.effectiveListMembershipsMap.get(listId);
    const allowedRoles: ('super_admin' | 'admin')[] = [];

    if (
      listMembership &&
      (listMembership.role === 'super_admin' || listMembership.role === 'admin')
    ) {
      allowedRoles.push('super_admin');
    } else {
      allowedRoles.push('super_admin', 'admin');
    }

    return this.isUserAuthorized('list', listId, allowedRoles);
  }

  getAllowedAssignableWorkspaceRoles(): TopLevelRole[] {
    const userId = this.userService.user()?.id;
    const roles: TopLevelRole[] = [];

    if (!userId) {
      return roles;
    }

    const workspaceMembership =
      this.workspaceMembersMap()?.get(userId)?.effectiveMembershipsMaps
        .workspaceMembership;

    if (!workspaceMembership) {
      return roles;
    }

    roles.push('member', 'guest');

    if (workspaceMembership.role === 'super_admin') {
      roles.push('super_admin', 'admin');
    }

    return roles;
  }

  getAllowedAssignableSpaceRoles(spaceId: string): TopLevelRole[] {
    const userId = this.userService.user()?.id;
    const roles: TopLevelRole[] = [];

    if (!userId) {
      return roles;
    }

    const spaceMembership = this.workspaceMembersMap()
      ?.get(userId)
      ?.effectiveMembershipsMaps.effectiveSpaceMembershipsMap.get(spaceId);

    if (!spaceMembership) {
      return roles;
    }

    roles.push('member', 'guest');

    if (spaceMembership.role === 'super_admin') {
      roles.push('super_admin', 'admin');
    }

    return roles;
  }

  getAllowedAssignableFolderRoles(folderId: string): TopLevelRole[] {
    const userId = this.userService.user()?.id;
    const roles: TopLevelRole[] = [];

    if (!userId) {
      return roles;
    }

    const folderMembership = this.workspaceMembersMap()
      ?.get(userId)
      ?.effectiveMembershipsMaps.effectiveFolderMembershipsMap.get(folderId);

    if (!folderMembership) {
      return roles;
    }

    roles.push('member', 'guest');

    if (folderMembership.role === 'super_admin') {
      roles.push('super_admin', 'admin');
    }

    return roles;
  }

  getAllowedAssignableListRoles(listId: string): TopLevelRole[] {
    const userId = this.userService.user()?.id;
    const roles: TopLevelRole[] = [];

    if (!userId) {
      return roles;
    }

    const listMembership = this.workspaceMembersMap()
      ?.get(userId)
      ?.effectiveMembershipsMaps.effectiveListMembershipsMap.get(listId);

    if (!listMembership) {
      return roles;
    }

    roles.push('member', 'guest');

    if (listMembership.role === 'super_admin') {
      roles.push('super_admin', 'admin');
    }

    return roles;
  }

  private isUserAuthorized(
    entity: 'workspace' | 'space' | 'folder' | 'list' | 'task',
    sectionId: string,
    allowedRoles: (SubsectionRole | 'member_creator')[],
    task?: Task,
  ): boolean {
    const workspace = this.workspaceService.currentWorkspace();
    const userId = this.userService.user()?.id;

    if (!workspace || !userId) {
      return false;
    }

    const userMembershipsMap =
      this.workspaceMembersMap()?.get(userId)?.effectiveMembershipsMaps;

    if (!userMembershipsMap) {
      return false;
    }

    switch (entity) {
      case 'workspace': {
        let role: TopLevelRole | undefined;
        if (sectionId === workspace.id) {
          role = userMembershipsMap.workspaceMembership.role;
        } else {
          role = this.userService
            .user()
            ?.workspaces.find((workspace) => workspace.id === sectionId)?.role;
        }

        if (!role || role === 'granular' || !allowedRoles.includes(role)) {
          return false;
        }
        if (
          allowedRoles.includes('member_creator') &&
          role === 'member' &&
          workspace.createdBy !== userId
        ) {
          return false;
        }
        return true;
      }

      case 'space': {
        const spaceMembership =
          userMembershipsMap.effectiveSpaceMembershipsMap.get(sectionId);
        if (!spaceMembership) {
          return false;
        }
        if (!allowedRoles.includes(spaceMembership.role)) {
          return false;
        }
        if (
          allowedRoles.includes('member_creator') &&
          spaceMembership.role === 'member' &&
          spaceMembership.spaceCreatorId !== userId
        ) {
          return false;
        }

        return true;
      }

      case 'folder': {
        const folderMembership =
          userMembershipsMap.effectiveFolderMembershipsMap.get(sectionId);
        if (!folderMembership) {
          return false;
        }

        if (!allowedRoles.includes(folderMembership.role)) {
          return false;
        }
        if (
          allowedRoles.includes('member_creator') &&
          folderMembership.role === 'member' &&
          folderMembership.folderCreatorId !== userId
        ) {
          return false;
        }
        return true;
      }
      case 'list': {
        const listMembership =
          userMembershipsMap.effectiveListMembershipsMap.get(sectionId);
        const personalListId = this.userService.user()?.personalList.id;

        if (sectionId === personalListId) {
          return true;
        }

        if (!listMembership) {
          return false;
        }

        if (!allowedRoles.includes(listMembership.role)) {
          return false;
        }

        if (
          allowedRoles.includes('member_creator') &&
          listMembership.role === 'member' &&
          listMembership.listCreatorId !== userId
        ) {
          return false;
        }

        return true;
      }
      case 'task': {
        const listMembership =
          userMembershipsMap.effectiveListMembershipsMap.get(sectionId);
        const personalListId = this.userService.user()?.personalList.id;

        if (sectionId === personalListId) {
          return true;
        }

        if (!listMembership) {
          return false;
        }

        if (!allowedRoles.includes(listMembership.role)) {
          return false;
        }

        if (
          allowedRoles.includes('member_creator') &&
          listMembership.role === 'member' &&
          task?.createdBy !== userId
        ) {
          return false;
        }
        return true;
      }
    }
  }
}
