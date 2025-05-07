// src/app/core/services/chat.service.ts
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  ChatResponse, 
  ChatsResponse, 
  ChatMessagesResponse, 
  SendMessageResponse, 
  MarkAsReadResponse,
  Chat,
  ChatMessage
} from '../models/chat.model';

import { TokenService } from '../auth/token.service';
import { io, Socket } from 'socket.io-client'; 

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chats`;
  private socket: Socket | null = null;
  private socketInitialized = false;
  private _activeChats = new BehaviorSubject<Chat[]>([]);
  private _currentChat = new BehaviorSubject<Chat | null>(null);
  private _messages = new BehaviorSubject<ChatMessage[]>([]);
  private _unreadCount = new BehaviorSubject<number>(0);
  private _activeRooms: string[] = [];
  
  // Expose as observables
  public activeChats$ = this._activeChats.asObservable();
  public currentChat$ = this._currentChat.asObservable();
  public messages$ = this._messages.asObservable();
  public unreadCount$ = this._unreadCount.asObservable();
  public unreadTotal$ = this._unreadCount.asObservable(); // Alias for compatibility

  constructor(
    private http: HttpClient, 
    private tokenService: TokenService,
    private ngZone: NgZone // NgZone to ensure Angular change detection works with socket events
  ) {
    // Initialize socket connection when service is instantiated
    this.initializeSocket();
  }

  // Get the socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Initialize socket connection with auth token
  initializeSocket(): void {
    const token = this.tokenService.getToken();
    
    // Only initialize once and if we have a token
    if (token && !this.socketInitialized) {
      console.log('Initializing socket connection...');
      
      try {
        this.socket = io(environment.apiUrl, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
          timeout: 10000
        });
        
        this.socketInitialized = true;
        
        // Set up socket event listeners
        this.setupSocketEvents();
        
        // Handle connection events
        this.socket.on('connect', () => {
          console.log('Socket connected successfully');
          
          // Rejoin active rooms on reconnect
          if (this._activeRooms.length > 0) {
            this._activeRooms.forEach(roomId => {
              this.socket?.emit('joinChat', roomId);
              console.log('Rejoining room:', roomId);
            });
          }
        });
        
        this.socket.on('disconnect', (reason) => {
          console.log(`Socket disconnected: ${reason}`);
          
          // No need to manually reconnect, socket.io handles reconnection
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });
      } catch (error) {
        console.error('Error initializing socket:', error);
        this.socketInitialized = false;
      }
    }
  }

  // Set up socket event listeners
  private setupSocketEvents(): void {
    if (!this.socket) return;

    // Listen for new messages
    this.socket.on('newMessage', (data: { message: ChatMessage, chatId: string }) => {
      console.log('New message received via socket:', data);
      
      // Use NgZone to ensure Angular change detection catches these updates
      this.ngZone.run(() => {
        // Update messages if we're in the current chat
        if (this._currentChat.value && this._currentChat.value._id === data.chatId) {
          const currentMessages = [...this._messages.value];
          currentMessages.push(data.message);
          this._messages.next(currentMessages);
          
          // Mark the message as read since we're in the chat
          this.markChatAsRead(data.chatId).subscribe();
        }
        
        // Update the chat list with the latest message
        this.updateChatWithNewMessage(data.chatId, data.message);
      });
    });

    // Listen for messages marked as read
    this.socket.on('messagesRead', (data: { chatId: string, messageIds: string[], userId: string }) => {
      this.ngZone.run(() => {
        if (this._currentChat.value && this._currentChat.value._id === data.chatId) {
          // Update read status for messages in the current conversation
          const updatedMessages = this._messages.value.map(msg => {
            if (data.messageIds.includes(msg._id)) {
              return { ...msg, readBy: [...(msg.readBy || []), data.userId] };
            }
            return msg;
          });
          this._messages.next(updatedMessages);
        }
        
        // Update unread counts in chat list
        this.refreshUnreadCounts();
      });
    });

    // Listen for deleted messages
    this.socket.on('messageDeleted', (data: { chatId: string, messageId: string }) => {
      this.ngZone.run(() => {
        if (this._currentChat.value && this._currentChat.value._id === data.chatId) {
          // Remove deleted message from current conversation
          const updatedMessages = this._messages.value.filter(msg => msg._id !== data.messageId);
          this._messages.next(updatedMessages);
        }
      });
    });
    
    // Listen for chat deletion notification
    this.socket.on('chatDeleted', (data: { chatId: string, userId: string }) => {
      this.ngZone.run(() => {
        console.log('Chat deleted by user:', data.userId);
        // No action needed as this is only an FYI notification
        // The chat still remains for the current user if they haven't deleted it
      });
    });
    
    // Explicitly handle successful chat join
    this.socket.on('chatJoined', (data: { chatId: string }) => {
      console.log(`Successfully joined chat room: ${data.chatId}`);
      
      // Add to active rooms if not already there
      if (!this._activeRooms.includes(data.chatId)) {
        this._activeRooms.push(data.chatId);
      }
    });
  }

  // Join a chat room when entering a conversation
  joinChat(chatId: string): void {
    if (!chatId) return;
    
    console.log(`Attempting to join chat room: ${chatId}`);
    
    if (!this.socket || !this.socketInitialized) {
      console.log('Socket not initialized, reinitializing...');
      this.initializeSocket();
    }
    
    // Try joining with a delay to ensure socket is connected
    setTimeout(() => {
      if (this.socket) {
        console.log(`Emitting joinChat for room: ${chatId}`);
        this.socket.emit('joinChat', chatId);
        
        // Add to active rooms
        if (!this._activeRooms.includes(chatId)) {
          this._activeRooms.push(chatId);
        }
      } else {
        console.error('Socket still not available after initialization');
      }
    }, 500);
  }

  // Leave a chat room when leaving a conversation
  leaveChat(chatId: string): void {
    if (!chatId) return;
    
    if (this.socket) {
      console.log(`Leaving chat room: ${chatId}`);
      this.socket.emit('leaveChat', chatId);
      
      // Remove from active rooms
      this._activeRooms = this._activeRooms.filter(id => id !== chatId);
    }
  }

  // Get all chats for current user
  getChats(active?: boolean): Observable<ChatsResponse> {
    let url = this.apiUrl;
    if (active !== undefined) {
      url += `?active=${active}`;
    }
    
    return this.http.get<ChatsResponse>(url).pipe(
      tap(response => {
        if (response.success) {
          this._activeChats.next(response.chats);
          // Calculate total unread count
          const unreadTotal = response.chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
          this._unreadCount.next(unreadTotal);
        }
      }),
      catchError(error => {
        console.error('Error fetching chats:', error);
        return of({ success: false, message: 'Failed to load chats', chats: [], count: 0 });
      })
    );
  }

  // Alias for getChats to maintain compatibility with existing code
  loadChats(active?: boolean): Observable<ChatsResponse> {
    return this.getChats(active);
  }

  // Get a specific chat with messages
  getChat(chatId: string): Observable<ChatResponse> {
    return this.http.get<ChatResponse>(`${this.apiUrl}/${chatId}`).pipe(
      tap(response => {
        if (response.success) {
          this._currentChat.next(response.chat);
          
          // If the chat has messages, update the messages subject
          if (response.chat.messages && response.chat.messages.length > 0) {
            this._messages.next(response.chat.messages);
          }
          
          // Join the chat room for real-time updates
          this.joinChat(chatId);
        }
      }),
      catchError(error => {
        console.error(`Error fetching chat ${chatId}:`, error);
        // Create empty chat object to satisfy type requirements
        const emptyChat: Chat = {
          _id: '',
          order: '',
          customer: '',
          chef: '',
          messages: [],
          lastActivity: new Date().toISOString(),
          isActive: false,
          deletedBy: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return of({ success: false, message: 'Failed to load chat', chat: emptyChat });
      })
    );
  }

  // Get messages for a specific chat
  getMessages(chatId: string): Observable<ChatMessagesResponse> {
    return this.http.get<ChatMessagesResponse>(`${this.apiUrl}/${chatId}/messages`).pipe(
      tap(response => {
        if (response.success) {
          this._messages.next(response.messages || []);
        }
      }),
      catchError(error => {
        console.error(`Error fetching messages for chat ${chatId}:`, error);
        // Return an empty successful response instead of throwing an error
        this._messages.next([]); // Set empty messages
        return of({ 
          success: true, 
          message: 'No messages available', 
          messages: [] 
        });
      })
    );
  }

  // Send a message
  sendMessage(chatId: string, content: string): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.apiUrl}/${chatId}/messages`, { content }).pipe(
      tap(response => {
        if (response.success) {
          // Add to messages list
          const currentMessages = [...this._messages.value];
          // Check if response has newMessage property
          const messageToAdd = response.newMessage || response.sentMessage;
          if (messageToAdd) {
            currentMessages.push(messageToAdd);
            this._messages.next(currentMessages);
            
            // Update chat with latest message
            this.updateChatWithNewMessage(chatId, messageToAdd);
            
            // Emit the message through socket for real-time delivery
            if (this.socket) {
              console.log('Emitting sendMessage event via socket for message:', messageToAdd._id);
              this.socket.emit('sendMessage', { 
                chatId, 
                messageId: messageToAdd._id,
                content: messageToAdd.content 
              });
            }
          }
        }
      }),
      catchError(error => {
        console.error(`Error sending message to chat ${chatId}:`, error);
        return of({ success: false, message: 'Failed to send message' });
      })
    );
  }

  // Mark all messages in a chat as read
  markChatAsRead(chatId: string): Observable<MarkAsReadResponse> {
    return this.http.patch<MarkAsReadResponse>(`${this.apiUrl}/${chatId}/read`, {}).pipe(
      tap(response => {
        if (response.success) {
          // Update read status for all messages in current chat
          const updatedMessages = this._messages.value.map(msg => {
            const currentUserId = this.tokenService.getUser()?._id;
            if (currentUserId && (!msg.readBy || !msg.readBy.includes(currentUserId))) {
              return { 
                ...msg, 
                readBy: [...(msg.readBy || []), currentUserId]
              };
            }
            return msg;
          });
          this._messages.next(updatedMessages);
          
          // Update unread count in active chats list
          const updatedChats = this._activeChats.value.map(chat => {
            if (chat._id === chatId) {
              return { ...chat, unreadCount: 0 };
            }
            return chat;
          });
          this._activeChats.next(updatedChats);
          
          // Recalculate total unread count
          this.refreshUnreadCounts();
          
          // Emit through socket that messages have been read
          if (this.socket) {
            const messageIds = this._messages.value
              .filter(msg => {
                const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
                return senderId !== this.tokenService.getUser()?._id;
              })
              .map(msg => msg._id);
              
            if (messageIds.length > 0) {
              console.log('Emitting markAsRead event via socket for messages:', messageIds.length);
              this.socket.emit('markAsRead', { 
                chatId, 
                messageIds,
                userId: this.tokenService.getUser()?._id
              });
            }
          }
        }
      }),
      catchError(error => {
        console.error(`Error marking chat ${chatId} as read:`, error);
        return of({ success: false, message: 'Failed to mark messages as read' });
      })
    );
  }

  // Delete a message
  deleteMessage(chatId: string, messageId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${chatId}/messages/${messageId}`).pipe(
      tap(response => {
        if (response.success) {
          // Remove from messages list
          const updatedMessages = this._messages.value.filter(msg => msg._id !== messageId);
          this._messages.next(updatedMessages);
          
          // Emit through socket for real-time update
          if (this.socket) {
            console.log('Emitting deleteMessage event via socket for message:', messageId);
            this.socket.emit('deleteMessage', { 
              chatId, 
              messageId,
              userId: this.tokenService.getUser()?._id
            });
          }
        }
      }),
      catchError(error => {
        console.error(`Error deleting message ${messageId} from chat ${chatId}:`, error);
        return of({ success: false });
      })
    );
  }

  // Delete/hide a chat for the current user (soft delete)
  deleteChat(chatId: string): Observable<{success: boolean, message?: string}> {
    return this.http.delete<{success: boolean, message?: string}>(`${this.apiUrl}/${chatId}`).pipe(
      tap(response => {
        if (response.success) {
          // Remove the chat from the active chats list in the UI
          const updatedChats = this._activeChats.value.filter(chat => chat._id !== chatId);
          this._activeChats.next(updatedChats);
          
          // Recalculate unread counts
          this.refreshUnreadCounts();
          
          // Leave the chat room if currently joined
          this.leaveChat(chatId);
          
          // Remove from active rooms
          this._activeRooms = this._activeRooms.filter(id => id !== chatId);
          
          // Notify via socket that this user has deleted the chat
          if (this.socket) {
            this.socket.emit('chatDeleted', {
              chatId,
              userId: this.tokenService.getUser()?._id
            });
          }
          
          console.log(`Chat ${chatId} removed from active chats for current user`);
        }
      }),
      catchError(error => {
        console.error(`Error deleting chat ${chatId}:`, error);
        return of({ success: false, message: 'Failed to delete chat' });
      })
    );
  }

  // Create a chat for an order (usually called after checkout)
  createOrderChat(orderId: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/order/${orderId}`, {}).pipe(
      tap(response => {
        if (response.success && response.chat) {
          // Add to active chats list
          const currentChats = [...this._activeChats.value];
          currentChats.push(response.chat);
          this._activeChats.next(currentChats);
          
          // Join the chat room
          this.joinChat(response.chat._id);
        }
      }),
      catchError(error => {
        console.error(`Error creating chat for order ${orderId}:`, error);
        // Create empty chat object to satisfy type requirements
        const emptyChat: Chat = {
          _id: '',
          order: '',
          customer: '',
          chef: '',
          messages: [],
          lastActivity: new Date().toISOString(),
          isActive: false,
          deletedBy: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return of({ success: false, message: 'Failed to create chat', chat: emptyChat });
      })
    );
  }

  // Update active chats when a new message is received
  private updateChatWithNewMessage(chatId: string, message: ChatMessage): void {
    const currentChats = [...this._activeChats.value];
    const chatIndex = currentChats.findIndex(chat => chat._id === chatId);
    
    if (chatIndex !== -1) {
      // Update last message and unread count
      const chat = currentChats[chatIndex];
      const userId = this.tokenService.getUser()?._id;
      
      // Increment unread count if message is from someone else
      let senderId: string;
      if (typeof message.sender === 'string') {
        senderId = message.sender;
      } else if (message.sender && typeof message.sender === 'object' && '_id' in message.sender) {
        senderId = message.sender._id;
      } else {
        senderId = '';
      }
      
      const unreadCount = chat.unreadCount || 0;
      const newUnreadCount = senderId !== userId ? unreadCount + 1 : unreadCount;
      
      // Update chat with new message info
      currentChats[chatIndex] = {
        ...chat,
        lastMessage: message,
        unreadCount: newUnreadCount,
        lastActivity: message.createdAt
      };
      
      // Move this chat to the top of the list
      const updatedChat = currentChats.splice(chatIndex, 1)[0];
      currentChats.unshift(updatedChat);
      
      // Update chat list
      this._activeChats.next(currentChats);
      
      // Recalculate total unread count
      this.refreshUnreadCounts();
    } else {
      // Chat not in list, refresh chats from server
      console.log('Chat not found in active chats, refreshing from server...');
      this.getChats().subscribe();
    }
  }

  // Recalculate total unread messages count
  private refreshUnreadCounts(): void {
    const unreadTotal = this._activeChats.value.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    this._unreadCount.next(unreadTotal);
  }

  // Clean up when service is destroyed
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.socketInitialized = false;
      this._activeRooms = [];
    }
  }
  
  // Force reconnect the socket - can be called when experiencing connectivity issues
  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socketInitialized = false;
    this.initializeSocket();
    
    // Rejoin active rooms
    setTimeout(() => {
      if (this._currentChat.value) {
        this.joinChat(this._currentChat.value._id);
      }
    }, 1000);
  }
}