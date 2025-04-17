// src/app/core/auth/user.model.ts
export interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isTwoFactorEnabled?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }