// src/app/features/user/edit-review/edit-review.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReviewFormComponent } from '../../reviews/review-form/review-form.component';
import { Product } from '../../../core/models/product.model';
import { Review } from '../../../core/models/review.model';

@Component({
  selector: 'app-edit-review',
  templateUrl: './edit-review.component.html',
  styleUrls: ['./edit-review.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReviewFormComponent
  ]
})
export class EditReviewComponent implements OnInit {
  reviewId: string = '';
  review: Review | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    public productService: ProductService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.reviewId = id;
        this.loadReview(id);
      } else {
        this.error = 'Review ID not found';
        this.isLoading = false;
      }
    });
  }

  loadReview(reviewId: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.reviewService.getReviewById(reviewId).subscribe({
      next: (response) => {
        this.review = response.review;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load review details';
        this.isLoading = false;
      }
    });
  }

  onReviewSubmitted(success: boolean): void {
    if (success) {
      this.toastService.showSuccess('Review updated successfully');
      this.router.navigate(['/user/reviews']);
    }
  }

  onCancelled(): void {
    this.router.navigate(['/user/reviews']);
  }
}