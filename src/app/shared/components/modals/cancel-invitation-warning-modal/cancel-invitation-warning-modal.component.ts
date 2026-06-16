import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { MembershipService } from '@core/services/authorization/membership.service';
import { NotificationsService } from '@shared/services/notifications.service';
import {
  CancelInvitationWarningModalData,
  InfoModalData,
} from '@shared/types/ui.types';

@Component({
  selector: 'app-cancel-invitation-warning-modal',
  imports: [],
  templateUrl: './cancel-invitation-warning-modal.component.html',
  styleUrl: './cancel-invitation-warning-modal.component.css',
})
export class CancelInvitationWarningModalComponent {
  private dialogRef = inject(DialogRef);
  private modalData = inject<CancelInvitationWarningModalData>(DIALOG_DATA);
  private membershipService = inject(MembershipService);
  private notificationsService = inject(NotificationsService);
  protected username = this.modalData.username;

  protected onClickClose(): void {
    this.dialogRef.close();
  }

  protected onClickCancel(): void {
    this.dialogRef.close();
  }

  protected onClickAccept(): void {
    const username = this.username;

    this.membershipService.cancelInvitation(this.modalData.userId).subscribe({
      next: () => {
        this.dialogRef.close();
        const successModalData: InfoModalData = {
          mainMessage: `The invitation to ${username} was cancelled.`,
        };

        this.notificationsService.openInfoModal(successModalData);
        this.modalData.onInvitationCancelled();
      },
      error: () => {
        this.dialogRef.close();
        const errorModalData: InfoModalData = {
          mainMessage: `An error occurred while cancelling the invitation to ${username}.`,
          secondaryMessage: `Please try again later.`,
        };

        this.notificationsService.openInfoModal(errorModalData);
      },
    });
  }
}
