import { Component, input, model, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { RoleFormatterPipe } from '@shared/pipes/role-formatter.pipe';
import { SubsectionRole, TopLevelRole } from '@shared/types/entities.types';
import { DisabledRoleButtons } from '@shared/types/ui.types';

@Component({
  selector: 'app-select-role-btn',
  imports: [MatMenuModule, RoleFormatterPipe],
  templateUrl: './select-role-btn.component.html',
  styleUrl: './select-role-btn.component.css',
})
export class SelectRoleBtnComponent {
  isDisabled = input<boolean>();
  disabledRoleButtons = input.required<DisabledRoleButtons>();
  btnType = input.required<'topLevel' | 'subsection'>();
  isInherited = input.required<boolean | undefined>();
  allowedAssignableRoles = input.required<TopLevelRole[]>();
  selectedRole = model<TopLevelRole | SubsectionRole | undefined>(undefined);
  @ViewChild('selectRoleDropdownTrigger', { static: true })
  private selectRoleDropdownTrigger!: MatMenuTrigger;

  protected onSelectRole(role: TopLevelRole, event: MouseEvent): void {
    event.stopPropagation();
    this.selectRoleDropdownTrigger.closeMenu();
    this.selectedRole.set(role);
  }
}
