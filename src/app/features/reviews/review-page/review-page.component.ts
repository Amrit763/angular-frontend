// src/app/features/reviews/review-page/review-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { ReviewService } from '../../../core/services/review.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';
import { ReviewFormComponent } from '../review-form/review-form.component';

@Component({
  selector: 'app-review-page',
  templateUrl: './review-page.component.html',
  styleUrls: ['./review-page.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReviewFormComponent
  ]
})
export class ReviewPageComponent implements OnInit {
  orderId: string = '';
  productId: string = '';
  product: Product | null = null;
  reviewId: string | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService,
    private reviewService: ReviewService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // Get parameters from route
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'] || '';
      this.productId = params['productId'] || '';
      this.reviewId = params['reviewId'] || null;
      
      console.log('Review page initialized with:', {
        orderId: this.orderId,
        productId: this.productId,
        reviewId: this.reviewId
      });
      
      if (!this.orderId || !this.productId) {
        this.error = 'Missing order or product information';
        this.isLoading = false;
        return;
      }
      
      this.loadProductDetails();
    });
  }

  loadProductDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    // Get product details
    this.productService.getProductById(this.productId).subscribe({
      next: (response) => {
        if (response.success) {
          this.product = response.product;
          console.log('Product loaded:', this.product);
          this.isLoading = false;
        } else {
          this.error = 'Failed to load product details';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error = err.message || 'Failed to load product details';
        this.isLoading = false;
      }
    });
  }

  onReviewSubmitted(success: boolean): void {
    if (success) {
      this.toastService.showSuccess('Review submitted successfully!');
      // Navigate back to order detail page
      this.router.navigate(['/user/orders', this.orderId]);
    }
  }

  onCancelled(): void {
    // Navigate back to order detail page
    this.router.navigate(['/user/orders', this.orderId]);
  }
}