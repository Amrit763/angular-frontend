// src/app/features/reviews/review-list/review-list.component.ts
import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';
import { ProductService } from '../../../core/services/product.service';
import { TokenService } from '../../../core/auth/token.service';
import { ToastService } from '../../../core/services/toast.service';
import { Review } from '../../../core/models/review.model';

@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ReviewListComponent implements OnInit {
  @Input() productId!: string;
  @Input() limit: number = 10;
  
  reviews: Review[] = [];
  averageRating: number = 0;
  totalReviews: number = 0;
  isLoading = true;
  error: string | null = null;
  currentPage = 1;
  totalPages = 1;
  
  currentUserId = '';
  isDeleteDialogOpen = false;
  reviewToDelete: string | null = null;
  isDeleting = false;

  constructor(
    private reviewService: ReviewService,
    public productService: ProductService,
    private tokenService: TokenService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUserId();
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = null;
    
    this.reviewService.getProductReviews(this.productId, this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.reviews = response.reviews;
        this.totalReviews = response.count;
        this.averageRating = response.averageRating || 0;
        this.totalPages = Math.ceil(response.count / this.limit);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.message || 'Failed to load reviews';
        this.isLoading = false;
        this.cdr.markForCheck();
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

  // Helper method to check if review is owned by current user
  isOwnReview(review: Review): boolean {
    return review.user._id === this.currentUserId;
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  // Get an array of pages for pagination
  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, index) => index);
  }

  // Calculate rating distribution as a percentage
  getRatingPercentage(rating: number): number {
    if (this.totalReviews === 0) return 0;
    
    const count = this.getRatingCount(rating);
    return (count / this.totalReviews) * 100;
  }

  // Get count of reviews with a specific rating
  getRatingCount(rating: number): number {
    return this.reviews.filter(review => Math.round(review.rating) === rating).length;
  }

  // Open delete confirmation dialog
  openDeleteDialog(reviewId: string): void {
    this.reviewToDelete = reviewId;
    this.isDeleteDialogOpen = true;
    this.cdr.markForCheck();
  }

  // Close delete confirmation dialog
  closeDeleteDialog(): void {
    this.reviewToDelete = null;
    this.isDeleteDialogOpen = false;
    this.cdr.markForCheck();
  }

  // Delete a review
  deleteReview(): void {
    if (!this.reviewToDelete) return;
    
    this.isDeleting = true;
    this.cdr.markForCheck();
    
    this.reviewService.deleteReview(this.reviewToDelete).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showSuccess('Review deleted successfully');
          this.closeDeleteDialog();
          this.loadReviews(); // Reload reviews
        } else {
          this.toastService.showError(response.message || 'Failed to delete review');
        }
        this.isDeleting = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toastService.showError(err.message || 'Failed to delete review');
        this.isDeleting = false;
        this.closeDeleteDialog();
        this.cdr.markForCheck();
      }
    });
  }
}