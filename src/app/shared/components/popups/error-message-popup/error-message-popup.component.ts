import { Component, inject } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { ErrorPopupData } from '@shared/types/ui.types';

@Component({
  selector: 'app-error-message-popup',
  imports: [],
  templateUrl: './error-message-popup.component.html',
  styleUrl: './error-message-popup.component.css',
})
export class ErrorMessagePopupComponent {
  private snackBarRef = inject(MatSnackBarRef);
  private popupData = inject(MAT_SNACK_BAR_DATA);
  protected errorMessage: ErrorPopupData =
    this.popupData.errorMessage || 'An error occurred. Please try again later.';

  protected onClickClose(): void {
    this.snackBarRef.dismiss();
  }
}
