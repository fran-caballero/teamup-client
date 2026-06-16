import { NgStyle, TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { SetPriorityDropdownComponent } from '@shared/components/menus/set-priority-dropdown/set-priority-dropdown.component';
import { priorityFlagStyles } from '@shared/constants/priority-flags-styles.constants';
import { Priority } from '@shared/types/entities.types';

@Component({
  selector: 'app-set-priority-btn',
  imports: [
    NgStyle,
    TitleCasePipe,
    MatMenuModule,
    SetPriorityDropdownComponent,
  ],
  templateUrl: './set-priority-btn.component.html',
  styleUrl: './set-priority-btn.component.css',
})
export class SetPriorityBtnComponent {
  isDisabled = input<boolean>();
  btnStyles = input<Record<string, string>>();
  symbolStyles = input<Record<string, string>>();
  hasHoverOutline = input<boolean>();
  noPriorityPlaceholder = input<string>();
  taskPriority = model<Priority>(null);
  menuOpened = output();
  menuClosed = output();
  @ViewChild('setPriorityBtn') setPriorityBtn?: MatMenuTrigger;
  protected combinedBtnStyles = computed(() => {
    return {
      ...this.btnStyles(),
      backgroundColor:
        this.hovered() && !this.isDisabled()
          ? 'var(--hover-color-contrast-medium)'
          : 'transparent',
    };
  });
  protected hovered = signal<boolean>(false);

  protected get combinedSymbolStyles() {
    return {
      ...this.symbolStyles(),
      color: this.flagColor,
      'font-variation-settings': this.fontVariationSettings,
    };
  }

  private get fontVariationSettings(): string {
    if (this.taskPriority() === null) {
      return '';
    }
    return priorityFlagStyles[this.taskPriority()!].fontVariationSettings;
  }

  private get flagColor(): string {
    if (this.taskPriority() === null) {
      return 'var(--text-color-secondary)';
    }
    return `var(--${
      priorityFlagStyles[this.taskPriority()!].flagColorVariableName
    })`;
  }
}
