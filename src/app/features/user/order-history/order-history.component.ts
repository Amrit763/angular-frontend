// src/app/features/user/order-history/order-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order, OrderStatus, ChefItemGroup } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  error: string | null = null;
  statusFilter: OrderStatus | 'all' = 'all';

  constructor(
    public orderService: OrderService,
    public productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getUserOrders().subscribe({
      next: (response) => {
        this.orders = response.orders;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred while loading orders';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    if (this.statusFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.statusFilter);
    }
    
    // Sort by most recent first
    this.filteredOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  setStatusFilter(status: OrderStatus | 'all'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  cancelOrder(orderId: string): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: (response) => {
          // Update the order in our list
          const index = this.orders.findIndex(order => order._id === orderId);
          if (index !== -1) {
            this.orders[index] = response.order;
            this.applyFilters();
          }
        },
        error: (err) => {
          this.error = err.message || 'Failed to cancel the order';
        }
      });
    }
  }

// Update the deleteOrder method
deleteOrder(orderId: string): void {
  if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
    this.isLoading = true;
    this.error = null;
    
    this.orderService.deleteOrder(orderId).subscribe({
      next: (response) => {
        if (response && response.success) {
          // Immediately remove from the local arrays without waiting for a refresh
          this.orders = this.orders.filter(order => order._id !== orderId);
          this.filteredOrders = this.filteredOrders.filter(order => order._id !== orderId);
          this.isLoading = false;
        } else {
          this.error = (response && response.message) || 'Failed to delete the order';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Delete order error:', err);
        this.error = err.message || 'Failed to delete the order. The server may not support this operation.';
        this.isLoading = false;
      }
    });
  }
}

  // Helper method for getting chef groups directly from order
  getChefGroups(order: Order): ChefItemGroup[] {
    if (!order.chefItems) return [];
    return order.chefItems;
  }

  // Get the status label for a chef group
  getChefStatusLabel(chefGroup: ChefItemGroup): string {
    return this.orderService.getStatusLabel(chefGroup.status);
  }

  // Get the status class for a chef group
  getChefStatusClass(chefGroup: ChefItemGroup): string {
    return this.orderService.getStatusClass(chefGroup.status);
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}