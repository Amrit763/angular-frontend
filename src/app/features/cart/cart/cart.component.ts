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

declare var bootstrap: any; // For Bootstrap 5 Modal

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

  // For condiments modal
  selectedCartItem: CartItem | null = null;
  tempSelectedCondiments: SelectedCondiment[] = [];
  updatingCondiments = false;
  condimentUpdateError: string | null = null; // Specific error for condiments update
  private condimentsModal: any = null;

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
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Clean up modal if it exists
    if (this.condimentsModal) {
      try {
        this.condimentsModal.dispose();
      } catch (e) {
        console.log('Error disposing modal:', e);
      }
    }
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

  removeItem(itemId: string): void {
    this.itemsBeingRemoved[itemId] = true;
    this.cartService.removeFromCart(itemId).subscribe({
      next: () => {
        // Item removal handled by cart subscription
      },
      error: (err: HttpErrorResponse) => {
        console.error('Remove item error:', err);
        this.error = this.getErrorMessage(err);
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

  // Open modal to change condiments
  openCondimentsModal(item: CartItem): void {
    this.condimentUpdateError = null; // Reset specific error

    // Create a deep copy of the item to avoid direct modification
    this.selectedCartItem = JSON.parse(JSON.stringify(item));
    this.tempSelectedCondiments = item.selectedCondiments ?
      JSON.parse(JSON.stringify(item.selectedCondiments)) : [];

    // Initialize the modal if it doesn't exist
    if (!this.condimentsModal) {
      const modalElement = document.getElementById('condimentsModal');
      if (modalElement) {
        this.condimentsModal = new bootstrap.Modal(modalElement);
      }
    }

    // Show the modal
    if (this.condimentsModal) {
      this.condimentsModal.show();
    }
  }

  // Check if a condiment is selected in the modal
  isCondimentSelectedInModal(condimentId: string): boolean {
    return this.tempSelectedCondiments.some(c => c.condimentId === condimentId);
  }

  // Toggle a condiment in the modal
  toggleCondimentInModal(condiment: Condiment): void {
    const index = this.tempSelectedCondiments.findIndex(c => c.condimentId === condiment._id);

    if (index === -1) {
      // Add the condiment
      this.tempSelectedCondiments.push({
        condimentId: condiment._id,
        name: condiment.name,
        price: Number(condiment.price) || 0
      });
    } else {
      // Remove the condiment
      this.tempSelectedCondiments.splice(index, 1);
    }
  }

  // Calculate item total price in the modal
  getModalItemTotal(): number {
    if (!this.selectedCartItem) return 0;

    let total = Number(this.selectedCartItem.product.price) || 0;

    // Add prices of selected condiments
    for (const condiment of this.tempSelectedCondiments) {
      const price = Number(condiment.price);
      if (!isNaN(price)) {
        total += price;
      }
    }

    return total;
  }

  saveCondiments(): void {
    if (!this.selectedCartItem) return;

    this.updatingCondiments = true;
    this.condimentUpdateError = null;

    // First verify we have a valid cartItem
    if (!this.selectedCartItem._id) {
      this.condimentUpdateError = "Invalid cart item";
      this.updatingCondiments = false;
      return;
    }

    // Format condiments to ensure they match expected server format
    const formattedCondiments = this.tempSelectedCondiments.map(condiment => ({
      condimentId: condiment.condimentId,
      name: condiment.name,
      price: Number(condiment.price) || 0
    }));

    console.log('Saving condiments for item:', this.selectedCartItem._id);
    console.log('Condiments data:', formattedCondiments);

    this.cartService.updateCartItemCondiments(
      this.selectedCartItem._id,
      formattedCondiments
    ).subscribe({
      next: (response) => {
        console.log('Condiments updated successfully:', response);
        this.updatingCondiments = false;

        // Close the modal
        if (this.condimentsModal) {
          this.condimentsModal.hide();
        }
      },
      error: (err) => {
        console.error('Detailed condiments update error:', err);

        // Extract error message
        let errorMessage = 'Failed to update condiments';

        if (err && err.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }

        this.condimentUpdateError = errorMessage;
        this.updatingCondiments = false;
      }
    });
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