// src/app/core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { User, LoginResponse, RegisterResponse, AuthResponse } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {
    // Load user from localStorage on service initialization
    const user = this.tokenService.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  register(userData: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, userData)
      .pipe(catchError(this.handleError));
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user && !response.requiresTwoFactor) {
            this.setSession(response.token, response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  validateTwoFactor(email: string, token: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/2fa/validate`, { email, token })
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user) {
            this.setSession(response.token, response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  validateBackupCode(email: string, backupCode: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/2fa/validate`, { email, backupCode })
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user) {
            this.setSession(response.token, response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/verify-email/${token}`)
      .pipe(catchError(this.handleError));
  }

  resendVerificationEmail(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/resend-verification`, { email })
      .pipe(catchError(this.handleError));
  }

  forgotPassword(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, password: string, confirmPassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/reset-password/${token}`, { 
      password, 
      confirmPassword 
    })
    .pipe(catchError(this.handleError));
  }


changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
  // Create the correct request payload based on backend requirements
  const requestBody = {
    currentPassword,
    newPassword,
    // Some backends also require confirmPassword - add if your API needs it
    confirmPassword: newPassword
  };
  
  console.log('Sending password change request to:', `${this.apiUrl}/change-password`);
  
  return this.http.post<AuthResponse>(`${this.apiUrl}/change-password`, requestBody)
    .pipe(
      tap(response => console.log('Password change API response:', response)),
      catchError(error => {
        console.error('Password change API error:', error);
        return this.handleError(error);
      })
    );
}

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`)
      .pipe(
        tap(response => {
          if (response.success && response.user) {
            this.tokenService.saveUser(response.user);
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    this.tokenService.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  setup2FA(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/2fa/setup`)
      .pipe(catchError(this.handleError));
  }

  verify2FA(token: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/2fa/verify`, { token })
      .pipe(catchError(this.handleError));
  }

  disable2FA(password: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/2fa/disable`, {
      body: { password }
    })
    .pipe(catchError(this.handleError));
  }

  getNewBackupCodes(password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/2fa/backup-codes`, { password })
      .pipe(catchError(this.handleError));
  }

  // Google Authentication Methods
  getGoogleAuthUrl(): string {
    return `${this.apiUrl}/google`;
  }

  handleGoogleCallback(code: string): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.apiUrl}/google/success?token=${code}`)
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user) {
            this.setSession(response.token, response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  private setSession(token: string, user: User): void {
    this.tokenService.saveToken(token);
    this.tokenService.saveUser(user);
    this.currentUserSubject.next(user);
  }

  private handleError(error: any) {
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.error && error.error.message) {
      // Server-side error with message
      errorMessage = error.error.message;
    } else if (error.status) {
      // Handle specific HTTP errors
      switch (error.status) {
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error: ${error.statusText}`;
      }
    }
    
    return throwError(() => errorMessage);
  }
}