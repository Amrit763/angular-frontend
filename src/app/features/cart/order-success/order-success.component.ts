// src/app/features/cart/order-success/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ChatService } from '../../../core/services/chat.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class OrderSuccessComponent implements OnInit {
  orderId: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  chatCreated: boolean = false;
  chatId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private chatService: ChatService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId = id;
        this.checkChatStatus();
      } else {
        this.error = 'Order ID not found';
        this.isLoading = false;
      }
    });
  }

  checkChatStatus(): void {
    // First check if chat already exists for this order
    this.chatService.getChats().subscribe({
      next: (response) => {
        if (response.success) {
          const existingChat = response.chats.find(chat => 
            chat.order && chat.order._id === this.orderId
          );
          
          if (existingChat) {
            this.chatCreated = true;
            this.chatId = existingChat._id;
            this.isLoading = false;
          } else {
            this.createOrderChat();
          }
        } else {
          this.createOrderChat();
        }
      },
      error: (err) => {
        this.error = err.message || 'Failed to check chat status';
        this.isLoading = false;
      }
    });
  }

  createOrderChat(): void {
    this.chatService.createOrderChat(this.orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.chatCreated = true;
          // Refresh chats to get the new chat ID
          this.chatService.loadChats();
          this.chatService.chats$.subscribe(chats => {
            const newChat = chats.find(chat => 
              chat.order && chat.order._id === this.orderId
            );
            if (newChat) {
              this.chatId = newChat._id;
            }
            this.isLoading = false;
          });
        } else {
          this.error = response.message || 'Failed to create chat';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = err.message || 'Failed to create chat';
        this.isLoading = false;
      }
    });
  }

  goToChat(): void {
    if (this.chatId) {
      this.router.navigate(['/user/chats', this.chatId]);
    } else {
      this.toastService.showError('Chat not found');
    }
  }

  viewOrder(): void {
    this.router.navigate(['/user/orders', this.orderId]);
  }
}