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
          this.error = err;
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
          this.error = err;
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
    
    // Update URL query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query },
      queryParamsHandling: 'merge'
    });
  }

  applyFilters(): void {
    // Start with all products
    let result = [...this.products];
    
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
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
    
    // Update URL query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.priceRange = [0, 100];
    this.isVegetarian = false;
    this.isVegan = false;
    this.isGlutenFree = false;
    this.sortOption = 'rating';
    this.applyFilters();
    
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null },
      queryParamsHandling: 'merge'
    });
  }

  maxPrice(): number {
    if (this.products.length === 0) return 100;
    return Math.ceil(Math.max(...this.products.map(p => p.price)));
  }

  onSortChange(event: any): void {
    this.sortOption = event.target.value;
    this.applyFilters();
  }

  isChefObject(chef: any): chef is ChefInfo {
    return chef && typeof chef !== 'string' && '_id' in chef;
  }
}