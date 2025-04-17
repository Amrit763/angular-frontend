// src/app/features/user/user-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { TwoFactorManagementComponent } from './two-factor-management/two-factor-management.component';
import { AuthGuard } from '../../core/auth/auth.guard';
import { ChefApplicationComponent } from './chef-application/chef-application.component';

export const USER_ROUTES: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'security/two-factor', component: TwoFactorManagementComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'chef-application', component: ChefApplicationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(USER_ROUTES)],
  exports: [RouterModule]
})
export class UserRoutingModule { }