// src/app/core/services/chat.service.ts
import { Injectable } from '@angular/core';
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
  private _activeChats = new BehaviorSubject<Chat[]>([]);
  private _currentChat = new BehaviorSubject<Chat | null>(null);
  private _messages = new BehaviorSubject<ChatMessage[]>([]);
  private _unreadCount = new BehaviorSubject<number>(0);
  
  // Expose as observables
  public activeChats$ = this._activeChats.asObservable();
  public currentChat$ = this._currentChat.asObservable();
  public messages$ = this._messages.asObservable();
  public unreadCount$ = this._unreadCount.asObservable();
  public unreadTotal$ = this._unreadCount.asObservable(); // Alias for compatibility

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  // Get the socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Initialize socket connection with auth token
  initializeSocket(): void {
    const token = this.tokenService.getToken();
    if (token && !this.socket) {
      this.socket = io(environment.apiUrl, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      // Set up socket event listeners
      this.setupSocketEvents();
      
      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Socket connected');
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
  }

  // Set up socket event listeners
  private setupSocketEvents(): void {
    if (!this.socket) return;

    // Listen for new messages
    this.socket.on('newMessage', (data: { message: ChatMessage, chatId: string }) => {
      console.log('New message received via socket:', data);
      
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

    // Listen for messages marked as read
    this.socket.on('messagesRead', (data: { chatId: string, messageIds: string[], userId: string }) => {
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

    // Listen for deleted messages
    this.socket.on('messageDeleted', (data: { chatId: string, messageId: string }) => {
      if (this._currentChat.value && this._currentChat.value._id === data.chatId) {
        // Remove deleted message from current conversation
        const updatedMessages = this._messages.value.filter(msg => msg._id !== data.messageId);
        this._messages.next(updatedMessages);
      }
    });
  }

  // Join a chat room when entering a conversation
  joinChat(chatId: string): void {
    if (this.socket) {
      console.log(`Joining chat room: ${chatId}`);
      this.socket.emit('joinChat', chatId);
    } else {
      console.log('Socket not connected, waiting...');
      // Try to reconnect and join
      this.initializeSocket();
      setTimeout(() => {
        if (this.socket) {
          this.socket.emit('joinChat', chatId);
        }
      }, 1000);
    }
  }

  // Leave a chat room when leaving a conversation
  leaveChat(chatId: string): void {
    if (this.socket) {
      console.log(`Leaving chat room: ${chatId}`);
      this.socket.emit('leaveChat', chatId);
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
              this.socket.emit('sendMessage', { chatId, messageId: messageToAdd._id });
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

  // Create a chat for an order (usually called after checkout)
  createOrderChat(orderId: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/order/${orderId}`, {}).pipe(
      tap(response => {
        if (response.success && response.chat) {
          // Add to active chats list
          const currentChats = [...this._activeChats.value];
          currentChats.push(response.chat);
          this._activeChats.next(currentChats);
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
      this.socket.disconnect();
      this.socket = null;
    }
  }
}