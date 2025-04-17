// src/app/features/auth/google-callback/google-callback.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-google-callback',
  templateUrl: './google-callback.component.html',
  styleUrls: ['./google-callback.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // No need to import services that are injectable
  ]
})
export class GoogleCallbackComponent implements OnInit {
  errorMessage: string = '';
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Get token from URL parameters
    const token = this.route.snapshot.queryParams['token'];
    
    if (!token) {
      this.errorMessage = 'Authentication failed. No token received.';
      this.loading = false;
      return;
    }

    // Process the token directly using HttpClient
    this.http.get<any>(`http://localhost:3000/api/auth/google/success?token=${token}`).subscribe({
      next: (response) => {
        if (response.success) {
          // Store token directly in localStorage
          localStorage.setItem('auth_token', response.token);
          
          // Store user data if needed
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          
          // Navigate to home page
          this.router.navigate(['/']);
        } else {
          this.errorMessage = response.message || 'Authentication failed.';
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'An error occurred during authentication.';
        this.loading = false;
      }
    });
  }
}