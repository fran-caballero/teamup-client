import { Component, computed, input, output, ViewChild } from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-entity-options-dropdown',
  imports: [MatMenuModule, MatTooltipModule],
  templateUrl: './entity-options-dropdown.component.html',
  styleUrl: './entity-options-dropdown.component.css',
})
export class EntityOptionsDropdownComponent {
  dropdownTitle = input<string>();
  includeRename = input<boolean>();
  includeDelete = input<boolean>();
  disableRename = input<boolean>(false);
  disableDelete = input<boolean>(false);
  disableRenameMessage = input<string>();
  disableDeleteMessage = input<string>();
  stopInnerClickPropagation = input<boolean>();
  startEntityRenaming = output();
  startEntityDeletion = output();
  @ViewChild('entityOptionsDropdown', { static: true })
  entityOptionsDropdown!: MatMenu;
  isEmpty = computed<boolean>(() => {
    return !this.includeRename() && !this.includeDelete();
  });
}
