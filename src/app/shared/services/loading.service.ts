import { computed, inject, Injectable, signal } from '@angular/core';
import { NotificationsService } from '@shared/services/notifications.service';
import { ResetUIState } from '@shared/types/ui.types';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private notificationsService = inject(NotificationsService);
  private loading = signal(false);
  loadingState = computed(() => this.loading());
  resetUiState = signal<ResetUIState>({ kind: 'none' });
  blockingResetState = computed(() => {
    const kind = this.resetUiState().kind;
    return (
      kind === 'demoOwnerResetActive' ||
      kind === 'demoOwnerWorkspaceResetActive'
    );
  });

  startLoading(): void {
    this.loading.set(true);
  }

  stopLoading(): void {
    if (!this.blockingResetState()) {
      this.loading.set(false);
    }
  }

  setDemoOwnerResetScheduled(scheduledFor: string): void {
    if (this.blockingResetState()) {
      return;
    }

    this.resetUiState.set({
      kind: 'demoOwnerResetScheduled',
      scheduledFor,
    });
  }

  setDemoOwnerResetActive(): void {
    this.notificationsService.clearTransientUi();
    this.resetUiState.set({ kind: 'demoOwnerResetActive' });
    this.startLoading();
  }

  setDemoOwnerWorkspaceResetActive(data: {
    workspaceId?: string;
    ownerId?: string;
    scheduledFor?: string;
  }): void {
    this.notificationsService.clearTransientUi();
    this.resetUiState.set({
      kind: 'demoOwnerWorkspaceResetActive',
      workspaceId: data.workspaceId,
      ownerId: data.ownerId,
      scheduledFor: data.scheduledFor,
    });
    this.startLoading();
  }

  clearResetState(): void {
    this.resetUiState.set({ kind: 'none' });
  }
}
