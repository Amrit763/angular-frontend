// src/app/core/models/review.model.ts
import { Product } from './product.model';
import { User } from '../auth/user.model';

export interface Review {
  _id: string;
  user: User;
  product: Product;
  order: string;
  rating: number;
  comment: string;
  reviewImages?: string[];
  createdAt: string;
  updatedAt: string;
}

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