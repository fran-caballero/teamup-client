import { formatDate } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ListService } from '@core/services/list.service';
import { UserService } from '@core/services/user.service';
import { MyWorkComponent } from '@features/home/my-work/my-work.component';
import { ListComponent } from '@features/list/list.component';
import { TaskGroupingService } from '@shared/services/task-grouping.service';
import { GroupByOption, GroupByOrderingOption } from '@shared/types/ui.types';

type PartOfTheDay = 'morning' | 'afternoon' | 'evening' | 'night';

@Component({
  selector: 'app-home',
  imports: [RouterModule, MyWorkComponent, ListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private userService = inject(UserService);
  private listService = inject(ListService);
  private taskGroupingService = inject(TaskGroupingService);
  protected currentTime!: string;
  protected partOfTheDay!: PartOfTheDay;
  protected user = this.userService.user;
  protected username = computed(() => this.user()?.username);
  protected assignedToList = this.listService.assignedToMeList;
  protected selectedGroupByOption = signal<GroupByOption>('status');
  protected groupByOrderingOption = signal<GroupByOrderingOption>('ascending');
  protected showClosedTasks = signal<boolean>(false);
  protected assignedToMeTaskGroups = computed(() => {
    switch (this.selectedGroupByOption()) {
      case 'status': {
        const taskGroups =
          this.taskGroupingService.groupAssignedToMeTasksByStatus(
            this.showClosedTasks(),
          );

        return this.taskGroupingService.orderTaskGroups(
          taskGroups,
          this.groupByOrderingOption(),
        );
      }

      case 'priority': {
        const taskGroups =
          this.taskGroupingService.groupAssignedToMeTasksByPriority(
            this.showClosedTasks(),
          );

        return this.taskGroupingService.orderTaskGroups(
          taskGroups,
          this.groupByOrderingOption(),
        );
      }

      case 'dueDate': {
        const taskGroups =
          this.taskGroupingService.groupAssignedToMeTasksByDueDate(
            this.showClosedTasks(),
          );

        return this.taskGroupingService.orderTaskGroups(
          taskGroups,
          this.groupByOrderingOption(),
        );
      }

      case 'assignee':
        return;
    }
  });

  ngOnInit() {
    this.currentTime = formatDate(new Date(), 'HH', 'en');
    this.partOfTheDay = this.getPartOfTheDay(+this.currentTime);
  }

  private getPartOfTheDay(currentTime: number): PartOfTheDay {
    if (currentTime < 12) {
      return 'morning';
    } else if (currentTime < 18) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  }
}
