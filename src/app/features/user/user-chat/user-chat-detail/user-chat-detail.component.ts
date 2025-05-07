// src/app/features/user/user-chat/user-chat-detail/user-chat-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../../core/services/chat.service';
import { ProductService } from '../../../../core/services/product.service';
import { TokenService } from '../../../../core/auth/token.service';
import { Chat, ChatMessage } from '../../../../core/models/chat.model';

@Component({
  selector: 'app-user-chat-detail',
  templateUrl: './user-chat-detail.component.html',
  styleUrls: ['./user-chat-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ]
})
export class UserChatDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  
  chatId: string = '';
  chat: Chat | null = null;
  messages: ChatMessage[] = [];
  currentUserId: string = '';
  isLoading = true;
  isSending = false;
  error: string | null = null;
  messageForm!: FormGroup;
  private subscriptions: Subscription[] = [];
  shouldScrollToBottom = true;

  constructor(
    private chatService: ChatService,
    public productService: ProductService,
    private tokenService: TokenService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUser()?._id || '';
    this.initForm();
    
    // Get chat ID from route parameter
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chatId = id;
        this.loadChatAndMessages();
      } else {
        this.router.navigate(['/user/chats']);
      }
    });
    
    // Subscribe to chat data
    this.subscriptions.push(
      this.chatService.currentChat$.subscribe(chat => {
        this.chat = chat;
      })
    );
    
    // Subscribe to messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages = messages || [];
        this.shouldScrollToBottom = true;
        this.isLoading = false;
      })
    );
    
    // Initialize socket connection
    this.chatService.initializeSocket();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    // Leave the chat room
    if (this.chatId) {
      this.chatService.leaveChat(this.chatId);
    }
    
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Initialize the message form
  initForm(): void {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  // Load chat and messages
  loadChatAndMessages(): void {
    this.isLoading = true;
    this.error = null;
    
    // Get chat details
    this.chatService.getChat(this.chatId).subscribe({
      next: (response) => {
        if (response.success) {
          // After getting chat, load messages
          this.loadMessages();
          
          // Join the chat room for real-time updates
          this.chatService.joinChat(this.chatId);
        } else {
          this.error = response.message || 'Failed to load chat';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = err.message || 'Failed to load chat';
        this.isLoading = false;
      }
    });
  }

  // Load chat messages
  loadMessages(): void {
    this.chatService.getMessages(this.chatId).subscribe({
      next: (response) => {
        if (response.success) {
          // Mark all messages as read when conversation is opened
          this.markAsRead();
        } else {
          this.error = response.message || 'Failed to load messages';
        }
      },
      error: (err) => {
        this.error = err.message || 'Failed to load messages';
        this.isLoading = false;
      }
    });
  }

  // Mark all messages as read
  markAsRead(): void {
    this.chatService.markChatAsRead(this.chatId).subscribe({
      error: (err) => {
        console.error('Error marking messages as read:', err);
      }
    });
  }

  // Send a new message
  sendMessage(): void {
    if (this.messageForm.invalid || this.isSending) return;
    
    const content = this.messageForm.get('content')?.value;
    if (!content || !content.trim()) return;
    
    this.isSending = true;
    
    this.chatService.sendMessage(this.chatId, content).subscribe({
      next: (response) => {
        if (response.success) {
          // Reset form after successful send
          this.messageForm.reset();
          
          // Scroll to bottom to see the new message
          this.shouldScrollToBottom = true;
        } else {
          this.error = response.message || 'Failed to send message';
        }
        this.isSending = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to send message';
        this.isSending = false;
      }
    });
  }

  // Scroll to the bottom of the message container
  scrollToBottom(): void {
    try {
      if (this.messageContainer && this.messageContainer.nativeElement) {
        const element = this.messageContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // Check if a message is from the current user
  isOwnMessage(message: ChatMessage): boolean {
    if (!message || !message.sender) return false;
    
    if (typeof message.sender === 'string') {
      return message.sender === this.currentUserId;
    } else if (message.sender && typeof message.sender === 'object' && '_id' in message.sender) {
      return message.sender._id === this.currentUserId;
    }
    
    return false;
  }

  // Get the chef's name
  getChefName(): string {
    if (!this.chat) return 'Chef';
    
    if (this.chat.chef && typeof this.chat.chef !== 'string') {
      return this.chat.chef.fullName || 'Chef';
    }
    
    if (this.chat.participants) {
      const chef = this.chat.participants.find(p => p._id !== this.currentUserId && p.role === 'chef');
      return chef ? chef.fullName : 'Chef';
    }
    
    return 'Chef';
  }

  // Get chef's profile image
  getChefImage(): string {
    if (!this.chat) return '';
    
    if (this.chat.chef && typeof this.chat.chef !== 'string' && this.chat.chef.profileImage) {
      return this.chat.chef.profileImage;
    }
    
    if (this.chat.participants) {
      const chef = this.chat.participants.find(p => p._id !== this.currentUserId && p.role === 'chef');
      return chef && chef.profileImage ? chef.profileImage : '';
    }
    
    return '';
  }

  // Format message timestamp
  formatMessageTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Get the order ID from the chat
  getOrderId(): string {
    if (!this.chat) return 'N/A';
    
    if (typeof this.chat.order === 'string') {
      return this.chat.order.slice(-8);
    } else if (this.chat.order && this.chat.order._id) {
      return this.chat.order._id.slice(-8);
    }
    return 'N/A';
  }
}