// src/app/core/services/condiment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Condiment, ProductResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CondimentService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  // Get all condiments for a product
  getProductCondiments(productId: string): Observable<{ success: boolean, productName: string, condiments: Condiment[] }> {
    return this.http.get<{ success: boolean, productName: string, condiments: Condiment[] }>(`${this.apiUrl}/${productId}/condiments`);
  }

  // Add a condiment to a product
  addCondiment(productId: string, condiment: { name: string, price: number, isDefault: boolean }): Observable<{ success: boolean, condiment: Condiment, message: string }> {
    return this.http.post<{ success: boolean, condiment: Condiment, message: string }>(`${this.apiUrl}/${productId}/condiments`, condiment);
  }

  // Update a specific condiment
  updateCondiment(productId: string, condimentId: string, condiment: { name?: string, price?: number, isDefault?: boolean }): Observable<{ success: boolean, condiment: Condiment, message: string }> {
    return this.http.put<{ success: boolean, condiment: Condiment, message: string }>(`${this.apiUrl}/${productId}/condiments/${condimentId}`, condiment);
  }

  // Delete a condiment
  deleteCondiment(productId: string, condimentId: string): Observable<{ success: boolean, message: string }> {
    return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${productId}/condiments/${condimentId}`);
  }

  // Format condiments data for form submission
  formatCondimentsForFormData(condiments: any[], formData: FormData): void {
    condiments.forEach((condiment, index) => {
      Object.keys(condiment).forEach(key => {
        // Skip null _id fields
        if (key === '_id' && !condiment[key]) {
          return;
        }
        
        formData.append(`condiments[${index}][${key}]`, condiment[key]);
      });
    });
  }

  // Calculate total price with condiments
  calculateTotalWithCondiments(basePrice: number, selectedCondiments: { price: number }[]): number {
    let totalPrice = basePrice;
    
    if (selectedCondiments && selectedCondiments.length > 0) {
      selectedCondiments.forEach(condiment => {
        totalPrice += condiment.price;
      });
    }
    
    return Number(totalPrice.toFixed(2));
  }
}