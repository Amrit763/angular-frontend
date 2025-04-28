// src/app/features/cart/checkout/checkout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartResponse } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { TokenService } from '../../../core/auth/token.service';
import { OrderService } from '../../../core/services/order.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  standalone: false,
})
export class CheckoutComponent implements OnInit, OnDestroy {
  cartData: CartResponse | null = null;
  isLoading = true;
  error: string | null = null;

  // Form
  checkoutForm!: FormGroup;
  submitted = false;
  processing = false;

  // Payment methods
  paymentMethods: PaymentMethod[] = [
    { id: 'credit_card', name: 'Credit Card', icon: 'bi-credit-card' },
    { id: 'paypal', name: 'PayPal', icon: 'bi-paypal' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: 'bi-bank' }
  ];

  // Step tracking
  currentStep = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private tokenService: TokenService,
    private orderService: OrderService,
    public productService: ProductService, // Added productService to access in template
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load cart data
    this.loadCart();

    // Subscribe to cart changes
    this.subscriptions.push(
      this.cartService.cart$.subscribe(cart => {
        this.cartData = cart;
        this.isLoading = false;

        // Redirect if cart is empty
        if (!cart || cart.count === 0) {
          this.router.navigate(['/cart']);
        }
      })
    );

    // Initialize form
    this.initForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCart(): void {
    this.cartService.getCart().subscribe({
      error: (err) => {
        this.error = err;
        this.isLoading = false;
      }
    });
  }

  initForm(): void {
    // Get user data
    const user = this.tokenService.getUser();

    this.checkoutForm = this.fb.group({
      // Delivery information
      fullName: [user?.fullName || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5,10}$/)]],

      // Delivery options
      deliveryDate: ['', [Validators.required]],
      deliveryTime: ['', [Validators.required]],
      deliveryNotes: [''],

      // Payment information
      paymentMethod: ['credit_card', [Validators.required]],
      cardNumber: ['', [Validators.pattern(/^[0-9]{16}$/)]],
      cardExpiry: ['', [Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)]],
      cardCvc: ['', [Validators.pattern(/^[0-9]{3,4}$/)]],
      savePaymentInfo: [false]
    });
  }

  // Form getters for validation
  get f() { return this.checkoutForm.controls; }

  // Handle payment method change
  onPaymentMethodChange(method: string): void {
    this.checkoutForm.patchValue({ paymentMethod: method });

    // Clear card fields if not credit card
    if (method !== 'credit_card') {
      this.checkoutForm.patchValue({
        cardNumber: '',
        cardExpiry: '',
        cardCvc: ''
      });
    }
  }

  // Move to next step
  nextStep(): void {
    if (this.currentStep === 1) {
      // Validate delivery information
      if (this.f['fullName'].invalid || this.f['email'].invalid ||
        this.f['phoneNumber'].invalid || this.f['address'].invalid ||
        this.f['city'].invalid || this.f['zipCode'].invalid) {

        this.markFormGroupTouched(this.checkoutForm);
        return;
      }
    }

    if (this.currentStep === 2) {
      // Validate delivery options
      if (this.f['deliveryDate'].invalid || this.f['deliveryTime'].invalid) {
        this.markFormGroupTouched(this.checkoutForm);
        return;
      }
    }

    this.currentStep++;
  }

  // Move to previous step
  previousStep(): void {
    this.currentStep--;
  }

  // Mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Submit the order
  submitOrder(): void {
    this.submitted = true;

    // Validate payment information
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      return;
    }

    this.processing = true;

    // Prepare order data
    const orderData = {
      deliveryAddress: `${this.f['address'].value}, ${this.f['city'].value}, ${this.f['zipCode'].value}`,
      deliveryDate: this.f['deliveryDate'].value,
      deliveryTime: this.f['deliveryTime'].value,
      deliveryNotes: this.f['deliveryNotes'].value,
      paymentMethod: this.f['paymentMethod'].value
    };

    // Create order
    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        this.processing = false;

        // Navigate to order confirmation
        this.router.navigate(['/user/orders', response.order._id]);
      },
      error: (err) => {
        this.processing = false;
        this.error = err;
      }
    });
  }

  // Helper method to check if field is invalid
  isInvalid(fieldName: string): boolean {
    const control = this.checkoutForm.get(fieldName);
    return control ? (control.touched || this.submitted) && control.invalid : false;
  }

  // Prevent non-numeric input in number fields
  onlyNumberInput(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  // Format card expiry date (MM/YY)
  formatCardExpiry(event: any): void {
    let input = event.target.value.replace(/\D/g, '');

    if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }

    this.checkoutForm.patchValue({ cardExpiry: input });
  }

  // Get today's date formatted for the date input (YYYY-MM-DD)
  getFormattedDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}