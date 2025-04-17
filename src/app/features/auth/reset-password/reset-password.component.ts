// src/app/features/auth/reset-password/reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = false;
  submitted = false;
  token = '';
  invalidToken = false;
  passwordReset = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Get token from route parameters
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.invalidToken = true;
    }
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
  get f() { return this.resetPasswordForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    // Stop here if form is invalid
    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.loading = true;

    this.authService.resetPassword(
      this.token,
      this.f['password'].value,
      this.f['confirmPassword'].value
    ).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.passwordReset = true;
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Password reset failed. Please try again.';
        }
      },
      error: (error) => {
        if (error.includes('token') || error.includes('expired')) {
          this.invalidToken = true;
        } else {
          this.errorMessage = error;
        }
        this.loading = false;
      }
    });
  }
}