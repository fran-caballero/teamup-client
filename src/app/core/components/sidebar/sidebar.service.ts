import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  closedWidth = 56;
  defaultWidth = 288;
  currentWidth = signal(this.defaultWidth);
  isOpen = signal(true);
  isAnimating = signal(false);
}
