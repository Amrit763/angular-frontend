// src/app/core/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { TokenService } from '../auth/token.service';

export interface ChatMessage {
  _id: string;
  chat: string;
  sender: any;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  order: any;
  participants: any[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  success: boolean;
  chat: Chat;
}

export interface ChatsResponse {
  success: boolean;
  chats: Chat[];
}

export interface MessageResponse {
  success: boolean;
  message: ChatMessage;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chats`;
  private socket: Socket | null = null;
  
  private _activeChat = new BehaviorSubject<Chat | null>(null);
  private _chats = new BehaviorSubject<Chat[]>([]);
  private _unreadTotal = new BehaviorSubject<number>(0);
  private _typingUsers = new BehaviorSubject<{[chatId: string]: string[]}>({});
  private typingTimeout: any = null;
  
  // Expose observables
  public activeChat$ = this._activeChat.asObservable();
  public chats$ = this._chats.asObservable();
  public unreadTotal$ = this._unreadTotal.asObservable();
  public typingUsers$ = this._typingUsers.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  // Initialize socket connection
  initializeSocket(): void {
    const token = this.tokenService.getToken();
    
    if (!token) {
      console.error('Cannot initialize socket: No authentication token available');
      return;
    }
    
    // Use the base API URL instead of looking for socketUrl property
    const socketUrl = environment.apiUrl.replace('/api', '');
    
    this.socket = io(socketUrl, {
      auth: { token }
    });
    
    this.setupSocketListeners();
  }

  // Set up listeners for socket events
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    // New message received
    this.socket.on('newMessage', ({ message, chatId }) => {
      // Update active chat if this message belongs to it
      const activeChat = this._activeChat.value;
      if (activeChat && activeChat._id === chatId) {
        activeChat.messages = [...activeChat.messages, message];
        activeChat.lastMessage = message;
        this._activeChat.next(activeChat);
        
        // If we're in the active chat, mark message as read immediately
        this.markChatAsRead(chatId);
      }
      
      // Update chat list
      this.updateChatWithNewMessage(chatId, message);
    });
    
    // Notification of new message (when not in the chat room)
    this.socket.on('messageNotification', ({ chatId, message, sender }) => {
      // Update chat list with new unread message
      this.updateChatWithNewMessage(chatId, message, true);
    });
    
    // Messages marked as read
    this.socket.on('messagesRead', ({ chatId, messageIds, userId }) => {
      // Update read status for messages
      const activeChat = this._activeChat.value;
      if (activeChat && activeChat._id === chatId) {
        const updatedMessages = activeChat.messages.map(msg => {
          if (messageIds.includes(msg._id) && !msg.readBy.includes(userId)) {
            return {
              ...msg,
              readBy: [...msg.readBy, userId]
            };
          }
          return msg;
        });
        
        activeChat.messages = updatedMessages;
        this._activeChat.next(activeChat);
      }
    });
    
    // Message deleted
    this.socket.on('messageDeleted', ({ chatId, messageId }) => {
      // Remove message from UI
      const activeChat = this._activeChat.value;
      if (activeChat && activeChat._id === chatId) {
        activeChat.messages = activeChat.messages.filter(msg => msg._id !== messageId);
        this._activeChat.next(activeChat);
      }
    });
    
    // Errors
    this.socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });
    
    // Successfully joined a chat
    this.socket.on('chatJoined', ({ chatId }) => {
      console.log(`Successfully joined chat ${chatId}`);
    });

    // User typing indicator events
    this.socket.on('userTyping', ({ chatId, userId, userName }) => {
      const currentTyping = this._typingUsers.value;
      
      // Check if user is already in the typing list
      if (!currentTyping[chatId]) {
        currentTyping[chatId] = [];
      }
      
      if (!currentTyping[chatId].includes(userName)) {
        currentTyping[chatId].push(userName);
        this._typingUsers.next({ ...currentTyping });
        
        // Automatically remove user from typing after 3 seconds of inactivity
        setTimeout(() => {
          this.removeTypingUser(chatId, userName);
        }, 3000);
      }
    });

    this.socket.on('userStoppedTyping', ({ chatId, userId, userName }) => {
      this.removeTypingUser(chatId, userName);
    });
  }

  // Update chat list with new message
  private updateChatWithNewMessage(chatId: string, message: ChatMessage, isUnread: boolean = false): void {
    const currentChats = this._chats.value;
    const updatedChats = currentChats.map(chat => {
      if (chat._id === chatId) {
        const unreadCount = isUnread ? (chat.unreadCount || 0) + 1 : chat.unreadCount;
        return {
          ...chat,
          lastMessage: message,
          unreadCount
        };
      }
      return chat;
    });
    
    this._chats.next(updatedChats);
    this.updateUnreadTotal();
  }

  // Calculate total unread messages
  private updateUnreadTotal(): void {
    const total = this._chats.value.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    this._unreadTotal.next(total);
  }

  // Get all chats for the current user
  getChats(active?: boolean): Observable<ChatsResponse> {
    let url = this.apiUrl;
    if (active !== undefined) {
      url += `?active=${active}`;
    }
    return this.http.get<ChatsResponse>(url);
  }

  // Load and update chats in the BehaviorSubject
  loadChats(active?: boolean): void {
    this.getChats(active).subscribe({
      next: (response) => {
        if (response.success) {
          this._chats.next(response.chats);
          this.updateUnreadTotal();
        }
      },
      error: (err) => {
        console.error('Error loading chats:', err);
      }
    });
  }

  // Get a specific chat with messages
  getChat(chatId: string): Observable<ChatResponse> {
    return this.http.get<ChatResponse>(`${this.apiUrl}/${chatId}`);
  }

  // Set active chat
  setActiveChat(chatId: string): void {
    this.getChat(chatId).subscribe({
      next: (response) => {
        if (response.success) {
          // Join the chat room
          if (this.socket) {
            this.socket.emit('joinChat', chatId);
          }
          
          this._activeChat.next(response.chat);
          
          // Mark messages as read
          this.markChatAsRead(chatId);
          
          // Update the chat in the list
          const currentChats = this._chats.value;
          const updatedChats = currentChats.map(chat => {
            if (chat._id === chatId) {
              return {
                ...chat,
                unreadCount: 0
              };
            }
            return chat;
          });
          
          this._chats.next(updatedChats);
          this.updateUnreadTotal();
        }
      },
      error: (err) => {
        console.error('Error setting active chat:', err);
      }
    });
  }

  // Clear active chat
  clearActiveChat(): void {
    const activeChat = this._activeChat.value;
    if (activeChat && this.socket) {
      this.socket.emit('leaveChat', activeChat._id);
    }
    this._activeChat.next(null);
  }

  // Send a message in a chat
  sendMessage(chatId: string, content: string): Observable<MessageResponse> {
    // Send via HTTP
    const result = this.http.post<MessageResponse>(`${this.apiUrl}/${chatId}/messages`, { content });
    
    // Send via Socket
    if (this.socket) {
      this.socket.emit('sendMessage', { chatId, content });
    }
    
    return result;
  }

  // Mark all messages in a chat as read
  markChatAsRead(chatId: string): void {
    // Mark via HTTP
    this.http.patch(`${this.apiUrl}/${chatId}/read`, {}).subscribe();
    
    // Mark via Socket
    const activeChat = this._activeChat.value;
    if (this.socket && activeChat) {
      const unreadMessages = activeChat.messages
        .filter(msg => !msg.readBy.includes(this.tokenService.getUserId()))
        .map(msg => msg._id);
      
      if (unreadMessages.length > 0) {
        this.socket.emit('markAsRead', { chatId, messageIds: unreadMessages });
      }
    }
    
    // Update chat in list to reflect read status
    const currentChats = this._chats.value;
    const updatedChats = currentChats.map(chat => {
      if (chat._id === chatId) {
        return {
          ...chat,
          unreadCount: 0
        };
      }
      return chat;
    });
    
    this._chats.next(updatedChats);
    this.updateUnreadTotal();
  }

  // Delete a message
  deleteMessage(chatId: string, messageId: string): Observable<{success: boolean, message: string}> {
    // Delete via HTTP
    const result = this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${chatId}/messages/${messageId}`);
    
