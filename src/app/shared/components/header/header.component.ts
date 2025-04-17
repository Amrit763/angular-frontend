import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { User } from '../../../core/auth/user.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAdmin = false;
  isChef = false;
  userName = '';
  isDropdownOpen = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    // Check initial login status
    this.updateUserStatus();
    
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(
      (user: User | null) => {
        if (user) {
          this.isLoggedIn = true;
          this.isAdmin = user.role === 'admin';
          this.isChef = user.role === 'chef';
          this.userName = user.fullName;
        } else {
          this.isLoggedIn = false;
          this.isAdmin = false;
          this.isChef = false;
          this.userName = '';
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close dropdown when clicking outside
    if (this.isDropdownOpen) {
      const dropdownElement = (event.target as HTMLElement).closest('.dropdown');
      if (!dropdownElement) {
        this.isDropdownOpen = false;
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.isDropdownOpen = false; // Close dropdown after logout
  }

  private updateUserStatus(): void {
    this.isLoggedIn = this.tokenService.isLoggedIn();
    
    if (this.isLoggedIn) {
      const user = this.tokenService.getUser();
      if (user) {
        this.isAdmin = user.role === 'admin';
        this.isChef = user.role === 'chef';
        this.userName = user.fullName;
      }
    }
  }
}