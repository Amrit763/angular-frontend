// src/app/features/reviews/review-form/review-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-review-form',
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ReviewFormComponent implements OnInit {
  @Input() orderId: string = ''; 
  @Input() productId: string = ''; 
  @Input() product: Product | null = null;
  @Input() reviewId?: string;
  @Input() initialRating = 0;
  @Input() initialComment = '';
  
  @Output() reviewSubmitted = new EventEmitter<boolean>();
  @Output() cancelled = new EventEmitter<void>();
  
  reviewForm!: FormGroup;
  
  selectedFiles: File[] = [];
  selectedFilePreviews: string[] = [];
  maxFiles = 5;
  isSubmitting = false;
  canReview = true;
  isEditMode = false;

  // Debug info
  debugInfo = '';

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    public productService: ProductService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    console.log("ReviewForm initialized with:", {
      orderId: this.orderId,
      productId: this.productId,
      product: this.product
    });
    
    // Initialize form with input values
    this.reviewForm = this.fb.group({
      rating: [this.initialRating || 0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: [this.initialComment || '', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
    
    this.isEditMode = !!this.reviewId;
    
    // Generate debug info
    this.debugInfo = `OrderID: ${this.orderId}, ProductID: ${this.productId}, ReviewID: ${this.reviewId}, Product: ${this.product ? 'present' : 'missing'}`;
    console.log(this.debugInfo);
    console.log('Form initialized with values:', this.reviewForm.value);
    console.log('Form valid:', this.reviewForm.valid);
    
    // If this is edit mode, load existing review
    if (this.isEditMode && this.reviewId) {
      this.loadReview(this.reviewId);
    }
  }
  
  // Load existing review for editing
  loadReview(reviewId: string): void {
    this.reviewService.getReviewById(reviewId).subscribe({
      next: (response) => {
        if (response.success && response.review) {
          const review = response.review;
          
          // Update form with existing review data
          this.reviewForm.patchValue({
            rating: review.rating,
            comment: review.comment
          });
          
          console.log('Loaded existing review data:', {
            rating: review.rating,
            comment: review.comment
          });
        }
      },
      error: (err) => {
        console.error('Error loading review:', err);
        this.toastService.showError('Failed to load review data');
      }
    });
  }

  onFileChange(event: any): void {
    if (event.target.files.length === 0) {
      return;
    }
    
    const files = event.target.files;
    const totalFiles = this.selectedFiles.length + files.length;
    
    if (totalFiles > this.maxFiles) {
      this.toastService.showError(`You can only upload a maximum of ${this.maxFiles} images.`);
      return;
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
        this.toastService.showError(`File "${file.name}" is not a valid image. Only JPEG, PNG and GIF images are allowed.`);
        continue;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.showError(`File "${file.name}" is too large. Maximum file size is 5MB.`);
        continue;
      }
      
      this.selectedFiles.push(file);
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFilePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFilePreviews.splice(index, 1);
  }

  onRatingClick(rating: number): void {
    console.log('Rating clicked:', rating);
    this.reviewForm.get('rating')?.setValue(rating);
    this.reviewForm.get('rating')?.markAsTouched();
    console.log('Form after rating click:', this.reviewForm.value);
    console.log('Form valid:', this.reviewForm.valid);
  }

  onSubmit(): void {
    console.log('Form submitted with values:', this.reviewForm.value);
    console.log('Form valid:', this.reviewForm.valid);
    
    // Mark all fields as touched to show validation errors
    Object.keys(this.reviewForm.controls).forEach(key => {
      const control = this.reviewForm.get(key);
      control?.markAsTouched();
    });
    
    if (this.reviewForm.invalid) {
      console.error('Form is invalid. Errors:', {
        rating: this.reviewForm.get('rating')?.errors,
        comment: this.reviewForm.get('comment')?.errors
      });
      
      // Show specific validation errors
      if (this.reviewForm.get('rating')?.invalid) {
        this.toastService.showError('Please select a star rating (1-5)');
      }
      
      if (this.reviewForm.get('comment')?.invalid) {
        this.toastService.showError('Please write a review comment (10-500 characters)');
      }
      
      return;
    }
    
    this.isSubmitting = true;
    const { rating, comment } = this.reviewForm.value;
    
    // Ensure we have valid IDs
    if (!this.orderId || !this.productId) {
      console.error('Missing required IDs:', { orderId: this.orderId, productId: this.productId });
      this.toastService.showError('Missing order or product information');
      this.isSubmitting = false;
      return;
    }
    
    if (this.isEditMode && this.reviewId) {
      // Update existing review
      this.reviewService.updateReview(
        this.reviewId,
        rating,
        comment,
        this.selectedFiles
      ).subscribe({
        next: (response) => {
          console.log('Review updated successfully:', response);
          this.isSubmitting = false;
          this.toastService.showSuccess('Your review has been updated successfully!');
          this.reviewSubmitted.emit(true);
        },
        error: (err) => {
          console.error('Error updating review:', err);
          this.isSubmitting = false;
          this.toastService.showError(err.message || 'Failed to update your review. Please try again.');
        }
      });
    } else {
      // Create new review
      this.reviewService.createReview(
        this.orderId,
        this.productId,
        rating,
        comment,
        this.selectedFiles
      ).subscribe({
        next: (response) => {
          console.log('Review created successfully:', response);
          this.isSubmitting = false;
          this.toastService.showSuccess('Your review has been submitted successfully!');
          this.reviewSubmitted.emit(true);
        },
        error: (err) => {
          console.error('Error submitting review:', err);
          this.isSubmitting = false;
          this.toastService.showError(err.message || 'Failed to submit your review. Please try again.');
        }
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}