// src/app/features/auth/verify-email/verify-email.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  verified = false;
  error = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Get token from URL
    const token = this.route.snapshot.paramMap.get('token');
    
    if (!token) {
      this.loading = false;
      this.error = true;
      this.errorMessage = 'Invalid verification link.';
      return;
    }
    
    // Verify email with token
    this.authService.verifyEmail(token)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.verified = true;
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              this.router.navigate(['/auth/login'], { queryParams: { verified: 'true' } });
            }, 3000);
          } else {
            this.error = true;
            this.errorMessage = response.message || 'Email verification failed. Please try again.';
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = true;
          this.errorMessage = error || 'Email verification failed. The link may have expired.';
        }
      });
  }
}