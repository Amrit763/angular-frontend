// src/app/features/cart/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartResponse, CartItem } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { Condiment, SelectedCondiment, ChefInfo } from '../../../core/models/product.model';
import { HttpErrorResponse } from '@angular/common/http';

declare var bootstrap: any; // For Bootstrap 5 Modals

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

  // For delete confirmation modal
  private deleteConfirmModal: any = null;
  itemToDelete: string = ''; // ID of the item to delete

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
        console.log('Cart updated:', cart);
        this.cartData = cart;
        this.isLoading = false;
      })
    );

    // Initialize the delete confirmation modal
    this.initDeleteModal();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Clean up modal if it exists
    if (this.deleteConfirmModal) {
      try {
        this.deleteConfirmModal.dispose();
      } catch (e) {
        console.log('Error disposing modal:', e);
      }
    }
  }

  // Initialize the delete confirmation modal
  initDeleteModal(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('deleteConfirmModal');
      if (modalElement) {
        this.deleteConfirmModal = new bootstrap.Modal(modalElement);
      }
    }, 500);
  }

  loadCart(): void {
    this.isLoading = true;
    this.error = null;

    this.cartService.getCart().subscribe({
      next: () => {
        // Cart data will be handled by the subscription
      },
      error: (err: HttpErrorResponse) => {
        console.error('Cart loading error:', err);
        this.error = this.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  // Type guard for chef object
  isChefObject(chef: string | ChefInfo): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) return;

    this.isUpdatingQuantity = true;
    this.cartService.updateCartItem(item._id, newQuantity).subscribe({
      next: () => {
        this.isUpdatingQuantity = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Update quantity error:', err);
        this.error = this.getErrorMessage(err);
        this.isUpdatingQuantity = false;
      }
    });
  }

  // Show delete confirmation modal
  confirmDeleteItem(itemId: string): void {
    this.itemToDelete = itemId;
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.show();
    } else {
      // Fallback if modal isn't available
      this.removeItem(itemId);
    }
  }

  // Process the item deletion after confirmation
  removeItem(itemId: string = ''): void {
    // Use the stored item ID if none is provided
    const id = itemId || this.itemToDelete;
    if (!id) return;

    // Hide the modal if it's open
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.hide();
    }

    this.itemsBeingRemoved[id] = true;
    this.cartService.removeFromCart(id).subscribe({
      next: () => {
        // Item removal handled by cart subscription
      },
      error: (err: HttpErrorResponse) => {
        console.error('Remove item error:', err);
        this.error = this.getErrorMessage(err);
        this.itemsBeingRemoved[id] = false;
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
        error: (err: HttpErrorResponse) => {
          console.error('Clear cart error:', err);
          this.error = this.getErrorMessage(err);
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

  // Calculate the total price of condiments for an item
  getCondimentsPrice(item: CartItem): number {
    if (!item.selectedCondiments || item.selectedCondiments.length === 0) {
      return 0;
    }

    let total = 0;
    for (const condiment of item.selectedCondiments) {
      const price = Number(condiment.price);
      if (!isNaN(price)) {
        total += price;
      }
    }

    return total;
  }

  // Calculate the item base price (product price + condiments) without quantity
  getItemBasePrice(item: CartItem): number {
    if (!item.product) return 0;

    const basePrice = Number(item.product.price) || 0;
    const condimentsPrice = this.getCondimentsPrice(item);

    return basePrice + condimentsPrice;
  }

  // Calculate the item total price (base price * quantity)
  getItemTotalPrice(item: CartItem): number {
    // If the item has a calculated totalPrice from the service, use that
    if (item.totalPrice !== undefined && item.totalPrice !== null) {
      return item.totalPrice;
    }

    // Otherwise calculate it
    return this.getItemBasePrice(item) * item.quantity;
  }

  // Extract error message from various error types
  private getErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      // Try to extract message from response
      if (error.error && error.error.message) {
        return error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        return error.error;
      } else if (error.message) {
        return error.message;
      } else {
        return `Server error: ${error.status}`;
      }
    } else if (error && error.message) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return 'An unknown error occurred';
    }
  }
}