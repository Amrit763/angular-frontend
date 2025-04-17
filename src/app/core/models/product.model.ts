// src/app/core/models/product.model.ts
export interface Product {
    _id: string;
    chef: ChefInfo | string;
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    ingredients: string[];
    allergens: string[];
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
  
  export interface ChefInfo {
    _id: string;
    fullName: string;
    profileImage: string | null;
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