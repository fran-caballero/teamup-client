import {
  Component,
  computed,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { PermissionsEditorMenuService } from '@shared/components/menus/permissions-editor-menu/permissions-editor-menu.service';
import { SelectRoleBtnComponent } from '@shared/components/menus/permissions-editor-menu/select-role-btn/select-role-btn.component';
import { TrimNamePipe } from '@shared/pipes/trim-name.pipe';
import { TopLevelRole } from '@shared/types/entities.types';
import { DisabledRoleButtons } from '@shared/types/ui.types';

import { EditSpacePermissionsBtnComponent } from './edit-space-permissions-btn/edit-space-permissions-btn.component';

@Component({
  selector: 'app-permissions-editor-menu',
  standalone: true,
  imports: [
    MatMenuModule,
    MatTooltipModule,
    TrimNamePipe,
    SelectRoleBtnComponent,
    EditSpacePermissionsBtnComponent,
  ],
  templateUrl: './permissions-editor-menu.component.html',
  styleUrl: './permissions-editor-menu.component.css',
})
export class PermissionsEditorMenuComponent {
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  private workspaceService = inject(WorkspaceService);
  private permissionsEditorMenuService = inject(PermissionsEditorMenuService);
  workspaceMemberId = input.required<string>();
  isUserMember = input.required<boolean>();
  @ViewChild('permissionsEditorMenu', { static: true })
  permissionsEditorMenu!: MatMenu;
  protected workspace = this.workspaceService.currentWorkspace;
  protected isWorkspaceChecked = signal<boolean>(
    !!this.permissionsEditorMenuService.selectedMembershipsData()
      .workspaceMembershipData || false,
  );
  protected workspaceRole = computed<TopLevelRole | undefined>(
    () =>
      this.permissionsEditorMenuService.selectedMembershipsData()
        .workspaceMembershipData?.role,
  );

  protected onClickClearPermissions() {
    this.permissionsEditorMenuService.clearPermissions();
    this.isWorkspaceChecked.set(false);
  }

  protected toggleWorkspaceChecked(): void {
    this.isWorkspaceChecked.update((isChecked) => !isChecked);
    if (!this.isWorkspaceChecked()) {
      this.permissionsEditorMenuService.deleteWorkspaceMembership();
    }
  }

  protected canEditWorkspacePermissions(): boolean {
    const workspaceId = this.workspaceService.currentWorkspace()?.id;

    return this.authorizationCheckerService.canEditWorkspacePermissions(
      workspaceId,
      this.workspaceMemberId(),
    );
  }

  protected getAllowedAssignableWorkspaceRoles(): TopLevelRole[] {
    return this.authorizationCheckerService.getAllowedAssignableWorkspaceRoles();
  }

  protected onSelectRole(role: TopLevelRole | undefined): void {
    this.permissionsEditorMenuService.updateWorkspaceMembership(role!);
  }

  protected getDisabledRoleButtons(): DisabledRoleButtons {
    return {
      super_admin: false,
      admin: false,
      member: false,
      guest: false,
    };
  }

  protected canEditSpacePermissions(spaceId: string): boolean {
    return this.authorizationCheckerService.canEditSpacePermissions(
      spaceId,
      this.workspaceMemberId(),
    );
  }

  protected getAllowedAssignableSpaceRoles(spaceId: string): TopLevelRole[] {
    return this.authorizationCheckerService.getAllowedAssignableSpaceRoles(
      spaceId,
    );
  }
}
