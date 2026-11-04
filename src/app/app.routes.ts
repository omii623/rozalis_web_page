import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'ROZALIS ékszer',
    loadComponent: () => import('./pages/link-tree/link-tree').then((m) => m.LinkTree),
  },
  { path: 'link-tree', redirectTo: '', pathMatch: 'full' },
  {
    path: '**',
    title: 'Az oldal nem található – ROZALIS',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
