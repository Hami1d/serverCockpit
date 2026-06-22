import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'apps',
    loadComponent: () => import('./apps-component/apps-component').then((m) => m.AppsComponent),
  },
  {
    path: 'discovery',
    loadComponent: () => import('./discovery/discovery').then((m) => m.Discovery),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
