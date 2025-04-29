// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CartService, CartItem } from './cart.service';
import { SelectedCondiment } from '../models/product.model';
import { 
  Order, 
  OrderStatus, 
  OrderItem, 
  ChefItemGroup,
  ChefOrdersResponse, 
  UpdateOrderStatusResponse 
} from '../models/order.model';

// Define the OrderData interface for creating orders
export interface OrderData {
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryNotes?: string;
  paymentMethod: string;
}

// Define common status labels and classes
const STATUS_LABELS: { [key: string]: string } = {
  'pending': 'Pending',
  'received': 'Received',
  'in_progress': 'In Progress',
  'ready': 'Ready for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled'
};

const STATUS_CLASSES: { [key: string]: string } = {
  'pending': 'bg-warning',
  'received': 'bg-info',
  'in_progress': 'bg-primary',
  'ready': 'bg-success',
  'delivered': 'bg-secondary',
  'cancelled': 'bg-danger'
};

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(
    private http: HttpClient,
    private cartService: CartService
  ) { }

  // Create a new order
  createOrder(orderData: OrderData): Observable<{ success: boolean; message: string; order: Order }> {
    console.log('Creating order with data:', orderData);
    
    // Make sure to get the latest cart data first to ensure correct prices
    return this.cartService.getCart().pipe(
      switchMap(cartData => {
        console.log('Latest cart data for order:', cartData);
        
        // Use the cart data to create the order
        const order = {
          ...orderData,
          items: cartData.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price,
            selectedCondiments: item.selectedCondiments,
            subtotal: item.totalPrice || this.calculateItemTotal(item)
          })),
          subtotal: cartData.subtotal,
          serviceFee: cartData.serviceFee,
          totalAmount: cartData.total
        };
        
        console.log('Submitting finalized order:', order);
        
        return this.http.post<{ success: boolean; message: string; order: Order }>(`${this.apiUrl}`, order);
      })
    );
  }

  // Get all orders for the current user
  getUserOrders(): Observable<{ success: boolean; orders: Order[] }> {
    return this.http.get<{ success: boolean; orders: Order[] }>(`${this.apiUrl}/user`);
  }

  // Get a specific order by ID
  getOrderById(orderId: string): Observable<{ success: boolean; order: Order }> {
    return this.http.get<{ success: boolean; order: Order }>(`${this.apiUrl}/${orderId}`);
  }

  // Cancel an order
  cancelOrder(orderId: string): Observable<{ success: boolean; order: Order }> {
    return this.http.patch<{ success: boolean; order: Order }>(`${this.apiUrl}/${orderId}/cancel`, {});
  }

  // Delete an order (if allowed)
  deleteOrder(orderId: string): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.apiUrl}/${orderId}/delete`, {});
  }

  // Get status label for display
  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || 'Unknown';
  }

  // Get CSS class for status
  getStatusClass(status: string): string {
    return STATUS_CLASSES[status] || 'bg-secondary';
  }

  // Check if an order can be deleted
  canDeleteOrder(order: Order): boolean {
    return order.status === 'delivered' || order.status === 'cancelled';
  }

  // Helper method to calculate item total if totalPrice is missing
  private calculateItemTotal(item: CartItem): number {
    let basePrice = Number(item.product.price) || 0;
    
    // Add condiment prices
    if (item.selectedCondiments && item.selectedCondiments.length > 0) {
      for (const condiment of item.selectedCondiments) {
        basePrice += Number(condiment.price) || 0;
      }
    }
    
    // Multiply by quantity
    return basePrice * item.quantity;
  }

  // ----- CHEF SPECIFIC METHODS -----

  // Get all orders assigned to the current chef
  getChefOrders(): Observable<ChefOrdersResponse> {
    return this.http.get<ChefOrdersResponse>(`${this.apiUrl}/chef`);
  }

  // Update an order's status
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<UpdateOrderStatusResponse> {
    return this.http.patch<UpdateOrderStatusResponse>(
      `${this.apiUrl}/${orderId}/status`, 
      { status }
    );
  }

  // Get items from an order that belong to the current chef
  getChefItems(order: Order): OrderItem[] {
    // Find the chef item group that belongs to the current chef
    const chefGroup = order.chefItems?.find(group => {
      // You may need to add logic here to find the current chef's group
      // For now, we'll assume there's only one chef per order for simplicity
      return true;
    });
    
    return chefGroup ? chefGroup.items : [];
  }

  // Get the status of an order for the current chef
  getChefStatus(order: Order): OrderStatus {
    // Find the chef item group that belongs to the current chef
    const chefGroup = order.chefItems?.find(group => {
      // You may need to add logic here to find the current chef's group
      // For now, we'll assume there's only one chef per order for simplicity
      return true;
    });
    
    // Convert status string to OrderStatus type
    return (chefGroup ? chefGroup.status : order.status) as OrderStatus;
  }

  // Check if a chef order can be deleted
  canDeleteChefOrder(order: Order): boolean {
    const status = this.getChefStatus(order);
    return status === 'delivered' || status === 'cancelled';
  }
}