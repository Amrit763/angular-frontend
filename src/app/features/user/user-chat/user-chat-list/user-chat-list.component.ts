// src/app/features/user/user-chat/user-chat-list/user-chat-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../../core/services/chat.service';
import { ProductService } from '../../../../core/services/product.service';
import { TokenService } from '../../../../core/auth/token.service';
import { Chat } from '../../../../core/models/chat.model';

@Component({
  selector: 'app-user-chat-list',
  templateUrl: './user-chat-list.component.html',
  styleUrls: ['./user-chat-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class UserChatListComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  isLoading = true;
  error: string | null = null;
  currentUserId: string = '';
  
  // Filters
  activeFilter: 'all' | 'active' | 'read' | 'unread' = 'all';
  
  // Deletion tracking
  deletingChatId: { [key: string]: boolean } = {};
  isDeleting: { [key: string]: boolean } = {};
  
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    public productService: ProductService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUser()?._id || '';
    this.loadChats();
    
    // Subscribe to active chats
    this.subscriptions.push(
      this.chatService.activeChats$.subscribe(chats => {
        this.chats = chats;
        this.isLoading = false;
      })
    );

    // Initialize socket connection
    this.chatService.initializeSocket();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Load all chats
  loadChats(): void {
    this.isLoading = true;
    this.error = null;
    
    this.chatService.getChats().subscribe({
      error: (err) => {
        this.error = err.message || 'Failed to load chats';
        this.isLoading = false;
      }
    });
  }

  // Filter chats by read/unread status
  filterChats(filter: 'all' | 'active' | 'read' | 'unread'): void {
    this.activeFilter = filter;
    
    // Apply server-side filter for active chats
    if (filter === 'active') {
      this.chatService.getChats(true).subscribe();
      return;
    }
    
    // Load all chats first for other filters
    this.chatService.getChats().subscribe({
      next: () => {
        // Apply client-side filtering
        // (This is handled in the getFilteredChats method)
      }
    });
  }

  // Get filtered chats based on current filter
  getFilteredChats(): Chat[] {
    switch (this.activeFilter) {
      case 'unread':
        return this.chats.filter(chat => (chat.unreadCount || 0) > 0);
      case 'read':
        return this.chats.filter(chat => !((chat.unreadCount || 0) > 0));
      default:
        return this.chats;
    }
  }
  
  // Show delete confirmation for a chat
  showDeleteConfirmation(chat: Chat): void {
    // Reset all other delete confirmations
    this.deletingChatId = {};
    
    // Set this chat to show delete confirmation
    this.deletingChatId[chat._id] = true;
  }
  
  // Cancel delete operation
  cancelDeleteChat(chatId: string): void {
    this.deletingChatId[chatId] = false;
  }
  
  // Delete a chat (soft delete for current user only)
  deleteChat(chatId: string): void {
    this.isDeleting[chatId] = true;
    
    this.chatService.deleteChat(chatId).subscribe({
      next: (response) => {
        if (response.success) {
          // The chat will be automatically removed from the list
          // via the BehaviorSubject in the chat service
          console.log('Chat deleted successfully');
        } else {
          this.error = response.message || 'Failed to delete chat';
          // Reset the delete confirmation
          this.deletingChatId[chatId] = false;
        }
        this.isDeleting[chatId] = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to delete chat';
        this.isDeleting[chatId] = false;
        this.deletingChatId[chatId] = false;
      }
    });
  }

  // Get chef name for a chat
  getChefName(chat: Chat): string {
    if (!chat.participants || chat.participants.length === 0) {
      return 'Chef';
    }
    
    // Find the participant who is a chef (not the current user)
    const chef = chat.participants.find(p => 
      p._id !== this.currentUserId && p.role === 'chef'
    );
    
    return chef ? chef.fullName : 'Chef';
  }

  // Get chef profile image
  getChefImage(chat: Chat): string {
    if (!chat.participants || chat.participants.length === 0) {
      return '';
    }
    
    // Find the chef participant
    const chef = chat.participants.find(p => 
      p._id !== this.currentUserId && p.role === 'chef'
    );
    
    return chef && chef.profileImage ? chef.profileImage : '';
  }

  // Format date for display (relative time)
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If date is today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If date is yesterday, show "Yesterday"
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Get the last message preview
  getMessagePreview(chat: Chat): string {
    if (!chat.lastMessage) {
      return 'No messages yet';
    }
    
    // Check if the current user is the sender
    let isSender = false;
    
    if (typeof chat.lastMessage.sender === 'string') {
      isSender = chat.lastMessage.sender === this.currentUserId;
    } else if (chat.lastMessage.sender && typeof chat.lastMessage.sender === 'object' && '_id' in chat.lastMessage.sender) {
      isSender = chat.lastMessage.sender._id === this.currentUserId;
    }
    
    const prefix = isSender ? 'You: ' : '';
    
    // Truncate message if too long
    const content = chat.lastMessage.content.length > 30 
      ? chat.lastMessage.content.substring(0, 30) + '...' 
      : chat.lastMessage.content;
    
    return prefix + content;
  }

  // Get order ID for display
  getOrderId(chat: Chat): string {
    if (typeof chat.order === 'string') {
      return chat.order.slice(-8); // Show last 8 characters
    } else if (chat.order && chat.order._id) {
      return chat.order._id.slice(-8);
    }
    return 'N/A';
  }
}