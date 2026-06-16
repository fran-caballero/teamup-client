import { Injectable } from '@angular/core';
import { DayOfTheWeek } from '@shared/types/common.types';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  daysOfTheWeek: DayOfTheWeek[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  formatDateToShort(date: Date): string {
    const day = date.toLocaleString('en-US', { day: 'numeric' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  }

  getEndOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() + 1);
    result.setMilliseconds(-1);
    return result;
  }

  getEndOfWeek(date: Date): Date {
    const result = new Date(date);
    const dayOfTheWeek = result.getDay();
    const daysUntilNextSunday = 7 - dayOfTheWeek;
    result.setDate(result.getDate() + daysUntilNextSunday - 1);
    result.setMilliseconds(-1);
    return this.getEndOfDay(result);
  }

  getYesterday(): Date {
    const result = new Date();
    result.setDate(result.getDate() - 1);
    return this.getEndOfDay(result);
  }

  getEndOfToday(): Date {
    const currentDate = new Date();
    return this.getEndOfDay(currentDate);
  }

  getLater(): Date {
    const result = new Date();
    if (result.getHours() >= 22) {
      return this.getEndOfDay(result);
    }
    result.setHours(result.getHours() + 2);
    return result;
  }

  getEndOfTomorrow(): Date {
    const result = new Date();
    result.setDate(result.getDate() + 1);
    return this.getEndOfDay(result);
  }

  getThisWeekend(): Date {
    const today = new Date();
    return this.getEndOfWeek(today);
  }

  getBeginningOfNextWeek(): Date {
    const result = new Date();
    const dayOfTheWeek = result.getDay();
    const daysUntilNextTuesday = dayOfTheWeek === 0 ? 2 : 8 - dayOfTheWeek;
    result.setDate(result.getDate() + daysUntilNextTuesday);
    return this.getEndOfDay(result);
  }

  getNextWeekend(): Date {
    const beginningOfNextWeek = this.getBeginningOfNextWeek();
    return this.getEndOfWeek(beginningOfNextWeek);
  }

  getTwoWeeksFromNow(): Date {
    const result = new Date();
    result.setDate(result.getDate() + 14);
    return this.getEndOfDay(result);
  }

  getFourWeeksFromNow(): Date {
    const result = new Date();
    result.setDate(result.getDate() + 28);
    return this.getEndOfDay(result);
  }

  getWeekdayToday(): string {
    return new Date().toLocaleString('en-US', { weekday: 'short' });
  }

  getTimeString(date: Date): string {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  getLaterTime(): string {
    const later = this.getLater();
    return this.getTimeString(later);
  }

  getWeekdayTomorrow(): string {
    const tomorrow = this.getEndOfTomorrow();
    return tomorrow.toLocaleString('en-US', { weekday: 'short' });
  }

  getNextWeekendShortDate(): string {
    const nextWeekend = this.getNextWeekend();
    return this.formatDateToShort(nextWeekend);
  }

  getTwoWeeksFromNowShortDate(): string {
    const twoWeeksFromNow = this.getTwoWeeksFromNow();
    return this.formatDateToShort(twoWeeksFromNow);
  }

  getFourWeeksFromNowShortDate(): string {
    const fourWeeksFromNow = this.getFourWeeksFromNow();
    return this.formatDateToShort(fourWeeksFromNow);
  }

  getDaysToNextDayOfTheWeek(dayOfTheWeek: DayOfTheWeek): number {
    const dateToCompare = new Date();
    const dayOfTheWeekNumber = this.daysOfTheWeek.indexOf(dayOfTheWeek);

    let daysToDay = 0;
    while (dateToCompare.getDay() !== dayOfTheWeekNumber) {
      dateToCompare.setDate(dateToCompare.getDate() + 1);
      ++daysToDay;
    }

    return daysToDay;
  }

  isDateOverdue(date: Date): boolean {
    const now = new Date();
    return date <= now;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isTimeSelected(date: Date): boolean {
    return (
      date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }) !== '23:59:59'
    );
  }

  isInThisYear(date: Date): boolean {
    const today = new Date();
    return date.getFullYear() === today.getFullYear();
  }

  isTomorrow(date: Date): boolean {
    const today = new Date();
    const tomorrow = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    return (
      date.getFullYear() === tomorrow.getFullYear() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getDate() === tomorrow.getDate()
    );
  }

  isDayOfTheWeekFormatAdequate(date: Date): boolean {
    const today = new Date();
    const dayAfterTomorrow = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 2,
    );
    const sixDaysFromToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 6,
    );

    return (
      !this.isDateOverdue(date) &&
      date >= dayAfterTomorrow &&
      date <= sixDaysFromToday
    );
  }
}
