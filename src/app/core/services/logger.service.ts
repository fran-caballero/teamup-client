import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  info(message: string, ...args: unknown[]): void {
    if (environment.production) {
      return;
    }

    console.log(`%c[INFO] ${message}`, 'color: blue', ...args);
  }

  apiError(message: string, ...args: unknown[]): void {
    if (environment.production) {
      return;
    }

    console.error(`%c[API ERROR] ${message}`, 'color: red', ...args);
  }

  internalError(message: string, ...args: unknown[]): void {
    if (environment.production) {
      return;
    }

    console.error(`%c[INTERNAL ERROR] ${message}`, 'color: red', ...args);
  }
}
