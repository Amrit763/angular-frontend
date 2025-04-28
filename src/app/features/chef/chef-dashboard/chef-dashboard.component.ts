// src/app/features/chef/chef-dashboard/chef-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { TokenService } from '../../../core/auth/token.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';
import { User } from '../../../core/auth/user.model';

// Extend the User interface to include the rating property
interface ChefUser extends User {
  rating?: number;
}

@Component({
  selector: 'app-chef-dashboard',
  templateUrl: './chef-dashboard.component.html',
  styleUrls: ['./chef-dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ChefDashboardComponent implements OnInit {
  chef: ChefUser | null = null;
  today: Date = new Date();
  recentOrders: Order[] = [];
  products: Product[] = [];
  isLoading = true;
  error: string | null = null;
  updatingStatus: { [key: string]: boolean } = {};
  updatingAvailability: { [key: string]: boolean } = {};

  constructor(
    private orderService: OrderService,
    public productService: ProductService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    // Cast to ChefUser to include the rating property
    this.chef = this.tokenService.getUser() as ChefUser;
    this.loadRecentOrders();
    this.loadProducts();
  }

  loadRecentOrders(): void {
    this.orderService.getChefOrders().subscribe({
      next: (response) => {
        // Get most recent 5 orders
        this.recentOrders = response.orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      },
      error: (err) => {
        this.error = err.message || 'Failed to load orders';
      }
    });
  }

  loadProducts(): void {
    if (!this.chef?._id) return;
    
    this.productService.getChefProducts(this.chef._id).subscribe({
      next: (response) => {
        this.products = response.products;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load products';
        this.isLoading = false;
      }
    });
  }

  // Helper method to handle chef rating display safely
  getChefRating(): string {
    if (this.chef?.rating) {
      return this.chef.rating.toFixed(1);
    }
    return 'N/A';
  }

  // Helper method to safely get the first image from a product
  getProductFirstImage(product: Product): string | undefined {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return undefined;
  }

  getOrderItemCount(order: Order): string {
    const chefItems = this.orderService.getChefItems(order);
    const itemCount = chefItems.reduce((sum, item) => sum + item.quantity, 0);
    return `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
  }

  getOrderTotal(order: Order): number {
    const chefItems = this.orderService.getChefItems(order);
    return chefItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getStatusLabel(order: Order): string {
    const status = this.orderService.getChefStatus(order);
    return this.orderService.getStatusLabel(status);
  }

  getStatusBadgeClass(order: Order): string {
    const status = this.orderService.getChefStatus(order);
    return this.orderService.getStatusClass(status);
  }

  canUpdateOrderStatus(order: Order): boolean {
    const status = this.orderService.getChefStatus(order);
    return status !== 'delivered' && status !== 'cancelled';
  }

  getNextStatus(order: Order): OrderStatus | null {
    const currentStatus = this.orderService.getChefStatus(order);
    
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

  getNextActionLabel(order: Order): string {
    const nextStatus = this.getNextStatus(order);
    
    switch (nextStatus) {
      case 'received': return 'Accept';
      case 'in_progress': return 'Start';
      case 'ready': return 'Ready';
      case 'delivered': return 'Deliver';
      default: return 'Update';
    }
  }

  updateOrderStatus(order: Order): void {
    const nextStatus = this.getNextStatus(order);
    if (!nextStatus) return;
    
    this.updatingStatus[order._id] = true;
    
    this.orderService.updateOrderStatus(order._id, nextStatus).subscribe({
      next: (response) => {
        // Find and update the order in our list
        const index = this.recentOrders.findIndex(o => o._id === order._id);
        if (index !== -1) {
          this.recentOrders[index] = response.order;
        }
        this.updatingStatus[order._id] = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to update order status';
        this.updatingStatus[order._id] = false;
      }
    });
  }

  toggleProductAvailability(productId: string, event: any): void {
    const isAvailable = event.target.checked;
    this.updatingAvailability[productId] = true;
    
    this.productService.toggleAvailability(productId, isAvailable).subscribe({
      next: (response) => {
        // Update product in list
        const index = this.products.findIndex(p => p._id === productId);
        if (index !== -1) {
          this.products[index] = response.product;
        }
        this.updatingAvailability[productId] = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to update product availability';
        this.updatingAvailability[productId] = false;
        // Revert toggle
        event.target.checked = !isAvailable;
      }
    });
  }

  getActiveOrdersCount(): number {
    if (!this.recentOrders.length) return 0;
    
    return this.recentOrders.filter(order => {
      const status = this.orderService.getChefStatus(order);
      return ['pending', 'received', 'in_progress', 'ready'].includes(status);
    }).length;
  }

  getCompletedOrdersCount(): number {
    if (!this.recentOrders.length) return 0;
    
    return this.recentOrders.filter(order => {
      const status = this.orderService.getChefStatus(order);
      return status === 'delivered';
    }).length;
  }

  getActiveProductsCount(): number {
    if (!this.products.length) return 0;
    
    return this.products.filter(product => product.isAvailable).length;
  }
}