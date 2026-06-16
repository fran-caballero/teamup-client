import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from '@core/services/authentication.service';
import { UserService } from '@core/services/user.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-page-not-found',
  imports: [RouterModule, UserAvatarComponent],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css',
})
export class PageNotFoundComponent {
  private userService = inject(UserService);
  private authenticationService = inject(AuthenticationService);
  protected user = this.userService.user;

  protected onClickSignout(): void {
    this.authenticationService.logout().subscribe();
  }
}
