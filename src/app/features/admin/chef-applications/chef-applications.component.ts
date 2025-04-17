// src/app/features/admin/chef-applications/chef-applications.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/auth/token.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface ChefApplication {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  specialization: string;
  experience: number;
  bio: string;
  isApproved: boolean;
  isRejected: boolean;
  certificateImages: string[];
  portfolioImages: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApplicationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

@Component({
  selector: 'app-chef-applications',
  templateUrl: './chef-applications.component.html',
  styleUrls: ['./chef-applications.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class ChefApplicationsComponent implements OnInit {
  allApplications: ChefApplication[] = [];
  filteredApplications: ChefApplication[] = [];
  selectedApplication: ChefApplication | null = null;
  
  // Debug flags
  hasLoadedData = false;
  isLoading = true;
  loadingError = '';
  
  // Filter and search
  filterStatus = '';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Modal control
  showApproveModal = false;
  showRejectModal = false;
  showDetailsModal = false;
  
  // Form control
  rejectionReason = '';
  loading = false;
  
  // Statistics
  stats: ApplicationStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  };

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    console.log('ChefApplicationsComponent initialized');
    console.log('API URL:', environment.apiUrl);
    this.checkAdminStatus();
    this.loadApplications();
  }

  checkAdminStatus(): void {
    console.log('Checking admin status');
    const isLoggedIn = this.tokenService.isLoggedIn();
    const isAdmin = this.tokenService.isAdmin();
    console.log('Is logged in:', isLoggedIn, 'Is admin:', isAdmin);
    
    if (!isLoggedIn || !isAdmin) {
      console.log('Not an admin, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }
    console.log('Admin status verified');
  }

  loadApplications(): void {
    console.log('Loading chef applications...');
    this.isLoading = true;
    const token = this.tokenService.getToken();
    console.log('Token exists:', !!token);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(`${environment.apiUrl}/chefs/applications`, { headers })
      .subscribe(
        (response) => {
          console.log('API Response received:', response);
          this.isLoading = false;
          
          if (response && response.success) {
            console.log('Applications count:', response.applications?.length || 0);
            
            // Add an isRejected flag for applications that are not approved
            this.allApplications = (response.applications || []).map((app: ChefApplication) => ({
              ...app,
              isRejected: !app.isApproved && (app.isRejected || false)
            }));
            
            console.log('Processed applications:', this.allApplications);
            this.hasLoadedData = true;
            
            this.calculateStats();
            this.filterApplications();
            console.log('Filtered applications:', this.filteredApplications);
          } else {
            console.error('API returned unsuccessful response:', response);
            this.loadingError = 'API returned unsuccessful response';
          }
        },
        (error) => {
          this.isLoading = false;
          console.error('Error loading chef applications:', error);
          this.loadingError = `Error: ${error.status} - ${error.statusText || 'Unknown error'}`;
          this.toastr.error('Failed to load chef applications', 'Error');
        }
      );
  }

  calculateStats(): void {
    console.log('Calculating stats...');
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Count all applications
    this.stats.total = this.allApplications.length;
    
    // Count pending applications
    this.stats.pending = this.allApplications.filter(app => !app.isApproved && !app.isRejected).length;
    
    // Count approved applications this month
    this.stats.approved = this.allApplications.filter(app => {
      if (!app.isApproved) return false;
      const approvedDate = new Date(app.updatedAt);
      return approvedDate >= firstDayOfMonth;
    }).length;
    
    // Count rejected applications this month
    this.stats.rejected = this.allApplications.filter(app => {
      if (!app.isRejected) return false;
      const rejectedDate = new Date(app.updatedAt);
      return rejectedDate >= firstDayOfMonth;
    }).length;
    
    console.log('Stats calculated:', this.stats);
  }

  setFilter(status: string): void {
    console.log('Setting filter to:', status);
    this.filterStatus = status;
    this.currentPage = 1;
    this.filterApplications();
  }

  filterApplications(): void {
    console.log('Filtering applications with status:', this.filterStatus);
    let filtered = [...this.allApplications];
    console.log('Original applications count:', filtered.length);

    // Apply status filter
    if (this.filterStatus) {
      if (this.filterStatus === 'pending') {
        filtered = filtered.filter(app => !app.isApproved && !app.isRejected);
      } else if (this.filterStatus === 'approved') {
        filtered = filtered.filter(app => app.isApproved);
      } else if (this.filterStatus === 'rejected') {
        filtered = filtered.filter(app => app.isRejected);
      }
      console.log('After status filter count:', filtered.length);
    }

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      console.log('Applying search term:', search);
      filtered = filtered.filter(app => 
        (app.user?.fullName?.toLowerCase().includes(search) || 
        app.user?.email?.toLowerCase().includes(search) ||
        app.specialization?.toLowerCase().includes(search))
      );
      console.log('After search filter count:', filtered.length);
    }

    this.filteredApplications = filtered;
    console.log('Final filtered applications:', this.filteredApplications);
    
    this.calculateTotalPages();
    this.applyPagination();
  }

  applyPagination(): void {
    console.log('Applying pagination, current page:', this.currentPage);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    
    // Store before pagination for debugging
    const beforePagination = [...this.filteredApplications];
    
    this.filteredApplications = this.filteredApplications.slice(start, end);
    console.log(`Pagination: ${start} to ${end}, showing ${this.filteredApplications.length} of ${beforePagination.length} items`);
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredApplications.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
    console.log('Total pages calculated:', this.totalPages);
  }

  changePage(page: number): void {
    console.log('Changing to page:', page);
    if (page < 1 || page > this.totalPages) {
      console.log('Invalid page number, ignoring');
      return;
    }
    this.currentPage = page;
    this.filterApplications();
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatusBadgeClass(application: ChefApplication): string {
    if (application.isApproved) {
      return 'bg-success';
    } else if (application.isRejected) {
      return 'bg-danger';
    } else {
      return 'bg-warning';
    }
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'NA';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  }

  // Updated getImagePath method
  getImagePath(imagePath: string): string {
    if (!imagePath) {
      console.warn('Empty image path provided');
      return 'assets/images/placeholder-certificate.jpg';
    }
    
    // Check if the image path is already a full URL
    if (imagePath.startsWith('http')) {
      console.log(`Using full URL for image: ${imagePath}`);
      return imagePath;
    }
    
    // Get base URL without the /api path
    const baseUrl = environment.apiUrl.includes('/api') 
      ? environment.apiUrl.substring(0, environment.apiUrl.indexOf('/api'))
      : environment.apiUrl;
    
    // Handle relative paths correctly
    const path = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    const fullPath = `${baseUrl}/${path}`;
    console.log(`Constructed image path: ${fullPath}`);
    return fullPath;
  }

  // Add this new method for direct image URLs
  getDirectImageUrl(imagePath: string): string {
    if (!imagePath) {
      return 'assets/images/placeholder-certificate.jpg';
    }
    
    // If it's already an absolute URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Handle the case where we need to strip the API path
    // For example, if environment.apiUrl is 'http://localhost:3000/api'
    // We need the base URL 'http://localhost:3000'
    let baseUrl = environment.apiUrl;
    if (baseUrl.includes('/api')) {
      baseUrl = baseUrl.substring(0, baseUrl.indexOf('/api'));
    }
    
    // Remove any leading slashes from the image path
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Construct the full URL
    const directUrl = `${baseUrl}/${cleanPath}`;
    console.log(`Direct image URL constructed: ${directUrl}`);
    return directUrl;
  }

  // Handler for image load errors
  onImageError(event: Event, isPortfolio: boolean = false): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      console.log('Image failed to load, using placeholder', imgElement.src);
      imgElement.src = isPortfolio 
        ? 'assets/images/placeholder-dish.jpg' 
        : 'assets/images/placeholder-certificate.jpg';
      imgElement.classList.add('error');
    }
  }

  // Modal actions
  openApproveModal(application: ChefApplication): void {
    console.log('Opening approve modal for application:', application._id);
    this.selectedApplication = application;
    this.showApproveModal = true;
  }

  closeApproveModal(): void {
    console.log('Closing approve modal');
    this.showApproveModal = false;
  }

  openRejectModal(application: ChefApplication): void {
    console.log('Opening reject modal for application:', application._id);
    this.selectedApplication = application;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    console.log('Closing reject modal');
    this.showRejectModal = false;
  }

  viewDetails(application: ChefApplication): void {
    console.log('Opening details modal for application:', application._id);
    this.selectedApplication = application;
    this.showDetailsModal = true;
    
    // Log image paths for debugging
    if (application.certificateImages && application.certificateImages.length > 0) {
      console.log('Certificate images:', application.certificateImages);
      console.log('First certificate image path:', this.getImagePath(application.certificateImages[0]));
      console.log('First direct image URL:', this.getDirectImageUrl(application.certificateImages[0]));
    } else {
      console.log('No certificate images available');
    }
    
    if (application.portfolioImages && application.portfolioImages.length > 0) {
      console.log('Portfolio images:', application.portfolioImages);
      console.log('First portfolio direct URL:', this.getDirectImageUrl(application.portfolioImages[0]));
    } else {
      console.log('No portfolio images available');
    }
  }

  closeDetailsModal(): void {
    console.log('Closing details modal');
    this.showDetailsModal = false;
  }

  // Application actions
  approveApplication(): void {
    if (!this.selectedApplication) {
      console.error('No application selected for approval');
      return;
    }
    
    console.log('Approving application:', this.selectedApplication._id);
    this.loading = true;
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.put<any>(
      `${environment.apiUrl}/chefs/applications/${this.selectedApplication._id}/approve`, 
      {}, 
      { headers }
    ).subscribe(
      (response) => {
        this.loading = false;
        console.log('Approval response:', response);
        if (response.success) {
          this.toastr.success('Chef application approved successfully', 'Approved');
          this.closeApproveModal();
          this.loadApplications(); // Reload all applications
        } else {
          console.error('API returned unsuccessful response for approval:', response);
          this.toastr.error(response.message || 'Failed to approve application', 'Error');
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error approving chef application:', error);
        this.toastr.error(error.error?.message || 'Failed to approve application', 'Error');
      }
    );
  }

  rejectApplication(): void {
    if (!this.selectedApplication) {
      console.error('No application selected for rejection');
      return;
    }
    
    console.log('Rejecting application:', this.selectedApplication._id);
    this.loading = true;
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const data = this.rejectionReason ? { reason: this.rejectionReason } : {};
    console.log('Rejection data:', data);

    this.http.delete<any>(
      `${environment.apiUrl}/chefs/applications/${this.selectedApplication._id}`, 
      { 
        headers,
        body: data
      }
    ).subscribe(
      (response) => {
        this.loading = false;
        console.log('Rejection response:', response);
        if (response.success) {
          this.toastr.success('Chef application rejected', 'Rejected');
          this.closeRejectModal();
          this.loadApplications(); // Reload all applications
        } else {
          console.error('API returned unsuccessful response for rejection:', response);
          this.toastr.error(response.message || 'Failed to reject application', 'Error');
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error rejecting chef application:', error);
        this.toastr.error(error.error?.message || 'Failed to reject application', 'Error');
      }
    );
  }

  logout(): void {
    console.log('Logging out');
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}