// import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
// import { Subscription } from 'rxjs';
// import { AuthService } from '../../../core/auth/auth.service';
// import { TokenService } from '../../../core/auth/token.service';
// import { User } from '../../../core/auth/user.model';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html',
//   styleUrls: ['./header.component.css'],
//   standalone: true,
//   imports: [CommonModule, RouterModule]
// })
// export class HeaderComponent implements OnInit, OnDestroy {
//   isLoggedIn = false;
//   isAdmin = false;
//   isChef = false;
//   userName = '';
//   isDropdownOpen = false;
//   private userSubscription?: Subscription;

//   constructor(
//     private authService: AuthService,
//     private tokenService: TokenService
//   ) { }

//   ngOnInit(): void {
//     // Check initial login status
//     this.updateUserStatus();
    
//     // Subscribe to user changes
//     this.userSubscription = this.authService.currentUser$.subscribe(
//       (user: User | null) => {
//         if (user) {
//           this.isLoggedIn = true;
//           this.isAdmin = user.role === 'admin';
//           this.isChef = user.role === 'chef';
//           this.userName = user.fullName;
//         } else {
//           this.isLoggedIn = false;
//           this.isAdmin = false;
//           this.isChef = false;
//           this.userName = '';
//         }
//       }
//     );
//   }

//   ngOnDestroy(): void {
//     if (this.userSubscription) {
//       this.userSubscription.unsubscribe();
//     }
//   }

//   toggleDropdown(event: Event): void {
//     event.preventDefault();
//     event.stopPropagation();
//     this.isDropdownOpen = !this.isDropdownOpen;
//   }

//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: MouseEvent): void {
//     // Close dropdown when clicking outside
//     if (this.isDropdownOpen) {
//       const dropdownElement = (event.target as HTMLElement).closest('.dropdown');
//       if (!dropdownElement) {
//         this.isDropdownOpen = false;
//       }
//     }
//   }

//   logout(): void {
//     this.authService.logout();
//     this.isDropdownOpen = false; // Close dropdown after logout
//   }

//   private updateUserStatus(): void {
//     this.isLoggedIn = this.tokenService.isLoggedIn();
    
//     if (this.isLoggedIn) {
//       const user = this.tokenService.getUser();
//       if (user) {
//         this.isAdmin = user.role === 'admin';
//         this.isChef = user.role === 'chef';
//         this.userName = user.fullName;
//       }
//     }
//   }
// }


// src/app/shared/components/header/header.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenService } from '../../../core/auth/token.service';
import { User } from '../../../core/auth/user.model';
import { ChefToggleComponent } from '../chef-toggle/chef-toggle.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChefToggleComponent
  ]
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isChefMode = false;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Check if user is already logged in
    const user = this.tokenService.getUser();
    if (user) {
      this.currentUser = user;
    }
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
  }
}