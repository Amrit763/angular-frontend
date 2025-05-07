// src/app/features/cart/order-success/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ChatService } from '../../../core/services/chat.service';
import { Order } from '../../../core/models/order.model';
import { Chat } from '../../../core/models/chat.model';

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
  order: Order | null = null;
  chat: Chat | null = null;
  isLoading = true;
  isChatLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId = id;
        this.loadOrderDetails();
        this.findOrderChat();
      }
    });
  }

  // Load order details
  loadOrderDetails(): void {
    this.isLoading = true;
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (response) => {
        this.order = response.order;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load order details';
        this.isLoading = false;
      }
    });
  }

  // Find chat for this order
  findOrderChat(): void {
    this.isChatLoading = true;
    
    // First get all chats
    this.chatService.getChats().subscribe({
      next: (response) => {
        // Filter chats to find one matching this order
        const chatForOrder = response.chats.find(chat => {
          // Check if chat.order is a string (ID) or object
          if (typeof chat.order === 'string') {
            return chat.order === this.orderId;
          } else if (chat.order && chat.order._id) {
            return chat.order._id === this.orderId;
          }
          return false;
        });
        
        this.chat = chatForOrder || null;
        this.isChatLoading = false;
      },
      error: (err) => {
        console.error('Failed to load chats:', err);
        this.isChatLoading = false;
      }
    });
  }

  // Format timestamp for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  // Get status label
  getOrderStatusLabel(): string {
    if (!this.order) return 'Unknown';
    return this.orderService.getStatusLabel(this.order.status);
  }

  // Get status badge class
  getOrderStatusClass(): string {
    if (!this.order) return 'bg-secondary';
    return this.orderService.getStatusClass(this.order.status);
  }
}