import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { TokenService } from '../../../core/auth/token.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-chef-dashboard',
  templateUrl: './chef-dashboard.component.html',
  styleUrls: ['./chef-dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ChefDashboardComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  error: string | null = null;
  totalProducts = 0;
  activeProducts = 0;
  averageRating = 0;
  viewMode = 'chef'; // 'chef' or 'customer'

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
      this.productService.getChefProducts(user._id).subscribe({
        next: (response) => {
          this.products = response.products;
          this.totalProducts = response.count;
          this.calculateDashboardStats();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err;
          this.isLoading = false;
        }
      });
    }
  }

  calculateDashboardStats(): void {
    this.activeProducts = this.products.filter(p => p.isAvailable).length;
    
    const totalRating = this.products.reduce((sum, product) => {
      return sum + (product.rating * product.reviewCount);
    }, 0);
    
    const totalReviews = this.products.reduce((sum, product) => {
      return sum + product.reviewCount;
    }, 0);
    
    this.averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'chef' ? 'customer' : 'chef';
  }
}