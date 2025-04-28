// src/app/core/models/order.model.ts
import { User } from './../auth/user.model';
import { Product } from './product.model';

export type OrderStatus = 'pending' | 'received' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  product: Product | null | undefined;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: Date;
}

export interface ChefItemGroup {
  chef: User | null | undefined;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
}

export interface Order {
  _id: string;
  user: User | null | undefined;
  items: OrderItem[];
  chefItems: ChefItemGroup[];
  totalAmount: number;
  subtotal: number;
  serviceFee: number;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryNotes?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;
  order: Order;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  orders: Order[];
}

export interface ChefOrdersResponse {
  success: boolean;
  count: number;
  orders: Order[];
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  order: Order;
}