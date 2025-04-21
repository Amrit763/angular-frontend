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
    path: 'chef',
    loadChildren: () => import('./features/chef/chef.module').then(m => m.ChefModule),
    canActivate: [AuthGuard],
    data: { role: 'chef' }
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
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