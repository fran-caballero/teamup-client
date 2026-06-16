import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MembershipService } from '@core/services/authorization/membership.service';
import { UserService } from '@core/services/user.service';
import { RoleFormatterPipe } from '@shared/pipes/role-formatter.pipe';
import { NotificationsService } from '@shared/services/notifications.service';
import { Notification } from '@shared/types/common.types';
import { hasSubsectionMemberships } from '@shared/utils/membership.utils';
import { EMPTY, switchMap } from 'rxjs';

@Component({
  selector: 'app-accept-invitation-modal',
  imports: [CommonModule, RoleFormatterPipe],
  templateUrl: './accept-invitation-modal.component.html',
  styleUrl: './accept-invitation-modal.component.css',
})
export class AcceptInvitationModalComponent {
  private notification: Notification = inject(DIALOG_DATA);
  private dialogRef = inject(DialogRef);
  private userService = inject(UserService);
  private membershipService = inject(MembershipService);
  private notificationsService = inject(NotificationsService);
  protected invitation = this.notification.data;
  protected invitationMemberships = this.invitation.memberships;
  protected hasSubsectionMemberships = hasSubsectionMemberships;

  protected onClickClose(): void {
    this.dialogRef.close();
  }

  protected declineInvitation(): void {
    this.membershipService
      .respondToInvitation(this.invitation.inviterId, false)
      .subscribe({
        next: () => {
          this.notificationsService.removeNotification(this.notification.id);
        },
      });

    this.dialogRef.close();
  }

  protected acceptInvitation(): void {
    this.membershipService
      .respondToInvitation(this.invitation.inviterId, true)
      .pipe(
        switchMap(() => {
          this.notificationsService.removeNotification(this.notification.id);
          const userId = this.userService.user()?.id;

          if (userId) {
            return this.userService.getUser(userId);
          }

          return EMPTY;
        }),
      )
      .subscribe();

    this.dialogRef.close();
  }
}
