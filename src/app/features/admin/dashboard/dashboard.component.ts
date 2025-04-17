// src/app/features/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/auth/token.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ChefApplication {
  _id: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
  specialization: string;
  experience: number;
  isApproved: boolean;
  createdAt: string;
}

interface DashboardStats {
  userCount: number;
  chefCount: number;
  pendingApplications: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DashboardComponent implements OnInit {
  adminInfo: any;
  recentUsers: User[] = [];
  recentApplications: ChefApplication[] = [];
  stats: DashboardStats = {
    userCount: 0,
    chefCount: 0,
    pendingApplications: 0
  };

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkAdminStatus();
    this.loadAdminDashboard();
  }

  checkAdminStatus(): void {
    if (!this.tokenService.isLoggedIn() || !this.tokenService.isAdmin()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.adminInfo = this.tokenService.getUser();
  }

  loadAdminDashboard(): void {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Get dashboard stats
    this.http.get<any>(`${environment.apiUrl}/users`, { headers })
      .subscribe(
        (response) => {
          if (response.success) {
            this.stats.userCount = response.count;
            this.recentUsers = response.users.slice(0, 5);
            // Count chefs
            this.stats.chefCount = response.users.filter((user: User) => user.role === 'chef').length;
          }
        },
        (error) => {
          console.error('Error loading users:', error);
        }
      );

    // Get chef applications
    this.http.get<any>(`${environment.apiUrl}/chefs/applications`, { headers })
      .subscribe(
        (response) => {
          if (response.success) {
            this.stats.pendingApplications = response.applications.filter(
              (app: ChefApplication) => !app.isApproved
            ).length;
            this.recentApplications = response.applications.slice(0, 5);
          }
        },
        (error) => {
          console.error('Error loading chef applications:', error);
        }
      );
  }

  getBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'chef':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}