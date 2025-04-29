// src/app/core/models/product.model.ts
export interface Condiment {
  _id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface SelectedCondiment {
  condimentId: string;
  name: string;
  price: number;
}

export interface ChefInfo {
  _id: string;
  fullName: string;
  profileImage?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  chef: string | ChefInfo;
  images: string[];
  ingredients: string[];
  allergens: string[];
  condiments: Condiment[]; // Add condiments array
  preparationTime: number;
  servingSize: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  success: boolean;
  product: Product;
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  products: Product[];
}

export interface SearchProductsResponse {
  success: boolean;
  count: number;
  products: Product[];
}