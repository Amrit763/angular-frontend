// src/app/features/chef/product-list/product-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { TokenService } from '../../../core/auth/token.service';
import { Product } from '../../../core/models/product.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class ProductListComponent implements OnInit, OnDestroy {
  // Main data
  products: Product[] = [];
  categories: string[] = [];
  
  // UI state
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Filters
  filterCategory: string = '';
  filterStatus: string = '';
  
  // For cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    public productService: ProductService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    this.loadChefProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all products belonging to the current chef
   */
  loadChefProducts(): void {
    const user = this.tokenService.getUser();
    if (user && user._id) {
      this.isLoading = true;
      this.productService.getChefProducts(user._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.products = response.products;
            this.extractCategories();
            this.isLoading = false;
          },
          error: (err) => {
            this.error = err?.message || 'Failed to load products. Please try again.';
            this.isLoading = false;
            this.setAutoDismiss('error');
          }
        });
    } else {
      this.error = 'User information not found. Please log in again.';
      this.isLoading = false;
    }
  }

  /**
   * Extract unique categories from products
   */
  extractCategories(): void {
    this.categories = [...new Set(this.products.map(p => p.category))].sort();
  }

  /**
   * Delete a product
   */
  deleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      this.isLoading = true;
      this.productService.deleteProduct(productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = response.message || 'Product deleted successfully';
            // Remove the deleted product from the list
            this.products = this.products.filter(p => p._id !== productId);
            this.extractCategories();
            this.isLoading = false;
            this.setAutoDismiss('success');
          },
          error: (err) => {
            this.error = err?.message || 'Failed to delete product. Please try again.';
            this.isLoading = false;
            this.setAutoDismiss('error');
          }
        });
    }
  }

  /**
   * Update product availability status
   */
  updateProductStatus(product: Product, status: string): void {
    const newAvailability = status === 'available';
    
    // Optimistic UI update
    const originalStatus = product.isAvailable;
    product.isAvailable = newAvailability;
    
    this.productService.toggleAvailability(product._id, newAvailability)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Server confirmed the update
          this.successMessage = `Product ${newAvailability ? 'is now available' : 'is now unavailable'}`;
          this.setAutoDismiss('success');
        },
        error: (err) => {
          // Revert the optimistic update
          product.isAvailable = originalStatus;
          
          this.error = err?.message || 'Failed to update product status. Please try again.';
          this.setAutoDismiss('error');
        }
      });
  }

  /**
   * Apply filters to the product list
   */
  applyFilters(): Product[] {
    let filteredProducts = [...this.products];
    
    // Apply category filter
    if (this.filterCategory) {
      filteredProducts = filteredProducts.filter(p => p.category === this.filterCategory);
    }
    
    // Apply status filter
    if (this.filterStatus === 'available') {
      filteredProducts = filteredProducts.filter(p => p.isAvailable);
    } else if (this.filterStatus === 'unavailable') {
      filteredProducts = filteredProducts.filter(p => !p.isAvailable);
    }
    
    return filteredProducts;
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterCategory = '';
    this.filterStatus = '';
  }

  /**
   * Auto-dismiss messages after a delay
   */
  private setAutoDismiss(type: 'success' | 'error', delay: number = 3000): void {
    setTimeout(() => {
      if (type === 'success') {
        this.successMessage = null;
      } else {
        this.error = null;
      }
    }, delay);
  }

  /**
   * Track function for ngFor optimization
   */
  trackByProductId(index: number, product: Product): string {
    return product._id;
  }
}