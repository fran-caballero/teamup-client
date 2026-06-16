import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { Component, computed, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '@core/components/logo/logo.component';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { NotificationsDropdownComponent } from '@shared/components/menus/notifications-dropdown/notifications-dropdown.component';
import { ProfileSettingsDropdownComponent } from '@shared/components/menus/profile-settings-dropdown/profile-settings-dropdown.component';
import { NewTaskModalComponent } from '@shared/components/modals/new-task-modal/new-task-modal.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { NotificationsService } from '@shared/services/notifications.service';

import { ToggleColorModeBtnComponent } from './toggle-color-mode-btn/toggle-color-mode-btn.component';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
  imports: [
    DialogModule,
    MatBadgeModule,
    MatMenuModule,
    RouterModule,
    NotificationsDropdownComponent,
    ProfileSettingsDropdownComponent,
    UserAvatarComponent,
    LogoComponent,
    ToggleColorModeBtnComponent,
  ],
})
export class SiteHeaderComponent {
  private dialog = inject(Dialog);
  private workspaceService = inject(WorkspaceService);
  private userService = inject(UserService);
  private notificationsService = inject(NotificationsService);
  protected user = this.userService.user;
  protected numberOfNotifications = computed(
    () => this.notificationsService.notifications().length,
  );

  protected openDialog(): void {
    if (this.workspaceService.currentWorkspace()) {
      this.dialog.open(NewTaskModalComponent);
    }
  }
}
