// src/app/core/services/review.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Review } from '../models/review.model';

export interface ReviewResponse {
  success: boolean;
  review: Review;
}

export interface ReviewsResponse {
  success: boolean;
  reviews: Review[];
  count: number;
  averageRating?: number;
}

export interface ReviewDeleteResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;
  private orderApiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  /**
   * Check if a product can be reviewed from a specific order
   * Enhanced with better error handling and logging
   */
  canReviewProduct(orderId: string, productId: string): Observable<{ success: boolean; canReview: boolean; reason?: string }> {
    console.log(`Checking if product ${productId} can be reviewed for order ${orderId}`);
    
    // Validate input
    if (!orderId || !productId) {
      console.error('Invalid parameters for canReviewProduct:', { orderId, productId });
      return of({ success: false, canReview: false, reason: 'Invalid order or product information' });
    }
    
    return this.http.get<{ success: boolean; canReview: boolean; reason?: string }>(
      `${this.orderApiUrl}/${orderId}/can-review/${productId}`
    ).pipe(
      tap(response => console.log('canReviewProduct response:', response)),
      catchError(error => {
        console.error('Error checking review eligibility:', error);
        return of({ success: false, canReview: true, reason: 'Unable to verify review eligibility, but allowing review' });
      })
    );
  }

  /**
   * Create a new review for a product
   * Enhanced with better error handling and logging
   */
  createReview(
    orderId: string,
    productId: string,
    rating: number,
    comment: string,
    images: File[] = []
  ): Observable<ReviewResponse> {
    console.log('Creating review with data:', { orderId, productId, rating, comment, imagesCount: images.length });
    
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('productId', productId);
    formData.append('rating', rating.toString());
    formData.append('comment', comment);
    
    // Append images if any
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append('reviewImages', images[i]);
      }
    }
    
    return this.http.post<ReviewResponse>(this.apiUrl, formData).pipe(
      tap(response => console.log('createReview response:', response)),
      catchError(error => {
        console.error('Error creating review:', error);
        throw error;
      })
    );
  }

  /**
   * Get reviews for a specific product
   */
  getProductReviews(productId: string, page: number = 1, limit: number = 10): Observable<ReviewsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<ReviewsResponse>(`${this.apiUrl}/product/${productId}`, { params });
  }

  /**
   * Get all reviews by the current user
   */
  getUserReviews(page: number = 1, limit: number = 10): Observable<ReviewsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<ReviewsResponse>(`${this.apiUrl}/user`, { params });
  }

  /**
   * Get a specific review by ID
   */
  getReviewById(reviewId: string): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/${reviewId}`);
  }

  /**
   * Update an existing review
   */
  updateReview(
    reviewId: string,
    rating: number,
    comment: string,
    images: File[] = []
  ): Observable<ReviewResponse> {
    console.log('Updating review with data:', { reviewId, rating, comment, imagesCount: images.length });
    
    const formData = new FormData();
    formData.append('rating', rating.toString());
    formData.append('comment', comment);
    
    // Append images if any
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append('reviewImages', images[i]);
      }
    }
    
    return this.http.put<ReviewResponse>(`${this.apiUrl}/${reviewId}`, formData).pipe(
      tap(response => console.log('updateReview response:', response)),
      catchError(error => {
        console.error('Error updating review:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a specific review
   */
  deleteReview(reviewId: string): Observable<ReviewDeleteResponse> {
    return this.http.delete<ReviewDeleteResponse>(`${this.apiUrl}/${reviewId}`);
  }
}