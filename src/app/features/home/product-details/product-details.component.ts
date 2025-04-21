// src/app/features/home/product-details/product-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { TokenService } from '../../../core/auth/token.service';
import { Product, ChefInfo, ProductResponse } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ProductDetailsComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;
  activeImageIndex = 0;
  quantity = 1;
  addingToCart = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public productService: ProductService,
    private cartService: CartService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    } else {
      this.error = 'Product ID is missing';
      this.isLoading = false;
    }
  }

  loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (response: ProductResponse) => {
        this.product = response.product;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err;
        this.isLoading = false;
      }
    });
  }

  setActiveImage(index: number): void {
    this.activeImageIndex = index;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  getTotal(): number {
    if (!this.product) return 0;
    return this.product.price * this.quantity;
  }

  addToCart(): void {
    if (!this.product) return;
    
    // Check if user is logged in
    if (!this.tokenService.isLoggedIn()) {
      // Redirect to login page with return URL
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.addingToCart = true;
    
    // Add product to cart
    this.cartService.addToCart(this.product._id, this.quantity).subscribe({
      next: (response) => {
        console.log(`Added to cart: ${this.quantity} x ${this.product?.name}`);
        this.addingToCart = false;
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.error = typeof error === 'string' ? error : 'Failed to add to cart';
        this.addingToCart = false;
      }
    });
  }

  isChefObject(chef: string | ChefInfo): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }
}