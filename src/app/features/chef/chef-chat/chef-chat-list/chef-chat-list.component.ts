// src/app/features/chef/chef-chat/chef-chat-list/chef-chat-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Chat, ChatService } from '../../../../core/services/chat.service';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TokenService } from '../../../../core/auth/token.service';
import { User } from '../../../../core/models/chat.model';

@Component({
  selector: 'app-chef-chat-list',
  templateUrl: './chef-chat-list.component.html',
  styleUrls: ['./chef-chat-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class ChefChatListComponent implements OnInit, OnDestroy {
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
    // Get user ID from token service
    this.currentUserId = this.tokenService.getUser()?._id || '';
    
    // Initialize socket connection
    this.chatService.initializeSocket();
    
    // Subscribe to chats observable
    this.subscriptions.push(
      this.chatService.chats$.subscribe((chats: Chat[]) => {
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
    this.router.navigate(['/chef/chats', chatId]);
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
      next: (response: any) => {
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
      error: (err: any) => {
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

  // Get other participant(s) in a chat (customers)
  getOtherParticipants(chat: Chat): string {
    if (!chat.participants || chat.participants.length === 0) {
      return 'Unknown';
    }
    
    const others = chat.participants
      .filter((p: User) => p._id !== this.currentUserId)
      .map((p: User) => p.fullName);
    
    if (others.length === 0) {
      return chat.participants[0].fullName; // Fallback to first participant if no others
    }
    
    return others.join(', ');
  }

  // Get customer phone number if available
  getCustomerPhone(chat: Chat): string | null {
    if (!chat.participants || chat.participants.length === 0) {
      return null;
    }
    
    const customer = chat.participants.find((p: User) => p._id !== this.currentUserId);
    
    if (customer && customer.phone) {
      return customer.phone;
    }
    
    return null;
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

  // Get participant avatar (customer)
  getParticipantAvatar(chat: Chat): string {
    if (!chat.participants || chat.participants.length === 0) {
      return '';
    }
    
    const other = chat.participants.find((p: User) => p._id !== this.currentUserId);
    
    if (other && other.profileImage) {
      return other.profileImage;
    }
    
    return '';
  }

  // Get the order status to show for each chat
  getOrderStatus(chat: Chat): string {
    if (!chat.order || !chat.order.status) {
      return 'Unknown';
    }
    
    // Map status codes to readable labels
    const statusMap: {[key: string]: string} = {
      'pending': 'Pending',
      'received': 'Received',
      'in_progress': 'In Progress',
      'ready': 'Ready',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[chat.order.status] || chat.order.status;
  }

  // Get appropriate class for order status
  getOrderStatusClass(chat: Chat): string {
    if (!chat.order || !chat.order.status) {
      return 'bg-secondary';
    }
    
    const classMap: {[key: string]: string} = {
      'pending': 'bg-warning',
      'received': 'bg-info',
      'in_progress': 'bg-primary',
      'ready': 'bg-success',
      'delivered': 'bg-dark',
      'cancelled': 'bg-danger'
    };
    
    return classMap[chat.order.status] || 'bg-secondary';
  }
}