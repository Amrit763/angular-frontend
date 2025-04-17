// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  twoFactorForm: FormGroup;
  backupCodeForm: FormGroup;
  loading = false;
  submitted = false;
  twoFactorSubmitted = false;
  backupCodeSubmitted = false;
  returnUrl: string = '/';
  errorMessage: string = '';
  successMessage: string = '';
  requiresTwoFactor = false;
  showBackupCode = false;
  userEmail: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize forms
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });

    this.twoFactorForm = this.formBuilder.group({
      twoFactorCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.backupCodeForm = this.formBuilder.group({
      backupCode: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{8}$')]]
    });

    // Check for return URL or set default
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Check if redirected from email verification
    const verified = this.route.snapshot.queryParams['verified'];
    if (verified === 'true') {
      this.successMessage = 'Email verified successfully. You can now log in.';
    }
    
    // Check if token expired
    const expired = this.route.snapshot.queryParams['expired'];
    if (expired === 'true') {
      this.errorMessage = 'Your session has expired. Please login again.';
    }
  }

  ngOnInit(): void {
    // Auto-fill email if redirected from registration
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.loginForm.patchValue({ email });
    }
  }

  // Convenience getters for easy access to form fields
  get f() { return this.loginForm.controls; }
  get tf() { return this.twoFactorForm.controls; }
  get bf() { return this.backupCodeForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    
    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        next: (response) => {
          if (response.requiresTwoFactor) {
            // Handle 2FA requirement
            this.requiresTwoFactor = true;
            this.userEmail = response.email || this.f['email'].value;
            this.loading = false;
          } else if (response.needsVerification) {
            // Handle email verification requirement
            this.loading = false;
            this.errorMessage = response.message || 'Please verify your email before logging in.';
            this.userEmail = response.email || this.f['email'].value;
          } else {
            // Normal login success
            this.router.navigate([this.returnUrl]);
          }
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
        }
      });
  }

  onTwoFactorSubmit(): void {
    this.twoFactorSubmitted = true;
    this.errorMessage = '';

    // Stop here if form is invalid
    if (this.twoFactorForm.invalid) {
      return;
    }

    this.loading = true;
    
    this.authService.validateTwoFactor(this.userEmail, this.tf['twoFactorCode'].value)
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
        }
      });
  }

  onBackupCodeSubmit(): void {
    this.backupCodeSubmitted = true;
    this.errorMessage = '';

    // Stop here if form is invalid
    if (this.backupCodeForm.invalid) {
      return;
    }

    this.loading = true;
    
    this.authService.validateBackupCode(this.userEmail, this.bf['backupCode'].value)
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
        }
      });
  }

  showBackupCodeForm(): void {
    this.showBackupCode = true;
  }

  showTwoFactorForm(): void {
    this.showBackupCode = false;
  }

  loginWithGoogle(): void {
    // Store the return URL in localStorage before redirecting
    localStorage.setItem('returnUrl', this.returnUrl);
    
    // Redirect to Google OAuth URL
    window.location.href = this.authService.getGoogleAuthUrl();
  }
}