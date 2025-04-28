// src/app/features/chef/chef-order-detail/chef-order-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-chef-order-detail',
  templateUrl: './chef-order-detail.component.html',
  styleUrls: ['./chef-order-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ChefOrderDetailComponent implements OnInit {
  orderId: string = '';
  order: Order | null = null;
  isLoading = true;
  error: string | null = null;
  updatingStatus = false;
  deletingOrder = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public orderService: OrderService,
    public productService: ProductService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId = id;
        this.loadOrderDetails(id);
      } else {
        this.error = 'Order ID not found';
        this.isLoading = false;
      }
    });
  }

  loadOrderDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.orderService.getOrderById(id).subscribe({
      next: (response) => {
        this.order = response.order;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred while loading order details';
        this.isLoading = false;
      }
    });
  }

  updateOrderStatus(newStatus: OrderStatus): void {
    if (!this.order) return;
    
    this.updatingStatus = true;
    this.error = null;
    
    this.orderService.updateOrderStatus(this.order._id, newStatus).subscribe({
      next: (response) => {
        this.order = response.order;
        this.updatingStatus = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to update order status';
        this.updatingStatus = false;
      }
    });
  }

  // Updated delete method with improved error handling and loading state
  deleteOrder(): void {
    if (!this.order) return;
    
    if (confirm('Are you sure you want to delete this order from your history? This action cannot be undone.')) {
      this.deletingOrder = true;
      this.error = null;
      
      this.orderService.deleteOrder(this.order._id).subscribe({
        next: (response) => {
          this.deletingOrder = false;
          if (response && response.success) {
            // Navigate back to orders list
            this.router.navigate(['/chef/orders']);
          } else {
            this.error = (response && response.message) || 'Failed to delete the order';
          }
        },
        error: (err) => {
          this.deletingOrder = false;
          console.error('Delete order error:', err);
          this.error = err.message || 'Failed to delete the order. The server may not support this operation.';
        }
      });
    }
  }

  // Get the next status in the workflow
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

  // Check if a next status is available
  hasNextStatus(order: Order): boolean {
    const currentStatus = this.orderService.getChefStatus(order);
    return currentStatus !== 'delivered' && currentStatus !== 'cancelled';
  }

  // Calculate total amount for the chef's items in this order
  calculateOrderTotal(): number {
    if (!this.order) return 0;
    
    const chefItems = this.orderService.getChefItems(this.order);
    return chefItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  backToOrders(): void {
    this.router.navigate(['/chef/orders']);
  }
}