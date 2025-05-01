// src/app/core/services/toast.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastContainer: HTMLDivElement | null = null;

  constructor() {
    // Create the toast container on service initialization
    this.initToastContainer();
  }

  private initToastContainer(): void {
    // Check if running in browser
    if (typeof document === 'undefined') return;

    // Check if container already exists
    if (document.getElementById('toast-container')) return;

    // Create the toast container
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
    this.toastContainer.style.zIndex = '1050';
    document.body.appendChild(this.toastContainer);
  }

  /**
   * Shows a success toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.showToast(message, 'success', duration);
  }

  /**
   * Shows an error toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  showError(message: string, duration: number = 5000): void {
    this.showToast(message, 'danger', duration);
  }

  /**
   * Shows a warning toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 4000)
   */
  showWarning(message: string, duration: number = 4000): void {
    this.showToast(message, 'warning', duration);
  }

  /**
   * Shows an info toast message
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  showInfo(message: string, duration: number = 3000): void {
    this.showToast(message, 'info', duration);
  }

  /**
   * Creates and shows a toast notification
   * @param message The message to display
   * @param type The type of toast (success, danger, warning, info)
   * @param duration Duration in milliseconds
   */
  private showToast(message: string, type: string, duration: number): void {
    // Check if running in browser
    if (typeof document === 'undefined' || !this.toastContainer) return;

    // Create the toast element
    const toast = document.createElement('div');
    const toastId = `toast-${Date.now()}`;
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Create the toast content
    const toastContent = document.createElement('div');
    toastContent.className = 'd-flex';

    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';
    toastBody.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close btn-close-white me-2 m-auto';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');

    // Assemble the toast
    toastContent.appendChild(toastBody);
    toastContent.appendChild(closeButton);
    toast.appendChild(toastContent);

    // Add to container
    this.toastContainer.appendChild(toast);

    // Show the toast (using Bootstrap 5 toast)
    const bsToast = new (window as any).bootstrap.Toast(toast, {
      autohide: true,
      delay: duration
    });
    bsToast.show();

    // Remove the toast from DOM after hiding
    toast.addEventListener('hidden.bs.toast', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
}