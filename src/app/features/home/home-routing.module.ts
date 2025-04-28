// src/app/features/home/home-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { ProductSearchComponent } from './product-search/product-search.component';
import { ChefProductsComponent } from './chef-products/chef-products.component';

const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent 
  },
  { 
    path: 'products/:id', 
    component: ProductDetailsComponent 
  },
  { 
    path: 'search', 
    component: ProductSearchComponent 
  },
  {
    path: 'chef/:chefId',
    component: ChefProductsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }