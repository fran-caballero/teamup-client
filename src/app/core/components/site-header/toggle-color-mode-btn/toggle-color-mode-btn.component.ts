import {
  AfterViewInit,
  Component,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import { ColorThemeService } from '@core/services/color-theme.service';

@Component({
  selector: 'app-toggle-color-mode-btn',
  templateUrl: './toggle-color-mode-btn.component.html',
  styleUrl: './toggle-color-mode-btn.component.css',
})
export class ToggleColorModeBtnComponent implements AfterViewInit {
  private renderer = inject(Renderer2);
  private colorThemeService = inject(ColorThemeService);
  protected currentColorTheme = this.colorThemeService.currentColorTheme;
  protected isTransitionEnabled = signal(false);

  ngAfterViewInit() {
    setTimeout(() => this.isTransitionEnabled.set(true), 0);
  }

  protected onClickToggle(btnMode: 'light' | 'dark'): void {
    if (btnMode !== this.currentColorTheme()) {
      this.colorThemeService.toggleColorTheme(this.renderer);
    }
  }
}
