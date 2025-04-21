// src/app/features/user/user-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TwoFactorManagementComponent } from './two-factor-management/two-factor-management.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AuthGuard } from '../../core/auth/auth.guard';
import { ChefApplicationComponent } from './chef-application/chef-application.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

export const USER_ROUTES: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: 'security/two-factor', component: TwoFactorManagementComponent, canActivate: [AuthGuard] },
  { path: 'security/change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'chef-application', component: ChefApplicationComponent, canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(USER_ROUTES)],
  exports: [RouterModule]
})
export class UserRoutingModule { }