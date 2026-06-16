import { TopLevelRole } from '@shared/types/entities.types';

export const roleHierarchy: Record<TopLevelRole, number> = {
  granular: 0,
  guest: 0,
  member: 1,
  admin: 2,
  super_admin: 3,
};
