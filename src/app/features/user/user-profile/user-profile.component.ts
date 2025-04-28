// src/app/features/user/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { User } from '../../../core/auth/user.model';
import { environment } from '../../../../environments/environment';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class UserProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  successMessage: string | null = null;
  apiUrl = environment.apiUrl;
  baseUrl = environment.apiUrl.replace('/api', ''); // Base URL without /api
  previewImage: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  defaultImagePath = 'assets/images/default-profile.jpg'; // Default image path
// In src/app/features/user/user-profile/user-profile.component.ts

// Find this line:

// Change it to:
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private http: HttpClient,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      phoneNumber: ['', [
        Validators.pattern(/^[0-9]{10}$/), // 10 digit number
      ]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.user = response.user;
          this.tokenService.saveUser(response.user);
          
          // Initialize form with user data - with null checks
          this.profileForm.patchValue({
            fullName: this.user?.fullName || '',
            phoneNumber: this.user?.phoneNumber || ''
          });
          
          // Set profile image preview - with null checks and corrected URL path
          if (this.user && this.user.profileImage) {
            // Use baseUrl instead of apiUrl to avoid /api prefix
            this.previewImage = `${this.baseUrl}/${this.user.profileImage}`;
            console.log('Profile image URL:', this.previewImage);
          } else {
            this.previewImage = this.defaultImagePath;
            console.log('Using default profile image:', this.defaultImagePath);
          }
          
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load profile: ' + err;
        this.isLoading = false;
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      
      // Check file size (max 5MB)
      if (this.selectedFile.size > 5 * 1024 * 1024) {
        this.error = 'Image size should not exceed 5MB';
        this.selectedFile = null;
        return;
      }
      
      // Check file type
      const fileType = this.selectedFile.type;
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(fileType)) {
        this.error = 'Only JPEG, PNG, GIF, and WebP images are allowed';
        this.selectedFile = null;
        return;
      }
      
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
      
      this.error = null;
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;
    
    const formData = new FormData();
    
    // Add text fields
    formData.append('fullName', this.profileForm.get('fullName')?.value || '');
    
    // Add phone number if provided
    const phoneNumber = this.profileForm.get('phoneNumber')?.value;
    if (phoneNumber) {
      formData.append('phoneNumber', phoneNumber);
    }
    
    // Add profile image if selected
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }
    
    // Submit update if user exists
    if (this.user && this.user._id) {
      // Use direct HTTP call to update user profile
      this.http.put<any>(`${this.apiUrl}/users/${this.user._id}`, formData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.successMessage = 'Profile updated successfully';
            
            // Update user in token service
            this.tokenService.saveUser(response.user);
            
            // Refresh profile image with corrected URL
            if (response.user.profileImage) {
              this.previewImage = `${this.baseUrl}/${response.user.profileImage}`;
              console.log('Updated profile image URL:', this.previewImage);
            }
            
            // Reload current user in auth service
            this.authService.getCurrentUser().subscribe();
            
            // Reset form state
            this.selectedFile = null;
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = 'Failed to update profile: ' + (typeof err === 'string' ? err : 'An error occurred');
          console.error('Profile update error:', err);
        }
      });
    }
  }

  // Helper method to handle image errors
  handleImageError(): void {
    console.log('Image failed to load, using default');
    this.previewImage = this.defaultImagePath;
  }
}