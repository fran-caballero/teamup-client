import { Component, inject, ViewChild } from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { AuthenticationService } from '@core/services/authentication.service';
import { UserService } from '@core/services/user.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-profile-settings-dropdown',
  imports: [MatMenuModule, UserAvatarComponent],
  templateUrl: './profile-settings-dropdown.component.html',
  styleUrl: './profile-settings-dropdown.component.css',
})
export class ProfileSettingsDropdownComponent {
  private authenticationService = inject(AuthenticationService);
  private userService = inject(UserService);
  @ViewChild('profileSettingsDropdown', { static: true })
  profileSettingsDropdown!: MatMenu;
  protected user = this.userService.user;

  protected onClickSignout() {
    this.authenticationService.logout().subscribe();
  }
}
