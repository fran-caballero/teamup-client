import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '@core/services/authentication.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const isAuthenticated = authenticationService.isAuthenticated;

  if (['/login', '/signup'].includes(state.url)) {
    if (isAuthenticated()) {
      router.navigate(['/home']);
      return false;
    }
    return true;
  }

  if (isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
