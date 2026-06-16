import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from '@core/services/authentication.service';
import { ThreeDotsLoadingAnimationComponent } from '@features/auth/three-dots-loading-animation/three-dots-loading-animation.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ThreeDotsLoadingAnimationComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authenticationService = inject(AuthenticationService);
  private readonly demoCredentials = {
    username: 'HospitableJellyfish',
    password: '^IdxvTN[n/}4',
  };
  protected loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });
  protected isPasswordVisible = signal(false);
  protected isLoggingIn = signal(false);

  protected get username() {
    return this.loginForm.controls.username;
  }

  protected get password() {
    return this.loginForm.controls.password;
  }

  protected fillDemoCredentials(): void {
    this.loginForm.setValue(this.demoCredentials);
  }

  protected login(): void {
    this.loginForm.markAllAsTouched();
    this.loginForm.markAsDirty();

    if (this.loginForm.valid) {
      this.isLoggingIn.set(true);
      this.authenticationService
        .login(this.username.value!, this.password.value!)
        .pipe(
          finalize(() => {
            this.isLoggingIn.set(false);
          }),
        )
        .subscribe({
          error: (err) => {
            if (err.status === 404) {
              this.username.setErrors({ userNotFound: true });
            } else if (err.status === 401) {
              this.password.setErrors({ wrongPassword: true });
            }
          },
        });
    }
  }
}
