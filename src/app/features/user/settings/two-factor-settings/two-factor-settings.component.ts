// src/app/features/user/settings/two-factor/two-factor-settings.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-two-factor-settings',
  templateUrl: './two-factor-settings.component.html',
  styleUrls: ['./two-factor-settings.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class TwoFactorSettingsComponent implements OnInit {
  loading = false;
  errorMessage = '';
  successMessage = '';
  twoFactorStatus = { enabled: false };
  qrCodeDataUrl = '';
  tempSecret = '';
  otpAuthUrl = '';
  backupCodes: string[] = [];
  setupStep = 0; // 0: not started, 1: showing QR, 2: verification, 3: success
  currentUser: any;
  
  verificationForm: FormGroup;
  disableForm: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.verificationForm = this.formBuilder.group({
      verificationCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
    
    this.disableForm = this.formBuilder.group({
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Subscribe to current user to get 2FA status
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.twoFactorStatus.enabled = user.twoFactorEnabled || false;
      }
    });
    
    // Refresh user data from server
    this.refreshUserData();
  }
  
  refreshUserData(): void {
    this.loading = true;
    this.authService.getCurrentUser().subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  initiateTwoFactorSetup(): void {
    this.loading = true;
    this.errorMessage = '';
    this.setupStep = 0;
    
    this.authService.setup2FA().subscribe({
      next: (response) => {
        this.qrCodeDataUrl = response.qrCodeDataUrl;
        this.tempSecret = response.tempSecret;
        this.otpAuthUrl = response.otpAuthUrl;
        this.setupStep = 1;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  submitVerificationCode(): void {
    if (this.verificationForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const verificationCode = this.verificationForm.get('verificationCode')?.value;
    
    this.authService.verify2FA(verificationCode).subscribe({
      next: (response) => {
        this.backupCodes = response.backupCodes || [];
        this.setupStep = 3;
        this.twoFactorStatus.enabled = true;
        this.loading = false;
        this.successMessage = 'Two-factor authentication has been enabled successfully.';
        this.refreshUserData();
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  disableTwoFactor(): void {
    if (this.disableForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const password = this.disableForm.get('password')?.value;
    
    this.authService.disable2FA(password).subscribe({
      next: () => {
        this.twoFactorStatus.enabled = false;
        this.setupStep = 0;
        this.loading = false;
        this.successMessage = 'Two-factor authentication has been disabled successfully.';
        this.disableForm.reset();
        this.refreshUserData();
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  regenerateBackupCodes(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // Using the existing method from AuthService
    const password = this.disableForm.get('password')?.value;
    
    this.authService.getNewBackupCodes(password).subscribe({
      next: (response) => {
        this.backupCodes = response.backupCodes || [];
        this.loading = false;
        this.successMessage = 'New backup codes have been generated successfully.';
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
  
  getBackupCodes(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // No direct method exists in your AuthService, so using the getNewBackupCodes method
    const password = this.disableForm.get('password')?.value;
    
    if (!password) {
      this.errorMessage = 'Password is required to view backup codes';
      this.loading = false;
      return;
    }
    
    this.authService.getNewBackupCodes(password).subscribe({
      next: (response) => {
        this.backupCodes = response.backupCodes || [];
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error;
        this.loading = false;
      }
    });
  }
}