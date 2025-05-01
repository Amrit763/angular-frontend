// src/app/features/chat/chat-list/chat-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add FormsModule import
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { TokenService } from '../../../core/auth/token.service';
import { Chat } from '../../../core/models/chat.model';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule // Add FormsModule to imports
  ]
})
export class ChatListComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  isLoading = true;
  error: string | null = null;
  showOnlyActive = true;
  
  isDeleteDialogOpen = false;
  chatToDelete: string | null = null;
  isDeleting = false;
  
  currentUserId = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    public productService: ProductService,
    private toastService: ToastService,
    private tokenService: TokenService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId();
    
    // Initialize socket connection
    this.chatService.initializeSocket();
    
    // Subscribe to chats observable
    this.subscriptions.push(
      this.chatService.chats$.subscribe(chats => {
        this.chats = chats;
        this.isLoading = false;
      })
    );
    
    // Load initial chats
    this.loadChats();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadChats(): void {
    this.isLoading = true;
    this.error = null;
    this.chatService.loadChats(this.showOnlyActive);
  }

  toggleActiveFilter(): void {
    this.showOnlyActive = !this.showOnlyActive;
    this.loadChats();
  }

  openChat(chatId: string): void {
    this.router.navigate(['/user/chats', chatId]);
  }

  // Open delete confirmation dialog
  openDeleteDialog(chatId: string, event: Event): void {
    // Prevent the click from also opening the chat
    event.stopPropagation();
    
    this.chatToDelete = chatId;
    this.isDeleteDialogOpen = true;
  }

  // Close delete confirmation dialog
  closeDeleteDialog(): void {
    this.chatToDelete = null;
    this.isDeleteDialogOpen = false;
  }

  // Delete a chat
  deleteChat(): void {
    if (!this.chatToDelete) return;
    
    this.isDeleting = true;
    
    this.chatService.deleteChat(this.chatToDelete).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Chat deleted successfully');
          // Reload chats
          this.loadChats();
        } else {
          this.toastService.showError(response.message || 'Failed to delete chat');
        }
        this.isDeleting = false;
        this.closeDeleteDialog();
      },
      error: (err) => {
        this.toastService.showError(err.message || 'Failed to delete chat');
        this.isDeleting = false;
        this.closeDeleteDialog();
      }
    });
  }

  // Format date for display
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
    
    // If date is within the last week, show day name
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    if (date > lastWeek) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Get other participant(s) in a chat
  getOtherParticipants(chat: Chat): string {
    if (!chat.participants || chat.participants.length === 0) {
      return 'Unknown';
    }
    
    const others = chat.participants
      .filter(p => p._id !== this.currentUserId)
      .map(p => p.fullName);
    
    if (others.length === 0) {
      return chat.participants[0].fullName; // Fallback to first participant if no others
    }
    
    return others.join(', ');
  }

  // Get last message preview text
  getLastMessagePreview(chat: Chat): string {
    if (!chat.lastMessage) {
      return 'No messages yet';
    }
    
    const isSender = chat.lastMessage.sender._id === this.currentUserId;
    const prefix = isSender ? 'You: ' : '';
    const content = chat.lastMessage.content.length > 30 
      ? chat.lastMessage.content.substring(0, 30) + '...' 
      : chat.lastMessage.content;
    
    return prefix + content;
  }

  // Get participant avatar
  getParticipantAvatar(chat: Chat): string {
    if (!chat.participants || chat.participants.length === 0) {
      return '';
    }
    
    const other = chat.participants.find(p => p._id !== this.currentUserId);
    
    if (other && other.profileImage) {
      return other.profileImage;
    }
    
    return '';
  }
}