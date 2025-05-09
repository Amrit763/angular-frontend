// src/app/shared/components/toast/toast.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div id="toast-container" class="toast-container position-fixed top-0 end-0 p-3">
      <!-- Toasts are dynamically generated by the ToastService -->
    </div>
  `,
  styles: [`
    .toast-container {
      z-index: 1100;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ToastComponent implements OnInit {
  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    // No initialization needed - ToastService handles toast creation
  }
}