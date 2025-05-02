// src/app/features/chef/chef-chat/chef-chat-detail/chef-chat-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../../core/services/chat.service';
import { ProductService } from '../../../../core/services/product.service';
import { OrderService } from '../../../../core/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TokenService } from '../../../../core/auth/token.service';
import { Chat, ChatMessage, User } from '../../../../core/models/chat.model';
import { OrderStatus } from '../../../../core/models/order.model';
import { ChatQuickRepliesComponent } from '../../../../shared/components/chat-quick-replies/chat-quick-replies.component';
import { ChatOrderSummaryComponent } from '../../../../shared/components/chat-order-summary/chat-order-summary.component';

@Component({
  selector: 'app-chef-chat-detail',
  templateUrl: './chef-chat-detail.component.html',
  styleUrls: ['./chef-chat-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ChatQuickRepliesComponent,
    ChatOrderSummaryComponent
  ]
})
export class ChefChatDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  
  chatId: string = '';
  chat: Chat | null = null;
  isLoading = true;
  error: string | null = null;
  
  messageForm!: FormGroup;
  sending = false;
  
  currentUserId = '';
  isDeleteDialogOpen = false;
  messageToDelete: string | null = null;
  isDeleting = false;
  
  // Typing indicator properties
  typingUsers: string[] = [];
  private typingSubscription: Subscription | null = null;
  
  // Order summary property
  showOrderSummary: boolean = false;
  
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = true;
  private lastMessageCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private chatService: ChatService,
    public productService: ProductService,
    private orderService: OrderService,
    private toastService: ToastService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId();
    
    // Initialize socket connection
    this.chatService.initializeSocket();
    
    // Initialize form
    this.initForm();
    
    // Subscribe to active chat observable
    this.subscriptions.push(
      this.chatService.activeChat$.subscribe((chat: Chat | null) => {
        // Determine if new messages have been added
        const hadChat = !!this.chat;
        const oldMessageCount = hadChat && this.chat ? this.chat.messages.length : 0;
        
        this.chat = chat;
        this.isLoading = false;
        
        // Set scrollToBottom flag if:
        // 1. First time loading the chat
        // 2. New messages arrived and we were already at the bottom
        // 3. We sent a message (lastMessageCount will be incremented when we send)
        if (!hadChat || 
            (chat && oldMessageCount < chat.messages.length && this.isScrolledToBottom()) || 
            (chat && this.lastMessageCount < chat.messages.length && this.isOwnMessage(chat.messages[chat.messages.length - 1]))) {
          this.shouldScrollToBottom = true;
        }
        
        if (chat) {
          this.lastMessageCount = chat.messages.length;
        }
      })
    );
    
    // Subscribe to typing indicators
    this.typingSubscription = this.chatService.typingUsers$.subscribe((typingUsers: Record<string, string[]>) => {
      if (this.chatId && typingUsers[this.chatId]) {
        // Filter out current user from typing users list
        this.typingUsers = typingUsers[this.chatId].filter((userName: string) => 
          userName !== this.tokenService.getUser()?.fullName
        );
      } else {
        this.typingUsers = [];
      }
    });
    
    // Get chat ID from route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chatId = id;
        this.loadChat(id);
      } else {
        this.error = 'Chat ID not found';
        this.isLoading = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    // Clear active chat when leaving
    this.chatService.clearActiveChat();
    
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Unsubscribe from typing indicators
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }
  }

  // Auto-resize textarea as user types
  @HostListener('input', ['$event.target'])
  onInput(textArea: HTMLTextAreaElement): void {
    if (textArea && textArea.tagName.toLowerCase() === 'textarea') {
      textArea.style.height = 'auto';
      textArea.style.height = textArea.scrollHeight + 'px';
    }
  }

  // Check if user has scrolled to bottom
  isScrolledToBottom(): boolean {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      const threshold = 50; // pixels from bottom to consider "at bottom"
      return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    }
    return false;
  }

  // Handle scroll events
  onScroll(): void {
    // Could be used for "load more messages" functionality
  }

  initForm(): void {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  loadChat(chatId: string): void {
    this.isLoading = true;
    this.error = null;
    this.chatService.setActiveChat(chatId);
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.chatId) {
      return;
    }
    
    let message = this.messageForm.get('message')?.value;
    
    // Check for special commands
    if (message === '/order') {
      // Replace with a proper message and show order summary
      message = 'Here is the order information:';
      this.showOrderSummary = true;
    }
    
    this.sending = true;
    
    // Stop typing indicator
    this.chatService.sendTypingIndicator(this.chatId, false);
    
    // Update lastMessageCount to indicate we're adding a message
    this.lastMessageCount++;
    
    this.chatService.sendMessage(this.chatId, message).subscribe({
      next: (response: any) => {
        // Successfully sent - clear form
        this.messageForm.reset();
        this.sending = false;
        this.shouldScrollToBottom = true;
        
        // Reset textarea height
        if (this.messageInput) {
          this.messageInput.nativeElement.style.height = 'auto';
        }
      },
      error: (err: any) => {
        this.toastService.showError(err.message || 'Failed to send message');
        this.sending = false;
        
        // Decrement since message wasn't actually added
        this.lastMessageCount--;
      }
    });
  }

  // Handle typing event
  onTyping(): void {
    if (this.chatId) {
      this.chatService.sendTypingIndicator(this.chatId, true);
    }
  }
  
  // Toggle order summary visibility
  toggleOrderSummary(): void {
    this.showOrderSummary = !this.showOrderSummary;
  }
  
  // Handle quick reply selection
  onQuickReplySelected(text: string): void {
    // Set the text in the form
    this.messageForm.get('message')?.setValue(text);
    
    // Focus the input to allow for editing before sending
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  // Update order status
  updateOrderStatus(): void {
    if (!this.chat || !this.chat.order) {
      return;
    }
    
    const nextStatus = this.getNextOrderStatus();
    if (!nextStatus) {
      return;
    }
    
    this.orderService.updateOrderStatus(this.chat.order._id, nextStatus).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Update order in chat
          if (this.chat) {
            this.chat.order = response.order;
            
            // Create a status update message
            const statusLabel = this.getOrderStatus();
            const statusMessages: Record<string, string> = {
              'Received': 'I\'ve received your order and will start preparing it soon!',
              'In Progress': 'I\'ve started preparing your order. It should be ready in about 15-20 minutes.',
              'Ready for Pickup': 'Great news! Your order is ready for pickup or delivery.',
              'Delivered': 'Your order has been delivered. Enjoy your meal! Please let me know if everything is to your satisfaction.'
            };
            
            const statusMessage = statusMessages[statusLabel] || 
              `Your order status has been updated to: ${statusLabel}`;
            
            // Send the automated status update message
            this.chatService.sendMessage(this.chatId, statusMessage).subscribe(
              () => {
                this.toastService.showSuccess('Order status updated and customer notified');
                this.shouldScrollToBottom = true;
              },
              (err: any) => {
                console.error('Error sending status message:', err);
                this.toastService.showSuccess('Order status updated but failed to notify customer');
              }
            );
          }
        } else {
          this.toastService.showError(response.message || 'Failed to update order status');
        }
      },
      error: (err: any) => {
        this.toastService.showError(err.message || 'Failed to update order status');
      }
    });
  }

  // Get next order status
  getNextOrderStatus(): OrderStatus | null {
    if (!this.chat || !this.chat.order) {
      return null;
    }
    
    const currentStatus = this.chat.order.status;
    
    // Define status flow
    const statusFlow: Record<string, OrderStatus | null> = {
      'Pending': 'received' as OrderStatus,
      'Received': 'in_progress' as OrderStatus,
      'In Progress': 'ready' as OrderStatus,
      'Ready for Pickup': 'delivered' as OrderStatus
    };
    
    return statusFlow[currentStatus] || null;
  }

  // Get order status label
  getOrderStatus(): string {
    if (!this.chat || !this.chat.order) {
      return 'Unknown';
    }
    
    return this.chat.order.status;
  }

  // Check if message is from current user
  isOwnMessage(message: ChatMessage): boolean {
    return message.sender._id === this.currentUserId;
  }

  // Format date for display
  formatDate(dateString: string, showTime: boolean = true): string {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateStr = '';
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      dateStr = 'Today';
    }
    // Check if date is yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      dateStr = 'Yesterday';
    }
    // Otherwise use full date
    else {
      dateStr = date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // Add time if requested
    if (showTime) {
      dateStr += ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return dateStr;
  }

  // Get other participant(s) in the chat
  getOtherParticipants(): string {
    if (!this.chat || !this.chat.participants || this.chat.participants.length === 0) {
      return 'Chat';
    }
    
    const others = this.chat.participants
      .filter((p: User) => p._id !== this.currentUserId)
      .map((p: User) => p.fullName);
    
    if (others.length === 0) {
      return this.chat.participants[0].fullName; // Fallback to first participant
    }
    
    return others.join(', ');
  }

  // Get participant avatar
  getParticipantAvatar(): string {
    if (!this.chat || !this.chat.participants || this.chat.participants.length === 0) {
      return '';
    }
    
    const other = this.chat.participants.find((p: User) => p._id !== this.currentUserId);
    
    if (other && other.profileImage) {
      return other.profileImage;
    }
    
    return '';
  }

  // Get customer phone number if available
  getCustomerPhone(): string | null {
    if (!this.chat || !this.chat.participants) {
      return null;
    }
    
    const customer = this.chat.participants.find((p: User) => p._id !== this.currentUserId);
    
    if (customer && customer.phone) {
      return customer.phone;
    }
    
    return null;
  }

  // Scroll to bottom of chat
  scrollToBottom(): void {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // Open delete dialog
  openDeleteDialog(messageId: string): void {
    this.messageToDelete = messageId;
    this.isDeleteDialogOpen = true;
  }

  // Close delete dialog
  closeDeleteDialog(): void {
    this.messageToDelete = null;
    this.isDeleteDialogOpen = false;
  }

  // Delete a message
  deleteMessage(): void {
    if (!this.messageToDelete || !this.chatId) {
      return;
    }
    
    this.isDeleting = true;
    
    this.chatService.deleteMessage(this.chatId, this.messageToDelete).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.showSuccess('Message deleted');
          
          // Update local chat if not updated by socket
          if (this.chat) {
            this.chat.messages = this.chat.messages.filter((msg: ChatMessage) => msg._id !== this.messageToDelete);
          }
        } else {
          this.toastService.showError(response.message || 'Failed to delete message');
        }
        this.isDeleting = false;
        this.closeDeleteDialog();
      },
      error: (err: any) => {
        this.toastService.showError(err.message || 'Failed to delete message');
        this.isDeleting = false;
        this.closeDeleteDialog();
      }
    });
  }

  // Handle enter key in textarea (send message)
  onKeydown(event: KeyboardEvent): void {
    // Send message on Enter (without shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Navigate back to chats list
  backToChats(): void {
    this.router.navigate(['/chef/chats']);
  }

  // Navigate to order details
  viewOrder(): void {
    if (this.chat?.order) {
      this.router.navigate(['/chef/orders', this.chat.order._id]);
    }
  }
}