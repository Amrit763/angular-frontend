// src/app/features/chef/chef-order-management/chef-order-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { TokenService } from '../../../core/auth/token.service';
import { Order, OrderItem, OrderStatus } from '../../../core/models/order.model';
import { Router } from '@angular/router';

interface StatusOption {
  value: 'all' | OrderStatus;
  label: string;
}

@Component({
  selector: 'app-chef-order-management',
  templateUrl: './chef-order-management.component.html',
  styleUrls: ['./chef-order-management.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class ChefOrderManagementComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  error: string | null = null;
  statusFilter: 'all' | OrderStatus = 'all';
  chefId: string = '';
  
  // Track status updates in progress
  updatingOrderStatus: { [key: string]: boolean } = {};
  deletingOrder: { [key: string]: boolean } = {};
  
  // Status filter options
  statusOptions: StatusOption[] = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'received', label: 'Received' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'ready', label: 'Ready for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    public orderService: OrderService,
    public productService: ProductService,
    private tokenService: TokenService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.tokenService.getUser();
    if (user && user._id) {
      this.chefId = user._id;
    }
    
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    
    this.orderService.getChefOrders().subscribe({
      next: (response) => {
        if (response && response.orders) {
          this.orders = response.orders;
          this.applyFilters();
        } else {
          this.error = 'Invalid response format from server';
          this.orders = [];
          this.filteredOrders = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading chef orders:', err);
        this.error = err.message || 'An error occurred while loading orders';
        this.orders = [];
        this.filteredOrders = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    if (this.statusFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      // Filter by chef-specific status
      this.filteredOrders = this.orders.filter(order => {
        const chefGroup = this.findChefGroup(order);
        return chefGroup && chefGroup.status === this.statusFilter;
      });
    }
    
    // Sort by most recent first
    this.filteredOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Helper method to find the chef's group consistently
  findChefGroup(order: Order): any {
    if (!order || !order.chefItems) return null;
    return order.chefItems.find(group => 
      group.chef && group.chef._id === this.chefId
    );
  }

  setStatusFilter(status: 'all' | OrderStatus): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    if (!orderId || !newStatus) {
      console.error('Invalid order ID or status');
      return;
    }
    
    // Set updating flag for this order
    this.updatingOrderStatus[orderId] = true;
    this.error = null;
    
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        if (response && response.order) {
          // Update the order in our list
          const index = this.orders.findIndex(order => order._id === orderId);
          if (index !== -1) {
            this.orders[index] = response.order;
            this.applyFilters();
          }
        } else {
          this.error = 'Invalid response from server when updating status';
        }
        // Clear updating flag
        this.updatingOrderStatus[orderId] = false;
      },
      error: (err) => {
        console.error('Update status error:', err);
        this.error = err.message || 'Failed to update order status';
        // Clear updating flag
        this.updatingOrderStatus[orderId] = false;
      }
    });
  }

  deleteOrder(orderId: string): void {
    if (!orderId) {
      console.error('Invalid order ID');
      return;
    }
    
    if (confirm('Are you sure you want to delete this order from your history? This action cannot be undone.')) {
      // Set deleting flag for this order
      this.deletingOrder[orderId] = true;
      this.error = null;
      
      this.orderService.deleteOrder(orderId).subscribe({
        next: (response) => {
          // Clear deleting flag
          this.deletingOrder[orderId] = false;
          
          if (response && response.success) {
            // Remove the order from our lists
            this.orders = this.orders.filter(order => order._id !== orderId);
            this.filteredOrders = this.filteredOrders.filter(order => order._id !== orderId);
          } else {
            this.error = (response && response.message) || 'Failed to delete the order';
          }
        },
        error: (err) => {
          // Clear deleting flag
          this.deletingOrder[orderId] = false;
          
          console.error('Delete order error:', err);
          this.error = err.message || 'Failed to delete the order. The server may not support this operation.';
        }
      });
    }
  }

  // Get the next status in the workflow for a specific order
  getNextStatus(order: Order): OrderStatus | null {
    if (!order) return null;
    
    const currentStatus = this.orderService.getChefStatus(order);
    if (!currentStatus) return null;
    
    const statusFlow: { [key in OrderStatus]: OrderStatus | null } = {
      'pending': 'received',
      'received': 'in_progress',
      'in_progress': 'ready',
      'ready': 'delivered',
      'delivered': null,
      'cancelled': null
    };
    
    return statusFlow[currentStatus];
  }

  // Check if a next status is available
  hasNextStatus(order: Order): boolean {
    if (!order) return false;
    
    const currentStatus = this.orderService.getChefStatus(order);
    if (!currentStatus) return false;
    
    return currentStatus !== 'delivered' && currentStatus !== 'cancelled';
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  // Calculate total items and amount for this chef in an order
  calculateOrderTotals(order: Order): { items: number, amount: number } {
    if (!order) return { items: 0, amount: 0 };
    
    const chefItems = this.orderService.getChefItems(order);
    if (!chefItems || chefItems.length === 0) return { items: 0, amount: 0 };
    
    const totalItems = chefItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = chefItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    
    return { items: totalItems, amount: totalAmount };
  }

  // Get count of orders with specific status
  getOrderCountByStatus(status: 'all' | OrderStatus): number {
    if (!this.orders || this.orders.length === 0) return 0;
    
    if (status === 'all') {
      return this.orders.length;
    }
    
    // Count orders where this chef's items have the specified status
    return this.orders.filter(order => {
      const chefGroup = this.findChefGroup(order);
      return chefGroup && chefGroup.status === status;
    }).length;
  }
}