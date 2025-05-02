// src/app/shared/components/chat-order-summary/chat-order-summary.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-order-summary',
  templateUrl: './chat-order-summary.component.html',
  styleUrls: ['./chat-order-summary.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ChatOrderSummaryComponent implements OnInit {
  @Input() order: any;
  @Input() collapsed: boolean = true;
  
  constructor() { }

  ngOnInit(): void {
  }
  
  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }
  
  getStatusClass(): string {
    if (!this.order || !this.order.status) {
      return 'bg-secondary';
    }
    
    switch (this.order.status) {
      case 'Pending':
        return 'bg-warning';
      case 'Received':
        return 'bg-info';
      case 'In Progress':
        return 'bg-primary';
      case 'Ready for Pickup':
        return 'bg-success';
      case 'Delivered':
        return 'bg-success';
      case 'Cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
  
  // Format price with currency symbol
  formatPrice(price: number): string {
    return '$' + price.toFixed(2);
  }
  
  // Format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}