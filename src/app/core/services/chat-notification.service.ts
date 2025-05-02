// src/app/core/services/chat-notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { TokenService } from '../auth/token.service';

@Injectable({
  providedIn: 'root'
})
export class ChatNotificationService {
  private _userUnreadCount = new BehaviorSubject<number>(0);
  private _chefUnreadCount = new BehaviorSubject<number>(0);
  private _lastNotificationSound: number = 0;
  private _notificationAudio: HTMLAudioElement | null = null;

  // Expose observables
  public userUnreadCount$ = this._userUnreadCount.asObservable();
  public chefUnreadCount$ = this._chefUnreadCount.asObservable();

  constructor(
    private chatService: ChatService,
    private tokenService: TokenService
  ) {
    // Initialize audio element for notification sound
    if (typeof Audio !== 'undefined') {
      this._notificationAudio = new Audio('/assets/sounds/notification.mp3');
    }

    // Subscribe to chat service unread count
    this.chatService.unreadTotal$.subscribe(count => {
      const userRole = this.tokenService.getUserRole();
      
      if (userRole === 'user') {
        this._userUnreadCount.next(count);
      } else if (userRole === 'chef') {
        this._chefUnreadCount.next(count);
      }
    });

    // Subscribe to notifications for new messages
    this.chatService.initializeSocket();
    if (this.tokenService.isLoggedIn()) {
      this.setupSocketListeners();
    }
  }

  private setupSocketListeners(): void {
    // Listen for message notifications
    this.chatService.getSocket()?.on('messageNotification', (data) => {
      // Play notification sound with throttling (max once every 3 seconds)
      const now = Date.now();
      if (now - this._lastNotificationSound > 3000) {
        this.playNotificationSound();
        this._lastNotificationSound = now;
      }

      // Check if browser notifications are supported and permitted
      this.showBrowserNotification(data);
    });
  }

  // Play notification sound
  private playNotificationSound(): void {
    if (this._notificationAudio) {
      this._notificationAudio.currentTime = 0;
      this._notificationAudio.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
  }

  // Show browser notification if supported and permitted
  private showBrowserNotification(data: any): void {
    if (!('Notification' in window)) {
      return; // Browser doesn't support notifications
    }

    if (Notification.permission === 'granted') {
      this.createNotification(data);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(data);
        }
      });
    }
  }

  // Create the actual notification
  private createNotification(data: any): void {
    const sender = data.sender?.fullName || 'Someone';
    const content = data.message?.content || 'You have a new message';
    const orderId = data.chat?.order?._id?.slice(-8) || '';
    
    const title = `New message from ${sender}`;
    const options = {
      body: content,
      icon: '/assets/icons/chat-notification.png',
      badge: '/assets/icons/badge.png',
      tag: `chat-${data.chatId}`,
      data: { chatId: data.chatId }
    };

    const notification = new Notification(title, options);
    
    // Handle notification click
    notification.onclick = () => {
      window.focus();
      
      const userRole = this.tokenService.getUserRole();
      const route = userRole === 'chef' ? `/chef/chats/${data.chatId}` : `/user/chats/${data.chatId}`;
      
      // Navigate to chat (this is a bit tricky from service, may use a subject instead)
      window.location.href = route;
      
      notification.close();
    };
    
    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  // Request notification permission (can be called from a user gesture)
  requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.resolve('denied' as NotificationPermission);
    }
    
    return Notification.requestPermission();
  }

  // Get current count for a specific role
  getUnreadCount(role: 'user' | 'chef'): number {
    return role === 'user' 
      ? this._userUnreadCount.getValue()
      : this._chefUnreadCount.getValue();
  }

  // Get current notification permission status
  getNotificationPermission(): NotificationPermission | null {
    return ('Notification' in window) ? Notification.permission : null;
  }
}