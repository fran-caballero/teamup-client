import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbsBarComponent } from '@core/components/breadcrumbs-bar/breadcrumbs-bar.component';
import { SidebarComponent } from '@core/components/sidebar/sidebar.component';
import { SiteHeaderComponent } from '@core/components/site-header/site-header.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterModule,
    BreadcrumbsBarComponent,
    SidebarComponent,
    SiteHeaderComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {}
