// src/app/shared/components/header/header.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { User } from '../../../core/auth/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class HeaderComponent implements OnInit, AfterViewInit {
  currentUser: User | null = null;
  isChefMode = false;
  cartItemCount = 0;
  isDropdownOpen = false; // Track dropdown state
  isMenuCollapsed = true; // Track mobile menu collapsed state

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      // Reset chef mode when user changes or logs out
      if (!this.isChef()) {
        this.isChefMode = false;
      }
    });

    // Check if user is already logged in
    const user = this.tokenService.getUser();
    if (user) {
      this.currentUser = user;
    }
    
    // For demonstration purposes
    this.cartItemCount = 3;
  }

  ngAfterViewInit(): void {
    // Initialize dropdown toggling
    this.initializeDropdowns();
  }

  // Toggle mobile menu
  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  // Method to manually initialize dropdowns
  private initializeDropdowns(): void {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      if (!(event.target as HTMLElement).closest('.dropdown')) {
        const menus = document.querySelectorAll('.dropdown-menu.show');
        menus.forEach(menu => menu.classList.remove('show'));
        this.isDropdownOpen = false;
      }
    });
  }

  // Toggle dropdown manually
  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  isLoggedIn(): boolean {
    return this.tokenService.isLoggedIn();
  }

  isChef(): boolean {
    return this.tokenService.isChef();
  }

  isAdmin(): boolean {
    return this.tokenService.isAdmin();
  }

  toggleChefMode(): void {
    this.isChefMode = !this.isChefMode;
    
    // Redirect to appropriate dashboard
    if (this.isChefMode) {
      this.router.navigate(['/chef/dashboard']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}