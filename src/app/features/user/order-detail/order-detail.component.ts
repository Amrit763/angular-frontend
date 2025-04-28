// src/app/features/user/order-detail/order-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order, ChefItemGroup } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class OrderDetailComponent implements OnInit {
  orderId: string = '';
  order: Order | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public orderService: OrderService,
    public productService: ProductService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderId = id;
        this.loadOrderDetails(id);
      } else {
        this.error = 'Order ID not found';
        this.isLoading = false;
      }
    });
  }

  loadOrderDetails(id: string): void {
    this.isLoading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (response) => {
        this.order = response.order;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred while loading order details';
        this.isLoading = false;
      }
    });
  }

  cancelOrder(): void {
    if (!this.order) return;
    
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(this.order._id).subscribe({
        next: (response) => {
          this.order = response.order;
        },
        error: (err) => {
          this.error = err.message || 'Failed to cancel the order';
        }
      });
    }
  }

  // New delete order functionality
  deleteOrder(): void {
    if (!this.order) return;
    
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      this.orderService.deleteOrder(this.order._id).subscribe({
        next: (response) => {
          if (response.success) {
            // Navigate back to orders list
            this.router.navigate(['/user/orders']);
          } else {
            this.error = response.message || 'Failed to delete the order';
          }
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete the order';
        }
      });
    }
  }

  // Helper method for getting chef groups directly from order
  getChefGroups(): ChefItemGroup[] {
    if (!this.order || !this.order.chefItems) return [];
    return this.order.chefItems;
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  backToOrders(): void {
    this.router.navigate(['/user/orders']);
  }

  // Get the CSS class for the chef group based on status
  getStatusClass(chefGroup: ChefItemGroup): string {
    return this.orderService.getStatusClass(chefGroup.status);
  }

  // Get the status label for the chef group
  getStatusLabel(chefGroup: ChefItemGroup): string {
    return this.orderService.getStatusLabel(chefGroup.status);
  }
}