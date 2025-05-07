// src/app/features/user/user-chat/user-chat-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserChatListComponent } from './user-chat-list/user-chat-list.component';
import { UserChatDetailComponent } from './user-chat-detail/user-chat-detail.component';
import { AuthGuard } from '../../../core/auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: UserChatListComponent,
    canActivate: [AuthGuard]
  },
  // {
  //   path: ':id',
  //   component: UserChatDetailComponent,
  //   canActivate: [AuthGuard]
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserChatRoutingModule { }