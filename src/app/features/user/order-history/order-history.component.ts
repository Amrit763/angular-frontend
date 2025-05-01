// src/app/features/user/order-history/order-history.component.ts (Fixed)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { ReviewService } from '../../../core/services/review.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus, ChefItemGroup } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';
import { ReviewFormComponent } from '../../reviews/review-form/review-form.component';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReviewFormComponent
  ]
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  error: string | null = null;
  statusFilter: OrderStatus | 'all' = 'all';
  
  // Review form properties
  showReviewForm = false;
  selectedOrderId = '';
  selectedProductId = '';
  selectedProduct: Product | null = null;
  
  // Track review eligibility
  reviewableProducts: {[productId: string]: boolean} = {};

  constructor(
    public orderService: OrderService,
    public productService: ProductService,
    private reviewService: ReviewService,
    private router: Router,
    private toastService: ToastService
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
        
        // Check for reviewable products in delivered orders
        this.checkReviewableProducts();
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
          this.toastService.showSuccess('Order cancelled successfully');
        },
        error: (err) => {
          this.error = err.message || 'Failed to cancel the order';
          this.toastService.showError(err.message || 'Failed to cancel the order');
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
            this.toastService.showSuccess('Order deleted successfully');
          } else {
            const errorMsg = (response && response.message) || 'Failed to delete the order';
            this.error = errorMsg;
            this.isLoading = false;
            this.toastService.showError(errorMsg);
          }
        },
        error: (err) => {
          console.error('Delete order error:', err);
          const errorMsg = err.message || 'Failed to delete the order. The server may not support this operation.';
          this.error = errorMsg;
          this.isLoading = false;
          this.toastService.showError(errorMsg);
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
  
  // Check which products from delivered orders can be reviewed
  checkReviewableProducts(): void {
    // Find all delivered orders
    const deliveredOrders = this.orders.filter(order => order.status === 'delivered');
    
    // For each delivered order, check each product
    deliveredOrders.forEach(order => {
      if (!order.chefItems) return;
      
      order.chefItems.forEach(chefGroup => {
        chefGroup.items.forEach(item => {
          if (item.product && item.product._id) {
            // Check if this product can be reviewed
            this.checkCanReviewProduct(order._id, item.product._id);
          }
        });
      });
    });
  }
  
  // Check if a specific product can be reviewed
  checkCanReviewProduct(orderId: string, productId: string): void {
    this.reviewService.canReviewProduct(orderId, productId).subscribe({
      next: (response) => {
        this.reviewableProducts[productId] = response.canReview;
      },
      error: () => {
        // On error, assume product cannot be reviewed
        this.reviewableProducts[productId] = false;
      }
    });
  }
  
  // Check if a product can be reviewed
  canReviewProduct(productId: string): boolean {
    return this.reviewableProducts[productId] === true;
  }
  
  // Open review form for a product
  openReviewForm(orderId: string, productId: string, product: Product): void {
    this.selectedOrderId = orderId;
    this.selectedProductId = productId;
    this.selectedProduct = product;
    this.showReviewForm = true;
  }
  
  // Close review form
  closeReviewForm(): void {
    this.showReviewForm = false;
  }
  
  // Handle review submission
  onReviewSubmitted(success: boolean): void {
    if (success) {
      this.toastService.showSuccess('Review submitted successfully!');
      this.closeReviewForm();
      
      // Update reviewable status for this product
      if (this.selectedProductId) {
        this.reviewableProducts[this.selectedProductId] = false;
      }
    }
  }
  
  // Navigate to all user reviews
  goToUserReviews(): void {
    this.router.navigate(['/user/reviews']);
  }
}