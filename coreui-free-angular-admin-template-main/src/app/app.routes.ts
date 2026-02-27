import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayoutComponent),
    data: {
      title: 'Home'
    },
    
    
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes)
      },
      {
      path: 'task3',
      loadComponent: () => import('./views/task3/task3.component').then(m => m.Task3Component),
      data: { title: 'Task3' }
      },
      {
      path: 'connectivity-dashboard',
      loadComponent: () => import('./views/connectivity-dashboard/connectivity-dashboard.component')
        .then(m => m.ConnectivityDashboardComponent),
      data: { title: 'Connectivity Datas' }
      },
      {
      path: 'dashboard',
      loadComponent: () => import('./views/dashboard/dashboard.component').then(m => m.DashboardComponent),
      data: { title: 'Dashboard' }
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./views/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: 
      {
        title: 'OJT Dashboard'
      }
      },
      {
      path: 'call-sign',
      loadComponent: () =>
        import('./views/call-sign/call-sign.component')
          .then(m => m.CallSignComponent),
      data: { title: 'Call Sign' }
      },
      {
        path: 'non-gov-call-sign',
        loadComponent: () =>
          import('./views/non-gov-call-sign/non-gov-call-sign.component')
            .then(m => m.NonGovCallSignComponent),
        data: { title: "Non-Gov't Call Sign" }
      },
      {
        path: 'prs',
        loadComponent: () =>
          import('./views/prs/prs.component')
            .then(m => m.PrsComponent),
        data: { title: "Prs" }
      },
      {
        path: 'visitor-logbook',
        loadComponent: () =>
          import('./views/visitor-logbook/visitor-logbook.component')
            .then(m => m.VisitorLogbookComponent),
        data: { title: "Visitor's Logbook" }
      },
      {
        path: 'visitor-logbook2',
        loadComponent: () =>
          import('./views/visitor-logbook2/visitor-logbook2.component')
            .then(m => m.VisitorLogbook2Component),
        data: { title: "Visitor's Logbook2" }
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
      }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./views/login/login.component').then(m => m.LoginComponent),
    data: { title: 'NTC Login' }
  },
  {
    path: 'login1',                                          
    loadComponent: () =>
      import('./views/login1/login1.component').then(m => m.Login1Component),
    data: { title: 'NTC Login v2' }
  },
  {
    path: 'register',
    loadComponent: () => import('./views/pages/register/register.component').then(m => m.RegisterComponent),
    data: {
      title: 'Register Page'
    }
  },
  { path: '**', redirectTo: 'dashboard' }
];
