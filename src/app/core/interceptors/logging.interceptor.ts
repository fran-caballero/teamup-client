import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { catchError, Observable, throwError } from 'rxjs';

export function loggingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const loggerService = inject(LoggerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      loggerService.apiError(`HTTP Fail: ${req.url}`, {
        requestMethod: req.method,
        requestUrl: req.urlWithParams,
        responseStatus: error.status,
        responseStatusText: error.statusText,
        responseUrl: error.url,
        responseMessage: error.message,
        responseBody: error.error,
      });

      return throwError(() => error);
    }),
  );
}
