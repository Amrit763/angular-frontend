// src/app/features/chat/chat-detail/chat-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { TokenService } from '../../../core/auth/token.service';
import { Chat, ChatMessage, User } from '../../../core/models/chat.model';

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
  @ViewChild('messageInput') messageInput!: ElementRef;
  
  chatId: string = '';
  chat: Chat | null = null;
  isLoading = true;
  error: string | null = null;
  
  messageForm!: FormGroup;
  sending = false;
  
  currentUserId = '';
  
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private chatService: ChatService,
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
    
    // Auto-resize textarea if it exists
    if (this.messageInput && this.messageInput.nativeElement) {
      this.adjustTextareaHeight(this.messageInput.nativeElement);
    }
  }

  ngOnDestroy(): void {
    // Clear active chat when leaving
    this.chatService.clearActiveChat();
    
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Auto-resize textarea as user types
  @HostListener('input', ['$event.target'])
  onInput(textArea: HTMLTextAreaElement): void {
    if (textArea && textArea.tagName.toLowerCase() === 'textarea') {
      this.adjustTextareaHeight(textArea);
    }
  }
  
  // Helper to adjust textarea height
  private adjustTextareaHeight(textArea: HTMLTextAreaElement): void {
    textArea.style.height = 'auto';
    textArea.style.height = textArea.scrollHeight + 'px';
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
    
    const messageControl = this.messageForm.get('message');
    let message = messageControl?.value || '';
    
    // Trim message to remove whitespace
    message = message.trim();
    
    if (!message) {
      return; // Don't send empty messages
    }
    
    this.sending = true;
    
    // Add temporary message for immediate UI feedback
    const tempMessage: any = {
      _id: 'temp-' + new Date().getTime(),
      content: message,
      sender: {
        _id: this.currentUserId,
        fullName: this.tokenService.getUser()?.fullName || 'You'
      },
      readBy: [this.currentUserId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add message to UI immediately
    if (this.chat) {
      this.chat.messages = [...this.chat.messages, tempMessage];
      this.shouldScrollToBottom = true;
    }
    
    // Clear form before the API call completes
    this.messageForm.reset();
    
    // Reset textarea height
    if (this.messageInput) {
      this.messageInput.nativeElement.style.height = 'auto';
    }
    
    this.chatService.sendMessage(this.chatId, message).subscribe({
      next: (response) => {
        // Replace temp message with actual message
        if (response && response.success && response.message && this.chat) {
          this.chat.messages = this.chat.messages.filter(msg => msg._id !== tempMessage._id);
          this.chat.messages.push(response.message);
        }
        
        this.sending = false;
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        // Remove the temp message on error
        if (this.chat) {
          this.chat.messages = this.chat.messages.filter(msg => msg._id !== tempMessage._id);
        }
        
        this.sending = false;
      }
    });
  }

  // Handle typing event
  onTyping(): void {
    if (this.chatId) {
      this.chatService.sendTypingIndicator(this.chatId, true);
    }
  }

  // Check if message is from current user
  isOwnMessage(message: ChatMessage): boolean {
    return message.sender._id === this.currentUserId;
  }

  // Get sender name for a message
  getSenderName(message: ChatMessage): string {
    // If it's the current user's message
    if (this.isOwnMessage(message)) {
      const user = this.tokenService.getUser();
      return user?.fullName || 'You';
    }
    
    // Otherwise return the sender's name
    return message.sender?.fullName || 'Chef';
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

  // Get other participant(s) in the chat - Chef name
  getOtherParticipants(): string {
    if (!this.chat || !this.chat.participants || this.chat.participants.length === 0) {
      return 'Chef';
    }
    
    // Find participants who aren't the current user
    const others = this.chat.participants
      .filter((p: User) => p && p._id && p._id !== this.currentUserId)
      .map((p: User) => p.fullName || 'Chef');
    
    if (others.length === 0) {
      return 'Chef';
    }
    
    return others.join(', ');
  }

  // Scroll to bottom of chat
  scrollToBottom(): void {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // Handle enter key in textarea (send message)
  onKeydown(event: KeyboardEvent): void {
    // Send message on Enter (without shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}