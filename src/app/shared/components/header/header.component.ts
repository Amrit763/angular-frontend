// src/app/shared/components/header/header.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { CartService } from '../../../core/services/cart.service';
import { User } from '../../../core/auth/user.model';
import { Subscription } from 'rxjs';

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
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  currentUser: User | null = null;
  isChefMode = false;
  cartItemCount = 0;
  unreadMessages = 0; // For chat badge
  pendingOrders = 0; // For orders badge
  isDropdownOpen = false; // Track dropdown state
  isMenuCollapsed = true; // Track mobile menu collapsed state
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to user changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        
        // Reset chef mode when user changes or logs out
        if (!this.isChef()) {
          this.isChefMode = false;
        }
        
        // If user is logged in, get cart count and notifications
        if (user) {
          this.loadUserData();
        }
      })
    );

    // Check if user is already logged in
    const user = this.tokenService.getUser();
    if (user) {
      this.currentUser = user;
      this.loadUserData();
    }
  }

  // Load all user-related data including notifications
  loadUserData(): void {
    // Load cart data
    this.subscriptions.push(
      this.cartService.cartCount$.subscribe(count => {
        this.cartItemCount = count;
      })
    );
    
    this.cartService.getCart().subscribe();
    
    // You would implement these services in your actual application
    this.loadUnreadMessages();
    this.loadPendingOrders();
  }
  
  // Load unread messages count
  loadUnreadMessages(): void {
    // This is a placeholder - replace with your actual service call
    // For example: this.messageService.getUnreadCount().subscribe(count => this.unreadMessages = count);
    this.unreadMessages = Math.floor(Math.random() * 5); // Placeholder for demo
  }
  
  // Load pending orders count
  loadPendingOrders(): void {
    // This is a placeholder - replace with your actual service call
    // For example: this.orderService.getPendingCount().subscribe(count => this.pendingOrders = count);
    this.pendingOrders = Math.floor(Math.random() * 3); // Placeholder for demo
  }

  ngAfterViewInit(): void {
    // Initialize dropdown toggling
    this.initializeDropdowns();
  }
  
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Toggle mobile menu
  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    
    // Close dropdown if open when menu is toggled
    if (!this.isMenuCollapsed && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  // Method to manually initialize dropdowns
  private initializeDropdowns(): void {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      if (!(event.target as HTMLElement).closest('.dropdown')) {
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
    
    // Close dropdown after toggle
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.isDropdownOpen = false;
  }
}