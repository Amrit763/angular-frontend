// src/app/features/chef-application/chef-application.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/auth/token.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chef-application',
  templateUrl: './chef-application.component.html',
  styleUrls: ['./chef-application.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ChefApplicationComponent implements OnInit {
  applicationForm!: FormGroup;
  submitted = false;
  loading = false;
  isSubmitted = false;
  selectedCertificates: File[] = [];
  selectedPortfolio: File[] = [];
  hasSelectedCertificates = false;
  
  // Add maximum file count constraints to match backend
  maxCertificates = 5;
  maxPortfolio = 10;
  
  // Error handling
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private tokenService: TokenService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.applicationForm = this.formBuilder.group({
      specialization: ['', Validators.required],
      experience: ['', [Validators.required, Validators.min(1)]],
      bio: ['', [Validators.required, Validators.minLength(50)]]
    });
  }

  // Getter for easy access to form fields
  get f() { return this.applicationForm.controls; }

  onFileChange(event: any, type: 'certificates' | 'portfolio'): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Clear previous errors when user takes action
    this.errorMessage = '';

    if (type === 'certificates') {
      // Check if not exceeding max files
      if (files.length > this.maxCertificates) {
        this.toastr.warning(`You can upload maximum ${this.maxCertificates} certificates.`, 'Too Many Files');
        return;
      }
      this.selectedCertificates = Array.from(files);
      this.hasSelectedCertificates = this.selectedCertificates.length > 0;
    } else {
      // Check if not exceeding max files
      if (files.length > this.maxPortfolio) {
        this.toastr.warning(`You can upload maximum ${this.maxPortfolio} portfolio images.`, 'Too Many Files');
        return;
      }
      this.selectedPortfolio = Array.from(files);
    }
  }

  removeFile(file: File, type: 'certificates' | 'portfolio'): void {
    // Clear previous errors when user takes action
    this.errorMessage = '';
    
    if (type === 'certificates') {
      this.selectedCertificates = this.selectedCertificates.filter(f => f !== file);
      this.hasSelectedCertificates = this.selectedCertificates.length > 0;
    } else {
      this.selectedPortfolio = this.selectedPortfolio.filter(f => f !== file);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    
    // Clear previous errors
    this.errorMessage = '';

    // Stop if form is invalid
    if (this.applicationForm.invalid) {
      return;
    }

    // Check if certificates have been selected
    if (this.selectedCertificates.length === 0) {
      this.hasSelectedCertificates = false;
      return;
    }

    this.loading = true;

    // Create form data
    const formData = new FormData();
    formData.append('specialization', this.f['specialization'].value);
    formData.append('experience', this.f['experience'].value);
    formData.append('bio', this.f['bio'].value);

    // Add certificate files - make sure to use the same field name as in backend
    for (const file of this.selectedCertificates) {
      formData.append('certificateImages', file);
    }

    // Add portfolio files if any - make sure to use the same field name as in backend
    for (const file of this.selectedPortfolio) {
      formData.append('portfolioImages', file);
    }

    // Get the token for authentication
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Submit application
    this.http.post(`${environment.apiUrl}/chefs/apply`, formData, { headers })
      .subscribe(
        (response: any) => {
          this.loading = false;
          this.isSubmitted = true;
          this.toastr.success('Your chef application has been submitted successfully!', 'Application Submitted');
        },
        (error: HttpErrorResponse) => {
          this.loading = false;
          console.error('Application submission error:', error);
          
          // Extract the error message from the response
          if (error.error && typeof error.error === 'object' && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else {
            this.errorMessage = error.message || 'An unknown error occurred';
          }
          
          // Log the error message for debugging
          console.log('Application submission error:', this.errorMessage);
        }
      );
  }
}