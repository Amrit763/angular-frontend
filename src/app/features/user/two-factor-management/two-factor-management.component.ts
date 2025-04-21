// src/app/features/user/two-factor-management/two-factor-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-two-factor-management',
  templateUrl: './two-factor-management.component.html',
  styleUrls: ['./two-factor-management.component.css'],
  // Add standalone: true and imports to make the component work with the directives
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule]
})
export class TwoFactorManagementComponent implements OnInit {
  // Forms
  verifyForm: FormGroup;
  disableForm: FormGroup;
  
  // Form submission flags
  verifySubmitted = false;
  disableSubmitted = false;
  
  // Loading state
  loading = false;
  
  // Message states
  errorMessage = '';
  successMessage = '';
  
  // 2FA setup data
  qrCodeUrl = '';
  secretKey = '';
  backupCodes: string[] = [];
  
  // View states
  setupComplete = false;
  showSetup = false;
  showBackupCodes = false;
  showManage = true;
  showDisableConfirmation = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private toastr: ToastrService
  ) {
    // Initialize forms
    this.verifyForm = this.formBuilder.group({
      verificationCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.disableForm = this.formBuilder.group({
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if the user already has 2FA enabled
    const user = this.tokenService.getUser();
    if (user && user.twoFactorEnabled) {
      this.setupComplete = true;
    }
  }

  // Convenience getters for easy access to form fields
  get v() { return this.verifyForm.controls; }
  get d() { return this.disableForm.controls; }

  // Setup Two-Factor Authentication
  setupTwoFactor(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.authService.setup2FA()
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // Show setup view with QR code and secret
            this.qrCodeUrl = response.qrCodeDataUrl;
            this.secretKey = response.tempSecret;
            this.showSetup = true;
            this.showManage = false;
            this.toastr.success('2FA setup started. Scan the QR code with your authenticator app.');
          } else {
            this.errorMessage = response.message || 'Failed to set up two-factor authentication.';
            this.toastr.error(this.errorMessage);
          }
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
          this.toastr.error(this.errorMessage);
        }
      });
  }

  // Verify and enable 2FA
  onVerifySubmit(): void {
    this.verifySubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Stop here if form is invalid
    if (this.verifyForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    this.authService.verify2FA(this.v['verificationCode'].value)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // Show backup codes and update user data in storage
            this.backupCodes = response.backupCodes;
            this.showSetup = false;
            this.showBackupCodes = true;
            
            // Update user in storage with 2FA enabled
            const user = this.tokenService.getUser();
            if (user) {
              user.twoFactorEnabled = true;
              this.tokenService.saveUser(user);
              this.setupComplete = true;
            }
            
            this.successMessage = response.message || 'Two-factor authentication has been enabled successfully.';
            this.toastr.success(this.successMessage);
          } else {
            this.errorMessage = response.message || 'Verification failed. Please check your code and try again.';
            this.toastr.error(this.errorMessage);
          }
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
          this.toastr.error(this.errorMessage);
        }
      });
  }

  // Disable 2FA
  onDisableSubmit(): void {
    this.disableSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Stop here if form is invalid
    if (this.disableForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    this.authService.disable2FA(this.d['password'].value)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // Update user in storage with 2FA disabled
            const user = this.tokenService.getUser();
            if (user) {
              user.twoFactorEnabled = false;
              this.tokenService.saveUser(user);
              this.setupComplete = false;
            }
            
            this.showDisableConfirmation = false;
            this.successMessage = response.message || 'Two-factor authentication has been disabled.';
            this.toastr.success(this.successMessage);
          } else {
            this.errorMessage = response.message || 'Failed to disable two-factor authentication.';
            this.toastr.error(this.errorMessage);
          }
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
          this.toastr.error(this.errorMessage);
        }
      });
  }

  // Get new backup codes
  getNewBackupCodes(): void {
    this.disableSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Stop here if form is invalid
    if (this.disableForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    this.authService.getNewBackupCodes(this.d['password'].value)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // Show new backup codes
            this.backupCodes = response.backupCodes;
            this.showManage = false;
            this.showBackupCodes = true;
            this.showDisableConfirmation = false;
            this.successMessage = response.message || 'New backup codes generated successfully.';
            this.toastr.success(this.successMessage);
          } else {
            this.errorMessage = response.message || 'Failed to generate new backup codes.';
            this.toastr.error(this.errorMessage);
          }
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
          this.toastr.error(this.errorMessage);
        }
      });
  }

  // Show manage screen after backup codes
  showManageScreen(): void {
    this.showBackupCodes = false;
    this.showManage = true;
  }

  // Utility methods for backup codes
  printBackupCodes(): void {
    const printContent = `
      <html>
      <head>
        <title>Two-Factor Authentication Backup Codes</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { margin-bottom: 20px; }
          .backup-codes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 20px; }
          .backup-code { font-family: monospace; font-size: 16px; padding: 10px; border: 1px solid #ddd; text-align: center; }
          .warning { color: #dc3545; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>Two-Factor Authentication Backup Codes</h2>
        <p>Keep these backup codes in a safe place. Each code can only be used once.</p>
        <p class="warning">Important: These codes will not be shown again.</p>
        <div class="backup-codes">
          ${this.backupCodes.map(code => `<div class="backup-code">${code}</div>`).join('')}
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      this.errorMessage = 'Please enable pop-ups to print the backup codes.';
      this.toastr.error(this.errorMessage);
    }
  }

  copyBackupCodes(): void {
    const text = `Two-Factor Authentication Backup Codes:\n\n${this.backupCodes.join('\n')}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        this.successMessage = 'Backup codes copied to clipboard.';
        this.toastr.success(this.successMessage);
      })
      .catch(() => {
        this.errorMessage = 'Failed to copy backup codes. Please copy them manually.';
        this.toastr.error(this.errorMessage);
      });
  }
}