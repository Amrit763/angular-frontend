// src/app/shared/components/chat-quick-replies/chat-quick-replies.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-quick-replies',
  templateUrl: './chat-quick-replies.component.html',
  styleUrls: ['./chat-quick-replies.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ChatQuickRepliesComponent implements OnInit {
  @Input() role: 'user' | 'chef' = 'user';
  @Input() orderStatus: string = '';
  @Output() replySelected = new EventEmitter<string>();
  
  categories: {name: string, replies: string[]}[] = [];
  expanded: boolean = false;
  
  constructor() { }

  ngOnInit(): void {
    this.initializeReplies();
  }
  
  ngOnChanges(): void {
    this.initializeReplies();
  }
  
  initializeReplies(): void {
    if (this.role === 'user') {
      this.initializeUserReplies();
    } else {
      this.initializeChefReplies();
    }
  }
  
  initializeUserReplies(): void {
    // Standard replies for users
    const generalReplies = [
      'Hi, I have a question about my order.',
      'Thank you!',
      'Could you please let me know when my order will be ready?',
      'I have a food allergy, can you make sure the dish doesn\'t contain...',
      'Could I add something to my order?'
    ];
    
    // Status-specific replies
    let statusReplies: string[] = [];
    
    switch (this.orderStatus) {
      case 'Pending':
      case 'Received':
        statusReplies = [
          'How long will it take to prepare my order?',
          'Can I make a small change to my order?',
          'Could you confirm you received my special instructions?'
        ];
        break;
      case 'In Progress':
        statusReplies = [
          'How much longer until my order is ready?',
          'Is everything going well with the preparation?',
          'Can I get an update on my order?'
        ];
        break;
      case 'Ready for Pickup':
        statusReplies = [
          'I\'m on my way to pick up my order.',
          'I\'ll be there in about 10 minutes.',
          'Is the food still hot?'
        ];
        break;
      case 'Delivered':
        statusReplies = [
          'The food was delicious, thank you!',
          'I have feedback about my order.',
          'There was a small issue with my order.'
        ];
        break;
      default:
        statusReplies = [];
    }
    
    // Set categories
    this.categories = [
      { name: 'General', replies: generalReplies }
    ];
    
    if (statusReplies.length > 0) {
      this.categories.push({ name: 'Status', replies: statusReplies });
    }
  }
  
  initializeChefReplies(): void {
    // Standard replies for chefs
    const generalReplies = [
      'Hello! How can I help you with your order?',
      'Thank you for ordering from us!',
      'Please let me know if you have any questions.',
      'I\'ll make sure your order is prepared exactly as requested.',
      'Is there anything else you need?'
    ];
    
    // Status-specific replies
    let statusReplies: string[] = [];
    
    switch (this.orderStatus) {
      case 'Pending':
      case 'Received':
        statusReplies = [
          'I\'ve received your order and will start preparing it shortly.',
          'I\'ll need approximately 30 minutes to prepare your order.',
          'I\'ve noted your special instructions.'
        ];
        break;
      case 'In Progress':
        statusReplies = [
          'Your order is being prepared right now.',
          'The preparation is going well. It should be ready in about 15 minutes.',
          'I\'m adding the finishing touches to your order.'
        ];
        break;
      case 'Ready for Pickup':
        statusReplies = [
          'Your order is ready for pickup!',
          'Your food is packaged and waiting. It will stay hot for about 30 minutes.',
          'Please come to the front counter to collect your order.'
        ];
        break;
      case 'Delivered':
        statusReplies = [
          'I hope you enjoyed your meal!',
          'Thank you for your order. Please let me know if everything was satisfactory.',
          'Would you consider leaving us a review?'
        ];
        break;
      default:
        statusReplies = [];
    }
    
    // Set categories
    this.categories = [
      { name: 'General', replies: generalReplies }
    ];
    
    if (statusReplies.length > 0) {
      this.categories.push({ name: 'Status', replies: statusReplies });
    }
  }
  
  selectReply(reply: string): void {
    this.replySelected.emit(reply);
    this.expanded = false;
  }
  
  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }
}