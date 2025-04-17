// src/app/core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  // Regular auth methods (login, register, etc.)
  
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        map(response => {
          // Store tokens if present and not requiring 2FA
          if (response.token && !response.requiresTwoFactor) {
            this.tokenService.setToken(response.token);
            if (response.refreshToken) {
              this.tokenService.setRefreshToken(response.refreshToken);
            }
          }
          return response;
        }),
        catchError(err => {
          return throwError(() => err.error?.message || 'An error occurred during login');
        })
      );
  }

  // Two-factor authentication methods
  
  // Get the current 2FA status
  getTwoFactorStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/2fa/status`)
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'Unable to get 2FA status');
        })
      );
  }

  // Start the 2FA setup process
  initiateTwoFactorSetup(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/setup/initiate`, {})
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'Unable to initiate 2FA setup');
        })
      );
  }

  // Complete the 2FA setup with a verification code
  completeTwoFactorSetup(verificationCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/setup/complete`, { verificationCode })
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'Unable to complete 2FA setup');
        })
      );
  }

  // Disable 2FA with password confirmation
  disableTwoFactor(password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/disable`, { password })
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'Unable to disable 2FA');
        })
      );
  }

  // Get backup codes
  getBackupCodes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/2fa/backup-codes`)
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'Unable to get backup codes');
        })
      );
  }

  // Regenerate backup codes
  regenerateBackupCodes(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/backup-codes/regenerate`, {})
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'Unable to regenerate backup codes');
        })
      );
  }

  // Validate a 2FA code during login
  validateTwoFactor(email: string, twoFactorCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/validate`, { email, twoFactorCode })
      .pipe(
        map(response => {
          // Store tokens
          if (response.token) {
            this.tokenService.setToken(response.token);
            if (response.refreshToken) {
              this.tokenService.setRefreshToken(response.refreshToken);
            }
          }
          return response;
        }),
        catchError(err => {
          return throwError(() => err.error?.message || 'Invalid verification code');
        })
      );
  }

  // Validate a backup code during login
  validateBackupCode(email: string, backupCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/validate-backup`, { email, backupCode })
      .pipe(
        map(response => {
          // Store tokens
          if (response.token) {
            this.tokenService.setToken(response.token);
            if (response.refreshToken) {
              this.tokenService.setRefreshToken(response.refreshToken);
            }
          }
          return response;
        }),
        catchError(err => {
          return throwError(() => err.error?.message || 'Invalid backup code');
        })
      );
  }

  // Forgot password request
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'An error occurred while sending password reset email');
        })
      );
  }

  // Reset password with token
  resetPassword(token: string, password: string, confirmPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/reset-password/${token}`, {
      password,
      confirmPassword
    }).pipe(
      catchError(err => {
        return throwError(() => err.error?.message || 'An error occurred during password reset');
      })
    );
  }

  // Google OAuth URL
  getGoogleAuthUrl(): string {
    return `${this.apiUrl}/auth/google`;
  }
  
  // Process Google callback with token
  processGoogleCallback(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/google/success?token=${token}`)
      .pipe(
        map(response => {
          if (response.success && response.token) {
            this.tokenService.setToken(response.token);
            // Store user data in local storage if needed
            if (response.user) {
              localStorage.setItem('user', JSON.stringify(response.user));
            }
          }
          return response;
        }),
        catchError(err => {
          return throwError(() => err.error?.message || 'An error occurred during Google authentication');
        })
      );
  }

  // Add register and resendVerificationEmail methods (needed for RegisterComponent)
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'An error occurred during registration');
        })
      );
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/resend-verification`, { email })
      .pipe(
        catchError(err => {
          return throwError(() => err.error?.message || 'An error occurred while sending verification email');
        })
      );
  }



  
}