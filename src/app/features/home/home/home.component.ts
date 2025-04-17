// src/app/features/home/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product, ChefInfo } from '../../../core/models/product.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class HomeComponent implements OnInit {
  allProducts: Product[] = [];
  featuredProducts: Product[] = [];
  categories: string[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Filter
  selectedCategory: string = '';
  
  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts(1, 100).subscribe({
      next: (response) => {
        this.allProducts = response.products;
        this.extractCategories();
        this.selectFeaturedProducts();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err;
        this.isLoading = false;
      }
    });
  }

  extractCategories(): void {
    // Extract unique categories
    this.categories = [...new Set(this.allProducts.map(p => p.category))];
  }

  selectFeaturedProducts(): void {
    // Choose some products to feature (e.g., highest rated, newest)
    this.featuredProducts = this.allProducts
      .filter(p => p.isAvailable) // Only available products
      .sort((a, b) => b.rating - a.rating) // Sort by rating (highest first)
      .slice(0, 6); // Take top 6
  }

  filterProductsByCategory(category: string): void {
    this.selectedCategory = category;
  }

  getFilteredProducts(): Product[] {
    if (!this.selectedCategory) {
      return this.allProducts.filter(p => p.isAvailable);
    }
    return this.allProducts.filter(p => p.isAvailable && p.category === this.selectedCategory);
  }

  clearFilter(): void {
    this.selectedCategory = '';
  }

  isChefObject(chef: string | ChefInfo): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }
}