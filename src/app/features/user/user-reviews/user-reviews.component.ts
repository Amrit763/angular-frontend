// src/app/features/user/user-reviews/user-reviews.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ReviewService } from '../../../core/services/review.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Review } from '../../../core/models/review.model';
import { Order } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map, filter } from 'rxjs/operators';

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
    RouterModule
  ]
})
export class UserReviewsComponent implements OnInit {
  reviews: Review[] = [];
  isLoading = true;
  error: string | null = null;
  currentPage = 1;
  totalPages = 1;
  limit = 6;
  totalReviews = 0;
  
  isDeleteDialogOpen = false;
  reviewToDelete: string | null = null;
  isDeleting = false;
  
  // Pending reviews
  pendingReviews: ReviewableProduct[] = [];
  loadingPendingReviews = false;
  
  activeTabIndex = 0; // 0 = My Reviews, 1 = Pending Reviews

  constructor(
    private reviewService: ReviewService,
    public productService: ProductService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router
  ) { }

  // Handle router events to detect when a review is completed
  ngOnInit(): void {
    this.loadReviews();
    this.loadPendingReviews();
    
    // Check for completed reviews when navigating back to this page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.url.includes('/user/reviews'))
    ).subscribe(() => {
      console.log('Navigated back to reviews page - refreshing data');
      // Refresh both reviews and pending reviews
      this.loadReviews();
      this.loadPendingReviews();
    });
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
    
