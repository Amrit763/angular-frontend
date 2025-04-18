// src/app/features/chef/product-details/product-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductResponse } from '../../../core/models/product.model';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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

  toggleAvailability(): void {
    if (!this.product) return;
    
    const newStatus = !this.product.isAvailable;
    
    this.productService.toggleAvailability(this.product._id, newStatus).subscribe({
      next: (response: ProductResponse) => {
        if (this.product) {
          this.product.isAvailable = newStatus;
        }
      },
      error: (err) => {
        this.error = err;
      }
    });
  }

  deleteProduct(): void {
    if (!this.product) return;
    
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(this.product._id).subscribe({
        next: () => {
          this.router.navigate(['/chef/products']);
        },
        error: (err) => {
          this.error = err;
        }
      });
    }
  }
}