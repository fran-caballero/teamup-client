import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { MembershipService } from '@core/services/authorization/membership.service';
import { NotificationsService } from '@shared/services/notifications.service';
import {
  InfoModalData,
  RemoveUserFromWorkspaceWarningData,
} from '@shared/types/ui.types';

@Component({
  selector: 'app-remove-user-from-workspace-warning-modal',
  imports: [],
  templateUrl: './remove-user-from-workspace-warning-modal.component.html',
  styleUrl: './remove-user-from-workspace-warning-modal.component.css',
})
export class RemoveUserFromWorkspaceWarningModalComponent {
  private dialogRef = inject(DialogRef);
  private modalData = inject<RemoveUserFromWorkspaceWarningData>(DIALOG_DATA);
  private membershipService = inject(MembershipService);
  private notificationsService = inject(NotificationsService);
  protected username = this.modalData.username;

  protected onClickClose(): void {
    this.dialogRef.close();
  }

  protected onClickCancel(): void {
    this.dialogRef.close();
  }

  onClickAccept(): void {
    const username = this.username;
    const notificationsService = this.notificationsService;
    const editPermissionsModalDialogRef =
      this.modalData.editPermissionsModalDialogRef;

    this.membershipService
      .revokeWorkspacePermissions(this.modalData.userId)
      .subscribe({
        complete: () => {
          this.dialogRef.close();
          const successModalData: InfoModalData = {
            mainMessage: ` ${username}'s permissions for this workspace have been revoked.`,
          };
          notificationsService.openInfoModal(successModalData);
          editPermissionsModalDialogRef.close();
        },
        error: () => {
          this.dialogRef.close();
          const errorModalData: InfoModalData = {
            mainMessage: `An error occurred while revoking ${username}'s permissions. `,
            secondaryMessage: `Please try again later.`,
          };
          notificationsService.openInfoModal(errorModalData);
          editPermissionsModalDialogRef.close();
        },
      });
  }
}
