import { Dialog } from '@angular/cdk/dialog';
import { Component, inject, ViewChild } from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { AcceptInvitationModalComponent } from '@shared/components/modals/accept-invitation-modal/accept-invitation-modal.component';
import { NotificationsService } from '@shared/services/notifications.service';
import { Notification } from '@shared/types/common.types';

@Component({
  selector: 'app-notifications-dropdown',
  imports: [MatMenuModule],
  templateUrl: './notifications-dropdown.component.html',
  styleUrl: './notifications-dropdown.component.css',
})
export class NotificationsDropdownComponent {
  private dialog = inject(Dialog);
  private notificationsService = inject(NotificationsService);
  @ViewChild('notificationsDropdown', { static: true })
  notificationsDropdown!: MatMenu;
  protected notifications = this.notificationsService.notifications;

  protected openDialog(notification: Notification): void {
    this.dialog.open(AcceptInvitationModalComponent, {
      data: notification,
    });
  }
}
