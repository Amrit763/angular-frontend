import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/auth/auth.service';
import { TokenService } from '../core/auth/token.service';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { NgIf, NgClass } from '@angular/common';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { ChatService } from '../core/services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, HeaderComponent, FooterComponent, NgIf, NgClass, ToastComponent]
})
export class AppComponent implements OnInit {
  isChefRoute = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private tokenService: TokenService,
    private chatService: ChatService
  ) {}

  isResetPasswordRoute(): boolean {
    // Check if the current URL contains the reset-password path
    return this.router.url.includes('/auth/reset-password/');
  }

  isAdminRoute(): boolean {
    // Check if the current URL is in the admin section
    return this.router.url.includes('/admin/');
  }
  
  isChefPageRoute(): boolean {
    // Check if the current URL is in the chef section
    return this.router.url.includes('/chef/');
  }

  shouldShowHeaderFooter(): boolean {
    // Don't show header/footer on reset password route, admin routes, or chef routes
    return !this.isResetPasswordRoute() && !this.isAdminRoute() && !this.isChefPageRoute();
  }

  ngOnInit(): void {
    // Check if user is already logged in
    this.checkAuth();
    
    // Initialize socket connection for real-time messaging
    if (this.tokenService.getToken()) {
      this.chatService.initializeSocket();
    }
    
    // Check initial route
    this.isChefRoute = this.router.url.includes('/chef/');
    
    // Add body class for chef routes
    if (this.isChefRoute) {
      document.body.classList.add('chef-mode');
    }
    
    // Listen for route changes to scroll to top and update body class
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      window.scrollTo(0, 0);
      
      // Update chef route flag
      this.isChefRoute = event.url.includes('/chef/');
      
      // Add/remove chef-mode class to body
      if (this.isChefRoute) {
        document.body.classList.add('chef-mode');
      } else {
        document.body.classList.remove('chef-mode');
      }
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
            
            // Initialize socket after successful auth
            this.chatService.initializeSocket();
          },
          error: (error) => {
            console.error('Google authentication error:', error);
          }
        });
    } else {
      // Normal auth check
      this.authService.getCurrentUser().subscribe({
        next: () => {
          // Initialize socket if user is logged in
          if (this.tokenService.getToken()) {
            this.chatService.initializeSocket();
          }
        }
      });
    }
  }
}