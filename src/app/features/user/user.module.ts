// src/app/features/user/user.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';
import { SharedModule } from '../../shared/shared.module';

// Import standalone components
import { DashboardComponent } from './dashboard/dashboard.component';
import { TwoFactorManagementComponent } from './two-factor-management/two-factor-management.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ChefApplicationComponent } from './chef-application/chef-application.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { UserReviewsComponent } from './user-reviews/user-reviews.component';
import { EditReviewComponent } from './edit-review/edit-review.component';
import { UserNavComponent } from './user-nav/user-nav.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UserRoutingModule,
    SharedModule,
    // Import standalone components
    DashboardComponent,
    UserProfileComponent,
    TwoFactorManagementComponent,
    ChangePasswordComponent,
    OrderDetailComponent,
    OrderHistoryComponent,
    ChefApplicationComponent,
    UserReviewsComponent,
    EditReviewComponent,
    UserNavComponent
  ]
})
export class UserModule { }