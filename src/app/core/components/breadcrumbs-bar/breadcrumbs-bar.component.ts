import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  UrlSegment,
} from '@angular/router';
import { SidebarService } from '@core/components/sidebar/sidebar.service';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { OpenSidebarBtnComponent } from '@shared/components/buttons/open-sidebar-btn/open-sidebar-btn.component';
import { ListSymbolComponent } from '@shared/components/icons/list-symbol/list-symbol.component';
import { Folder, List, Space, Task } from '@shared/types/entities.types';
import { SectionType } from '@shared/types/ui.types';
import {
  getFolderLink,
  getListLink,
  getSpaceLink,
} from '@shared/utils/link.utils';
import { getRoute } from '@shared/utils/route.utils';

@Component({
  selector: 'app-breadcrumbs-bar',
  imports: [
    RouterModule,
    NgTemplateOutlet,
    ListSymbolComponent,
    OpenSidebarBtnComponent,
  ],
  templateUrl: './breadcrumbs-bar.component.html',
  styleUrl: './breadcrumbs-bar.component.css',
})
export class BreadcrumbsBarComponent implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private workspaceService = inject(WorkspaceService);
  private sidebarService = inject(SidebarService);
  private getSpaceLink = getSpaceLink;
  private getFolderLink = getFolderLink;
  private getListLink = getListLink;
  private workspace = this.workspaceService.currentWorkspace;
  protected isSidebarClosed = computed(
    () =>
      this.sidebarService.currentWidth() === this.sidebarService.closedWidth,
  );
  protected urlSegments = signal<UrlSegment[] | undefined>(undefined);
  protected space: Signal<Space | undefined> | undefined;
  protected spaceId = signal<string | undefined>(undefined);
  protected folder: Signal<Folder | undefined> | undefined;
  protected folderId = signal<string | undefined>(undefined);
  protected list: Signal<List | undefined> | undefined;
  protected listId = signal<string | undefined>(undefined);
  protected task: Signal<Task | undefined> | undefined;
  protected taskId = signal<string | undefined>(undefined);
  protected currentSectionType: Signal<SectionType | undefined> | undefined;

  ngOnInit() {
    const routeUrlSub = getRoute(this.route, this.router).subscribe((route) =>
      this.setRoute(route),
    );

    this.destroyRef.onDestroy(() => routeUrlSub.unsubscribe());
  }

  protected getSectionOneLink(urlSection: string): string {
    if (urlSection === 'personal-list') {
      return '/personal-list';
    } else if (urlSection === 'spaces' && this.space && this.space()) {
      return this.getSpaceLink(this.space()!.id);
    }
    return '';
  }

  protected getSectionTwoLink(urlSection: string): string {
    if (
      urlSection === 'folders' &&
      this.space &&
      this.space() &&
      this.folderId()
    ) {
      return this.getFolderLink(this.space()!.id, this.folderId()!);
    } else if (
      urlSection === 'lists' &&
      this.space &&
      this.space() &&
      this.listId()
    ) {
      return this.getListLink(this.space()!.id, null, this.listId()!);
    }
    return '';
  }

  protected getSectionThreeLink(urlSection: string): string {
    if (
      urlSection === 'lists' &&
      this.space &&
      this.space() &&
      this.folderId()
    ) {
      return this.getListLink(
        this.space()!.id,
        this.folderId()!,
        this.listId()!,
      );
    }
    return '';
  }

  private setCurrentSectionType(): void {
    this.currentSectionType = computed(() => {
      const firstSegment = this.urlSegments()?.[0].path;

      if (firstSegment === 'home') {
        return 'home';
      }

      if (firstSegment === 'personal-list') {
        return this.taskId() ? 'taskInPersonalList' : 'personalList';
      }

      if (firstSegment === 'people') {
        return 'people';
      }

      if (firstSegment === 'roles-and-permissions') {
        return 'rolesAndPermissions';
      }

      if (this.spaceId()) {
        const hasFolder = this.folderId();
        const hasList = this.listId();
        const hasTask = this.taskId();

        if (hasFolder) {
          if (hasList) {
            return hasTask ? 'taskInListInFolder' : 'listInFolder';
          } else {
            return 'folder';
          }
        }
        if (hasList) {
          return hasTask ? 'taskInListInSpace' : 'listInSpace';
        }
        return 'space';
      }

      return;
    });
  }

  private setRoute(route: UrlSegment[]): void {
    this.urlSegments.set(route);
    if (route[0].path === 'spaces') {
      this.spaceId.set(route[1].path);
      this.space = computed(() =>
        this.workspace()?.spaces.find((space) => space.id === this.spaceId()),
      );

      if (route[2]) {
        if (route[2].path === 'folders') {
          this.folderId.set(route[3].path);
          this.folder = computed(() => {
            return this.space!()?.folders.find(
              (folder) => folder.id === this.folderId(),
            );
          });
          if (route[4]) {
            if (route[4].path === 'lists') {
              this.listId.set(route[5].path);
              this.list = computed(() => {
                return this.folder!()?.lists.find(
                  (list) => list.id === this.listId(),
                );
              });
            }
            if (route[6]) {
              this.taskId.set(route[7].path);
              this.task = computed(() => {
                return this.list!()?.tasks.find(
                  (task) => task.id === this.taskId(),
                );
              });
            } else {
              this.taskId.set(undefined);
            }
          } else {
            this.listId.set(undefined);
          }
        } else if (route[2].path === 'lists') {
          this.listId.set(route[3].path);

          this.list = computed(() => {
            return this.space!()?.lists.find(
              (list) => list.id === this.listId(),
            );
          });
          this.folderId.set(undefined);
          if (route[4]) {
            this.taskId.set(route[5].path);
            this.task = computed(() => {
              return this.list!()?.tasks.find(
                (task) => task.id === this.taskId(),
              );
            });
          } else {
            this.taskId.set(undefined);
          }
        }
      } else {
        this.folderId.set(undefined);
        this.listId.set(undefined);
      }
    } else if (route[0].path === 'personal-list') {
      this.list = computed(() => this.userService.user()?.personalList);
      if (route[1]) {
        this.taskId.set(route[1].path);
        this.task = computed(() => {
          return this.list!()?.tasks.find((task) => task.id === this.taskId());
        });
      } else {
        this.taskId.set(undefined);
      }
    }
    this.setCurrentSectionType();
  }
}
