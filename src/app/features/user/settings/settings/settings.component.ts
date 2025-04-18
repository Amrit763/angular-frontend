// src/app/features/user/settings/settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TokenService } from '../../../../core/auth/token.service';

// Modal service (assuming you use Bootstrap's JS)
declare var bootstrap: any;

interface Session {
  id: string;
  device: string;
  deviceIcon: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class SettingsComponent implements OnInit {
  user: any;
  activeSessions: Session[] = [];
  sessionsModal: any;

  constructor(
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    // Get current user
    this.user = this.tokenService.getUser();
    
    // Load mock session data
    this.loadMockSessions();
  }

  viewActiveSessions(): void {
    this.sessionsModal = new bootstrap.Modal(document.getElementById('activeSessionsModal'));
    this.sessionsModal.show();
  }

  terminateSession(sessionId: string): void {
    // In a real app, this would call an API to terminate the session
    console.log(`Terminating session: ${sessionId}`);
    
    // Mock implementation - remove from local array
    this.activeSessions = this.activeSessions.filter(session => session.id !== sessionId);
  }

  terminateAllOtherSessions(): void {
    // In a real app, this would call an API to terminate all other sessions
    console.log('Terminating all other sessions');
    
    // Mock implementation - keep only current session
    this.activeSessions = this.activeSessions.filter(session => session.isCurrent);
  }

  private loadMockSessions(): void {
    // Demo sessions - would come from a real API in production
    this.activeSessions = [
      {
        id: '1',
        device: 'Current Device',
        deviceIcon: 'bi-laptop',
        browser: 'Chrome on Windows',
        location: 'New York, USA',
        lastActive: 'Now',
        isCurrent: true
      },
      {
        id: '2',
        device: 'iPhone 13',
        deviceIcon: 'bi-phone',
        browser: 'Safari on iOS',
        location: 'New York, USA',
        lastActive: '2 hours ago',
        isCurrent: false
      },
      {
        id: '3',
        device: 'iPad Pro',
        deviceIcon: 'bi-tablet',
        browser: 'Safari on iPadOS',
        location: 'Chicago, USA',
        lastActive: '2 days ago',
        isCurrent: false
      }
    ];
  }
}