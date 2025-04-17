// src/app/features/admin/admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { ChefApplicationsComponent } from './chef-applications/chef-applications.component';
import { AuthGuard } from '../../core/auth/auth.guard';

const routes: Routes = [
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'users', 
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
 
  { 
    path: 'chef-applications', 
    component: ChefApplicationsComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }