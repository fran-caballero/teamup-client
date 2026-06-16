import {
  animate,
  AnimationEvent,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CdkDragMove, DragDropModule } from '@angular/cdk/drag-drop';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Injector,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  UrlSegment,
} from '@angular/router';
import { SidebarService } from '@core/components/sidebar/sidebar.service';
import { WorkspaceButtonComponent } from '@core/components/sidebar/workspace-btn/workspace-btn.component';
import { AuthorizationCheckerService } from '@core/services/authorization/authorization-checker.service';
import { SpaceService } from '@core/services/space.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { SpaceBtnComponent } from '@shared/components/buttons/space-btn/space-btn.component';
import { getRoute } from '@shared/utils/route.utils';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  imports: [
    DragDropModule,
    OverlayModule,
    ReactiveFormsModule,
    RouterModule,
    SpaceBtnComponent,
    WorkspaceButtonComponent,
  ],
  animations: [
    trigger('spacesSidebarAnimation', [
      state(
        'closed',
        style({
          width: '0px',
          paddingLeft: '0px',
          paddingRight: '0px',
          borderWidth: '0px',
        }),
      ),
      state(
        'open',
        style({
          width: '255px',
          paddingLeft: '*',
          paddingRight: '*',
          borderWidth: '*',
        }),
      ),
      transition('closed <=> open', animate('0.2s ease-in-out')),
      transition(':enter', [
        style({ width: '0px' }),
        animate('0.2s ease-in-out'),
      ]),
    ]),
  ],
})
export class SidebarComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private workspaceService = inject(WorkspaceService);
  private authorizationService = inject(AuthorizationCheckerService);
  private sidebarService = inject(SidebarService);
  private spaceService = inject(SpaceService);
  private resizeObserver = new ResizeObserver((entries) => {
    this.mainSidebarHeight.set(entries[0].contentRect.height);
  });
  private injector = inject(Injector);
  @ViewChild('subMenuOrigin', { static: true })
  private subMenuOrigin!: CdkOverlayOrigin;
  @ViewChild('mainSidebarSpaceFormInput')
  private mainSidebarSpaceFormInput?: ElementRef;
  @ViewChild('overlaySidebarSpaceFormInput')
  private overlaySidebarSpaceFormInput?: ElementRef;
  protected workspace = this.workspaceService.currentWorkspace;
  protected isNewSpaceBeingCreated = signal(false);
  protected newSpaceForm = new FormGroup({
    spaceName: new FormControl(''),
  });
  protected currentLocation = signal<
    'home' | 'personalList' | 'people' | 'other'
  >('other');
  protected isSpacesSidebarOpen = signal(false);
  protected spacesSidebarAnimationState = signal<'open' | 'closed'>('closed');
  protected currentWidth = this.sidebarService.currentWidth;
  protected defaultWidth = this.sidebarService.defaultWidth;
  protected isAnimating = this.sidebarService.isAnimating;
  protected mainSidebarHeight = signal<number>(0);
  protected canCreateSpace = computed(() => {
    const workspaceId = this.workspace()?.id;

    return this.authorizationService.canCreateSpace(workspaceId);
  });

  ngOnInit() {
    if (window.innerWidth < 768) {
      this.sidebarService.currentWidth.set(this.sidebarService.closedWidth);
    }

    const mainSidebar: HTMLElement =
      this.subMenuOrigin.elementRef.nativeElement;
    this.resizeObserver.observe(mainSidebar);

    const setLocationSub = getRoute(this.route, this.router).subscribe(
      (route) => this.setLocation(route),
    );
    this.destroyRef.onDestroy(() => setLocationSub.unsubscribe());
  }

  protected createSpace(): void {
    if (
      this.newSpaceForm.controls.spaceName.value &&
      this.newSpaceForm.controls.spaceName.value !== ''
    ) {
      this.spaceService.createSpace(this.newSpaceForm.controls.spaceName.value);
    }

    this.newSpaceForm.controls.spaceName.reset();
    this.isNewSpaceBeingCreated.set(false);
  }

  protected onDragMoved(event: CdkDragMove): void {
    let position = event.pointerPosition.x;

    if (position < 200) {
      position = this.sidebarService.closedWidth;
    } else if (position > 369) {
      position = 369;
    }

    this.sidebarService.currentWidth.set(position);
    this.isSpacesSidebarOpen.set(false);

    const element = event.source.element.nativeElement;
    element.style.transform = 'none';
  }

  protected closeSidebar(): void {
    this.sidebarService.isAnimating.set(true);
    this.sidebarService.currentWidth.set(this.sidebarService.closedWidth);

    setTimeout(() => {
      this.sidebarService.isAnimating.set(false);
    }, 200);
  }

  protected showMainSidebarNewSpaceForm() {
    this.isNewSpaceBeingCreated.set(true);
    afterNextRender(
      () => {
        this.mainSidebarSpaceFormInput?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected updateSpacesSidebarState(): void {
    if (this.spacesSidebarAnimationState() === 'closed') {
      this.isSpacesSidebarOpen.set(true);
      this.spacesSidebarAnimationState.set('open');
    } else {
      this.spacesSidebarAnimationState.set('closed');
    }
  }

  protected onSpacesSidebarAnimationDone(event: AnimationEvent): void {
    if (event.toState === 'closed') {
      this.isSpacesSidebarOpen.set(false);
    }
  }

  protected showOverlaySidebarNewSpaceForm() {
    this.isNewSpaceBeingCreated.set(true);
    afterNextRender(
      () => {
        this.overlaySidebarSpaceFormInput?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  private setLocation(route: UrlSegment[]): void {
    if (route[0]) {
      const firstSegmentPath = route[0].path;
      if (firstSegmentPath === 'home') {
        this.currentLocation.set('home');
      } else if (firstSegmentPath === 'personal-list') {
        this.currentLocation.set('personalList');
      } else if (firstSegmentPath === 'people') {
        this.currentLocation.set('people');
      } else {
        this.currentLocation.set('other');
      }
    }
  }

  @HostListener('window:resize')
  protected onResize(): void {
    if (window.innerWidth < 768) {
      this.closeSidebar();
    }
  }
}
