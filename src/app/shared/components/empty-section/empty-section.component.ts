import { Dialog } from '@angular/cdk/dialog';
import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { NewSectionModalComponent } from '@shared/components/modals/new-section-modal/new-section-modal.component';
import { NewSectionModalData } from '@shared/types/ui.types';

@Component({
  selector: 'app-empty-section',
  imports: [TitleCasePipe],
  templateUrl: './empty-section.component.html',
  styleUrl: './empty-section.component.css',
})
export class EmptySectionComponent {
  private dialog = inject(Dialog);
  private authorizationCheckerService = inject(AuthorizationCheckerService);
  spaceId = input<string>();
  folderId = input<string | null>();
  sectionType = input.required<'space' | 'folder'>();
  protected canCreateEntities = computed(() => {
    if (this.sectionType() === 'space') {
      return this.authorizationCheckerService.canCreateEntitiesInSpace(
        this.spaceId(),
      );
    } else {
      return this.authorizationCheckerService.canCreateListsInFolder(
        this.folderId(),
      );
    }
  });

  protected openNewListDialog() {
    const spaceId = this.spaceId();
    const folderId = this.folderId();

    if (!spaceId || (this.sectionType() === 'folder' && !folderId)) {
      return;
    }

    const modalData: NewSectionModalData = {
      sectionType: 'list',
      sectionDescription: 'A list groups a set of tasks.',
      spaceId: spaceId,
      folderId: folderId ?? null,
    };

    this.dialog.open(NewSectionModalComponent, { data: modalData });
  }
}
