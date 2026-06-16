import { NgStyle } from '@angular/common';
import { Component, inject, model, ViewChild } from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { ColorThemeService } from '@core/services/color-theme.service';
import { defaultStatusColors } from '@shared/constants/status-colors.constants';
import { StatusColor } from '@shared/types/ui.types';

@Component({
  selector: 'app-color-picker-menu',
  imports: [NgStyle, MatMenuModule],
  templateUrl: './color-picker-menu.component.html',
  styleUrl: './color-picker-menu.component.css',
})
export class ColorPickerMenuComponent {
  private colorThemeService = inject(ColorThemeService);
  selectedDefaultColor = model<StatusColor | null>();
  @ViewChild('colorPickerMenu', { static: true }) colorPickerMenu!: MatMenu;
  protected colorsArray = defaultStatusColors;
  protected currentColorTheme = this.colorThemeService.currentColorTheme;
  colorPickerPanel!: HTMLElement;
  newStatusNameInputWrapper!: HTMLElement;

  protected onColorSelection($index: number): void {
    const selectedColor = this.colorsArray[$index];
    this.selectedDefaultColor.set(selectedColor);
  }
}
