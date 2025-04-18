// src/app/features/home/product-card/product-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product, ChefInfo } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';

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
  
  constructor(public productService: ProductService) {}
  
  isChefObject(chef: string | ChefInfo): chef is ChefInfo {
    return chef !== null && typeof chef === 'object' && '_id' in chef;
  }
}