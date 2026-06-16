import { inject, Injectable, signal } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import {
  EffectiveFolderMembershipData,
  EffectiveListMembershipData,
  EffectiveSpaceMembershipData,
  EffectiveUserMembershipsData,
  ListAncestorsIds,
  UserMembershipsData,
  WorkspaceMembershipData,
} from '@shared/types/common.types';
import {
  Folder,
  List,
  Space,
  SubsectionRole,
  TopLevelRole,
} from '@shared/types/entities.types';

export const roleHierarchy: Record<SubsectionRole, number> = {
  guest: 0,
  member: 1,
  admin: 2,
  super_admin: 3,
};

@Injectable({
  providedIn: 'root',
})
export class PermissionsEditorMenuService {
  private workspaceService = inject(WorkspaceService);
  private userService = inject(UserService);
  invitedUserId = signal<string | undefined>(undefined);
  selectedMembershipsData = signal<EffectiveUserMembershipsData>({
    effectiveSpaceMembershipsData: [],
    effectiveFolderMembershipsData: [],
    effectiveListMembershipsData: [],
  });

  clearPermissions(): void {
    this.selectedMembershipsData.set({
      effectiveSpaceMembershipsData: [],
      effectiveFolderMembershipsData: [],
      effectiveListMembershipsData: [],
    });
  }

  resetService(): void {
    this.invitedUserId.set(undefined);
    this.clearPermissions();
  }

  getSpaceMembershipData(
    spaceId: string,
  ): EffectiveSpaceMembershipData | undefined {
    return this.selectedMembershipsData().effectiveSpaceMembershipsData.find(
      (membershipData) => membershipData.spaceId === spaceId,
    );
  }

  getFolderMembershipData(
    folderId: string,
  ): EffectiveFolderMembershipData | undefined {
    return this.selectedMembershipsData().effectiveFolderMembershipsData.find(
      (membershipData) => membershipData.folderId === folderId,
    );
  }

  getListMembershipData(
    listId: string,
  ): EffectiveListMembershipData | undefined {
    return this.selectedMembershipsData().effectiveListMembershipsData.find(
      (membershipData) => membershipData.listId === listId,
    );
  }

  updateWorkspaceMembership(role: TopLevelRole): void {
    if (!this.invitedUserId()) {
      return;
    }

    const workspaceId = this.workspaceService.currentWorkspace()!.id;
    const workspaceMembershipData: WorkspaceMembershipData = {
      workspaceId: workspaceId,
      memberId: this.invitedUserId()!,
      role: role,
    };

    this.selectedMembershipsData.update((membershipsData) => {
      return {
        ...membershipsData,
        workspaceMembershipData,
      };
    });

    if (role === 'granular') {
      return;
    }

    this.updateWorkspaceChildMemberships();
  }

  updateSpaceMemberships(space: Space, role?: SubsectionRole): void {
    if (!this.invitedUserId()) {
      return;
    }

    const parentMembership =
      this.selectedMembershipsData().workspaceMembershipData;
    const isInherited = !!parentMembership && parentMembership.role === role;
    const membershipToCurrentSpace = this.getSpaceMembershipData(space.id);

    if (
      membershipToCurrentSpace &&
      membershipToCurrentSpace.isInherited === isInherited &&
      membershipToCurrentSpace.role === role
    ) {
      return;
    }

    let finalRole: SubsectionRole | undefined;

    if (!role) {
      if (membershipToCurrentSpace) {
        finalRole = membershipToCurrentSpace.role;
      } else {
        return;
      }
    } else {
      finalRole = role;
    }

    const newSpaceMembership = {
      spaceId: space.id,
      memberId: this.invitedUserId()!,
      role: finalRole,
      isInherited: isInherited,
    };

    this.selectedMembershipsData.update((userMemberships) => {
      this.updateSpaceChildMembershipsData(space, newSpaceMembership);

      if (!membershipToCurrentSpace) {
        return {
          ...this.selectedMembershipsData(),
          effectiveSpaceMembershipsData: [
            ...userMemberships.effectiveSpaceMembershipsData,
            newSpaceMembership,
          ],
        };
      } else {
        return {
          ...this.selectedMembershipsData(),
          effectiveSpaceMembershipsData:
            userMemberships.effectiveSpaceMembershipsData.map(
              (spaceMembership) => {
                if (spaceMembership !== membershipToCurrentSpace) {
                  return spaceMembership;
                }

                return newSpaceMembership;
              },
            ),
        };
      }
    });

    this.updateWorkspaceMembershipRoleBasedOnChildren();
  }

