// src/app/core/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CartItem {
  _id: string;
  product: any;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  success: boolean;
  count: number;
  items: CartItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  
  // BehaviorSubject to store and emit cart data
  private cartSubject = new BehaviorSubject<CartResponse | null>(null);
  public cart$ = this.cartSubject.asObservable();
  
  // BehaviorSubject to store and emit cart item count
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load cart data when service initializes
    this.getCart().subscribe();
  }

  // Get all items in the cart
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl)
      .pipe(
        tap(response => {
          this.cartSubject.next(response);
          this.cartCountSubject.next(response.count);
        })
      );
  }

  // Add item to cart
  addToCart(productId: string, quantity: number = 1): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.apiUrl, { productId, quantity })
      .pipe(
        tap(response => {
          this.cartSubject.next(response);
          this.cartCountSubject.next(response.count);
        })
      );
  }

  // Update cart item quantity
  updateCartItem(cartItemId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/${cartItemId}`, { quantity })
      .pipe(
        tap(response => {
          this.cartSubject.next(response);
          this.cartCountSubject.next(response.count);
        })
      );
  }

  // Remove item from cart
  removeFromCart(cartItemId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/${cartItemId}`)
      .pipe(
        tap(response => {
          this.cartSubject.next(response);
          this.cartCountSubject.next(response.count);
        })
      );
  }

  // Clear entire cart
  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(this.apiUrl)
      .pipe(
        tap(response => {
          this.cartSubject.next(response);
          this.cartCountSubject.next(0);
        })
      );
  }
}