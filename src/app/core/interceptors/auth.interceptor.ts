import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from '@core/services/authentication.service';
import { isUnrecoverableAuthError } from '@shared/utils/api-error.utils';
import { catchError, Observable, switchMap } from 'rxjs';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authenticationService = inject(AuthenticationService);

  if (req.url.includes('/login') || req.url.includes('/refresh-token')) {
    return next(req);
  }

  if (authenticationService.shouldRefreshAccessToken()) {
    return authenticationService.refreshAccessToken().pipe(
      catchError((refreshErr) => {
        if (isUnrecoverableAuthError(refreshErr)) {
          authenticationService.logoutLocally();
        }

        throw refreshErr;
      }),
      switchMap(() => {
        const accessToken = authenticationService.getAccessToken();
        const modifiedReq = req.clone({
          headers: req.headers.set('Authorization', 'Bearer ' + accessToken),
        });

        return next(modifiedReq);
      }),
    );
  }

  const accessToken = authenticationService.getAccessToken();
  const modifiedReq = req.clone({
    headers: req.headers.set('Authorization', 'Bearer ' + accessToken),
  });

  if (req.url.endsWith('/logout')) {
    return next(modifiedReq).pipe(
      catchError((err) => {
        authenticationService.logoutLocally();
        throw err;
      }),
    );
  }

  return next(modifiedReq).pipe(
    catchError((err) => {
      if (err.status !== 401) {
        throw err;
      }

      return authenticationService.refreshAccessToken().pipe(
        catchError((refreshErr) => {
          if (isUnrecoverableAuthError(refreshErr)) {
            authenticationService.logoutLocally();
          }
          throw refreshErr;
        }),
        switchMap((res) => {
          authenticationService.setAccessToken(res.data.accessToken);

          const modifiedReq = req.clone({
            headers: req.headers.set(
              'Authorization',
              'Bearer ' + res.data.accessToken,
            ),
          });

          return next(modifiedReq);
        }),
      );
    }),
  );
}
