import { Component, output, ViewChild } from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { Priority } from '@shared/types/entities.types';

@Component({
  selector: 'app-set-priority-dropdown',
  imports: [MatMenuModule],
  templateUrl: './set-priority-dropdown.component.html',
  styleUrl: './set-priority-dropdown.component.css',
})
export class SetPriorityDropdownComponent {
  prioritySelection = output<Priority>();
  @ViewChild('setPriorityDropdown', { static: true })
  setPriorityDropdown!: MatMenu;
}
