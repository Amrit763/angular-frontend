// src/app/features/chat/chat-detail/chat-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { TokenService } from '../../../core/auth/token.service';
import { Chat, ChatMessage } from '../../../core/models/chat.model';

@Component({
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ]
})
export class ChatDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  
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
  
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private chatService: ChatService,
    public productService: ProductService,
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
      this.chatService.activeChat$.subscribe(chat => {
        this.chat = chat;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      })
    );
    
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
    
    const message = this.messageForm.get('message')?.value;
    this.sending = true;
    
    this.chatService.sendMessage(this.chatId, message).subscribe({
      next: (response) => {
        // Successfully sent - clear form
        this.messageForm.reset();
        this.sending = false;
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        this.toastService.showError(err.message || 'Failed to send message');
        this.sending = false;
      }
    });
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
      .filter(p => p._id !== this.currentUserId)
      .map(p => p.fullName);
    
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
    
    const other = this.chat.participants.find(p => p._id !== this.currentUserId);
    
    if (other && other.profileImage) {
      return other.profileImage;
    }
    
    return '';
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
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Message deleted');
          
          // Update local chat if not updated by socket
          if (this.chat) {
            this.chat.messages = this.chat.messages.filter(msg => msg._id !== this.messageToDelete);
          }
        } else {
          this.toastService.showError(response.message || 'Failed to delete message');
        }
        this.isDeleting = false;
        this.closeDeleteDialog();
      },
      error: (err) => {
        this.toastService.showError(err.message || 'Failed to delete message');
        this.isDeleting = false;
        this.closeDeleteDialog();
      }
    });
  }

  // Navigate back to chats list
  backToChats(): void {
    this.router.navigate(['/user/chats']);
  }

  // Navigate to order details
  viewOrder(): void {
    if (this.chat?.order) {
      this.router.navigate(['/user/orders', this.chat.order._id]);
    }
  }
}