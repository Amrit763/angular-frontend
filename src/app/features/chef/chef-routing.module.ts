// src/app/features/chef/chef-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

import { ChefDashboardComponent } from './chef-dashboard/chef-dashboard.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailsComponent } from './product-details/product-details.component';

export const CHEF_ROUTES: Routes = [
  { 
    path: 'dashboard', 
    component: ChefDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'chef' }
  },
  { 
    path: 'products', 
    component: ProductListComponent,
    canActivate: [AuthGuard],
    data: { role: 'chef' }
  },
  { 
    path: 'products/new', 
    component: ProductFormComponent,
    canActivate: [AuthGuard],
    data: { role: 'chef' }
  },
  { 
    path: 'products/edit/:id', 
    component: ProductFormComponent,
    canActivate: [AuthGuard],
    data: { role: 'chef' }
  },
  { 
    path: 'products/:id', 
    component: ProductDetailsComponent,
    canActivate: [AuthGuard],
    data: { role: 'chef' }
  },
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  }
];

@NgModule({
  imports: [RouterModule.forChild(CHEF_ROUTES)],
  exports: [RouterModule]
})
export class ChefRoutingModule { }