// src/app/features/user/settings/settings.routes.ts
import { Routes } from '@angular/router';
import { SettingsComponent } from './settings/settings.component';
import { TwoFactorSettingsComponent } from './two-factor-settings/two-factor-settings.component';

export const SETTINGS_ROUTES: Routes = [
  { 
    path: '', 
    component: SettingsComponent,
    children: [
      { path: 'two-factor', component: TwoFactorSettingsComponent },
      // Add other settings routes here
      { path: '', component: SettingsComponent }
    ]
  }
];