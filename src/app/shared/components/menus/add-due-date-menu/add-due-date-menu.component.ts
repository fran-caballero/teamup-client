import {
  Component,
  computed,
  effect,
  inject,
  model,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { DateService } from '@shared/services/date.service';

type DateOption =
  | 'today'
  | 'later'
  | 'tomorrow'
  | 'thisWeekend'
  | 'nextWeek'
  | 'nextWeekend'
  | 'twoWeeks'
  | 'fourWeeks'
  | 'noDate';

@Component({
  selector: 'app-add-due-date-menu',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatInputModule,
    MatMenuModule,
    MatTimepickerModule,
  ],
  templateUrl: './add-due-date-menu.component.html',
  styleUrl: './add-due-date-menu.component.css',
})
export class AddDueDateMenuComponent {
  private dateService = inject(DateService);
  selectedOption = signal<DateOption | null>(null);
  selectedDate = model<Date | null>(null);
  @ViewChild('menu', { static: true }) addDueDateMenu!: MatMenu;
  protected laterTime = signal(this.dateService.getLaterTime());
  protected dueDateForm = new FormGroup({
    selectedDate: new FormControl(),
  });
  formattedSelectedDate = computed(() => {
    let formattedSelectedDate: string | null = null;
    const selectedDate = this.selectedDate();

    if (!selectedDate) {
      return formattedSelectedDate;
    }

    if (this.dateService.isDateOverdue(selectedDate)) {
      formattedSelectedDate = this.dateService.formatDateToShort(selectedDate);
    } else if (this.dateService.isToday(selectedDate)) {
      formattedSelectedDate = 'Today';
    } else if (this.dateService.isTomorrow(selectedDate!)) {
      formattedSelectedDate = 'Tomorrow';
    } else if (this.dateService.isDayOfTheWeekFormatAdequate(selectedDate)) {
      formattedSelectedDate = selectedDate.toLocaleString('en-US', {
        weekday: 'short',
      });
    } else {
      formattedSelectedDate = this.dateService.formatDateToShort(selectedDate);
    }

    if (this.dateService.isTimeSelected(selectedDate)) {
      const selectedDateTime = selectedDate.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
      });
      formattedSelectedDate = `${formattedSelectedDate}, ${selectedDateTime}`;
    }

    if (!this.dateService.isInThisYear(selectedDate)) {
      const year = selectedDate.getFullYear();
      formattedSelectedDate = `${formattedSelectedDate} ${year}`;
    }

    return formattedSelectedDate;
  });

  constructor() {
    effect(() =>
      this.dueDateForm.controls.selectedDate.setValue(this.selectedDate()),
    );

    this.dueDateForm.controls.selectedDate.valueChanges.subscribe((val) =>
      this.selectedDate.set(val),
    );
  }

  protected getWeekdayToday(): string {
    return this.dateService.getWeekdayToday();
  }


  protected getWeekdayTomorrow(): string {
    return this.dateService.getWeekdayTomorrow();
  }

  protected getNextWeekendShortDate(): string {
    return this.dateService.getNextWeekendShortDate();
  }

  protected getTwoWeeksFromNowShortDate(): string {
    return this.dateService.getTwoWeeksFromNowShortDate();
  }

  protected getFourWeeksFromNowShortDate(): string {
    return this.dateService.getFourWeeksFromNowShortDate();
  }

  protected setSelectedDate(dateOption: DateOption | null): void {
    let selectedDate: Date | null = null;
    switch (dateOption) {
      case 'today':
        selectedDate = this.dateService.getEndOfToday();
        break;
      case 'later':
        selectedDate = this.dateService.getLater();
        break;

      case 'tomorrow':
        selectedDate = this.dateService.getEndOfTomorrow();
        break;

      case 'thisWeekend':
        selectedDate = this.dateService.getThisWeekend();
        break;

      case 'nextWeek':
        selectedDate = this.dateService.getBeginningOfNextWeek();
        break;

      case 'nextWeekend':
        selectedDate = this.dateService.getNextWeekend();
        break;

      case 'twoWeeks':
        selectedDate = this.dateService.getTwoWeeksFromNow();
        break;

      case 'fourWeeks':
        selectedDate = this.dateService.getFourWeeksFromNow();
        break;
      case 'noDate':
        selectedDate = null;
        break;
    }

    this.dueDateForm.controls.selectedDate.setValue(selectedDate);
  }

  protected onDateSelected(date: Date): void {
    const endOfDay = this.dateService.getEndOfDay(date);
    this.dueDateForm.controls.selectedDate.setValue(endOfDay);
  }
}
