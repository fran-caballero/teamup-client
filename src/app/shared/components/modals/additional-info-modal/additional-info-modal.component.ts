import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-additional-info-modal',
  imports: [],
  templateUrl: './additional-info-modal.component.html',
  styleUrl: './additional-info-modal.component.css',
})
export class AdditionalInfoModalComponent {
  private modalData = inject<{ infoMessage: string }>(DIALOG_DATA);
  protected infoMessage = this.modalData.infoMessage;
}
