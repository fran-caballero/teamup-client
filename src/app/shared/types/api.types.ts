import {
  Folder,
  List,
  Space,
  Status,
  SubsectionRole,
  Task,
  TopLevelRole,
  UserPreferences,
  Workspace,
} from './entities.types';

export type SuccessResponse<T> = {
  status: 'success';
  data: T;
};

export type ErrorResponse = {
  status: 'failure';
  error: {
    message: string;
    code?: string;
  };
};

export type CreateUserRequestBody = {
  id: string;
  username: string;
  password: string;
};

export type UpdateUserPreferencesBody = Partial<UserPreferences>;

export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  userSummary: { id: string; username: string };
};

export type AccessTokenResponse = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
};

export type RefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export type CreateWorkspaceRequestBody = Pick<Workspace, 'name'>;

export type WorkspaceSummary = Omit<Workspace, 'spaces' | 'personalList'>;

export type UpdateWorkspaceRequestBody = CreateWorkspaceRequestBody;

export type CreateSpaceRequestBody = Pick<Space, 'id' | 'name'>;

export type SpaceSummary = Omit<Space, 'folders' | 'lists'>;

export type UpdateSpaceRequestBody = Pick<Space, 'name'>;

export type CreateFolderRequestBody = Pick<Folder, 'id' | 'name'>;

export type FolderSummary = Omit<Folder, 'lists'>;

export type UpdateFolderRequestBody = Pick<Folder, 'name'>;

export type DefaultStatusSummary = Pick<Status, 'id' | 'type'>;

export type CreateListRequestBody = {
  name: string;
  id: string;
  defaultStatusesSummary: DefaultStatusSummary[];
};

export type ListSummary = Omit<List, 'tasks'>;

export type UpdateListRequestBody = Pick<List, 'name'>;

export type CreateStatusRequestBody = Pick<
  Status,
  'id' | 'name' | 'type' | 'defaultColorId' | 'colorHex'
>;

export type UpdateStatusRequestBody = Partial<
  Pick<Status, 'name' | 'defaultColorId' | 'colorHex'>
>;

export type CreateTaskRequestBody = Omit<
  Task,
  'assignees' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'
> & { assigneesIds: string[] };

export type UpdateTaskRequestBody = Partial<
  Omit<CreateTaskRequestBody, 'id' | 'assigneesIds'>
>;

export type CreateTaskAssigmentRequestBody = {
  assigneeId: string;
};

export type CreateWorkspaceMembershipRequestBody = {
  memberId: string;
  role: TopLevelRole;
};

export type UpdateWorkspaceMembershipRequestBody = {
  role: TopLevelRole;
};

export type CreateSpaceMembershipRequestBody = {
  memberId: string;
  role: SubsectionRole;
};

export type UpdateSpaceMembershipRequestBody = {
  role: SubsectionRole;
};

export type CreateFolderMembershipRequestBody = {
  memberId: string;
  role: SubsectionRole;
};

export type UpdateFolderMembershipRequestBody = {
  role: SubsectionRole;
};

export type CreateListMembershipRequestBody = {
  memberId: string;
  role: SubsectionRole;
};

export type UpdateListMembershipRequestBody = {
  role: SubsectionRole;
};
