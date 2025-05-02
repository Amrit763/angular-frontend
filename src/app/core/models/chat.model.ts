// src/app/core/models/chat.model.ts
export interface User {
  _id: string;
  fullName: string;
  profileImage?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Order {
  _id: string;
  user?: User;
  chef?: User;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  deliveryAddress?: DeliveryAddress;
  specialInstructions?: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  options?: {name: string, value?: string}[];
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  instructions?: string;
}

export interface ChatMessage {
  _id: string;
  chat: string;
  sender: User;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  order: Order;
  participants: User[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  success: boolean;
  chat: Chat;
}

export interface ChatsResponse {
  success: boolean;
  chats: Chat[];
}

export interface MessageResponse {
  success: boolean;
  message: ChatMessage;
}