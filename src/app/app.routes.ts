import type { Routes } from '@angular/router';

const stub = () => import('./core/stub/stub.page').then((m) => m.StubPage);

export const routes: Routes = [
  { path: '', redirectTo: 'nutrition/daily-log', pathMatch: 'full' },
  {
    path: 'nutrition/daily-log',
    loadComponent: () => import('./features/nutrition/daily-log/daily-log.page').then((m) => m.DailyLogPage),
  },

  // Stubs until these screens are built (daily-log spec, Navigation).
  { path: 'nutrition/targets', loadComponent: stub, data: { title: 'Targets' } },
  { path: 'nutrition/meal/:subject', loadComponent: stub, data: { title: 'Meal' } },
  { path: 'nutrition/log-food', loadComponent: stub, data: { title: 'Log food' } },
  { path: 'daily-tracking/:subject', loadComponent: stub, data: { title: 'Daily tracking' } },
  { path: 'meals', loadComponent: stub, data: { title: 'Meals' } },
  { path: 'exercise', loadComponent: stub, data: { title: 'Exercise' } },
  { path: 'weight', loadComponent: stub, data: { title: 'Weight' } },

  { path: '**', redirectTo: 'nutrition/daily-log' },
];
