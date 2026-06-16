import { Pipe, PipeTransform } from '@angular/core';
import { TopLevelRole } from '@shared/types/entities.types';

@Pipe({
  name: 'formatRole',
  standalone: true,
})
export class RoleFormatterPipe implements PipeTransform {
  private userFriendlyRoleNames: Record<TopLevelRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    member: 'Member',
    guest: 'Guest',
    granular: 'Granular',
  };

  transform(role: TopLevelRole): string {
    return this.userFriendlyRoleNames[role];
  }
}
