// src/app/shared/components/chef-toggle/chef-toggle.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chef-toggle',
  templateUrl: './chef-toggle.component.html',
  styleUrls: ['./chef-toggle.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class ChefToggleComponent {
  @Input() isChefMode = false;
  @Output() toggleMode = new EventEmitter<void>();

  toggle() {
    this.toggleMode.emit();
  }
}