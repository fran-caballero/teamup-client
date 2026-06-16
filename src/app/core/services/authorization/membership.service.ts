import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { SuccessResponse } from '@shared/types/api.types';
import {
  EffectiveFolderMembership,
  EffectiveListMembership,
  EffectiveSpaceMembership,
  UserMembershipsData,
} from '@shared/types/common.types';
import {
  Folder,
  List,
  SubsectionRole,
  WorkspaceMember,
  WorkspaceMembership,
} from '@shared/types/entities.types';
import { environment } from 'environments/environment';
import { EMPTY, filter, map, Observable, switchMap, take, tap } from 'rxjs';

type EffectiveSpaceMembershipsMap = Map<string, EffectiveSpaceMembership>;
type EffectiveFolderMembershipsMap = Map<string, EffectiveFolderMembership>;
type EffectiveListMembershipsMap = Map<string, EffectiveListMembership>;
type WorkspaceMemberWithMappedMemberships = {
  id: string;
  username: string;
  effectiveMembershipsMaps: {
    workspaceMembership: WorkspaceMembership;
    effectiveSpaceMembershipsMap: EffectiveSpaceMembershipsMap;
    effectiveFolderMembershipsMap: EffectiveFolderMembershipsMap;
    effectiveListMembershipsMap: EffectiveListMembershipsMap;
  };
};

@Injectable({
  providedIn: 'root',
})
export class MembershipService {
  private httpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private workspace = this.workspaceService.currentWorkspace;
  private mappedWorkspace = this.workspaceService.mappedWorkspace;
  workspaceMembers = signal<WorkspaceMember[] | undefined>(undefined);
  workspaceMembersMap = computed<
    Map<string, WorkspaceMemberWithMappedMemberships> | undefined
  >(() => {
    return new Map(this.workspaceMembers()?.map(this.mapMemberCallback));
  });
  workspaceMembersMap$ = toObservable(this.workspaceMembersMap);
  workspaceMembersMapDefined$ = this.workspaceMembersMap$.pipe(
    filter((map) => map !== undefined),
    take(1),
  );

  getWorkspaceMembers(): Observable<SuccessResponse<WorkspaceMember[]>> {
    const workspaceId = this.workspace()?.id;

    if (!workspaceId) {
      return EMPTY;
    }

    return this.httpClient
      .get<
        SuccessResponse<WorkspaceMember[]>
      >(`${this.apiUrl}/workspaces/${workspaceId}/members`)
      .pipe(
        tap((res) => {
          this.workspaceMembers.set(res.data);
        }),
      );
  }

  getMemberUsernameById(userId: string): string | undefined {
    return this.workspaceMembersMap()?.get(userId)?.username;
  }

  inviteUser(selectedMemberships: UserMembershipsData): Observable<void> {
    const inviteeId = selectedMemberships.workspaceMembershipData.memberId;

    return this.httpClient.post<void>(
      `${this.apiUrl}/invitations/${inviteeId}`,
      { memberships: selectedMemberships },
    );
  }

  cancelInvitation(inviteeId: string): Observable<void> {
    const workspaceId = this.workspaceService.currentWorkspace()!.id;

    return this.httpClient.delete<void>(
      `${this.apiUrl}/workspaces/${workspaceId}/invitations/${inviteeId}`,
    );
  }

  respondToInvitation(
    inviterId: string,
    isAccepted: boolean,
  ): Observable<void> {
    const userId = this.userService.user()?.id;

    if (!userId) {
      return EMPTY;
    }

    return this.httpClient.patch<void>(`${this.apiUrl}/invitations/${userId}`, {
      inviterId,
      isAccepted,
    });
  }

  updateUserPermissions(
    selectedMemberships: UserMembershipsData,
  ): Observable<void> {
    const workspaceId = selectedMemberships.workspaceMembershipData.workspaceId;

    return this.httpClient
      .patch<void>(`${this.apiUrl}/workspaces/${workspaceId}/memberships/`, {
        memberships: selectedMemberships,
      })
      .pipe(
        switchMap(() => this.getWorkspaceMembers()),
        map(() => undefined),
      );
  }

  revokeWorkspacePermissions(memberId: string): Observable<void> {
    const workspaceId = this.workspaceService.currentWorkspace()!.id;

    return this.httpClient
      .delete<void>(
        `${this.apiUrl}/workspaces/${workspaceId}/memberships/${memberId}`,
      )
      .pipe(
        switchMap(() => this.getWorkspaceMembers()),
        map(() => undefined),
      );
  }

