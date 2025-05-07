// src/app/features/user/user-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TwoFactorManagementComponent } from './two-factor-management/two-factor-management.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AuthGuard } from '../../core/auth/auth.guard';
import { ChefApplicationComponent } from './chef-application/chef-application.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { UserReviewsComponent } from './user-reviews/user-reviews.component';
import { EditReviewComponent } from './edit-review/edit-review.component';
import { ReviewPageComponent } from '../reviews/review-page/review-page.component';
import { UserChatListComponent } from './user-chat/user-chat-list/user-chat-list.component';
import { UserChatDetailComponent } from './user-chat/user-chat-detail/user-chat-detail.component';

export const USER_ROUTES: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: 'security/two-factor', component: TwoFactorManagementComponent, canActivate: [AuthGuard] },
  { path: 'security/change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrderHistoryComponent, canActivate: [AuthGuard] },
  { path: 'orders/:id', component: OrderDetailComponent, canActivate: [AuthGuard] },
  { path: 'reviews', component: UserReviewsComponent, canActivate: [AuthGuard] },
  { path: 'reviews/edit/:id', component: EditReviewComponent, canActivate: [AuthGuard] },
  { path: 'reviews/write', component: ReviewPageComponent, canActivate: [AuthGuard] },
  { path: 'chef-application', component: ChefApplicationComponent, canActivate: [AuthGuard] },
  
  // Add the chat routes directly to user module
  { path: 'chats', component: UserChatListComponent, canActivate: [AuthGuard] },
  { path: 'chats/:id', component: UserChatDetailComponent, canActivate: [AuthGuard] },
  
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(USER_ROUTES)],
  exports: [RouterModule]
})
export class UserRoutingModule { }