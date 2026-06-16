import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { SpaceBtnComponent } from '@shared/components/buttons/space-btn/space-btn.component';
import { ListAncestorsIds } from '@shared/types/common.types';
import { List, Status } from '@shared/types/entities.types';

@Component({
  selector: 'app-path-selector-dropdown',
  imports: [MatMenuModule, SpaceBtnComponent],
  templateUrl: './path-selector-dropdown.component.html',
  styleUrl: './path-selector-dropdown.component.css',
})
export class PathSelectorDropdownComponent {
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  columnStatus = input<Status>();
  listSelection = output<{
    selectedList: List;
    listAncestorsIds: ListAncestorsIds;
  }>();
  @ViewChild('pathSelectorDropdown', { static: true })
  pathSelectorDropdown!: MatMenu;
  protected personalList = computed(
    () => this.userService.user()?.personalList,
  );
  protected user = this.userService.user;
  protected workspace = this.workspaceService.currentWorkspace;
  selectedList = signal<List | undefined>(this.personalList());
}
