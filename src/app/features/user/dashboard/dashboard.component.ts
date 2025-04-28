// src/app/features/user/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TokenService } from '../../../core/auth/token.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';

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
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class DashboardComponent implements OnInit {
  user: any;
  changePasswordForm!: FormGroup;
  submitted = false;
  passwordChanging = false;
  changePasswordError = '';
  changePasswordSuccess = '';
  baseUrl = environment.apiUrl.replace('/api', ''); // Base URL without /api
  defaultImagePath = 'assets/images/default-profile.jpg';
  
  constructor(
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.user = this.tokenService.getUser();
    console.log('User data:', this.user);
    
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
    
    // Load Bootstrap scripts for modal functionality
    this.loadBootstrapScripts();

    // Refresh user data to ensure we have the latest
    this.refreshUserData();
  }

  // Reload user data from the server
  refreshUserData(): void {
    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.user = response.user;
          this.tokenService.saveUser(response.user);
          console.log('Refreshed user data:', this.user);
        }
      },
      error: (error) => {
        console.error('Error refreshing user data:', error);
      }
    });
  }

  // Helper function to get correct profile image URL
  getProfileImageUrl(): string {
    if (this.user && this.user.profileImage) {
      return `${this.baseUrl}/${this.user.profileImage}`;
    }
    return this.defaultImagePath;
  }

  // Handle image loading errors
  handleImageError(): void {
    console.log('Image failed to load, using default');
    // Find the image element and set the src to the default
    const imgElements = document.getElementsByClassName('profile-img');
    if (imgElements && imgElements.length > 0) {
      (imgElements[0] as HTMLImageElement).src = this.defaultImagePath;
    }
  }

  // Convenience getter for easy access to form fields
  get f() { return this.changePasswordForm.controls; }
  
  // Open change password modal
  openChangePasswordModal(): void {
    // Reset form and error messages
    this.changePasswordForm.reset();
    this.changePasswordError = '';
    this.changePasswordSuccess = '';
    this.submitted = false;
    
    // Open modal using Bootstrap's API
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
      const bsModal = new (window as any).bootstrap.Modal(modal);
      bsModal.show();
    }
  }
  
  // Handle change password form submission
  onChangePasswordSubmit(): void {
    this.submitted = true;
    this.changePasswordError = '';
    this.changePasswordSuccess = '';
    
    // Stop here if form is invalid
    if (this.changePasswordForm.invalid) {
      return;
    }
    
    this.passwordChanging = true;
    
    const { currentPassword, newPassword } = this.changePasswordForm.value;
    
    this.authService.changePassword(currentPassword, newPassword)
      .subscribe({
        next: (response) => {
          this.passwordChanging = false;
          if (response.success) {
            this.changePasswordSuccess = response.message || 'Password changed successfully';
            this.toastr.success(this.changePasswordSuccess);
            
            // Close modal after 2 seconds
            setTimeout(() => {
              const modal = document.getElementById('changePasswordModal');
              if (modal) {
                const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                  bsModal.hide();
                }
              }
              
              // Reset form
              this.changePasswordForm.reset();
              this.submitted = false;
            }, 2000);
          } else {
            this.changePasswordError = response.message || 'Failed to change password';
            this.toastr.error(this.changePasswordError);
          }
        },
        error: (error) => {
          this.passwordChanging = false;
          this.changePasswordError = error;
          this.toastr.error(this.changePasswordError);
        }
      });
  }
  
  // Logout function
  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
  }
  
  // Load Bootstrap scripts for modal functionality
  private loadBootstrapScripts(): void {
    if (!(window as any).bootstrap) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.3/js/bootstrap.bundle.min.js';
      script.integrity = 'sha512-i9cEfJwUwViEPFKdC1enz4ZRGBj8YQo6QByFTF92YXHi7waCqyexvRD75S5NVTsSiTv7rKWqG9Y5eFxmRsOn0A==';
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    }
  }
}