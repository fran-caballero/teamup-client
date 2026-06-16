import {
  List,
  Status,
  SubsectionRole,
  Task,
  TopLevelRole,
  WorkspaceMembership,
} from '@shared/types/entities.types';

export type ListAncestorsIds = {
  spaceId: string | null;
  folderId: string | null;
};

export type TaskAncestorsIds = {
  spaceId: string | null;
  folderId: string | null;
  listId: string;
};

export type EntityData = { name: string; id: string };

export type ListsWithAncestorsGroup = {
  lists: List[];
  listsAncestorsData: ListAncestorsData;
};

export type ListAncestorsData = {
  spaceData: EntityData | null;
  folderData: EntityData | null;
};

export type TaskAncestorsData = {
  spaceData: EntityData | null;
  folderData: EntityData | null;
  listData: EntityData;
};

export type TaskWithAncestorsData = {
  task: Task;
  taskAncestorsData: TaskAncestorsData;
};

export type StandaloneTask = {
  task: Task;
  taskAncestorsData: TaskAncestorsData;
  listStatuses: Status[];
  status: Status;
};

export type TaskGroupByStatusType = {
  statusType: Status['type'];
  standaloneTasks: StandaloneTask[];
};

export type WorkspaceMembershipData = {
  workspaceId: string;
  memberId: string;
  role: TopLevelRole;
};

export type InvitationWorkspaceMembership = WorkspaceMembershipData & {
  workspaceName: string;
};

export type InvitationSpaceMembership = SpaceMembershipData & {
  spaceName: string;
};

export type InvitationFolderMembership = FolderMembershipData & {
  folderName: string;
};

export type InvitationListMembership = ListMembershipData & {
  listName: string;
};

export type InvitationMemberships = {
  workspaceMembership: InvitationWorkspaceMembership;
  spaceMemberships: InvitationSpaceMembership[];
  folderMemberships: InvitationFolderMembership[];
  listMemberships: InvitationListMembership[];
};

export type Invitation = {
  inviterId: string;
  inviterUsername: string;
  memberships: InvitationMemberships;
};

export type Notification = {
  type: 'invitation';
  description: string;
  data: Invitation;
  id: string;
};

export type EffectiveSpaceMembership = {
  spaceId: string;
  memberId: string;
  role: SubsectionRole;
  isInherited: boolean;
  spaceCreatorId: string;
  createdBy: string | null; // Null for cases in which the membership is inherited
  createdAt: Date | null;
  updatedBy: string | null; // Null for cases in which the membership is inherited on hasn't been updated yet
  updatedAt: Date | null;
};

export type EffectiveFolderMembership = {
  folderId: string;
  memberId: string;
  role: SubsectionRole;
  folderCreatorId: string;
  isInherited: boolean;
  createdBy: string | null;
  createdAt: Date | null;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type EffectiveListMembership = {
  listId: string;
  memberId: string;
  role: SubsectionRole;
  listCreatorId: string;
  isInherited: boolean;
  createdBy: string | null;
  createdAt: Date | null;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type EffectiveUserMemberships = {
  workspaceMembership: WorkspaceMembership;
  effectiveSpaceMemberships: EffectiveSpaceMembership[];
  effectiveFolderMemberships: EffectiveFolderMembership[];
  effectiveListMemberships: EffectiveListMembership[];
};

export type EffectiveUserMembershipsData = {
  workspaceMembershipData?: WorkspaceMembershipData;
  effectiveSpaceMembershipsData: EffectiveSpaceMembershipData[];
  effectiveFolderMembershipsData: EffectiveFolderMembershipData[];
  effectiveListMembershipsData: EffectiveListMembershipData[];
};

export type EffectiveSpaceMembershipData = SpaceMembershipData & {
  isInherited: boolean;
};

export type EffectiveFolderMembershipData = FolderMembershipData & {
  isInherited: boolean;
};

export type EffectiveListMembershipData = ListMembershipData & {
  isInherited: boolean;
};

type SubsectionMembershipData = {
  memberId: string;
  role: SubsectionRole;
};

export type SpaceMembershipData = SubsectionMembershipData & {
  spaceId: string;
};

export type FolderMembershipData = SubsectionMembershipData & {
  folderId: string;
};

export type ListMembershipData = SubsectionMembershipData & {
  listId: string;
};

export type UserMembershipsData = {
  workspaceMembershipData: WorkspaceMembershipData;
  spaceMembershipsData: SpaceMembershipData[];
  folderMembershipsData: FolderMembershipData[];
  listMembershipsData: ListMembershipData[];
};

export type DayOfTheWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';
