// src/app/shared/components/chat-notification/chat-notification.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat-notification',
  templateUrl: './chat-notification.component.html',
  styleUrls: ['./chat-notification.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ChatNotificationComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private subscription: Subscription | null = null;

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    // Connect to socket if not already connected
    this.chatService.initializeSocket();
    
    // Subscribe to unread count
    this.subscription = this.chatService.unreadTotal$.subscribe(count => {
      this.unreadCount = count;
    });
    
    // Load chats to get initial unread count
    this.chatService.loadChats();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}