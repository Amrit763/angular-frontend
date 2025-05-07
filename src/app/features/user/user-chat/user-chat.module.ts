// src/app/features/user/user-chat/user-chat.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UserChatRoutingModule } from './user-chat-routing.module';
import { UserChatListComponent } from './user-chat-list/user-chat-list.component';
import { UserChatDetailComponent } from './user-chat-detail/user-chat-detail.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UserChatRoutingModule,
    UserChatListComponent,
    UserChatDetailComponent
  ]
})
export class UserChatModule { }