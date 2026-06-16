import { DialogRef } from '@angular/cdk/dialog';
import { WritableSignal } from '@angular/core';
import { DayOfTheWeek, StandaloneTask } from '@shared/types/common.types';
import {
  List,
  Priority,
  Status,
  SubsectionRole,
  UserMemberships,
  WorkspaceMember,
} from '@shared/types/entities.types';

export type SectionType =
  | 'home'
  | 'personalList'
  | 'people'
  | 'rolesAndPermissions'
  | 'space'
  | 'folder'
  | 'listInSpace'
  | 'listInFolder'
  | 'taskInListInSpace'
  | 'taskInListInFolder'
  | 'taskInPersonalList';

export type StatusColor = {
  id: number;
  light: string;
  dark: string;
};

export type GroupByOption = 'status' | 'assignee' | 'priority' | 'dueDate';

export type GroupByOrderingOption = 'ascending' | 'descending';

export type ButtonType = 'link' | 'formElement';

export type EntityType =
  | 'workspace'
  | 'space'
  | 'folder'
  | 'list'
  | 'status'
  | 'task';

export type NewSectionModalData = {
  sectionType: 'folder' | 'list';
  sectionDescription: string;
  spaceId: string;
  folderId: string | null;
};

export type InviteUserModalData = {
  userId: string;
  username: string;
  onInvitationSent: () => void;
};

export type CancelInvitationWarningModalData = {
  userId: string;
  username: string;
  onInvitationCancelled: () => void;
};

export type AcceptInvitationModalData = {
  requesterUsername: string;
  requesterId: string;
  memberships: UserMemberships;
};

export type DeleteWarningModalData = {
  workspaceId: string | null;
  spaceId: string | null;
  folderId: string | null;
  listId: string | null;
  statusId: string | null;
  taskId: string | null;
  elementType: EntityType;
  elementName: string;
};

export type InfoModalData = {
  mainMessage: string;
  secondaryMessage?: string;
};

export type ResetUIState =
  | { kind: 'none' }
  | { kind: 'demoOwnerResetScheduled'; scheduledFor: string }
  | { kind: 'demoOwnerResetActive' }
  | {
      kind: 'demoOwnerWorkspaceResetActive';
      workspaceId?: string;
      ownerId?: string;
      scheduledFor?: string;
    };

export type RemoveUserFromWorkspaceWarningData = {
  userId: string;
  username: string;
  editPermissionsModalDialogRef: DialogRef;
};

export type EditPermissionsModalData = WorkspaceMember;

export type ErrorPopupData = {
  errorMessage?: string;
};

export type CollapsibleList = List & { isCollapsed: WritableSignal<boolean> };

export type FolderWithCollapsibleLists = {
  lists: CollapsibleList[];
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type SpaceWithCollapsibleLists = {
  id: string;
  name: string;
  folders: FolderWithCollapsibleLists[];
  lists: CollapsibleList[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type TaskGroupType = 'inMyWork' | 'inList' | 'inFolder' | 'inSpace';

export type TaskGroupSubtype = { statusType: Status['type'] };

export type TaskGroupByStatus = {
  status: Status;
  standaloneTasks: StandaloneTask[];
  isCollapsed: WritableSignal<boolean>;
};

export type TaskGroupByPriority = {
  priority: Priority;
  standaloneTasks: StandaloneTask[];
  isCollapsed: WritableSignal<boolean>;
};

export type TaskGroupByAssignee = {
  assignee: { id: string; username: string } | null;
  standaloneTasks: StandaloneTask[];
  isCollapsed: WritableSignal<boolean>;
};

export type DueDateCategory =
  | 'overdue'
  | 'today'
  | 'tomorrow'
  | DayOfTheWeek
  | 'future'
  | null
  | 'done';

export type TaskGroupByDueDate = {
  dueDate: DueDateCategory;
  standaloneTasks: StandaloneTask[];
  isCollapsed: WritableSignal<boolean>;
};

export type DisabledRoleButtons = Record<SubsectionRole, boolean>;

export type CollapsibleWorkspaceMember = WorkspaceMember & {
  isCollapsed: WritableSignal<boolean>;
};
