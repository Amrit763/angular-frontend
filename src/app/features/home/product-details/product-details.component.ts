// src/app/features/home/product-details/product-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { TokenService } from '../../../core/auth/token.service';
import { Product, ChefInfo, ProductResponse, Condiment, SelectedCondiment } from '../../../core/models/product.model';
import { ReviewListComponent } from '../../reviews/review-list/review-list.component';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReviewListComponent
  ]
})
export class ProductDetailsComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;
  activeImageIndex = 0;
  quantity = 1;
  addingToCart = false;
  
  // New properties for condiments
  selectedCondiments: SelectedCondiment[] = [];

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
        
        // Initialize selectedCondiments with default condiments
        if (this.product && this.product.condiments) {
          this.selectedCondiments = this.product.condiments
            .filter(condiment => condiment.isDefault)
            .map(condiment => ({
              condimentId: condiment._id,
              name: condiment.name,
              price: condiment.price
            }));
        }
        
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

  // Method to check if a condiment is selected
  isCondimentSelected(condimentId: string): boolean {
    return this.selectedCondiments.some(c => c.condimentId === condimentId);
  }

  // Method to toggle a condiment selection
  toggleCondiment(condiment: Condiment): void {
    const index = this.selectedCondiments.findIndex(c => c.condimentId === condiment._id);
    
    if (index === -1) {
      // Add the condiment
      this.selectedCondiments.push({
        condimentId: condiment._id,
        name: condiment.name,
        price: condiment.price
      });
    } else {
      // Remove the condiment
      this.selectedCondiments.splice(index, 1);
    }
  }

  // Get the base price of the product
  getBasePrice(): number {
    if (!this.product) return 0;
    return this.product.price;
  }

  // Get the total price for a single item with condiments
  getItemTotalPrice(): number {
    if (!this.product) return 0;
    
    let total = this.product.price;
    
    // Add prices of selected condiments
    for (const condiment of this.selectedCondiments) {
      total += condiment.price;
    }
    
    return total;
  }

  // Get the total price (item price × quantity)
  getTotal(): number {
    return this.getItemTotalPrice() * this.quantity;
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
    
    // Make sure selectedCondiments is properly formatted
    const cleanedCondiments = this.selectedCondiments.map(condiment => {
      // Ensure price is a valid number
      const price = Number(condiment.price);
      return {
        condimentId: condiment.condimentId,
        name: condiment.name,
        price: isNaN(price) ? 0 : price // Default to 0
      };
    });
    
    console.log('Adding to cart with condiments:', cleanedCondiments);
    
    // Add product to cart with selected condiments
    this.cartService.addToCart(
      this.product._id, 
      this.quantity, 
      cleanedCondiments
    ).subscribe({
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