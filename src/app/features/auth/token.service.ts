// src/app/core/auth/token.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  constructor() { }

  /**
   * Set the authentication token in local storage
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get the authentication token from local storage
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Remove the authentication token from local storage
   */
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Set the refresh token in local storage
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  /**
   * Get the refresh token from local storage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Remove the refresh token from local storage
   */
  removeRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Check if user is authenticated (has a token)
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Clear all auth-related storage items
   */
  clearTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
  }
}