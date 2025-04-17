// src/app/features/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  registered = false;
  errorMessage = '';
  successMessage = '';
  registeredEmail = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ matching: true });
    } else {
      // Only clear the matching error, don't reset other validation errors
      const errors = formGroup.get('confirmPassword')?.errors;
      if (errors) {
        delete errors['matching'];
        
        // If there are no more errors, set errors to null
        if (Object.keys(errors).length === 0) {
          formGroup.get('confirmPassword')?.setErrors(null);
        } else {
          formGroup.get('confirmPassword')?.setErrors(errors);
        }
      }
    }
  }

  // Convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    const userData = {
      fullName: this.f['fullName'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      confirmPassword: this.f['confirmPassword'].value
    };

    this.authService.register(userData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.registered = true;
            this.registeredEmail = userData.email;
            this.successMessage = response.message || 'Registration successful! Please check your email to verify your account.';
          } else {
            this.errorMessage = response.message || 'Registration failed. Please try again.';
          }
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
        }
      });
  }

  resendVerificationEmail(): void {
    if (!this.registeredEmail) {
      this.errorMessage = 'Email address not available. Please try registering again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendVerificationEmail(this.registeredEmail)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message || 'Verification email has been resent. Please check your inbox.';
        },
        error: (error) => {
          this.errorMessage = error;
          this.loading = false;
        }
      });
  }

  registerWithGoogle(): void {
    // Redirect to Google OAuth URL
    window.location.href = this.authService.getGoogleAuthUrl();
  }
}