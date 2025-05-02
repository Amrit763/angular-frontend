// src/app/features/cart/cart-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';
import { CartComponent } from '../cart/cart/cart.component';
import { CheckoutComponent } from '../cart/checkout/checkout.component';
import { OrderSuccessComponent } from '../cart/order-success/order-success.component';


export const CART_ROUTES: Routes = [
  { 
    path: '', 
    component: CartComponent
  },
  { 
    path: 'checkout', 
    component: CheckoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'success/:id',
    component: OrderSuccessComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(CART_ROUTES)],
  exports: [RouterModule]
})
export class CartRoutingModule { }