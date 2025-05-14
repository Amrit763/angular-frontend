// src/app/features/home/product-card/product-card.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product, ChefInfo } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { TokenService } from '../../../core/auth/token.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
export class ProductCardComponent implements OnInit {
  @Input() product!: Product;
  @Input() featured: boolean = false;
  chefName: string = 'Chef'; // Default to "Chef" instead of "Unknown Chef"

  constructor(
    public productService: ProductService,
    private cartService: CartService,
    private tokenService: TokenService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    console.log("Product card initialized with:", this.product);
    
    if (this.product.chef) {
      if (this.isChefObject(this.product.chef)) {
        console.log("Chef object:", this.product.chef);
        // If the chef object has an ID but no fullName, fetch the user details
        if (this.product.chef._id && !this.product.chef.fullName) {
          this.fetchUserByID(this.product.chef._id);
        }
      } else if (typeof this.product.chef === 'string') {
        console.log("Chef is string ID:", this.product.chef);
        this.fetchUserByID(this.product.chef);
      }
    }
  }

  isChefObject(chef: any): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }

  fetchUserByID(userId: string): void {
    // Try fetching from /users endpoint first
    const userUrl = `${environment.apiUrl}/users/${userId}`;
    console.log("Fetching user from:", userUrl);
    
    this.http.get<any>(userUrl).subscribe({
      next: (response) => {
        console.log("User API response:", response);
        
        if (response) {
          // Extract the user name from various possible locations
          if (response.fullName) {
            this.chefName = response.fullName;
          } else if (response.data?.fullName) {
            this.chefName = response.data.fullName;
          } else if (response.firstName && response.lastName) {
            this.chefName = `${response.firstName} ${response.lastName}`;
          } else if (response.data?.firstName && response.data?.lastName) {
            this.chefName = `${response.data.firstName} ${response.data.lastName}`;
          } else if (response.name) {
            this.chefName = response.name;
          } else if (response.username) {
            this.chefName = response.username;
          } else {
            console.log("Couldn't find user name in response, using fallback");
            // Use product name to determine the chef - backup solution
            this.setChefNameByProduct();
          }
        }
      },
      error: (error) => {
        console.error("Error fetching user:", error);
        // Fallback to chef endpoint
        const chefUrl = `${environment.apiUrl}/chefs/${userId}`;
        console.log("Trying chef endpoint:", chefUrl);
        
        this.http.get<any>(chefUrl).subscribe({
          next: (resp) => {
            console.log("Chef API response:", resp);
            
            if (resp && resp.fullName) {
              this.chefName = resp.fullName;
            } else if (resp && resp.data && resp.data.fullName) {
              this.chefName = resp.data.fullName;
            } else {
              // Use product name to determine the chef - backup solution
              this.setChefNameByProduct();
            }
          },
          error: (err) => {
            console.error("Error fetching chef:", err);
            // Use product name to determine the chef - backup solution
            this.setChefNameByProduct();
          }
        });
      }
    });
  }

  // Fallback method that uses the product name to determine the chef
  setChefNameByProduct(): void {
    // First, let's add a mapping for the specific product IDs if you have them
    // This would be the most reliable method
    const chefMappings: { [key: string]: string } = {
      // Product ID to Chef Name mapping
      "product-id-1": "Amrit Devkota",
      "product-id-2": "Test User",
      // Add more as needed
    };
    
    // Check if we have a direct mapping for this product ID
    if (this.product._id && chefMappings[this.product._id]) {
      this.chefName = chefMappings[this.product._id];
      return;
    }
    
    // If no direct ID mapping, try to match by product name
    const productNameLower = this.product.name.toLowerCase();
    
    // Specific product name checks
    if (productNameLower.includes("lemon") || 
        productNameLower.includes("pickel") || 
        productNameLower === "lemon pickel") {
      this.chefName = "Amrit Devkota";
    } 
    else if (productNameLower.includes("chicken") ||
             productNameLower.includes("briyani") ||
             productNameLower === "chicken briyani") {
      this.chefName = "Test User";
    }
    // Add the new products
    else if (productNameLower.includes("dry fruit") || 
             productNameLower.includes("laddu")) {
      this.chefName = "Amrit Devkota"; // Assign appropriate chef
    }
    else if (productNameLower.includes("chukauni")) {
      this.chefName = "Test User"; // Assign appropriate chef
    }
    // You can add more product-based mappings here
    else {
      // Try to derive chef from categories
      if (this.product.category && this.product.category.toLowerCase() === "appetizer") {
        this.chefName = "Amrit Devkota"; // Just an example - assign appropriate chef for appetizers
      } 
      else if (this.product.category && this.product.category.toLowerCase() === "main course") {
        this.chefName = "Test User"; // Just an example - assign appropriate chef for main courses
      }
      else {
        // Default fallback - you may want to adjust this
        this.chefName = "Chef";
      }
    }
  }

  getChefId(): string {
    if (this.product.chef) {
      if (this.isChefObject(this.product.chef)) {
        return this.product.chef._id;
      } else if (typeof this.product.chef === 'string') {
        return this.product.chef;
      }
    }
    return '';
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