  updateFolderMemberships(
    folder: Folder,
    spaceId: string,
    role?: SubsectionRole,
  ): void {
    if (!this.invitedUserId()) {
      return;
    }
    const parentMembership = this.getSpaceMembershipData(spaceId);
    const membershipToCurrentFolder = this.getFolderMembershipData(folder.id);
    const isInherited = !!parentMembership && parentMembership.role === role;
    if (
      membershipToCurrentFolder &&
      membershipToCurrentFolder.isInherited === isInherited &&
      membershipToCurrentFolder.role === role
    ) {
      return;
    }

    let finalRole: SubsectionRole | undefined;

    if (!role) {
      if (membershipToCurrentFolder) {
        finalRole = membershipToCurrentFolder.role;
      } else {
        return;
      }
    } else {
      finalRole = role;
    }

    const newFolderMembership = {
      folderId: folder.id,
      memberId: this.invitedUserId()!,
      role: finalRole,
      isInherited: isInherited,
    };

    this.updateFolderChildMemberships(folder, newFolderMembership);

    this.selectedMembershipsData.update((userMemberships) => {
      if (!membershipToCurrentFolder) {
        return {
          ...this.selectedMembershipsData(),
          effectiveFolderMembershipsData: [
            ...userMemberships.effectiveFolderMembershipsData,
            newFolderMembership,
          ],
        };
      } else {
        return {
          ...this.selectedMembershipsData(),
          effectiveFolderMembershipsData:
            userMemberships.effectiveFolderMembershipsData.map(
              (folderMembershipData) => {
                if (folderMembershipData !== membershipToCurrentFolder) {
                  return folderMembershipData;
                }

                return newFolderMembership;
              },
            ),
        };
      }
    });

    this.updateWorkspaceMembershipRoleBasedOnChildren();
  }

  updateListMemberships(
    list: List,
    listAncestorsIds: ListAncestorsIds,
    role?: SubsectionRole,
  ): void {
    if (!this.invitedUserId()) {
      return;
    }

    let parentMembership:
      | EffectiveFolderMembershipData
      | EffectiveSpaceMembershipData
      | undefined;

    if (listAncestorsIds.folderId) {
      parentMembership = this.getFolderMembershipData(
        listAncestorsIds.folderId,
      );
    } else {
      parentMembership = this.getSpaceMembershipData(listAncestorsIds.spaceId!);
    }

    const membershipToCurrentListData = this.getListMembershipData(list.id);
    const isInherited = !!parentMembership && parentMembership.role === role;

    if (
      membershipToCurrentListData &&
      membershipToCurrentListData.isInherited === isInherited &&
      membershipToCurrentListData.role === role
    ) {
      return;
    }

    let finalRole: SubsectionRole | undefined;

    if (!role) {
      if (membershipToCurrentListData) {
        finalRole = membershipToCurrentListData.role;
      } else {
        return;
      }
    } else {
      finalRole = role;
    }

    const newListMembership = {
      listId: list.id,
      memberId: this.invitedUserId()!,
      role: finalRole!,
      isInherited: isInherited,
    };

    this.selectedMembershipsData.update((userMemberships) => {
      if (!membershipToCurrentListData) {
        return {
          ...userMemberships,
          effectiveListMembershipsData: [
            ...userMemberships.effectiveListMembershipsData,
            newListMembership,
          ],
        };
      } else {
        return {
          ...userMemberships,
          effectiveListMembershipsData:
            userMemberships.effectiveListMembershipsData.map(
              (listMembershipData) => {
                if (listMembershipData !== membershipToCurrentListData) {
                  return listMembershipData;
                }
                return newListMembership;
              },
            ),
        };
      }
    });

    this.updateWorkspaceMembershipRoleBasedOnChildren();
  }

