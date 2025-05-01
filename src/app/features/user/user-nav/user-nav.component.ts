// src/app/features/user/user-nav/user-nav.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TokenService } from '../../../core/auth/token.service';
import { ChatService } from '../../../core/services/chat.service';
import { User } from '../../../core/auth/user.model';

@Component({
  selector: 'app-user-nav',
  templateUrl: './user-nav.component.html',
  styleUrls: ['./user-nav.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class UserNavComponent implements OnInit, OnDestroy {
  user: User | null = null;
  unreadCount = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private tokenService: TokenService,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    // Load user from token service
    this.user = this.tokenService.getUser();
    
    // Initialize chat service and subscribe to unread count
    this.initChatService();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Initialize chat service and subscribe to unread message count
  initChatService(): void {
    // Initialize socket connection
    this.chatService.initializeSocket();
    
    // Load chat list to get unread count
    this.chatService.loadChats();
    
    // Subscribe to unread total
    this.subscriptions.push(
      this.chatService.unreadTotal$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }
}