    // Delete via Socket
    if (this.socket) {
      this.socket.emit('deleteMessage', { chatId, messageId });
    }
    
    return result;
  }

  // Delete/hide a chat for the current user
  deleteChat(chatId: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${chatId}`);
  }

  // Create chat channels for an order
  createOrderChat(orderId: string): Observable<{success: boolean, message: string}> {
    return this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/order/${orderId}`, {});
  }

  /**
   * Send typing indicator to other users in chat
   * @param chatId The ID of the chat
   * @param isTyping Whether the user is typing or has stopped typing
   */
  // src/app/core/services/chat.service.ts

// Fix the sendTypingIndicator method
sendTypingIndicator(chatId: string, isTyping: boolean): void {
  if (!this.socket) return;
  
  if (isTyping) {
    // Send typing event
    this.socket.emit('typing', { chatId });
    
    // Clear existing timeout and set a new one
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Stop typing after 3 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      if (this.socket) { // Add null check here
        this.socket.emit('stopTyping', { chatId });
      }
      this.typingTimeout = null;
    }, 3000);
  } else if (!isTyping && this.typingTimeout) {
    // Send stop typing event
    if (this.socket) { // Add null check here
      this.socket.emit('stopTyping', { chatId });
    }
    clearTimeout(this.typingTimeout);
    this.typingTimeout = null;
  }
}
  /**
   * Get users currently typing in a specific chat
   * @param chatId The ID of the chat
   * @returns Array of user names who are typing
   */
  getTypingUsers(chatId: string): string[] {
    const currentTyping = this._typingUsers.value;
    return currentTyping[chatId] || [];
  }

  /**
   * Remove a user from the typing list
   * @param chatId The ID of the chat
   * @param userName The name of the user to remove
   */
  private removeTypingUser(chatId: string, userName: string): void {
    const currentTyping = this._typingUsers.value;
    
    if (currentTyping[chatId]) {
      currentTyping[chatId] = currentTyping[chatId].filter(name => name !== userName);
      
      // If no users are typing in this chat, remove the chat entry
      if (currentTyping[chatId].length === 0) {
        delete currentTyping[chatId];
      }
      
      this._typingUsers.next({ ...currentTyping });
    }
  }

  /**
   * Get socket instance (for use in other services)
   * @returns The socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}