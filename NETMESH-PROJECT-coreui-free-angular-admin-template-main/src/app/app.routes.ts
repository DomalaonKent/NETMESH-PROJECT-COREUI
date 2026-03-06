import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login1',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayoutComponent),
    data: { title: 'Home' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./views/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'validation-page',
        loadComponent: () =>
          import('./views/validation-page/validation-page.component')
            .then(m => m.ValidationPageComponent),
        data: { title: 'Validation Data' }
      },
      {
        path: 'igf',
        loadComponent: () =>
          import('./views/Internet Gateway Framework/InternetGF.component')
            .then(m => m.InternetGFComponent),
        data: { title: 'Internet Gateway Framework' }
      },
      {
        path: 'core-backbone',
        loadComponent: () =>
          import('./views/Core-Backbone/core-backbone.component')
            .then(m => m.CoreBackboneComponent),
        data: { title: 'Core / Backbone' }
      },
      {
        path: 'middle-mile',
        loadComponent: () =>
          import('./views/Middle Mile/middlemile.component')
            .then(m => m.MiddleMileComponent),
        data: { title: 'Middle Mile' }
      },
      {
        path: 'last-mile',
        loadComponent: () =>
          import('./views/Last Mile/lastmile.component')
            .then(m => m.LastMileComponent),
        data: { title: 'Last Mile' }
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./views/settings page/settings-page.component')
            .then(m => m.SettingsPageComponent),
        data: { title: 'Settings' }
      },
      {
        path: 'theme',
        loadChildren: () => import('./views/theme/routes').then((m) => m.routes)
      },
      {
        path: 'base',
        loadChildren: () => import('./views/base/routes').then((m) => m.routes)
      },
      {
        path: 'buttons',
        loadChildren: () => import('./views/buttons/routes').then((m) => m.routes)
      },
      {
        path: 'forms',
        loadChildren: () => import('./views/forms/routes').then((m) => m.routes)
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/icons/routes').then((m) => m.routes)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./views/notifications/routes').then((m) => m.routes)
      },
      {
        path: 'widgets',
        loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/charts/routes').then((m) => m.routes)
      },
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes)
      },
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: { title: 'Page 404' }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: { title: 'Page 500' }
  },
  {
    path: 'login1',
    loadComponent: () =>
      import('./views/login1/login1.component').then(m => m.Login1Component),
    data: { title: 'NTC Login' }
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./views/pages/register/register.component').then(m => m.RegisterComponent),
    data: { title: 'Register Page' }
  },
  { path: '**', redirectTo: 'login1' }
];