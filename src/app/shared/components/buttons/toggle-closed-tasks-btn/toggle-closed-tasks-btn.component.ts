import { Component, model } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-toggle-closed-tasks-btn',
  imports: [MatTooltipModule],
  templateUrl: './toggle-closed-tasks-btn.component.html',
  styleUrl: './toggle-closed-tasks-btn.component.css',
})
export class ToggleClosedTasksBtnComponent {
  showClosedTasks = model<boolean>(false);

  protected onClick() {
    this.showClosedTasks.update((value) => !value);
  }
}
