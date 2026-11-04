import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/link-tree/link-tree').then((m) => m.LinkTree),
  },
  {
    path: 'link-tree',
    loadComponent: () =>
      import('./pages/link-tree/link-tree').then((m) => m.LinkTree),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
