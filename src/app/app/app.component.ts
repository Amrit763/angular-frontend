
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/auth/auth.service';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, HeaderComponent, FooterComponent, NgIf]
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  isResetPasswordRoute(): boolean {
    // Check if the current URL contains the reset-password path
    return this.router.url.includes('/auth/reset-password/');
  }

  ngOnInit(): void {
    // Check if user is already logged in
    this.checkAuth();
    
    // Listen for route changes to scroll to top
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });
  }

  private checkAuth(): void {
    // Check if the URL contains a Google auth token
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('token');
    
    if (googleToken) {
      // Validate with backend and get user info
      this.authService.handleGoogleCallback(googleToken)
        .subscribe({
          next: () => {
            // Remove the token from URL (replace state without query params)
            const url = this.router.url.split('?')[0];
            window.history.replaceState({}, '', url);
          },
          error: (error) => {
            console.error('Google authentication error:', error);
          }
        });
    } else {
      // Normal auth check
      this.authService.getCurrentUser().subscribe();
    }
  }
}