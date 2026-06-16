import { Component, inject } from '@angular/core';
import { AuthenticationService } from '@core/services/authentication.service';
import { UserService } from '@core/services/user.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-unexpected-error',
  imports: [UserAvatarComponent],
  templateUrl: './unexpected-error.component.html',
  styleUrl: './unexpected-error.component.css',
})
export class UnexpectedErrorComponent {
  private userService = inject(UserService);
  private authenticationService = inject(AuthenticationService);
  protected user = this.userService.user;
  protected retryUrl = history.state?.retryUrl as string | undefined;

  protected onClickRetry(): void {
    if (!this.retryUrl) {
      return;
    }

    window.location.replace(this.retryUrl);
  }

  protected onClickSignout(): void {
    this.authenticationService.logout().subscribe();
  }
}
