// src/app/features/user/change-password/change-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';

// Custom validator to check if passwords match
function matchingPasswords(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors['matching']) {
      return;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ matching: true });
    } else {
      matchingControl.setErrors(null);
    }
  };
}

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  
  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  // Password strength
  passwordStrength = 0;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Initialize the change password form
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8), 
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: matchingPasswords('newPassword', 'confirmPassword')
    });
    
    // Subscribe to new password value changes to calculate strength
    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(
      (value) => this.calculatePasswordStrength(value)
    );
    
    // Load Font Awesome if not already loaded
    this.loadFontAwesome();
  }

  // Convenience getter for easy access to form fields
  get f() { return this.changePasswordForm.controls; }
  
  // Toggle password visibility
  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
  
  // Calculate password strength
  calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) {
      strength += 20;
    }
    
    // Contains lowercase letters
    if (/[a-z]/.test(password)) {
      strength += 20;
    }
    
    // Contains uppercase letters
    if (/[A-Z]/.test(password)) {
      strength += 20;
    }
    
    // Contains numbers
    if (/\d/.test(password)) {
      strength += 20;
    }
    
    // Contains special characters
    if (/[@$!%*?&]/.test(password)) {
      strength += 20;
    }
    
    this.passwordStrength = strength;
  }
  
  // Get password strength text based on percentage
  getPasswordStrengthText(): string {
    if (this.passwordStrength === 0) return 'None';
    if (this.passwordStrength <= 20) return 'Very Weak';
    if (this.passwordStrength <= 40) return 'Weak';
    if (this.passwordStrength <= 60) return 'Medium';
    if (this.passwordStrength <= 80) return 'Strong';
    return 'Very Strong';
  }
  
  // Get CSS class for password strength meter
  getPasswordStrengthClass(): string {
    if (this.passwordStrength <= 20) return 'bg-danger';
    if (this.passwordStrength <= 40) return 'bg-warning';
    if (this.passwordStrength <= 60) return 'bg-info';
    if (this.passwordStrength <= 80) return 'bg-primary';
    return 'bg-success';
  }

  // Handle form submission
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Stop here if form is invalid
    if (this.changePasswordForm.invalid) {
      console.log('Form is invalid:', this.changePasswordForm.errors);
      return;
    }
    
    this.loading = true;
    
    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;
    
    // Debugging: Log request (remove in production)
    console.log('Password change request payload:', { 
      currentPassword: '******', 
      newPassword: '******',
      confirmPassword: '******' 
    });
    
    this.authService.changePassword(currentPassword, newPassword)
      .subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Password change response:', response);
          
          if (response.success) {
            this.successMessage = response.message || 'Password changed successfully';
            this.toastr.success(this.successMessage);
            
            // Reset form
            this.changePasswordForm.reset();
            this.submitted = false;
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/user/dashboard']);
            }, 2000);
          } else {
            this.errorMessage = response.message || 'Failed to change password';
            this.toastr.error(this.errorMessage);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Password change error:', error);
          
          // Display a more helpful error message if possible
          if (typeof error === 'string') {
            this.errorMessage = error;
          } else if (error?.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'An error occurred while changing your password. Please try again.';
          }
          
          this.toastr.error(this.errorMessage);
        }
      });
  }
  
  // Load Font Awesome if not already loaded
  private loadFontAwesome(): void {
    if (!document.getElementById('font-awesome-css')) {
      const link = document.createElement('link');
      link.id = 'font-awesome-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      link.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }
}