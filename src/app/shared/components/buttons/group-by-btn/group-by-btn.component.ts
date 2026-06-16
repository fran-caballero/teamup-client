import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  model,
  signal,
  ViewChild,
} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GroupByOption, GroupByOrderingOption } from '@shared/types/ui.types';

type GroupByOptionsData = Record<
  GroupByOption,
  {
    name: string;
    materialSymbolClass: string;
    materialSymbolName: string;
  }
>;

@Component({
  selector: 'app-group-by-btn',
  imports: [MatMenuModule, MatTooltipModule],
  templateUrl: './group-by-btn.component.html',
  styleUrl: './group-by-btn.component.css',
})
export class GroupByBtnComponent implements AfterViewInit {
  selectedGroupByOption = model<GroupByOption>('status');
  groupByOrderingOption = model<GroupByOrderingOption>('ascending');
  omitOptions = input<GroupByOption[] | null>();
  @ViewChild('groupByBtnText') private groupByBtnText!: ElementRef<HTMLElement>;
  protected isTooltipDisabled = signal(false);
  protected groupByOptionsData: GroupByOptionsData = {
    status: {
      name: 'Status',
      materialSymbolClass: 'dialogs',
      materialSymbolName: 'dialogs',
    },
    assignee: {
      name: 'Assignee',
      materialSymbolClass: 'person',
      materialSymbolName: 'person',
    },
    priority: {
      name: 'Priority',
      materialSymbolClass: 'flag_2',
      materialSymbolName: 'flag_2',
    },
    dueDate: {
      name: 'Due date',
      materialSymbolClass: 'event',
      materialSymbolName: 'event',
    },
  };

  ngAfterViewInit() {
    this.isTooltipDisabled.set(
      this.groupByBtnText.nativeElement.offsetWidth > 0,
    );
  }
}
