// src/app/features/home/product-card/product-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product, ChefInfo } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { TokenService } from '../../../core/auth/token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() featured: boolean = false;
  
  constructor(
    public productService: ProductService,
    private cartService: CartService,
    private tokenService: TokenService,
    private router: Router
  ) {}
  
  isChefObject(chef: string | ChefInfo): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if user is logged in
    if (!this.tokenService.isLoggedIn()) {
      // Redirect to login page
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    // Add product to cart
    this.cartService.addToCart(this.product._id, 1).subscribe({
      next: (response) => {
        console.log('Product added to cart:', this.product.name);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
      }
    });
  }
}