// src/app/core/auth/token.service.ts
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode'; // Updated import syntax

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  constructor() { }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  saveUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Check if token is expired
        return decoded.exp > Date.now() / 1000;
      } catch (error) {
        // Invalid token
        this.clearStorage();
        return false;
      }
    }
    return false;
  }

  getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isChef(): boolean {
    return this.getUserRole() === 'chef';
  }

  clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}