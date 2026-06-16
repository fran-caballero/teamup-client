import { NgStyle } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AddDueDateMenuComponent } from '@shared/components/menus/add-due-date-menu/add-due-date-menu.component';
import { DateService } from '@shared/services/date.service';

@Component({
  selector: 'app-add-due-date-btn',
  imports: [NgStyle, MatMenuModule, AddDueDateMenuComponent],
  templateUrl: './add-due-date-btn.component.html',
  styleUrl: './add-due-date-btn.component.css',
})
export class AddDueDateBtnComponent {
  private dateService = inject(DateService);
  isDisabled = input<boolean>();
  btnStyles = input<Record<string, string>>();
  symbolStyles = input<Record<string, string>>();
  noDueDatePlaceholder = input<string>();
  hasHoverOutline = input<boolean>();
  selectedDate = model<Date | null>(null);
  menuOpened = output();
  menuClosed = output();
  @ViewChild('addDueDateBtn') addDueDateBtn?: MatMenuTrigger;
  protected hovered = signal<boolean>(false);
  protected combinedBtnStyles = computed(() => {
    return {
      ...this.btnStyles(),
      backgroundColor:
        this.hovered() && !this.isDisabled()
          ? 'var(--hover-color-contrast-medium)'
          : 'transparent',
    };
  });

  protected isDateOverdue(selectedDate: Date): boolean {
    return this.dateService.isDateOverdue(selectedDate);
  }
}
