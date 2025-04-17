// src/app/features/user/user.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';
import { SharedModule } from '../../shared/shared.module';
// Import standalone components
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { TwoFactorManagementComponent } from './two-factor-management/two-factor-management.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UserRoutingModule,
    SharedModule,
    TwoFactorManagementComponent,
    // Import standalone components
    DashboardComponent,
    ProfileComponent
  ]
})
export class UserModule { }