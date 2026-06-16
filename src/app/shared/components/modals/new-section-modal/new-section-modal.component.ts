import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TitleCasePipe } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ListService } from '@core/services/list.service';
import { NewSectionModalData } from '@shared/types/ui.types';

@Component({
  selector: 'app-new-section-modal',
  imports: [TitleCasePipe, ReactiveFormsModule],
  templateUrl: './new-section-modal.component.html',
  styleUrl: './new-section-modal.component.css',
})
export class NewSectionModalComponent {
  private dialogRef = inject(DialogRef);
  private modalData = inject<NewSectionModalData>(DIALOG_DATA);
  private listService = inject(ListService);
  @ViewChild('newSectionFormInput')
  private newSectionFormInput?: ElementRef;
  protected newSectionForm = new FormGroup({
    sectionName: new FormControl(''),
  });
  protected sectionType = this.modalData.sectionType;
  protected sectionDescription = this.modalData.sectionDescription;

  constructor() {
    afterNextRender(() => {
      this.newSectionFormInput?.nativeElement.focus();
    });
  }

  protected onClickClose(): void {
    this.dialogRef.close();
  }

  protected createList(): void {
    if (
      this.newSectionForm.controls.sectionName.value &&
      this.newSectionForm.controls.sectionName.value !== ''
    ) {
      this.listService.createList(
        this.modalData.spaceId,
        this.newSectionForm.controls.sectionName.value,
        this.modalData.folderId,
      );
    }

    this.newSectionForm.controls.sectionName.reset();
    this.dialogRef.close();
  }
}
