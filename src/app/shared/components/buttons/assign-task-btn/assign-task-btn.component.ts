import { NgStyle } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MembershipService } from '@core/services/authorization/membership.service';
import { AssignTaskMenuComponent } from '@shared/components/menus/assign-task-menu/assign-task-menu.component';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { Task } from '@shared/types/entities.types';

@Component({
  selector: 'app-assign-task-btn',
  imports: [
    NgStyle,
    MatMenuModule,
    AssignTaskMenuComponent,
    UserAvatarComponent,
  ],
  templateUrl: './assign-task-btn.component.html',
  styleUrl: './assign-task-btn.component.css',
})
export class AssignTaskBtnComponent {
  private membershipService = inject(MembershipService);
  isDisabled = input<boolean>();
  task = input.required<Task | null>();
  listId = input.required<string | null>();
  btnStyles = input<Record<string, string>>();
  symbolStyles = input<Record<string, string>>();
  avatarStyles = input<Record<string, string>>();
  hasHoverOutline = input<boolean>();
  newTaskAssigneesIds = model.required<string[] | null>();
  assigneeSelection = output<string>();
  menuOpened = output();
  menuClosed = output();
  @ViewChild('assignTaskBtn') assignTaskBtn?: MatMenuTrigger;
  protected hovered = signal<boolean>(false);
  protected combinedBtnStyles = computed(() => {
    return {
      ...this.btnStyles(),
      backgroundColor:
        this.hovered() && !this.isDisabled()
          ? 'var(--hover-color-contrast-medium)'
          : 'transparent',
    };
  });

  protected getMemberUsernameById(userId: string): string | undefined {
    return this.membershipService.getMemberUsernameById(userId);
  }
}
