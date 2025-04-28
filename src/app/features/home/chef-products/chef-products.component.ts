// src/app/features/home/chef-products/chef-products.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ChefInfo } from '../../../core/models/product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-chef-products',
  templateUrl: './chef-products.component.html',
  styleUrls: ['./chef-products.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCardComponent
  ]
})
export class ChefProductsComponent implements OnInit {
  chefId: string = '';
  chefInfo: any = null;
  chefProducts: Product[] = [];
  categories: string[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Filter variables
  selectedCategory: string = '';
  priceRange = [0, 100];
  maxPrice = 100;
  isVegetarian = false;
  isVegan = false;
  isGlutenFree = false;
  sortOption = 'rating';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 9;
  
  constructor(
    public productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('chefId');
      if (id) {
        this.chefId = id;
        this.loadChefProducts();
      } else {
        this.error = 'Chef ID not found';
        this.isLoading = false;
      }
    });
  }

  loadChefProducts(): void {
    this.isLoading = true;
    this.productService.getChefProducts(this.chefId).subscribe({
      next: (response) => {
        this.chefProducts = response.products;
        
        // Get chef info from the first product
        if (this.chefProducts.length > 0 && this.chefProducts[0].chef) {
          const firstProduct = this.chefProducts[0];
          if (typeof firstProduct.chef === 'object') {
            this.chefInfo = firstProduct.chef;
          }
        }
        
        this.extractCategories();
        this.calculateMaxPrice();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred while loading products';
        this.isLoading = false;
      }
    });
  }

  extractCategories(): void {
    // Extract unique categories from the chef's products
    this.categories = [...new Set(this.chefProducts.map(p => p.category))];
  }

  calculateMaxPrice(): void {
    if (this.chefProducts.length === 0) {
      this.maxPrice = 100;
      this.priceRange = [0, 100];
    } else {
      this.maxPrice = Math.ceil(Math.max(...this.chefProducts.map(p => p.price)));
      this.priceRange = [0, this.maxPrice];
    }
  }

  filterProductsByCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1; // Reset to first page when filtering
    this.applyFilters();
  }

  applyFilters(): void {
    // Reset to first page when applying new filters
    this.currentPage = 1;
  }

  getFilteredProducts(): Product[] {
    let filteredProducts = [...this.chefProducts];
    
    // Apply category filter
    if (this.selectedCategory) {
      filteredProducts = filteredProducts.filter(p => p.category === this.selectedCategory);
    }
    
    // Apply price range filter
    filteredProducts = filteredProducts.filter(p => 
      p.price >= this.priceRange[0] && p.price <= this.priceRange[1]
    );
    
    // Apply dietary filters
    if (this.isVegetarian) {
      filteredProducts = filteredProducts.filter(p => p.isVegetarian);
    }
    if (this.isVegan) {
      filteredProducts = filteredProducts.filter(p => p.isVegan);
    }
    if (this.isGlutenFree) {
      filteredProducts = filteredProducts.filter(p => p.isGlutenFree);
    }
    
    // Apply sorting
    switch (this.sortOption) {
      case 'price-low':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return filteredProducts;
  }

  clearFilter(): void {
    this.selectedCategory = '';
    this.currentPage = 1; // Reset to first page when clearing filters
  }

  clearAllFilters(): void {
    this.selectedCategory = '';
    this.priceRange = [0, this.maxPrice];
    this.isVegetarian = false;
    this.isVegan = false;
    this.isGlutenFree = false;
    this.sortOption = 'rating';
    this.currentPage = 1;
  }

  getAverageRating(): number {
    if (this.chefProducts.length === 0) return 0;
    
    // Calculate average rating from all products
    const totalRating = this.chefProducts.reduce((sum, product) => sum + product.rating, 0);
    return totalRating / this.chefProducts.length;
  }

  getTotalReviews(): number {
    if (this.chefProducts.length === 0) return 0;
    
    // Sum up all review counts
    return this.chefProducts.reduce((sum, product) => sum + product.reviewCount, 0);
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
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