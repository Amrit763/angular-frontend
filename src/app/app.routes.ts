// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
// Import user routes correctly
import { USER_ROUTES } from './features/user/user-routing.module';
import { AUTH_ROUTES } from './features/auth/auth-routing.module';

export const routes: Routes = [
  {
    path: 'auth',
    children: AUTH_ROUTES
    // loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'user',
    children: USER_ROUTES,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];