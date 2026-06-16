import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trimName',
  standalone: true,
})
export class TrimNamePipe implements PipeTransform {
  transform(name: string, maxLength: number): string {
    return name.length <= maxLength
      ? name
      : name.substring(0, maxLength - 1) + '...';
  }
}
