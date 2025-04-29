// src/app/core/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SelectedCondiment } from '../models/product.model';

export interface CartItem {
  _id: string;
  product: any;
  quantity: number;
  selectedCondiments?: SelectedCondiment[];
  totalPrice?: number;
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
  private _cart = new BehaviorSubject<CartResponse | null>(null);
  
  // Expose the cart as an Observable
  public cart$ = this._cart.asObservable();
  
  // Add the cartCount$ observable
  public cartCount$ = this.cart$.pipe(
    map(cart => cart ? cart.count : 0)
  );

  constructor(private http: HttpClient) { }

  // Get the cart from the server
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl).pipe(
      tap(response => {
        // Calculate subtotal, service fee, and total
        response = this.calculateCartTotals(response);
        this._cart.next(response);
      }),
      catchError(this.handleError)
    );
  }

  // Add an item to the cart
  addToCart(productId: string, quantity: number, selectedCondiments?: SelectedCondiment[]): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.apiUrl}`, {
      productId,
      quantity,
      selectedCondiments
    }).pipe(
      tap(response => {
        // Calculate subtotal, service fee, and total
        response = this.calculateCartTotals(response);
        this._cart.next(response);
      }),
      catchError(this.handleError)
    );
  }

  // Update an item's quantity in the cart
  updateCartItem(itemId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/item/${itemId}`, {
      quantity
    }).pipe(
      tap(response => {
        // Calculate subtotal, service fee, and total
        response = this.calculateCartTotals(response);
        this._cart.next(response);
      }),
      catchError(this.handleError)
    );
  }

  // Update an item's condiments in the cart
  updateCartItemCondiments(itemId: string, selectedCondiments: SelectedCondiment[]): Observable<CartResponse> {
    // Log the request for debugging
    console.log('Updating condiments for item:', itemId);
    console.log('Condiments data:', selectedCondiments);
    
    // Ensure condiment IDs are correctly formatted
    const formattedCondiments = selectedCondiments.map(c => ({
      condimentId: c.condimentId,
      name: c.name,
      price: Number(c.price) || 0
    }));
    
    return this.http.put<CartResponse>(
      `${this.apiUrl}/item/${itemId}/condiments`, 
      { selectedCondiments: formattedCondiments }
    ).pipe(
      tap(response => {
        console.log('Condiments update successful:', response);
        // Calculate subtotal, service fee, and total
        response = this.calculateCartTotals(response);
        this._cart.next(response);
      }),
      catchError(error => {
        console.error('Error updating condiments:', error);
        
        // Return a more specific error message
        if (error instanceof HttpErrorResponse) {
          return throwError(() => ({ 
            message: 'Server error while updating cart condiments',
            originalError: error
          }));
        }
        return this.handleError(error);
      })
    );
  }

  // Remove an item from the cart
  removeFromCart(itemId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/item/${itemId}`).pipe(
      tap(response => {
        // Calculate subtotal, service fee, and total
        response = this.calculateCartTotals(response);
        this._cart.next(response);
      }),
      catchError(this.handleError)
    );
  }

  // Clear the cart
  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(this.apiUrl).pipe(
      tap(response => {
        this._cart.next(response);
      }),
      catchError(this.handleError)
    );
  }

  // Helper method to calculate cart totals
  private calculateCartTotals(cart: CartResponse): CartResponse {
    if (!cart.items || cart.items.length === 0) {
      return {
        ...cart,
        subtotal: 0,
        serviceFee: 0,
        total: 0
      };
    }

    // Calculate subtotal by summing up each item's total price
    let subtotal = 0;
    
    for (const item of cart.items) {
      // Calculate item total price including condiments
      const basePrice = Number(item.product.price) || 0;
      let condimentsPrice = 0;
      
      if (item.selectedCondiments && item.selectedCondiments.length > 0) {
        for (const condiment of item.selectedCondiments) {
          condimentsPrice += Number(condiment.price) || 0;
        }
      }
      
      const itemTotal = (basePrice + condimentsPrice) * item.quantity;
      item.totalPrice = itemTotal; // Store the calculated price on the item
      subtotal += itemTotal;
    }
    
    // Calculate service fee (10%)
    const serviceFee = subtotal * 0.1;
    
    // Calculate total
    const total = subtotal + serviceFee;
    
    return {
      ...cart,
      subtotal: parseFloat(subtotal.toFixed(2)),
      serviceFee: parseFloat(serviceFee.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }
  
  // Generic error handler
  private handleError(error: any) {
    let errorMessage = '';
    
    if (error instanceof HttpErrorResponse) {
      // Server or connection error
      errorMessage = error.error instanceof ErrorEvent ? 
        `Error: ${error.error.message}` : // Client-side error
        `Server error: ${error.status}, ${error.message}`; // Server-side error
        
      // Try to extract more detailed error message if available
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    } else {
      // Handle application-level errors
      errorMessage = error.message || 'Something went wrong';
    }
    
    console.error('API Error:', error);
    return throwError(() => ({ message: errorMessage, originalError: error }));
  }
}