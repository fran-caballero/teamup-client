import { NgClass, NgStyle } from '@angular/common';
import { Component, computed, inject, input, model } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { ColorThemeService } from '@core/services/color-theme.service';
import { ListService } from '@core/services/list.service';
import { defaultStatusColors } from '@shared/constants/status-colors.constants';
import { Status } from '@shared/types/entities.types';

@Component({
  selector: 'app-toggle-status-btn',
  imports: [NgClass, NgStyle, MatMenuModule],
  templateUrl: './toggle-status-btn.component.html',
  styleUrl: './toggle-status-btn.component.css',
})
export class ToggleStatusBtnComponent {
  private colorThemeService = inject(ColorThemeService);
  private listService = inject(ListService);
  private currentColorTheme = this.colorThemeService.currentColorTheme;
  isEnabled = input.required<boolean>();
  hoverColorContrast = input.required<'medium' | 'high'>();
  status = model.required<Status | undefined>();
  protected statusColor = computed(() => {
    const status = this.status()!;
    if (this.isEnabled()) {
      return status!.defaultColorId
        ? this.listService.getDefaultColor(status!.defaultColorId!)![
            this.currentColorTheme()!
          ]
        : status!.colorHex;
    }
    return defaultStatusColors.find(
      (color) => color.id === status?.defaultColorId,
    )![this.currentColorTheme()!];
  });
}
