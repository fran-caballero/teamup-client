export type UserPreferences = {
  lastActiveWorkspaceId: string | null;
  preferredLanguage: 'en' | 'es';
  preferredTheme: 'light' | 'dark';
};

export type UserWorkspace = {
  id: string;
  name: string;
  role: TopLevelRole;
};

export type User = {
  id: string;
  username: string;
  preferences: UserPreferences;
  personalList: List;
  workspaces: UserWorkspace[];
};

export type UserSummary = Pick<User, 'id' | 'username'>;

export type UserSearchResult = UserSummary & {
  isInvited: boolean;
};

export type Priority = 'urgent' | 'high' | 'normal' | 'low' | null;

export type Assignee = {
  id: string;
  createdBy: string;
  createdAt: Date;
};

export type Task = {
  id: string;
  name: string;
  dueDate: Date | null;
  priority: Priority | null;
  statusId: string;
  description: string | null;
  assignees: Assignee[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type Status = {
  id: string;
  name: string;
  type: 'not_started' | 'active' | 'done';
  isDefault: boolean;
  defaultColorId: number | null;
  colorHex: string | null;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type List = {
  id: string;
  name: string;
  tasks: Task[];
  statuses: Status[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type Folder = {
  id: string;
  name: string;
  lists: List[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type Space = {
  id: string;
  name: string;
  folders: Folder[];
  lists: List[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type Workspace = {
  id: string;
  name: string;
  spaces: Space[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type TopLevelRole =
  | 'super_admin'
  | 'admin'
  | 'member'
  | 'guest'
  | 'granular';

export type SubsectionRole = 'super_admin' | 'admin' | 'member' | 'guest';

export type WorkspaceMembership = {
  workspaceId: string;
  memberId: string;
  role: TopLevelRole;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type SpaceMembership = {
  spaceId: string;
  memberId: string;
  role: SubsectionRole;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type FolderMembership = {
  folderId: string;
  memberId: string;
  role: SubsectionRole;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type ListMembership = {
  listId: string;
  memberId: string;
  role: SubsectionRole;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type UserMemberships = {
  workspaceMembership: WorkspaceMembership;
  spaceMemberships: SpaceMembership[];
  folderMemberships: FolderMembership[];
  listMemberships: ListMembership[];
};

export type WorkspaceMember = {
  id: string;
  username: string;
  memberships: UserMemberships;
};
