import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '@shared/types/api.types';

export function isDemoResetInProgressError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 423) {
    return false;
  }

  const errorResponse = error.error as ErrorResponse | undefined;

  return errorResponse?.error?.code === 'DEMO_ACCOUNT_RESET_IN_PROGRESS';
}

export function isUnrecoverableAuthError(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    (error.status === 401 || error.status === 403)
  );
}
