import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { TwoFactorComponent } from './two-factor/two-factor.component';

@NgModule({
  // Remove declarations since components are standalone
  imports: [
    SharedModule,
    // Import standalone components instead of declaring them
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    VerifyEmailComponent,
    TwoFactorComponent
  ]
})
export class AuthModule { }