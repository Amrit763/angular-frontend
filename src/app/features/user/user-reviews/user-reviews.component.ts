// src/app/features/user/user-reviews/user-reviews.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ReviewService } from '../../../core/services/review.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Review } from '../../../core/models/review.model';
import { Order } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { ReviewFormComponent } from '../../reviews/review-form/review-form.component';

interface ReviewableProduct {
  orderId: string;
  product: Product;
  orderDate: string;
}

@Component({
  selector: 'app-user-reviews',
  templateUrl: './user-reviews.component.html',
  styleUrls: ['./user-reviews.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReviewFormComponent
  ]
})
export class UserReviewsComponent implements OnInit {
  reviews: Review[] = [];
  isLoading = true;
  error: string | null = null;
  currentPage = 1;
  totalPages = 1;
  limit = 6; // Changed from 10 to 6 for pagination (show pagination when more than 6 reviews)
  totalReviews = 0;
  
  isDeleteDialogOpen = false;
  reviewToDelete: string | null = null;
  isDeleting = false;
  
  // Pending reviews
  pendingReviews: ReviewableProduct[] = [];
  loadingPendingReviews = false;
  
  // Review form
  showReviewForm = false;
  selectedOrderId = '';
  selectedProductId = '';
  selectedProduct: Product | null = null;
  activeTabIndex = 0; // 0 = My Reviews, 1 = Pending Reviews

  constructor(
    private reviewService: ReviewService,
    public productService: ProductService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadReviews();
    this.loadPendingReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = null;
    
    this.reviewService.getUserReviews(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.reviews = response.reviews;
        this.totalReviews = response.count;
        this.totalPages = Math.ceil(response.count / this.limit);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load your reviews';
        this.isLoading = false;
      }
    });
  }
  
  loadPendingReviews(): void {
    this.loadingPendingReviews = true;
    this.pendingReviews = [];
    
    // Get all orders first
    this.orderService.getUserOrders().pipe(
      map(response => response.orders.filter(order => {
        // Check if main order is delivered
        if (order.status === 'delivered') return true;
        
        // Or check if any chef items are delivered
        if (order.chefItems && order.chefItems.length > 0) {
          return order.chefItems.some(chefGroup => chefGroup.status === 'delivered');
        }
        
        return false;
      })),
      switchMap(deliveredOrders => {
        if (deliveredOrders.length === 0) {
          return of([]);
        }
        
        // For each delivered order, check each product
        const reviewCheckRequests: any[] = [];
        
        deliveredOrders.forEach(order => {
          // Process chef items that are delivered
          if (order.chefItems && order.chefItems.length > 0) {
            order.chefItems.forEach(chefGroup => {
              // Only process delivered chef groups
              if (chefGroup.status === 'delivered') {
                chefGroup.items.forEach(item => {
                  // Only add items with valid product info
                  if (item.product && item.product._id) {
                    const productId = item.product._id;
                    const product = item.product;
                    
                    reviewCheckRequests.push(
                      this.reviewService.canReviewProduct(order._id, productId).pipe(
                        map(response => ({
                          orderId: order._id,
                          productId: productId,
                          product: product,
                          orderDate: order.createdAt,
                          canReview: response.canReview
                        })),
                        catchError(() => of(null))
                      )
                    );
                  }
                });
              }
            });
          }
        });
        
        if (reviewCheckRequests.length === 0) {
          return of([]);
        }
        
        return forkJoin(reviewCheckRequests);
      })
    ).subscribe({
      next: (results) => {
        // Filter out null results and products that can't be reviewed
        this.pendingReviews = results
          .filter(result => result !== null && result.canReview)
          .map(result => ({
            orderId: result.orderId,
            product: result.product,
            orderDate: result.orderDate
          }));
        
        this.loadingPendingReviews = false;
      },
      error: (err) => {
        console.error('Error loading pending reviews:', err);
        this.loadingPendingReviews = false;
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.loadReviews();
  }
  
  setActiveTab(index: number): void {
    this.activeTabIndex = index;
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  // Open delete confirmation dialog
  openDeleteDialog(reviewId: string): void {
    this.reviewToDelete = reviewId;
    this.isDeleteDialogOpen = true;
  }

  // Close delete confirmation dialog
  closeDeleteDialog(): void {
    this.reviewToDelete = null;
    this.isDeleteDialogOpen = false;
  }

  // Delete a review
  deleteReview(): void {
    if (!this.reviewToDelete) return;
    
    this.isDeleting = true;
    
    this.reviewService.deleteReview(this.reviewToDelete).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Review deleted successfully');
          // Remove the deleted review from the list
          this.reviews = this.reviews.filter(review => review._id !== this.reviewToDelete);
          this.totalReviews--;
          this.totalPages = Math.ceil(this.totalReviews / this.limit);
          
          // If we've deleted the last review on this page and there are more pages, go to the previous page
          if (this.reviews.length === 0 && this.currentPage > 1) {
            this.currentPage--;
            this.loadReviews();
          }
          
          // Refresh pending reviews as this product might become reviewable again
          this.loadPendingReviews();
        } else {
          this.toastService.showError(response.message || 'Failed to delete review');
        }
        this.isDeleting = false;
        this.closeDeleteDialog();
      },
      error: (err) => {
        this.toastService.showError(err.message || 'Failed to delete review');
        this.isDeleting = false;
        this.closeDeleteDialog();
      }
    });
  }
  
  // Open review form for a pending review
  openReviewForm(orderId: string, product: Product): void {
    if (!product || !product._id) {
      this.toastService.showError('Invalid product information');
      return;
    }
    
    this.selectedOrderId = orderId;
    this.selectedProductId = product._id;
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
      
      // Remove the product from pending reviews
      if (this.selectedOrderId && this.selectedProductId) {
        this.pendingReviews = this.pendingReviews.filter(
          item => !(item.orderId === this.selectedOrderId && 
                   item.product && 
                   item.product._id === this.selectedProductId)
        );
      }
      
      // Refresh the reviews list to include the new review
      this.loadReviews();
    }
  }
  
  // Navigate to order details
  viewOrder(orderId: string): void {
    this.router.navigate(['/user/orders', orderId]);
  }
}