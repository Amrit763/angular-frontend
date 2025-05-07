// src/app/core/models/chat.model.ts
import { User } from '../auth/user.model';
import { Order } from './order.model';

export interface ChatMessage {
  _id: string;
  sender: string | User; // Can be either a user ID or a User object when populated
  content: string;
  readBy: string[]; // Array of user IDs who have read the message
  deletedBy: string[]; // Array of user IDs who have deleted the message
  createdAt: string;
}

export interface Chat {
  _id: string;
  order: string | Order; // Can be either an order ID or an Order object when populated
  customer: string | User; // Can be either a user ID or a User object when populated
  chef: string | User; // Can be either a user ID or a User object when populated
  participants?: User[]; // Array of User objects with customer and chef info
  messages: ChatMessage[];
  lastActivity: string;
  isActive: boolean;
  deletedBy: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: ChatMessage; // Latest message for display in chat list
  unreadCount?: number; // Count of unread messages
}

// API Response interfaces

export interface ChatResponse {
  success: boolean;
  message?: string;
  chat: Chat;
}

export interface ChatsResponse {
  success: boolean;
  message?: string;
  count: number;
  chats: Chat[];
}

export interface ChatMessagesResponse {
  success: boolean;
  message?: string;
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  newMessage?: ChatMessage;
  sentMessage?: ChatMessage; // Some API responses use a different property name
}

export interface MarkAsReadResponse {
  success: boolean;
  message?: string;
}