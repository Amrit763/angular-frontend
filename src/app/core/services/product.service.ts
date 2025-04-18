// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Product, 
  ProductResponse, 
  ProductsResponse, 
  SearchProductsResponse 
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private baseUrl = environment.baseUrl || environment.apiUrl.split('/api')[0];

  constructor(private http: HttpClient) { }

// In product.service.ts
getImageUrl(path: string): string {
  if (!path) return 'assets/placeholder-image.jpg'; // Default image
  
  // Use absolute URL with port 3000
  if (!path.startsWith('http')) {
    return `http://localhost:3000/${path}`;
  }
  
  return path;
}
  // Get all products with optional filters
  getAllProducts(
    page: number = 1, 
    limit: number = 10, 
    category?: string, 
    minPrice?: number, 
    maxPrice?: number, 
    vegetarian?: boolean, 
    vegan?: boolean, 
    glutenFree?: boolean,
    sort?: string
  ): Observable<ProductsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (category) params = params.set('category', category);
    if (minPrice !== undefined) params = params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params = params.set('maxPrice', maxPrice.toString());
    if (vegetarian !== undefined) params = params.set('vegetarian', vegetarian.toString());
    if (vegan !== undefined) params = params.set('vegan', vegan.toString());
    if (glutenFree !== undefined) params = params.set('glutenFree', glutenFree.toString());
    if (sort) params = params.set('sort', sort);

    return this.http.get<ProductsResponse>(this.apiUrl, { params });
  }

  // Get product by ID
  getProductById(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  // Search products
  searchProducts(query: string): Observable<SearchProductsResponse> {
    return this.http.get<SearchProductsResponse>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('q', query)
    });
  }

  // Get products by chef
  getChefProducts(chefId: string): Observable<SearchProductsResponse> {
    return this.http.get<SearchProductsResponse>(`${this.apiUrl}/chef/${chefId}`);
  }

  // Create a new product
  createProduct(productData: FormData): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, productData);
  }

  // Update a product
  updateProduct(id: string, productData: FormData | any): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, productData);
  }

  // Delete a product
  deleteProduct(id: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${id}`);
  }

  // Toggle product availability
  toggleAvailability(id: string, isAvailable: boolean): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, { isAvailable });
  }
}