// src/app/core/auth/user.model.ts
export interface User {
    _id: string;
    fullName: string;
    email: string;
    role: 'user' | 'chef' | 'admin';
    twoFactorEnabled: boolean; 
    profileImage?: string;
    phoneNumber?: string;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: User;
    requiresTwoFactor?: boolean;
    message?: string;
    needsVerification?: boolean;
    email?: string;
  }
  
  export interface RegisterResponse {
    success: boolean;
    message: string;
    userId: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    message?: string;
  }