// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../auth/token.service';
import { 
  Order, 
  OrderResponse, 
  OrdersResponse, 
  ChefOrdersResponse,
  UpdateOrderStatusResponse,
  OrderStatus,
  ChefItemGroup 
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  // Create a new order
  createOrder(orderData: any): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, orderData);
  }

  // Get all orders for the current user
  getUserOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(`${this.apiUrl}/user`);
  }

  // Get specific order by ID
  getOrderById(orderId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/${orderId}`);
  }

  // Get all orders for a chef
  getChefOrders(status?: OrderStatus): Observable<ChefOrdersResponse> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ChefOrdersResponse>(`${this.apiUrl}/chef`, { params });
  }

  // Update order status (for chef)
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<UpdateOrderStatusResponse> {
    return this.http.patch<UpdateOrderStatusResponse>(
      `${this.apiUrl}/${orderId}/status`, 
      { status }
    );
  }

  // Cancel order (for user)
  cancelOrder(orderId: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(
      `${this.apiUrl}/${orderId}/cancel`, 
      {}
    );
  }

  // Delete order (new method for both users and chefs)
  deleteOrder(orderId: string): Observable<{success: boolean, message: string}> {
    // Use the correct endpoint - this is likely a 'soft delete' method
    return this.http.patch<{success: boolean, message: string}>(
      `${this.apiUrl}/${orderId}/delete`, 
      {}
    ).pipe(
      catchError(error => {
        console.error('Error deleting order:', error);
        return throwError(() => error);
      })
    );
  }

  // Check if order is deletable (completed or cancelled)
  canDeleteOrder(order: Order): boolean {
    return order.status === 'delivered' || order.status === 'cancelled';
  }

  // Check if chef portion of order is deletable (delivered or cancelled)
  canDeleteChefOrder(order: Order): boolean {
    const chefStatus = this.getChefStatus(order);
    return chefStatus === 'delivered' || chefStatus === 'cancelled';
  }

  // Get order status label for display
  getStatusLabel(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      pending: 'Pending',
      received: 'Order Received',
      in_progress: 'In Progress',
      ready: 'Ready for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || 'Unknown';
  }

  // Get order status class for styling
  getStatusClass(status: OrderStatus): string {
    const classMap: Record<OrderStatus, string> = {
      pending: 'bg-warning',
      received: 'bg-info',
      in_progress: 'bg-primary',
      ready: 'bg-success',
      delivered: 'bg-success text-white',
      cancelled: 'bg-danger'
    };
    return classMap[status] || 'bg-secondary';
  }

  // Get chef-specific items from order
  getChefItems(order: Order): any[] {
    if (!order || !order.chefItems) return [];
    
    const currentUser = this.tokenService.getUser();
    if (!currentUser || !currentUser._id) return [];
    
    // Find this chef's item group in the order
    const chefGroup = order.chefItems.find(group => 
      group.chef?._id === currentUser._id
    );
    
    if (!chefGroup) return [];
    return chefGroup.items;
  }

  // Get chef-specific status from order
  getChefStatus(order: Order): OrderStatus {
    if (!order || !order.chefItems) return 'pending';
    
    const currentUser = this.tokenService.getUser();
    if (!currentUser || !currentUser._id) return 'pending';
    
    const chefGroup = order.chefItems.find(group => 
      group.chef?._id === currentUser._id
    );
    
    if (!chefGroup) return 'pending';
    return chefGroup.status;
  }

  // Get status for a specific chef in the order (for customer view)
  getChefStatusByChefId(order: Order, chefId: string): OrderStatus {
    if (!order || !order.chefItems) return 'pending';
    
    const chefGroup = order.chefItems.find(group => 
      group.chef?._id === chefId
    );
    
    if (!chefGroup) return 'pending';
    return chefGroup.status;
  }


  
}