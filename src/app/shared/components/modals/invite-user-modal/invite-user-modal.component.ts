import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MembershipService } from '@core/services/authorization/membership.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { PermissionsEditorMenuComponent } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.component';
import { PermissionsEditorMenuService } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.service';
import { NotificationsService } from '@shared/services/notifications.service';
import { InfoModalData, InviteUserModalData } from '@shared/types/ui.types';

@Component({
  selector: 'app-invite-user-modal',
  imports: [MatMenuModule, MatTooltipModule, PermissionsEditorMenuComponent],
  templateUrl: './invite-user-modal.component.html',
  styleUrl: './invite-user-modal.component.css',
})
export class InviteUserModalComponent {
  private dialogRef = inject(DialogRef);
  private membershipService = inject(MembershipService);
  private notificationsService = inject(NotificationsService);
  private workspaceService = inject(WorkspaceService);
  private permissionsEditorService = inject(PermissionsEditorMenuService);
  private modalData = inject<InviteUserModalData>(DIALOG_DATA);
  protected username = this.modalData.username;
  protected currentWorkspace = this.workspaceService.currentWorkspace;
  protected userId = this.modalData.userId;
  protected selectedMembershipsData =
    this.permissionsEditorService.selectedMembershipsData;

  constructor() {
    this.dialogRef.closed.subscribe({
      next: () => this.permissionsEditorService.resetService(),
    });
  }

  protected onClickCancel(): void {
    this.dialogRef.close();
  }

  protected onClickInvite(): void {
    const userName = this.username;

    this.membershipService
      .inviteUser(this.permissionsEditorService.getNonInheritedMemberships()!)
      .subscribe({
        next: () => {
          const successModalData: InfoModalData = {
            mainMessage: `An invitation was sent to ${userName}.`,
          };

          this.notificationsService.openInfoModal(successModalData);
          this.modalData.onInvitationSent();
        },
        error: () => {
          const errorModalData: InfoModalData = {
            mainMessage: `An error occurred while sending invitations to ${userName}. `,
            secondaryMessage: `Please try again later.`,
          };
          this.notificationsService.openInfoModal(errorModalData);
        },
      });
    this.dialogRef.close();
  }
}
