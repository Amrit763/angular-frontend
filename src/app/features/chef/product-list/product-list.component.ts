// src/app/features/chef/product-list/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { TokenService } from '../../../core/auth/token.service';
import { Product } from '../../../core/models/product.model';

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
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;
  // Filters
  filterCategory: string = '';
  filterAvailability: string = '';
  
  // Unique categories from products
  categories: string[] = [];
  
  constructor(
    private productService: ProductService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    this.loadChefProducts();
  }

  loadChefProducts(): void {
    const user = this.tokenService.getUser();
    if (user && user._id) {
      this.isLoading = true;
      this.productService.getChefProducts(user._id).subscribe({
        next: (response) => {
          this.products = response.products;
          this.extractCategories();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err;
          this.isLoading = false;
        }
      });
    }
  }

  extractCategories(): void {
    // Extract unique categories from products
    this.categories = [...new Set(this.products.map(p => p.category))];
  }

  deleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Product deleted successfully';
          // Remove the deleted product from the list
          this.products = this.products.filter(p => p._id !== productId);
          this.extractCategories();
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err) => {
          this.error = err;
          
          // Clear error message after 3 seconds
          setTimeout(() => {
            this.error = null;
          }, 3000);
        }
      });
    }
  }

  toggleAvailability(product: Product): void {
    const newStatus = !product.isAvailable;
    
    this.productService.toggleAvailability(product._id, newStatus).subscribe({
      next: (response) => {
        // Update the product in the list
        const index = this.products.findIndex(p => p._id === product._id);
        if (index !== -1) {
          this.products[index].isAvailable = newStatus;
        }
        
        this.successMessage = `Product ${newStatus ? 'is now available' : 'is now unavailable'}`;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        this.error = err;
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          this.error = null;
        }, 3000);
      }
    });
  }

  // Filter methods
  applyFilters(): Product[] {
    let filteredProducts = [...this.products];
    
    // Apply category filter
    if (this.filterCategory) {
      filteredProducts = filteredProducts.filter(p => p.category === this.filterCategory);
    }
    
    // Apply availability filter
    if (this.filterAvailability === 'available') {
      filteredProducts = filteredProducts.filter(p => p.isAvailable);
    } else if (this.filterAvailability === 'unavailable') {
      filteredProducts = filteredProducts.filter(p => !p.isAvailable);
    }
    
    return filteredProducts;
  }

  resetFilters(): void {
    this.filterCategory = '';
    this.filterAvailability = '';
  }

  // Track by function for ngFor
  trackByProductId(index: number, product: Product): string {
    return product._id;
  }
}