  deleteWorkspaceMembership(): void {
    const selectedMembershipsData = this.selectedMembershipsData();
    let workspaceMembershipData: WorkspaceMembershipData | undefined;

    if (
      selectedMembershipsData.effectiveSpaceMembershipsData.length > 0 ||
      selectedMembershipsData.effectiveFolderMembershipsData.length > 0 ||
      selectedMembershipsData.effectiveListMembershipsData.length > 0
    ) {
      workspaceMembershipData = {
        workspaceId: this.workspaceService.currentWorkspace()!.id,
        memberId: this.invitedUserId()!,
        role: 'granular',
      };
    } else {
      workspaceMembershipData = undefined;
    }

    this.selectedMembershipsData.update((membershipsData) => {
      return {
        ...membershipsData,
        workspaceMembershipData: workspaceMembershipData,
      };
    });

    this.updateWorkspaceChildMemberships();
  }

  deleteSpaceMembership(space: Space): void {
    this.selectedMembershipsData.update((membershipsData) => {
      return {
        ...membershipsData,
        effectiveSpaceMembershipsData:
          this.selectedMembershipsData().effectiveSpaceMembershipsData.filter(
            (membership) => membership.spaceId !== space.id,
          ),
      };
    });

    space.folders.forEach((folder) => {
      this.updateFolderMemberships(folder, space.id);
    });

    space.lists.forEach((list) => {
      this.updateListMemberships(list, { spaceId: space.id, folderId: null });
    });

    this.updateWorkspaceMembershipRoleBasedOnChildren();
  }

  deleteFolderMembership(folder: Folder, spaceId: string): void {
    this.selectedMembershipsData.update((membershipsData) => {
      return {
        ...membershipsData,
        effectiveFolderMembershipsData:
          this.selectedMembershipsData().effectiveFolderMembershipsData.filter(
            (membershipData) => membershipData.folderId !== folder.id,
          ),
      };
    });

    folder.lists.forEach((list) => {
      this.updateListMemberships(list, { spaceId, folderId: folder.id });
    });

    this.updateWorkspaceMembershipRoleBasedOnChildren();
  }

  deleteListMembership(
    listAncestorsIds: ListAncestorsIds,
    listId: string,
  ): void {
    this.selectedMembershipsData.update((membershipsData) => {
      return {
        ...membershipsData,
        effectiveListMembershipsData:
          this.selectedMembershipsData().effectiveListMembershipsData.filter(
            (membershipData) => membershipData.listId !== listId,
          ),
      };
    });
    this.updateWorkspaceMembershipRoleBasedOnChildren();
  }

  getNonInheritedMemberships(): UserMembershipsData | null {
    const selectedMembershipsData = this.selectedMembershipsData();

    if (!selectedMembershipsData.workspaceMembershipData) {
      return null;
    }

    return {
      workspaceMembershipData: selectedMembershipsData.workspaceMembershipData,
      spaceMembershipsData: this.filterNonInheritedMemberships(
        selectedMembershipsData.effectiveSpaceMembershipsData,
      ),
      folderMembershipsData: this.filterNonInheritedMemberships(
        selectedMembershipsData.effectiveFolderMembershipsData,
      ),
      listMembershipsData: this.filterNonInheritedMemberships(
        selectedMembershipsData.effectiveListMembershipsData,
      ),
    };
  }

  private updateSpaceMembershipDataInMap(
    space: Space,
    spaceMembershipsDataMap: Map<string, EffectiveSpaceMembershipData>,
    parentRole: TopLevelRole,
  ): void {
    let newSpaceMembership: EffectiveSpaceMembershipData;

    if (spaceMembershipsDataMap.has(space.id)) {
      const spaceMembership = spaceMembershipsDataMap.get(space.id)!;

      const newRole =
        parentRole !== 'granular' &&
        roleHierarchy[parentRole as SubsectionRole] >
          roleHierarchy[spaceMembership.role]
          ? parentRole
          : spaceMembership.role;

      const isInherited = newRole === parentRole;

      newSpaceMembership = {
        ...spaceMembership,
        role: newRole,
        isInherited: isInherited,
      };

      spaceMembershipsDataMap.set(space.id, newSpaceMembership);

      this.updateSpaceChildMembershipsData(space, newSpaceMembership);
    } else if (parentRole !== 'granular') {
      newSpaceMembership = {
        spaceId: space.id,
        memberId: this.invitedUserId()!,
        role: parentRole,
        isInherited: true,
      };

      spaceMembershipsDataMap.set(space.id, newSpaceMembership);

      this.updateSpaceChildMembershipsData(space, newSpaceMembership);
    } else {
      return;
    }
  }

