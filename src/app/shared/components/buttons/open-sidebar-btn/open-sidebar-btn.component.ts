import { Component, inject } from '@angular/core';
import { SidebarService } from '@core/components/sidebar/sidebar.service';

@Component({
  selector: 'app-open-sidebar-btn',
  imports: [],
  templateUrl: './open-sidebar-btn.component.html',
  styleUrl: './open-sidebar-btn.component.css',
})
export class OpenSidebarBtnComponent {
  protected sidebarService = inject(SidebarService);

  protected openSidebar(): void {
    this.sidebarService.isAnimating.set(true);
    this.sidebarService.currentWidth.set(this.sidebarService.defaultWidth);

    setTimeout(() => {
      this.sidebarService.isAnimating.set(false);
    }, 200);
  }
}
