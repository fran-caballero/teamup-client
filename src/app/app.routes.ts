import { Routes } from '@angular/router';
import { MainLayoutComponent } from '@core/components/main-layout/main-layout.component';
import { folderExistsGuard } from '@core/guards/folder-exists.guard';
import { listExistsGuard } from '@core/guards/list-exists.guard';
import { spaceExistsGuard } from '@core/guards/space-exists.guard';
import { taskExistsGuard } from '@core/guards/task-exists.guard';
import { authGuard } from '@features/auth/auth.guard';
import { LoginComponent } from '@features/auth/login/login.component';
import { SignUpComponent } from '@features/auth/sign-up/sign-up.component';
import { HomeComponent } from '@features/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        title: 'Home | TeamUp',
        component: HomeComponent,
        canActivate: [authGuard],
      },
      {
        path: 'personal-list',
        loadComponent: () =>
          import('@features/list/list.component').then(
            ({ ListComponent }) => ListComponent,
          ),
        title: 'Personal list | TeamUp',
        data: { isStandalone: true, isPersonal: true },
        canActivate: [authGuard],
      },
      {
        path: 'personal-list/:taskIdFromRoute',
        loadComponent: () =>
          import('@features/task-full-view/task-full-view.component').then(
            ({ TaskFullViewComponent }) => TaskFullViewComponent,
          ),
        title: 'Task | TeamUp',

        canActivate: [authGuard, taskExistsGuard],
      },
      {
        path: 'people',
        loadComponent: () =>
          import('@features/people/people.component').then(
            ({ PeopleComponent }) => PeopleComponent,
          ),
        title: 'People | TeamUp',
        canActivate: [authGuard],
      },
      {
        path: 'roles-and-permissions',
        loadComponent: () =>
          import('@features/roles-and-permissions/roles-and-permissions.component').then(
            ({ RolesAndPermissionsComponent }) => RolesAndPermissionsComponent,
          ),
        title: 'Roles and Permissions | TeamUp',
        canActivate: [authGuard],
      },
      {
        path: 'roles-and-permissions/:lang',
        loadComponent: () =>
          import('@features/roles-and-permissions/roles-and-permissions.component').then(
            ({ RolesAndPermissionsComponent }) => RolesAndPermissionsComponent,
          ),
        title: 'Roles and Permissions | TeamUp',
        canActivate: [authGuard],
      },
      {
        path: 'spaces/:spaceIdFromRoute',
        loadComponent: () =>
          import('@features/space/space.component').then(
            ({ SpaceComponent }) => SpaceComponent,
          ),
        title: 'Space | TeamUp',
        canActivate: [authGuard, spaceExistsGuard],
      },
      {
        path: 'spaces/:spaceIdFromRoute/lists/:listIdFromRoute',
        loadComponent: () =>
          import('@features/list/list.component').then(
            ({ ListComponent }) => ListComponent,
          ),
        title: 'List | TeamUp',
        data: { isStandalone: true, isPersonal: false },
        canActivate: [authGuard, listExistsGuard],
      },
      {
        path: 'spaces/:spaceIdFromRoute/folders/:folderIdFromRoute',
        loadComponent: () =>
          import('@features/folder/folder.component').then(
            ({ FolderComponent }) => FolderComponent,
          ),
        title: 'Folder | TeamUp',
        canActivate: [authGuard, folderExistsGuard],
      },
      {
        path: 'spaces/:spaceIdFromRoute/folders/:inputFolderId/lists/:listIdFromRoute',
        loadComponent: () =>
          import('@features/list/list.component').then(
            ({ ListComponent }) => ListComponent,
          ),
        title: 'List | TeamUp',
        data: { isStandalone: true, isPersonal: false },
        canActivate: [authGuard, listExistsGuard],
      },
      {
        path: 'spaces/:spaceIdFromRoute/folders/:folderIdFromRoute/lists/:listIdFromRoute/tasks/:taskIdFromRoute',
        loadComponent: () =>
          import('@features/task-full-view/task-full-view.component').then(
            ({ TaskFullViewComponent }) => TaskFullViewComponent,
          ),
        title: 'Task | TeamUp',
        canActivate: [authGuard, taskExistsGuard],
      },
      {
        path: 'spaces/:spaceIdFromRoute/lists/:listIdFromRoute/tasks/:taskIdFromRoute',
        loadComponent: () =>
          import('@features/task-full-view/task-full-view.component').then(
            ({ TaskFullViewComponent }) => TaskFullViewComponent,
          ),
        title: 'Task | TeamUp',
        canActivate: [authGuard, taskExistsGuard],
      },
      {
        path: 'lists/:listIdFromRoute/tasks/:taskIdFromRoute',
        loadComponent: () =>
          import('@features/task-full-view/task-full-view.component').then(
            ({ TaskFullViewComponent }) => TaskFullViewComponent,
          ),
        title: 'Task | TeamUp',

        canActivate: [authGuard, taskExistsGuard],
      },
    ],
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign up | TeamUp',
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Log in | TeamUp',
    canActivate: [authGuard],
  },
  {
    path: '404',
    loadComponent: () =>
      import('@core/components/page-not-found/page-not-found.component').then(
        ({ PageNotFoundComponent }) => PageNotFoundComponent,
      ),
    title: 'Page not found | TeamUp',
  },
  {
    path: 'unexpected-error',
    loadComponent: () =>
      import('@core/components/unexpected-error/unexpected-error.component').then(
        ({ UnexpectedErrorComponent }) => UnexpectedErrorComponent,
      ),
    title: 'Something went wrong | TeamUp',
  },
  {
    path: '**',
    redirectTo: '404',
  },
];
