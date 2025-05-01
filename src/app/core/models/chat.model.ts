// src/app/core/models/chat.model.ts
import { Order } from './order.model';
import { User } from '../auth/user.model';

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