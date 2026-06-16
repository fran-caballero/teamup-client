import { NgClass } from '@angular/common';
import { Component, input, output, ViewChild } from '@angular/core';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-toggle-options-dropdown-btn',
  imports: [NgClass, MatMenuModule],
  templateUrl: './toggle-options-dropdown-btn.component.html',
  styleUrl: './toggle-options-dropdown-btn.component.css',
})
export class ToggleOptionsDropdownBtnComponent {
  dropdownMenu = input.required<MatMenu | null>();
  hoverColorContrast = input.required<'medium' | 'ultra-high'>();
  isMenuOpen = output<boolean>();
  @ViewChild('menuTriggerBtn', { static: true })
  menuTriggerBtn!: MatMenuTrigger;
}
