import { computed, inject, Injectable, Renderer2 } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { NotificationsService } from '@shared/services/notifications.service';

@Injectable({
  providedIn: 'root',
})
export class ColorThemeService {
  private userService = inject(UserService);
  private notificationsService = inject(NotificationsService);
  currentColorTheme = computed(() => {
    if (!this.userService.user()) {
      return;
    }
    return this.userService.user()!.preferences.preferredTheme;
  });

  toggleColorTheme(renderer: Renderer2): void {
    const rootElement = renderer.selectRootElement('body', true);
    const user = this.userService.user();

    if (!user) {
      return;
    }

    let preferredTheme: 'light' | 'dark';

    if (rootElement.classList.contains('dark-theme')) {
      renderer.removeClass(rootElement, 'dark-theme');
      preferredTheme = 'light';
    } else {
      renderer.addClass(rootElement, 'dark-theme');
      preferredTheme = 'dark';
    }

    this.userService.updateUserPreferences({ preferredTheme }, true).subscribe({
      error: () => {
        this.notificationsService.showError(
          'Failed to update color theme. Please try again later.',
        );
      },
    });
  }
}
