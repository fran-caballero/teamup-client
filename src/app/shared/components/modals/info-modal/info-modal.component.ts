import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { InfoModalData } from '@shared/types/ui.types';

@Component({
  selector: 'app-info-modal',
  imports: [],
  templateUrl: './info-modal.component.html',
  styleUrl: './info-modal.component.css',
})
export class InfoModalComponent {
  private dialogRef = inject(DialogRef);
  private modalData = inject<InfoModalData>(DIALOG_DATA);
  protected mainMessage = this.modalData.mainMessage;
  protected secondaryMessage = this.modalData.secondaryMessage;

  onClickClose(): void {
    this.dialogRef.close();
  }
}
