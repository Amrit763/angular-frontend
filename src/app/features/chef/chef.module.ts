// src/app/features/chef/chef.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChefRoutingModule } from './chef-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ChefDashboardComponent } from './chef-dashboard/chef-dashboard.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailsComponent } from './product-details/product-details.component';

@NgModule({
  imports: [
    CommonModule,
    ChefRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    // Import standalone components
    ChefDashboardComponent,
    ProductFormComponent,
    ProductListComponent,
    ProductDetailsComponent
  ]
})
export class ChefModule { }