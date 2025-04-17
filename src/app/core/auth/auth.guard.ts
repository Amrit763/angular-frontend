// src/app/core/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if user is logged in
    if (this.tokenService.isLoggedIn()) {
      // Check if the route requires a specific role
      if (route.data['role']) {
        const user = this.tokenService.getUser();
        if (user && user.role === route.data['role']) {
          return true;
        } else {
          // User doesn't have the required role
          this.router.navigate(['/']);
          return false;
        }
      }
      return true;
    }
    
    // User is not logged in, redirect to login page with return URL
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}