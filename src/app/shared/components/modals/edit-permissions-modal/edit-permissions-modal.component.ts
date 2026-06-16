import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { MembershipService } from '@core/services/authorization/membership.service';
import { PermissionsEditorMenuComponent } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.component';
import { PermissionsEditorMenuService } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.service';
import { InfoModalComponent } from '@shared/components/modals/info-modal/info-modal.component';
import { RemoveUserFromWorkspaceWarningModalComponent } from '@shared/components/modals/remove-user-from-workspace-warning-modal/remove-user-from-workspace-warning-modal.component';
import {
  EditPermissionsModalData,
  InfoModalData,
  RemoveUserFromWorkspaceWarningData,
} from '@shared/types/ui.types';

@Component({
  selector: 'app-edit-permissions-modal',
  imports: [PermissionsEditorMenuComponent],
  templateUrl: './edit-permissions-modal.component.html',
  styleUrl: './edit-permissions-modal.component.css',
})
export class EditPermissionsModalComponent {
  private dialog = inject(Dialog);
  private dialogRef = inject(DialogRef);
  private modalData: EditPermissionsModalData = inject(DIALOG_DATA);
  private membershipService = inject(MembershipService);
  private permissionsEditorMenuService = inject(PermissionsEditorMenuService);
  protected username = this.modalData.username;
  protected userId = this.modalData.id;

  constructor() {
    this.dialogRef.closed.subscribe({
      next: () => this.permissionsEditorMenuService.resetService(),
    });
  }

  protected onClickCancel(): void {
    this.dialogRef.close();
  }

  protected onClickAccept(): void {
    const nonInheritedMemberships =
      this.permissionsEditorMenuService.getNonInheritedMemberships();

    if (nonInheritedMemberships) {
      this.membershipService
        .updateUserPermissions(nonInheritedMemberships)
        .subscribe({
          complete: () => {
            const successModalData: InfoModalData = {
              mainMessage: ` ${this.modalData.username}'s permissions have been updated.`,
            };
            this.dialog.open(InfoModalComponent, { data: successModalData });
          },
          error: () => {
            const errorModalData: InfoModalData = {
              mainMessage: `An error occurred while updating ${this.modalData.username}'s permissions. `,
              secondaryMessage: `Please try again later.`,
            };
            this.dialog.open(InfoModalComponent, { data: errorModalData });
          },
        });
    } else {
      const userId = this.modalData.id;
      const username = this.modalData.username;

      const removeUserFromWorkspaceWarningModalData: RemoveUserFromWorkspaceWarningData =
        { userId, username, editPermissionsModalDialogRef: this.dialogRef };
      this.dialog.open(RemoveUserFromWorkspaceWarningModalComponent, {
        data: removeUserFromWorkspaceWarningModalData,
      });
    }
  }
}
