// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

@NgModule({
  // Since AppComponent is standalone, remove it from declarations
  declarations: [
    // AppComponent is removed from here
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    // Import AppComponent as a standalone component
    AppComponent
  ],
  providers: [
    provideRouter(routes)
  ],
  // No need to bootstrap AppComponent here if you're using standalone bootstrapping
})
export class AppModule { }