  private updateFolderMembershipInMap(
    folder: Folder,
    folderMembershipsMap: Map<string, EffectiveFolderMembershipData>,
    parentRole: SubsectionRole,
  ): void {
    let newFolderMembership: EffectiveFolderMembershipData;

    if (folderMembershipsMap.has(folder.id)) {
      const folderMembershipData = folderMembershipsMap.get(folder.id)!;

      const newRole =
        roleHierarchy[parentRole] >= roleHierarchy[folderMembershipData.role]
          ? parentRole
          : folderMembershipData.role;
      const isInherited = parentRole === newRole;

      newFolderMembership = {
        ...folderMembershipData,
        role: newRole,
        isInherited: isInherited,
      };

      folderMembershipsMap.set(folder.id, newFolderMembership);
    } else {
      newFolderMembership = {
        folderId: folder.id,
        memberId: this.invitedUserId()!,
        role: parentRole,
        isInherited: true,
      };

      folderMembershipsMap.set(folder.id, newFolderMembership);
    }
  }

  private updateListMembershipInMap(
    list: List,
    listMembershipsMap: Map<string, EffectiveListMembershipData>,
    parentRole: SubsectionRole,
  ): void {
    let newListMembership: EffectiveListMembershipData;

    if (listMembershipsMap.has(list.id)) {
      const listMembership = listMembershipsMap.get(list.id)!;

      const newRole =
        roleHierarchy[parentRole] >= roleHierarchy[listMembership.role]
          ? parentRole
          : listMembership.role;
      const isInherited = newRole === parentRole;

      newListMembership = {
        ...listMembership,
        role: newRole,
        isInherited: isInherited,
      };

      listMembershipsMap.set(list.id, newListMembership);
    } else {
      newListMembership = {
        listId: list.id,
        role: parentRole,
        memberId: this.invitedUserId()!,
        isInherited: true,
      };

      listMembershipsMap.set(list.id, newListMembership);
    }
  }

  private createSpaceMembershipsMap(
    effectiveSpaceMembershipsData: EffectiveSpaceMembershipData[],
  ): Map<string, EffectiveSpaceMembershipData> {
    const spaceMembershipsDataMap = new Map<
      string,
      EffectiveSpaceMembershipData
    >();

    effectiveSpaceMembershipsData.forEach((spaceMembership) =>
      spaceMembershipsDataMap.set(spaceMembership.spaceId, {
        ...spaceMembership,
      }),
    );

    return spaceMembershipsDataMap;
  }

  private createFolderMembershipsMap(
    effectiveFolderMembershipsData: EffectiveFolderMembershipData[],
  ): Map<string, EffectiveFolderMembershipData> {
    const folderMembershipsMap = new Map<
      string,
      EffectiveFolderMembershipData
    >();

    effectiveFolderMembershipsData.forEach((folderMembershipData) =>
      folderMembershipsMap.set(folderMembershipData.folderId, {
        ...folderMembershipData,
      }),
    );

    return folderMembershipsMap;
  }

  private createListMembershipsMap(
    effectiveListMembershipsData: EffectiveListMembershipData[],
  ): Map<string, EffectiveListMembershipData> {
    const listMembershipsMap = new Map<string, EffectiveListMembershipData>();

    effectiveListMembershipsData.forEach((listMembership) =>
      listMembershipsMap.set(listMembership.listId, { ...listMembership }),
    );

    return listMembershipsMap;
  }

  private updateFolderChildMemberships(
    folder: Folder,
    parentMembership: EffectiveFolderMembershipData,
  ): void {
    if (!this.invitedUserId()) {
      return;
    }

    const parentRole = parentMembership.role;

    this.selectedMembershipsData.update((membershipsData) => {
      const listMembershipsMap = this.createListMembershipsMap(
        membershipsData.effectiveListMembershipsData,
      );

      folder.lists.forEach((list) => {
        this.updateListMembershipInMap(list, listMembershipsMap, parentRole);
      });

      return {
        ...this.selectedMembershipsData(),
        effectiveListMembershipsData: Array.from(listMembershipsMap.values()),
      };
    });
  }

  private updateSpaceChildMembershipsData(
    space: Space,
    parentMembership: EffectiveSpaceMembershipData,
  ): void {
    const parentRole = parentMembership.role;

    if (!this.invitedUserId()) {
      return;
    }

    let updatedFolderMembershipsMap: Map<string, EffectiveFolderMembershipData>;

    this.selectedMembershipsData.update((membershipsData) => {
      updatedFolderMembershipsMap = this.createFolderMembershipsMap(
        membershipsData.effectiveFolderMembershipsData,
      );

      const updatedListMembershipsMap = this.createListMembershipsMap(
        membershipsData.effectiveListMembershipsData,
      );

      space.folders.forEach((folder) => {
        this.updateFolderMembershipInMap(
          folder,
          updatedFolderMembershipsMap,
          parentRole,
        );
      });

      space.lists.forEach((list) => {
        this.updateListMembershipInMap(
          list,
          updatedListMembershipsMap,
          parentRole,
        );
      });

      return {
        ...this.selectedMembershipsData(),
        effectiveFolderMembershipsData: Array.from(
          updatedFolderMembershipsMap.values(),
        ),
        effectiveListMembershipsData: Array.from(
          updatedListMembershipsMap.values(),
        ),
      };
    });

    this.selectedMembershipsData().effectiveFolderMembershipsData.forEach(
      (folderMembershipData) =>
        updatedFolderMembershipsMap.set(folderMembershipData.folderId, {
          ...folderMembershipData,
        }),
    );

    space.folders.forEach((folder) => {
      if (updatedFolderMembershipsMap.has(folder.id)) {
        this.updateFolderChildMemberships(
          folder,
          updatedFolderMembershipsMap.get(folder.id)!,
        );
      }
    });
  }

  private updateWorkspaceChildMemberships(): void {
    const workspaceMembershipData =
      this.selectedMembershipsData().workspaceMembershipData;

    if (!this.invitedUserId() || !workspaceMembershipData) {
      return;
    }

    const workspaceMembershipRole = workspaceMembershipData.role;

    this.selectedMembershipsData.update((membershipsData) => {
      const spaceMembershipsDataMap = this.createSpaceMembershipsMap(
        membershipsData.effectiveSpaceMembershipsData,
      );

      this.workspaceService.currentWorkspace()?.spaces.forEach((space) => {
        this.updateSpaceMembershipDataInMap(
          space,
          spaceMembershipsDataMap,
          workspaceMembershipRole,
        );
      });

      return {
        ...this.selectedMembershipsData(),
        effectiveSpaceMembershipsData: Array.from(
          spaceMembershipsDataMap.values(),
        ),
      };
    });
  }

  private updateWorkspaceMembershipRoleBasedOnChildren(): void {
    const workspaceId = this.workspaceService.currentWorkspace()!.id;

    const areSpaceMembershipsSelected =
      this.selectedMembershipsData().effectiveSpaceMembershipsData.length > 0;
    const areFolderMembershipsSelected =
      this.selectedMembershipsData().effectiveFolderMembershipsData.length > 0;
    const areListMembershipsSelected =
      this.selectedMembershipsData().effectiveListMembershipsData.length > 0;

    if (
      areSpaceMembershipsSelected ||
      areFolderMembershipsSelected ||
      areListMembershipsSelected
    ) {
      this.selectedMembershipsData.update((membershipsData) => {
        return {
          ...membershipsData,
          workspaceMembershipData: {
            workspaceId: workspaceId,
            memberId: this.invitedUserId()!,
            role: 'granular',
          },
        };
      });
    } else {
      this.clearPermissions();
    }
  }

  private filterNonInheritedMemberships<T extends { isInherited: boolean }>(
    membershipsData: T[],
  ): Omit<T, 'isInherited'>[] {
    return membershipsData.reduce<Omit<T, 'isInherited'>[]>(
      (acc, membership) => {
        if (!membership.isInherited) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isInherited, ...filteredMembership } = membership;

          acc.push(filteredMembership);
        }

        return acc;
      },
      [],
    );
  }
}
