import { Component, inject, model, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from '@core/services/authentication.service';
import { UserService } from '@core/services/user.service';
import {
  lowercaseLetterValidator,
  specialCharacterValidator,
  uppercaseLetterValidator,
  usernamePasswordEqualityValidator,
} from '@core/validators/password.validators';
import {
  generateRandomPassword,
  generateRandomUser,
} from '@features/auth/sign-up/sign-up.utils';
import { switchMap } from 'rxjs';
@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent {
  private authenticationService = inject(AuthenticationService);
  private userService = inject(UserService);
  isAuthenticated = model(false);
  protected isPasswordVisible = signal(false);
  protected signUpForm = new FormGroup(
    {
      username: new FormControl('', [
        Validators.minLength(6),
        Validators.maxLength(30),
        Validators.required,
      ]),
      password: new FormControl('', [
        Validators.minLength(8),
        Validators.maxLength(256),
        Validators.required,
        specialCharacterValidator,
        lowercaseLetterValidator,
        uppercaseLetterValidator,
      ]),
    },
    [usernamePasswordEqualityValidator],
  );

  protected get username() {
    return this.signUpForm.controls.username;
  }

  protected get password() {
    return this.signUpForm.controls.password;
  }

  protected signUp() {
    if (this.signUpForm.valid) {
      this.userService
        .signUp(this.username.value!, this.password.value!)
        .pipe(
          switchMap(() =>
            this.authenticationService.login(
              this.username.value!,
              this.password.value!,
            ),
          ),
        )
        .subscribe({
          error: (error) => {
            if (error.status === 409) {
              this.username.setErrors({ taken: true });
            }
          },
        });
    } else {
      this.signUpForm.markAllAsTouched();
    }
  }

  protected generateRandomCredentials() {
    this.signUpForm.controls.username.setValue(generateRandomUser());
    this.signUpForm.controls.password.setValue(generateRandomPassword());
  }
}
