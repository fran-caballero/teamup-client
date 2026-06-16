import {
  Component,
  inject,
  input,
  model,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { MembershipService } from '@core/services/authorization/membership.service';
import { UserService } from '@core/services/user.service';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';
import { Task } from '@shared/types/entities.types';

@Component({
  selector: 'app-assign-task-menu',
  imports: [MatMenu, UserAvatarComponent],
  templateUrl: './assign-task-menu.component.html',
  styleUrl: './assign-task-menu.component.css',
})
export class AssignTaskMenuComponent {
  private membershipService = inject(MembershipService);
  private userService = inject(UserService);
  task = input.required<Task | null>();
  listId = input.required<string | null>();
  newTaskAssigneesIds = model.required<string[] | null>();
  hoveredMemberId = signal<string | null>(null);
  assigneeSelection = output<string>();
  @ViewChild('assignTaskMenu', { static: true }) assignTaskMenu!: MatMenu;
  protected user = this.userService.user;
  protected workspaceMembers = this.membershipService.workspaceMembers;

  protected isMemberInList(memberId: string): boolean {
    const listId = this.listId();
    if (listId) {
      const user = this.userService.user();
      if (user?.id === memberId && user?.personalList.id === listId) {
        return true;
      }

      const effectiveMembershipsMap = this.membershipService
        .workspaceMembersMap()
        ?.get(memberId)?.effectiveMembershipsMaps;

      if (effectiveMembershipsMap) {
        return effectiveMembershipsMap.effectiveListMembershipsMap.has(listId);
      }
    }

    return false;
  }

  protected onClickAssignee(memberId: string): void {
    if (this.task()) {
      this.assigneeSelection.emit(memberId);
    } else if (this.newTaskAssigneesIds() !== null) {
      if (!this.newTaskAssigneesIds()!.includes(memberId)) {
        this.newTaskAssigneesIds.update((assigneesIds) => [
          ...assigneesIds!,
          memberId,
        ]);
      } else {
        this.newTaskAssigneesIds.update((assigneesIds) => {
          return assigneesIds!.filter((assigneeId) => assigneeId !== memberId);
        });
      }
    }
  }

  protected isMemberAssignee(memberId: string): boolean {
    if (this.task()) {
      return !!this.task()!.assignees.find((member) => member.id === memberId);
    } else if (this.newTaskAssigneesIds()) {
      return !!this.newTaskAssigneesIds()!.find(
        (assigneeId) => assigneeId === memberId,
      );
    }
    return false;
  }
}
