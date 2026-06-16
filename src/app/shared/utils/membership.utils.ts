import { InvitationMemberships } from '@shared/types/common.types';
import { UserMemberships } from '@shared/types/entities.types';

export function hasSubsectionMemberships(
  memberships: UserMemberships | InvitationMemberships,
): boolean {
  if ('detailedSpaceMemberships' in memberships) {
    return (
      !!memberships.spaceMemberships.length ||
      !!memberships.folderMemberships.length ||
      !!memberships.listMemberships.length
    );
  } else {
    return (
      !!memberships.spaceMemberships.length ||
      !!memberships.folderMemberships.length ||
      !!memberships.listMemberships.length
    );
  }
}
