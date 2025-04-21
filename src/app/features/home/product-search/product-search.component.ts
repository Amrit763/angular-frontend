// src/app/features/home/product-search/product-search.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product, ChefInfo } from '../../../core/models/product.model';
import { ProductCardComponent } from '../product-card/product-card.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-product-search',
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCardComponent
  ]
})
export class ProductSearchComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  error: string | null = null;
  searchQuery = '';
  searchChanged = new Subject<string>();
  
  // Filter variables
  categories: string[] = [];
  selectedCategory = '';
  priceRange = [0, 100];
  isVegetarian = false;
  isVegan = false;
  isGlutenFree = false;
  sortOption = 'rating';

  // Pagination variables
  currentPage = 1;
  itemsPerPage = 12;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Setup debounce for search
    this.searchChanged.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
      }
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      if (params['page']) {
        this.currentPage = parseInt(params['page'], 10);
      }
      
      // Load products
      this.loadProducts();
    });
  }

  loadProducts(): void {
    if (this.searchQuery) {
      // If there's a search query, use search endpoint
      this.productService.searchProducts(this.searchQuery).subscribe({
        next: (response) => {
          this.products = response.products;
          this.extractCategories();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message || 'An error occurred while searching products';
          this.isLoading = false;
        }
      });
    } else {
      // Otherwise get all products
      this.productService.getAllProducts().subscribe({
        next: (response) => {
          this.products = response.products;
          this.extractCategories();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message || 'An error occurred while loading products';
          this.isLoading = false;
        }
      });
    }
  }

  extractCategories(): void {
    // Extract unique categories
    this.categories = [...new Set(this.products.map(p => p.category))];
  }

  onSearchInput(event: any): void {
    const query = event.target.value;
    this.searchChanged.next(query);
    
    // Update URL query parameter and reset to page 1
    this.currentPage = 1;
    this.updateUrlParams({ q: query, page: 1 });
  }

  applyFilters(): void {
    // Start with all products
    let result = [...this.products];
    
    // Apply search filter if query exists
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        (this.isChefObject(p.chef) && p.chef.fullName.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (this.selectedCategory) {
      result = result.filter(p => p.category === this.selectedCategory);
    }
    
    // Apply price range filter
    result = result.filter(p => p.price >= this.priceRange[0] && p.price <= this.priceRange[1]);
    
    // Apply dietary filters
    if (this.isVegetarian) {
      result = result.filter(p => p.isVegetarian);
    }
    if (this.isVegan) {
      result = result.filter(p => p.isVegan);
    }
    if (this.isGlutenFree) {
      result = result.filter(p => p.isGlutenFree);
    }
    
    // Apply sorting
    switch (this.sortOption) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    // Update filtered products
    this.filteredProducts = result;
    
    // If current page is now invalid due to filter, reset to page 1
    if (this.currentPage > this.totalPages() && this.totalPages() > 0) {
      this.currentPage = 1;
      this.updateUrlParams({ page: 1 });
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1; // Reset to page 1 when changing category
    this.applyFilters();
    
    // Update URL query parameters
    this.updateUrlParams({ category, page: 1 });
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.priceRange = [0, this.maxPrice()];
    this.isVegetarian = false;
    this.isVegan = false;
    this.isGlutenFree = false;
    this.sortOption = 'rating';
    this.currentPage = 1;
    this.applyFilters();
    
    // Update URL query parameters
    this.updateUrlParams({ 
      category: null, 
      page: 1,
      q: this.searchQuery.length > 0 ? this.searchQuery : null
    });
  }

  maxPrice(): number {
    if (this.products.length === 0) return 100;
    return Math.ceil(Math.max(...this.products.map(p => p.price)));
  }

  isChefObject(chef: any): chef is ChefInfo {
    return chef && typeof chef !== 'string' && '_id' in chef;
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updateUrlParams({ page: this.currentPage });
      window.scrollTo(0, 0);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateUrlParams({ page: this.currentPage });
      window.scrollTo(0, 0);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
      this.updateUrlParams({ page });
      window.scrollTo(0, 0);
    }
  }

  totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  getCurrentPageItems(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getPaginationArray(): number[] {
    const totalPages = this.totalPages();
    const current = this.currentPage;
    
    // Show limited pagination links if many pages
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

  // Helper to update URL parameters
  private updateUrlParams(params: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

}