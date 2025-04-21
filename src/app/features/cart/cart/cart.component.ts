// src/app/features/cart/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartResponse, CartItem } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: false,
})
export class CartComponent implements OnInit, OnDestroy {
  cartData: CartResponse | null = null;
  isLoading = true;
  error: string | null = null;
  itemsBeingRemoved: { [key: string]: boolean } = {}; // Track items being removed
  isUpdatingQuantity = false; // Track when quantity is being updated

  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    public productService: ProductService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCart();
    
    // Subscribe to cart changes
    this.subscriptions.push(
      this.cartService.cart$.subscribe(cart => {
        this.cartData = cart;
        this.isLoading = false;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      error: (err) => {
        this.error = err;
        this.isLoading = false;
      }
    });
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) return;
    
    this.isUpdatingQuantity = true;
    this.cartService.updateCartItem(item._id, newQuantity).subscribe({
      next: () => {
        this.isUpdatingQuantity = false;
      },
      error: (err) => {
        this.error = err;
        this.isUpdatingQuantity = false;
      }
    });
  }

  removeItem(itemId: string): void {
    this.itemsBeingRemoved[itemId] = true;
    this.cartService.removeFromCart(itemId).subscribe({
      error: (err) => {
        this.error = err;
        this.itemsBeingRemoved[itemId] = false;
      }
    });
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.isLoading = true;
      this.cartService.clearCart().subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err;
          this.isLoading = false;
        }
      });
    }
  }

  proceedToCheckout(): void {
    this.router.navigate(['/cart/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/home']);
  }
}