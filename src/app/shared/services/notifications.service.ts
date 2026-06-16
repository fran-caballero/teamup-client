import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { InfoModalComponent } from '@shared/components/modals/info-modal/info-modal.component';
import { LoadingPopupComponent } from '@shared/components/modals/loading-popup/loading-popup.component';
import { ErrorMessagePopupComponent } from '@shared/components/popups/error-message-popup/error-message-popup.component';
import { Invitation, Notification } from '@shared/types/common.types';
import { ErrorPopupData, InfoModalData } from '@shared/types/ui.types';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private dialog = inject(Dialog);
  private snackBar = inject(MatSnackBar);
  private loadingModalSnackbarRef:
    | MatSnackBarRef<LoadingPopupComponent>
    | undefined;
  notifications = signal<Notification[]>([]);

  addNotification(newNotification: Notification): void {
    this.notifications.update((notifications) => [
      ...notifications,
      newNotification,
    ]);
  }

  setInvitationNotifications(invitations: Invitation[]): void {
    const nonInvitationNotifications = this.notifications().filter(
      (notification) => notification.type !== 'invitation',
    );

    const invitationNotifications = invitations.map((invitation) => ({
      type: 'invitation' as const,
      description: `You've received an invitation from ${invitation.inviterUsername}`,
      data: invitation,
      id: self.crypto.randomUUID(),
    }));

    this.notifications.set([
      ...nonInvitationNotifications,
      ...invitationNotifications,
    ]);
  }

  removeNotification(notificationId: string): void {
    this.notifications.update((notifications) =>
      notifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  }

  openInfoModal(data: InfoModalData): void {
    this.dialog.open(InfoModalComponent, { data: data });
  }

  showLoadingSnackbar(): void {
    this.loadingModalSnackbarRef = this.snackBar.openFromComponent(
      LoadingPopupComponent,
      {
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
      },
    );
  }

  closeLoadingSnackbar(): void {
    this.loadingModalSnackbarRef?.dismiss();
  }

  clearTransientUi(): void {
    this.dialog.closeAll();
    this.snackBar.dismiss();
    this.loadingModalSnackbarRef = undefined;
  }

  showError(errorMessage?: string): void {
    const snackbarData: ErrorPopupData = {
      errorMessage,
    };

    this.snackBar.openFromComponent(ErrorMessagePopupComponent, {
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      announcementMessage: errorMessage,
      data: snackbarData,
    });
  }
}
