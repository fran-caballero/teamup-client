import { NgStyle } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  output,
  ViewChild,
} from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { ColorThemeService } from '@core/services/color-theme.service';
import { ListService } from '@core/services/list.service';
import { Status } from '@shared/types/entities.types';
import { StatusColor } from '@shared/types/ui.types';

@Component({
  selector: 'app-toggle-status-dropdown',
  imports: [NgStyle, MatMenuModule],
  templateUrl: './toggle-status-dropdown.component.html',
  styleUrl: './toggle-status-dropdown.component.css',
})
export class ToggleStatusDropdownComponent {
  private listService = inject(ListService);
  private colorThemeService = inject(ColorThemeService);
  listStatuses = input.required<Status[] | undefined>();
  statusSelection = output<Status>();
  @ViewChild('toggleStatusDropdown', { static: true })
  toggleStatusDropdown!: MatMenu;
  protected statusesGroupsByType = computed(() => {
    if (this.listStatuses()) {
      const notStartedStatuses: Status[] = [];

      const activeStatuses: Status[] = [];

      const doneStatuses: Status[] = [];

      this.listStatuses()!.forEach((status) => {
        switch (status.type) {
          case 'not_started':
            notStartedStatuses.push(status);
            break;
          case 'active':
            activeStatuses.push(status);
            break;
          case 'done':
            doneStatuses.push(status);
            break;
        }
      });

      return {
        notStartedStatuses,
        activeStatuses,
        doneStatuses,
      };
    }
    return;
  });
  protected currentColorTheme = this.colorThemeService.currentColorTheme;

  protected getDefaultColor(defaultColorId: number): StatusColor | undefined {
    return this.listService.getDefaultColor(defaultColorId);
  }
}
