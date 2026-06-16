import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { WorkspaceService } from '@core/services/workspace.service';

@Component({
  selector: 'app-new-workspace-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './new-workspace-modal.component.html',
  styleUrl: './new-workspace-modal.component.css',
})
export class NewWorkspaceModalComponent {
  private workspaceService = inject(WorkspaceService);
  private dialogRef = inject(DialogRef);
  protected newWorkspaceForm = new FormGroup({
    workspaceName: new FormControl('', { validators: [Validators.required] }),
  });

  protected onSubmit(): void {
    const newWorkspaceName = this.newWorkspaceForm.controls.workspaceName.value;

    if (newWorkspaceName && newWorkspaceName !== '') {
      this.workspaceService.createWorkspace(newWorkspaceName).subscribe({
        next: () => {
          this.dialogRef.close();
        },
      });
    }
  }

  protected onClickBack(): void {
    this.dialogRef.close();
  }
}