  private mapMemberCallback: (
    member: WorkspaceMember,
  ) => [string, WorkspaceMemberWithMappedMemberships] = (
    member: WorkspaceMember,
  ) => {
    const memberships = member.memberships;
    const mappedWorkspace = this.mappedWorkspace();
    const workspace = this.workspace();
    let effectiveSpaceMembershipsMap: EffectiveSpaceMembershipsMap;
    let effectiveFolderMembershipsMap: EffectiveFolderMembershipsMap;
    let effectiveListMembershipsMap: EffectiveListMembershipsMap;

    if (!workspace || !mappedWorkspace) {
      effectiveSpaceMembershipsMap = new Map();
      effectiveFolderMembershipsMap = new Map();
      effectiveListMembershipsMap = new Map();
    } else {
      effectiveSpaceMembershipsMap = new Map(
        memberships.spaceMemberships.flatMap((membership) => {
          const space = mappedWorkspace.spacesMap.get(membership.spaceId);

          if (!space) {
            return [];
          }

          const spaceMembership: EffectiveSpaceMembership = {
            ...membership,
            spaceCreatorId: space.createdBy,
            isInherited: false,
          };
          return [[membership.spaceId, spaceMembership]];
        }),
      );

      effectiveFolderMembershipsMap = new Map(
        memberships.folderMemberships.flatMap((membership) => {
          const folder = mappedWorkspace.foldersMap.get(membership.folderId);

          if (!folder) {
            return [];
          }

          const folderMembership: EffectiveFolderMembership = {
            ...membership,
            folderCreatorId: folder.createdBy,
            isInherited: false,
          };
          return [[membership.folderId, folderMembership]];
        }),
      );

      effectiveListMembershipsMap = new Map(
        memberships.listMemberships.flatMap((membership) => {
          const list = mappedWorkspace.listsMap.get(membership.listId);

          if (!list) {
            return [];
          }

          const listMembership: EffectiveListMembership = {
            ...membership,
            listCreatorId: list.createdBy,
            isInherited: false,
          };
          return [[membership.listId, listMembership]];
        }),
      );

      const cascadeMembershipsIntoFolder = (
        folder: Folder,
        folderRole: SubsectionRole,
        cascadedListsSet?: Set<string>,
      ) => {
        let listRole: SubsectionRole;
        if (!effectiveFolderMembershipsMap.has(folder.id)) {
          effectiveFolderMembershipsMap.set(folder.id, {
            folderId: folder.id,
            memberId: member.id,
            role: folderRole,
            folderCreatorId: folder.createdBy,
            isInherited: true,
            createdBy: null,
            createdAt: null,
            updatedBy: null,
            updatedAt: null,
          });
          listRole = folderRole;
        } else {
          listRole = effectiveFolderMembershipsMap.get(folder.id)!.role;
        }

        folder.lists.forEach((list) => {
          if (!effectiveListMembershipsMap.has(list.id)) {
            effectiveListMembershipsMap.set(list.id, {
              listId: list.id,
              memberId: member.id,
              role: listRole,
              listCreatorId: list.createdBy,
              isInherited: true,
              createdBy: null,
              createdAt: null,
              updatedBy: null,
              updatedAt: null,
            });
            cascadedListsSet?.add(list.id);
          }
        });
      };

      const cascadeMembershipsIntoListInSpace = (
        list: List,
        listRole: SubsectionRole,
      ) => {
        if (!effectiveListMembershipsMap.has(list.id)) {
          effectiveListMembershipsMap.set(list.id, {
            listId: list.id,
            memberId: member.id,
            role: listRole,
            listCreatorId: list.createdBy,
            isInherited: true,
            createdBy: null,
            createdAt: null,
            updatedBy: null,
            updatedAt: null,
          });
        }
      };

      const workspaceRole = memberships.workspaceMembership.role;

      if (workspaceRole !== 'granular') {
        workspace.spaces.forEach((space) => {
          let spaceRole: SubsectionRole;
          let folderRole: SubsectionRole;

          if (!effectiveSpaceMembershipsMap.has(space.id)) {
            spaceRole = workspaceRole;
            effectiveSpaceMembershipsMap.set(space.id, {
              spaceId: space.id,
              memberId: member.id,
              role: spaceRole,
              spaceCreatorId: space.createdBy,
              isInherited: true,
              createdBy: null,
              createdAt: null,
              updatedBy: null,
              updatedAt: null,
            });
            folderRole = spaceRole;
          } else {
            spaceRole = effectiveSpaceMembershipsMap.get(space.id)!.role;
            folderRole = spaceRole;
          }

          space.folders.forEach((folder) => {
            cascadeMembershipsIntoFolder(folder, folderRole);
          });

          const listRole = spaceRole;
          space.lists.forEach((list) => {
            cascadeMembershipsIntoListInSpace(list, listRole);
          });
        });
      } else {
        const cascadedFoldersSet = new Set<string>();
        const cascadedListsSet = new Set<string>();

        effectiveSpaceMembershipsMap.forEach((spaceMembership) => {
          const space = mappedWorkspace.spacesMap.get(spaceMembership.spaceId);
          if (!space) {
            return;
          }
          space.folders.forEach((folder) => {
            cascadeMembershipsIntoFolder(
              folder,
              spaceMembership.role,
              cascadedListsSet,
            );
            cascadedFoldersSet.add(folder.id);
          });
          space.lists.forEach((list) => {
            cascadeMembershipsIntoListInSpace(list, spaceMembership.role);
            cascadedListsSet.add(list.id);
          });
        });

        effectiveFolderMembershipsMap.forEach((folderMembership) => {
          if (!cascadedFoldersSet.has(folderMembership.folderId)) {
            const folder = mappedWorkspace.foldersMap.get(
              folderMembership.folderId,
            );
            if (!folder) {
              return;
            }
            cascadeMembershipsIntoFolder(
              folder,
              folderMembership.role,
              cascadedListsSet,
            );
            cascadedFoldersSet.add(folder.id);
          }
        });
      }
    }

    return [
      member.id,
      {
        id: member.id,
        username: member.username,
        effectiveMembershipsMaps: {
          workspaceMembership: member.memberships.workspaceMembership,
          effectiveSpaceMembershipsMap,
          effectiveFolderMembershipsMap,
          effectiveListMembershipsMap,
        },
      },
    ];
  };
}
