// src/app/features/user/order-detail/order-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { ReviewService } from '../../../core/services/review.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { Product, ChefInfo } from '../../../core/models/product.model';
import { ChatService } from '../../../core/services/chat.service';
import { Chat } from '../../../core/models/chat.model';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class OrderDetailComponent implements OnInit {
  orderId: string = '';
  order: Order | null = null;
  isLoading = true;
  error: string | null = null;
  chatId: string | null = null;

  // Cancel order
  isCancelDialogOpen = false;
  isCancelling = false;

  // Review functionality
  reviewableProducts: { [productId: string]: boolean } = {};

  // Debug functionality
  showDebug = false;
  debugModalOpen = false;
  debugProduct: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    public productService: ProductService,
    private reviewService: ReviewService,
    private toastService: ToastService,
    private chatService: ChatService
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

    // Check if debug mode is enabled in localStorage
    this.showDebug = localStorage.getItem('orderDebug') === 'true';
  }

  loadOrderDetails(orderId: string): void {
    this.isLoading = true;
    this.error = null;

    this.orderService.getOrderById(orderId).subscribe({
      next: (response) => {
        this.order = response.order;
        console.log('Order details loaded:', this.order);

        // Validate and fix product IDs when the order loads
        this.validateOrderProducts();

        // Check which products can be reviewed
        this.checkReviewableProducts();

        // Load the associated chat for this order
        this.loadOrderChat();

        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load order details';
        this.isLoading = false;
      }
    });
  }

  // Check which products from delivered orders can be reviewed
  checkReviewableProducts(): void {
    if (!this.order || this.order.status !== 'delivered' || !this.order.chefItems) {
      return;
    }

    // Check each product in delivered chef groups
    this.order.chefItems.forEach(chefGroup => {
      if (chefGroup.status === 'delivered' && chefGroup.items) {
        chefGroup.items.forEach(item => {
          // Handle different formats of product data
          if (item.product) {
            let productId = this.getProductId(item.product);
            
            // Only proceed if we have a valid product ID
            if (productId) {
              this.checkCanReviewProduct(this.orderId, productId);
            }
          }
        });
      }
    });
  }

  // Check if a specific product can be reviewed
  checkCanReviewProduct(orderId: string, productId: string): void {
    this.reviewService.canReviewProduct(orderId, productId).subscribe({
      next: (response) => {
        this.reviewableProducts[productId] = response.canReview;
        console.log(`Product ${productId} can be reviewed: ${response.canReview}`);
      },
      error: (err) => {
        console.error('Error checking if product can be reviewed:', err);
        // On error, assume product cannot be reviewed
        this.reviewableProducts[productId] = false;
      }
    });
  }

  // Check if a product can be reviewed
  canReviewProduct(productId: string): boolean {
    if (!productId) return false;
    return this.reviewableProducts[productId] === true;
  }

  // NEW METHODS TO HANDLE PRODUCT PROPERTIES SAFELY

  // Get product ID safely
  getProductId(product: any): string {
    if (!product) return '';
    
    if (typeof product === 'string') {
      return product;
    }
    
    if (typeof product === 'object' && product._id) {
      return this.extractStringId(product._id);
    }
    
    return '';
  }

  // Get product name safely
  getProductName(product: any): string {
    if (!product) return 'Product';
    
    if (typeof product === 'string') {
      return 'Product';
    }
    
    if (typeof product === 'object' && product.name) {
      return product.name;
    }
    
    return 'Product';
  }

  // Get product category safely
  getProductCategory(product: any): string {
    if (!product) return 'Category';
    
    if (typeof product === 'string') {
      return 'Category';
    }
    
    if (typeof product === 'object' && product.category) {
      return product.category;
    }
    
    return 'Category';
  }

  // Check if product has images
  hasProductImage(product: any): boolean {
    if (!product) return false;
    
    if (typeof product === 'string') {
      return false;
    }
    
    if (typeof product === 'object' && product.images && product.images.length > 0) {
      return true;
    }
    
    return false;
  }

  // Get product image URL safely
  getProductImageUrl(product: any): string {
    if (!this.hasProductImage(product)) {
      return '';
    }
    
    // Use first image from the product's images array
    return this.productService.getImageUrl(product.images[0]);
  }

  /**
   * Helper to safely extract a string ID from various ID formats
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

  /**
   * Validates and fixes product object references in the order
   * This ensures all product IDs are strings and all required properties exist
   */
  validateOrderProducts(): void {
    if (!this.order || !this.order.chefItems) return;

    // Loop through all chef items and validate products
    this.order.chefItems.forEach(chefGroup => {
      if (!chefGroup.items) return;

      chefGroup.items.forEach(item => {
        // Skip if product is missing completely
        if (!item.product) return;

        // Special case: if product is a string instead of an object, convert it to an object with _id
        if (typeof item.product === 'string') {
          console.log(`Converting string product to object: ${item.product}`);
          const productId = item.product;
          item.product = {
            _id: productId,
            name: 'Product ' + (typeof productId === 'string' ? (productId as string).substring(0, 8) : String(productId)),
            description: 'No description available',
            price: item.price || 0,
            category: 'Unknown',
            chef: (typeof chefGroup.chef === 'object' && chefGroup.chef) ?
              (chefGroup.chef as ChefInfo) :
              { _id: 'unknown', fullName: 'Unknown Chef' },
            images: [],
            ingredients: [],
            allergens: [],
            condiments: [],
            preparationTime: 30,
            servingSize: '1 serving',
            isAvailable: true,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            rating: 0,
            reviewCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return;
        }

        // Fix potential MongoDB ObjectId format
        if (item.product._id !== undefined && item.product._id !== null) {
          const originalId = item.product._id;
          const stringId = this.extractStringId(originalId);

          if (stringId && stringId !== originalId) {
            console.log(`Fixed product ID format: ${JSON.stringify(originalId)} -> ${stringId}`);
            item.product._id = stringId;
          }
        }
      });
    });
  }

  // Helper to get object keys for debugging
  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  // Toggle debug mode
  toggleDebug(): void {
    this.showDebug = !this.showDebug;
    localStorage.setItem('orderDebug', this.showDebug.toString());
  }

  // Show debug modal for a product
  showProductDebug(product: any): void {
    this.debugProduct = product;
    this.debugModalOpen = true;
    console.log('Debug product:', product);
  }

  // Close debug modal
  closeDebugModal(): void {
    this.debugModalOpen = false;
    this.debugProduct = null;
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  // Get appropriate badge class based on order status
  getStatusBadgeClass(status: OrderStatus): string {
    return this.orderService.getStatusClass(status);
  }

  // Get status label for display
  getStatusLabel(status: OrderStatus): string {
    return this.orderService.getStatusLabel(status);
  }

  // Go back to orders list
  goBack(): void {
    this.router.navigate(['/user/orders']);
  }

  // Open cancel confirmation dialog
  openCancelDialog(): void {
    this.isCancelDialogOpen = true;
  }

  // Close cancel confirmation dialog
  closeCancelDialog(): void {
    this.isCancelDialogOpen = false;
  }

  // Cancel order
  cancelOrder(): void {
    if (!this.orderId) return;

    this.isCancelling = true;

    this.orderService.cancelOrder(this.orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Order cancelled successfully');
          // Reload order details to show updated status
          this.loadOrderDetails(this.orderId);
        } else {
          this.toastService.showError('Failed to cancel order');
        }
        this.isCancelling = false;
        this.closeCancelDialog();
      },
      error: (err) => {
        this.toastService.showError(err.message || 'Failed to cancel order');
        this.isCancelling = false;
        this.closeCancelDialog();
      }
    });
  }

  /**
   * Navigate to the review page instead of showing a modal
   */
  navigateToReviewPage(orderId: string, product: any): void {
    console.log('Navigating to review page with product:', product);

    // Check if product exists
    if (!product) {
      this.toastService.showError('Invalid product information: Product is missing');
      return;
    }

    // Extract product ID
    let productId = this.getProductId(product);

    if (!productId) {
      this.toastService.showError('Invalid product information: Product ID is missing');
      return;
    }

    // First check if product can be reviewed
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

  // After order is loaded, find the associated chat
  loadOrderChat(): void {
    if (!this.order) return;

    this.chatService.getChats().subscribe({
      next: (response) => {
        if (response.success) {
          const chat = response.chats.find(c =>
            c.order && typeof c.order !== 'string' && c.order._id === this.order?._id

          );

          if (chat) {
            this.chatId = chat._id;
          } else {
            // Chat doesn't exist yet, we can create it
            this.createOrderChat();
          }
        }
      },
      error: (err) => {
        console.error('Error checking for chat:', err);
      }
    });
  }

  // Create chat for order if it doesn't exist
  createOrderChat(): void {
    if (!this.order) return;

    this.chatService.createOrderChat(this.order._id).subscribe({
      next: (response) => {
        if (response.success) {
          // Refresh chats to get the new chat ID
          this.chatService.loadChats();
          this.chatService.activeChats$.subscribe((chats: Chat[]) => {
              const newChat = chats.find((chat: Chat) =>
                chat.order && typeof chat.order !== 'string' && chat.order._id === this.order?._id
            );
            if (newChat) {
              this.chatId = newChat._id;
            }
          });
        }
      },
      error: (err) => {
        console.error('Error creating chat:', err);
      }
    });
  }

  // Navigate to chat
  openChat(): void {
    if (this.chatId) {
      this.router.navigate(['/user/chats', this.chatId]);
    } else {
      this.toastService.showError('Chat not available yet. Please try again shortly.');
    }
  }

}