    // Get all orders
    this.orderService.getUserOrders().pipe(
      switchMap(response => {
        const allOrders = response.orders;
        console.log(`Found ${allOrders.length} total orders`);
        
        if (allOrders.length === 0) {
          return of([]);
        }
        
        // For each order, check all products that might be reviewable
        const reviewCheckRequests: any[] = [];
        
        allOrders.forEach(order => {
          // Only process orders with chef items
          if (!order.chefItems || order.chefItems.length === 0) {
            return;
          }
          
          // Check both the main order status and individual chef item status
          const isOrderDelivered = order.status === 'delivered';
          console.log(`Order ${order._id} status: ${order.status}, isDelivered: ${isOrderDelivered}`);
          
          // Process each chef group
          order.chefItems.forEach(chefGroup => {
            const isChefGroupDelivered = chefGroup.status === 'delivered';
            console.log(`  Chef group status: ${chefGroup.status}, isDelivered: ${isChefGroupDelivered}`);
            
            // Only process delivered chef groups OR if the main order is delivered
            if (isOrderDelivered || isChefGroupDelivered) {
              if (!chefGroup.items || chefGroup.items.length === 0) {
                return;
              }
              
              // Process each item in the chef group
              chefGroup.items.forEach(item => {
                // Skip items without product info
                if (!item.product) {
                  return;
                }
                
                // Extract product ID safely
                let productId = '';
                let product = null;
                
                if (typeof item.product === 'string') {
                  productId = item.product;
                  product = { _id: productId, name: 'Product' };
                } else if (typeof item.product === 'object' && item.product._id) {
                  if (typeof item.product._id === 'string') {
                    productId = item.product._id;
                  } else {
                    try {
                      productId = String(item.product._id);
                    } catch (e) {
                      console.error('Error converting product ID to string:', e);
                      return;
                    }
                  }
                  product = item.product;
                } else {
                  console.warn('Invalid product format:', item.product);
                  return;
                }
                
                if (!productId) {
                  return;
                }
                
                console.log(`    Checking if product ${productId} can be reviewed`);
                
                // Check if this product can be reviewed
                reviewCheckRequests.push(
                  this.reviewService.canReviewProduct(order._id, productId).pipe(
                    map(response => {
                      console.log(`    Product ${productId} can be reviewed: ${response.canReview}`);
                      return {
                        orderId: order._id,
                        productId: productId,
                        product: product,
                        orderDate: order.createdAt,
                        canReview: response.canReview
                      };
                    }),
                    catchError(error => {
                      console.error('Error checking if product can be reviewed:', error);
                      return of(null);
                    })
                  )
                );
              });
            }
          });
        });
        
        console.log(`Total review check requests: ${reviewCheckRequests.length}`);
        
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
        
        console.log(`Loaded ${this.pendingReviews.length} pending reviews:`, this.pendingReviews);
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
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'N/A';
    }
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
  
  // HELPER METHODS FOR ROBUST DATA HANDLING
  
  // Get object keys for debugging
  getObjectKeys(obj: any): string[] {
    if (!obj) return ['null'];
    return Object.keys(obj);
  }
  
  // Get product object keys for debugging
  getProductObjectKeys(item: any): string[] {
    if (!item || !item.product) return ['no_product'];
    return Object.keys(item.product);
  }
  
  // Get product debug info
  getProductDebugInfo(item: any): string {
    if (!item) return 'Item is null';
    if (!item.product) return 'No product property';
    return JSON.stringify(item.product);
  }
  
  // Check if product has images array
  hasProductImages(item: any): boolean {
    return item && 
           item.product && 
           item.product.images && 
           Array.isArray(item.product.images) && 
           item.product.images.length > 0;
  }
  
  // Check if product has direct imageUrl property
  hasProductImageUrl(item: any): boolean {
    return item && 
           item.product && 
           (item.product.imageUrl || item.product.image || item.product.thumbnail);
  }
  
  // Get product image URL safely
  getProductImageUrl(item: any): string {
    if (!this.hasProductImages(item)) return '/assets/images/placeholder.jpg';
    return this.productService.getImageUrl(item.product.images[0]);
  }
  
  // Get direct image URL if available
  getProductDirectImageUrl(item: any): string {
    if (!item || !item.product) return '/assets/images/placeholder.jpg';
    const url = item.product.imageUrl || item.product.image || item.product.thumbnail;
    return this.productService.getImageUrl(url);
  }
  
  // Get product name safely
  getProductName(item: any): string {
    if (!item) return 'Unknown Product';
    if (!item.product) return 'Unknown Product';
    
    // Try different possible property names
    return item.product.name || 
           item.product.productName || 
           item.product.title || 
           'Product';
  }
  
  // Get product category safely
  getProductCategory(item: any): string {
    if (!item || !item.product) return 'Category';
    
    // Try different possible property names
    return item.product.category || 
           item.product.productCategory || 
           item.product.type || 
           'Category';
  }
  
  // Get formatted order date safely
  getFormattedOrderDate(item: any): string {
    if (!item) return 'N/A';
    
    // Try different possible date properties
    const dateString = item.orderDate || 
                      (item.order && item.order.createdAt) || 
                      'N/A';
    
    return this.formatDate(dateString);
  }
  
  // Get order ID safely
  getOrderId(item: any): string {
    if (!item) return '';
    return item.orderId || 
          (item.order && (
            typeof item.order === 'string' ? item.order : 
            (item.order._id || '')
          )) || 
          '';
  }
  
  // Get product object safely
  getProductObject(item: any): any {
    if (!item) return null;
    return item.product || null;
  }

  // Navigate to review form - using the same approach as in order-detail component
  navigateToReviewPage(orderId: string, product: any): void {
    console.log('Navigating to review page with product:', product);

    // Check if product exists
    if (!product) {
      this.toastService.showError('Invalid product information: Product is missing');
      return;
    }

    // Extract product ID
    let productId = '';

    if (typeof product === 'string') {
      productId = product;
    } else if (typeof product === 'object' && product !== null) {
      productId = product._id ? this.extractStringId(product._id) : '';
    }

    if (!productId) {
      this.toastService.showError('Invalid product information: Product ID is missing');
      return;
    }

    // Check if product can be reviewed
    this.reviewService.canReviewProduct(orderId, productId).subscribe({
      next: (response) => {
        if (response.canReview) {
          // Navigate to review page with query parameters
          this.router.navigate(['/user/reviews/write'], {
            queryParams: {
              orderId: orderId,
              productId: productId
            }
          });
        } else {
          this.toastService.showInfo('You have already reviewed this product or it cannot be reviewed at this time.');
        }
      },
      error: (err) => {
        console.error('Error checking review eligibility:', err);
        this.toastService.showError('Could not verify if product can be reviewed. Please try again.');
      }
    });
  }
  
  /**
   * Helper to safely extract a string ID from various ID formats
   * Copied from OrderDetailComponent to ensure consistent behavior
   */
  extractStringId(id: any): string {
    // Handle undefined or null
    if (id === undefined || id === null) {
      return '';
    }

    // If already a string, return it
    if (typeof id === 'string') {
      return id;
    }

    // If it's a number, convert to string
    if (typeof id === 'number') {
      return String(id);
    }

    // If it's an object (potentially a MongoDB ObjectId)
    if (typeof id === 'object') {
      // Handle MongoDB ObjectId in various formats
      if (id.toString && typeof id.toString === 'function') {
        return id.toString();
      }

      // Handle serialized ObjectId
      if (id.$oid) {
        return id.$oid;
      }

      // Handle id property
      if (id.id) {
        return String(id.id);
      }

      // Last resort: JSON stringify
      try {
        return JSON.stringify(id);
      } catch {
        return '';
      }
    }

    // Default fallback
    return String(id);
  }
  
  // Navigate to order details
  viewOrder(orderId: string): void {
    this.router.navigate(['/user/orders', orderId]);
  }
}