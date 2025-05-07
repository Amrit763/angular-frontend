// src/app/features/cart/cart.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CartRoutingModule } from './cart-routing.module';
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrderSuccessComponent } from './order-success/order-success.component';

@NgModule({
  declarations: [
    CartComponent,
    CheckoutComponent
    // Note: OrderSuccessComponent is standalone so not included here
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CartRoutingModule,
    OrderSuccessComponent // Import standalone component
  ]
})
export class CartModule { }