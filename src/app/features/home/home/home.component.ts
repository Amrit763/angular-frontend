// src/app/features/home/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product, ChefInfo } from '../../../core/models/product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProductCardComponent
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
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8;
  
  constructor(public productService: ProductService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  // handleImageError(event: any): void {
  //   // console.error('Image failed to load:', event);
  //   // Fallback to a default image
  //   event.target.src = 'assets/images/default-food-image.png';
  //   // If that doesn't work either, you could add another fallback
  //   event.target.onerror = () => {
  //     event.target.src = 'https://via.placeholder.com/600x400?text=Food+Hub+Image';
  //     event.target.onerror = null; // Prevent infinite loop
  //   };
  // }

  loadProducts(): void {
    this.productService.getAllProducts(1, 100).subscribe({
      next: (response) => {
        this.allProducts = response.products;
        this.extractCategories();
        this.selectFeaturedProducts();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred while loading products';
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
      .slice(0, 8); // Take top 8 for the view all functionality
  }

  filterProductsByCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1; // Reset to first page when filtering
  }

  getFilteredProducts(): Product[] {
    let filteredProducts = this.allProducts;
    
    if (this.selectedCategory) {
      filteredProducts = filteredProducts.filter(p => 
        p.isAvailable && p.category === this.selectedCategory
      );
    } else {
      filteredProducts = filteredProducts.filter(p => p.isAvailable);
    }
    
    return filteredProducts;
  }

  clearFilter(): void {
    this.selectedCategory = '';
    this.currentPage = 1; // Reset to first page when clearing filters
  }

  isChefObject(chef: string | ChefInfo): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  totalPages(): number {
    return Math.ceil(this.getFilteredProducts().length / this.itemsPerPage);
  }

  getCurrentPageItems(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.getFilteredProducts().slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  getPaginationArray(): number[] {
    const totalPages = this.totalPages();
    const current = this.currentPage;
    
    // Show all pagination links if few pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Complex pagination with ellipsis
      if (current <= 3) {
        return [1, 2, 3, 4, 0, totalPages - 1, totalPages];
      } else if (current >= totalPages - 2) {
        return [1, 2, 0, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        return [1, 0, current - 1, current, current + 1, 0, totalPages];
      }
    }
  }
}