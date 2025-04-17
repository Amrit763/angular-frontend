// src/app/features/admin/user-management/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/auth/token.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  profileImage?: string;
  isEmailVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser!: User; // Using definite assignment assertion
  isNewUser = false;
  userForm!: FormGroup;
  
  // Modal control
  showEditModal = false;
  showRoleModal = false;
  showDeleteModal = false;
  
  // Role management
  selectedRole = 'user';
  
  // Filters
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.checkAdminStatus();
    this.initUserForm();
    this.loadUsers();
  }

  checkAdminStatus(): void {
    if (!this.tokenService.isLoggedIn() || !this.tokenService.isAdmin()) {
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  initUserForm(): void {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      phoneNumber: [''],
      isActive: [true]
    });

    // Add validators for password when adding a new user
    this.userForm.get('password')?.setValidators(this.isNewUser ? [Validators.required, Validators.minLength(6)] : []);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  loadUsers(): void {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(`${environment.apiUrl}/users`, { headers })
      .subscribe(
        (response) => {
          if (response.success) {
            // Transform the user data to add isActive property
            this.users = response.users.map((user: User) => ({
              ...user,
              isActive: user.isEmailVerified
            }));
            this.filterUsers();
          }
        },
        (error) => {
          console.error('Error loading users:', error);
          this.toastr.error('Failed to load users', 'Error');
        }
      );
  }

  filterUsers(): void {
    this.currentPage = 1; // Reset to first page when filtering
    let filtered = [...this.users];

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(search) || 
        user.email.toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (this.roleFilter) {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    // Apply status filter
    if (this.statusFilter) {
      const status = this.statusFilter === 'true';
      filtered = filtered.filter(user => user.isActive === status);
    }

    this.filteredUsers = filtered;
    this.calculateTotalPages();
    this.applyPagination();
  }

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredUsers = [...this.filteredUsers].slice(start, end);
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.filterUsers();
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

  // User CRUD Operations
  addUser(): void {
    this.isNewUser = true;
    this.initUserForm(); // Reset form validators
    
    // Create a dummy user for the modal
    this.selectedUser = {
      _id: '',
      fullName: '',
      email: '',
      role: 'user',
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.userForm.reset({
      isActive: true
    });

    // Add required password validator for new users
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.showEditModal = true;
  }

  editUser(user: User): void {
    this.isNewUser = false;
    this.selectedUser = user;
    
    // Reset form validators
    this.initUserForm();
    
    // Remove required password validator for existing users
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      password: '',
      phoneNumber: user.phoneNumber || '',
      isActive: user.isActive
    });
    
    this.showEditModal = true;
  }

  saveUser(): void {
    if (this.userForm.invalid) return;

    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const userData = {
      ...this.userForm.value
    };

    // Remove password field if empty (for edit user)
    if (!userData.password) {
      delete userData.password;
    }

    if (this.isNewUser) {
      // Create new user
      this.http.post<any>(`${environment.apiUrl}/auth/register`, userData, { headers })
        .subscribe(
          (response) => {
            if (response.success) {
              this.toastr.success('User created successfully', 'Success');
              this.closeEditModal();
              this.loadUsers();
            }
          },
          (error) => {
            console.error('Error creating user:', error);
            this.toastr.error(error.error?.message || 'Failed to create user', 'Error');
          }
        );
    } else {
      // Update existing user
      this.http.put<any>(`${environment.apiUrl}/users/${this.selectedUser._id}`, userData, { headers })
        .subscribe(
          (response) => {
            if (response.success) {
              this.toastr.success('User updated successfully', 'Success');
              this.closeEditModal();
              this.loadUsers();
            }
          },
          (error) => {
            console.error('Error updating user:', error);
            this.toastr.error(error.error?.message || 'Failed to update user', 'Error');
          }
        );
    }
  }

  confirmDelete(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  deleteUser(): void {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete<any>(`${environment.apiUrl}/users/${this.selectedUser._id}`, { headers })
      .subscribe(
        (response) => {
          if (response.success) {
            this.toastr.success('User deleted successfully', 'Success');
            this.closeDeleteModal();
            this.loadUsers();
          }
        },
        (error) => {
          console.error('Error deleting user:', error);
          this.toastr.error(error.error?.message || 'Failed to delete user', 'Error');
        }
      );
  }

  openRoleModal(user: User): void {
    this.selectedUser = user;
    this.selectedRole = user.role;
    this.showRoleModal = true;
  }

  updateUserRole(): void {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const data = { role: this.selectedRole };

    this.http.put<any>(`${environment.apiUrl}/users/${this.selectedUser._id}/role`, data, { headers })
      .subscribe(
        (response) => {
          if (response.success) {
            this.toastr.success(`User role updated to ${this.selectedRole}`, 'Success');
            this.closeRoleModal();
            this.loadUsers();
          }
        },
        (error) => {
          console.error('Error updating user role:', error);
          this.toastr.error(error.error?.message || 'Failed to update user role', 'Error');
        }
      );
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.userForm.reset();
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}