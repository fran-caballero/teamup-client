import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FolderService } from '@core/services/folder.service';
import { ListService } from '@core/services/list.service';
import { SpaceService } from '@core/services/space.service';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { LoadingService } from '@shared/services/loading.service';
import { TaskAncestorsIds } from '@shared/types/common.types';
import { DeleteWarningModalData } from '@shared/types/ui.types';
import {
  getFolderLink,
  getListLink,
  getSpaceLink,
} from '@shared/utils/link.utils';
import { EMPTY, finalize, switchMap } from 'rxjs';

@Component({
  selector: 'app-delete-warning-modal',
  imports: [],
  templateUrl: './delete-warning-modal.component.html',
  styleUrl: './delete-warning-modal.component.css',
})
export class DeleteWarningModalComponent {
  private router = inject(Router);
  private dialogRef = inject(DialogRef);
  private modalData = inject<DeleteWarningModalData>(DIALOG_DATA);
  private loadingService = inject(LoadingService);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private spaceService = inject(SpaceService);
  private folderService = inject(FolderService);
  private listService = inject(ListService);
  private taskService = inject(TaskService);
  private getSpaceLink = getSpaceLink;
  private getFolderLink = getFolderLink;
  private getListLink = getListLink;
  protected elementName = this.modalData.elementName;
  protected elementType = this.modalData.elementType;

  protected onClickClose(): void {
    this.dialogRef.close();
  }

  protected onClickDelete(): void {
    this.dialogRef.close();

    switch (this.modalData.elementType) {
      case 'workspace':
        this.loadingService.startLoading();
        this.workspaceService
          .deleteWorkspace(this.modalData.workspaceId!)
          .pipe(
            switchMap(() => {
              const user = this.userService.user();

              if (user) {
                const fallbackWorkspaceId =
                  this.userService.getFallbackWorkspaceId(user);
                return this.workspaceService.getWorkspace(fallbackWorkspaceId);
              }

              return EMPTY;
            }),
            finalize(() => {
              this.loadingService.stopLoading();
            }),
          )
          .subscribe();
        break;

      case 'space':
        this.spaceService.deleteSpace(this.modalData.spaceId!).subscribe();

        if (this.isEntityInCurrentRoute(this.modalData.spaceId!)) {
          this.router.navigate(['/home']);
        }
        break;

      case 'folder':
        this.folderService
          .deleteFolder(this.modalData.spaceId!, this.modalData.folderId!)
          .subscribe();

        if (this.isEntityInCurrentRoute(this.modalData.folderId!)) {
          const parentSpaceRoute = this.getSpaceLink(this.modalData.spaceId!);
          this.router.navigate([parentSpaceRoute]);
        }
        break;

      case 'list':
        this.listService
          .deleteList(
            this.modalData.spaceId!,
            this.modalData.listId!,
            this.modalData.folderId,
          )
          .subscribe();

        if (this.isEntityInCurrentRoute(this.modalData.listId!)) {
          let parentEntityRoute: string;

          if (this.modalData.folderId) {
            parentEntityRoute = this.getFolderLink(
              this.modalData.spaceId!,
              this.modalData.folderId,
            );
          } else {
            parentEntityRoute = this.getSpaceLink(this.modalData.spaceId!);
          }

          this.router.navigate([parentEntityRoute]);
        }
        break;

      case 'status':
        this.listService.deleteStatus(
          this.modalData.spaceId!,
          this.modalData.folderId,
          this.modalData.listId!,
          this.modalData.statusId!,
        );
        break;

      case 'task': {
        const taskAncestorsIds: TaskAncestorsIds = {
          spaceId: this.modalData.spaceId,
          folderId: this.modalData.folderId,
          listId: this.modalData.listId!,
        };
        this.taskService.deleteTask(taskAncestorsIds, this.modalData.taskId!);

        if (this.isEntityInCurrentRoute(this.modalData.taskId!)) {
          const parentListRoute = this.getListLink(
            this.modalData.spaceId!,
            this.modalData.folderId,
            this.modalData.listId!,
          );

          this.router.navigate([parentListRoute]);
        }
        break;
      }
    }
  }

  private isEntityInCurrentRoute(entityId: string): boolean {
    const urlTree = this.router.parseUrl(this.router.url);
    const segments = urlTree.root.children['primary']?.segments;

    if (!segments) {
      return false;
    }

    return segments.some((segment) => segment.path === entityId);
  }
}
