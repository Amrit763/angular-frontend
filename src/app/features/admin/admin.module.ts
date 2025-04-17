// src/app/features/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { ChefApplicationsComponent } from './chef-applications/chef-applications.component';

@NgModule({
  declarations: [
    // Remove standalone components from declarations
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    // Import standalone components here
    DashboardComponent,
    UserManagementComponent,
    ChefApplicationsComponent,
  ]
})
export class AdminModule { }