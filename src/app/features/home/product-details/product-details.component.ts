// src/app/features/home/product-details/product-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
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

  constructor(
    private route: ActivatedRoute,
    public productService: ProductService
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
    
    // Here you would implement the cart functionality
    console.log(`Added to cart: ${this.quantity} x ${this.product.name}`);
    
    // For simplicity, just show an alert
    alert(`Added ${this.quantity} ${this.product.name} to cart!`);
  }

  isChefObject(chef: string | ChefInfo): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }
}