import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

type AuthMode = 'signup' | 'login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  mode: AuthMode = 'signup';

  errorMessage = '';
  isLoading = false;

  signupForm: FormGroup;
  loginForm: FormGroup;

  private readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['employee', Validators.required],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(this.passwordPattern)
        ]
      ]
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['employee', Validators.required]
    });
  }

  switchMode(mode: AuthMode): void {
    this.mode = mode;
    this.errorMessage = '';
    this.signupForm.reset({
      role: 'employee'
    });
    this.loginForm.reset({
      role: 'employee'
    });
  }

  signup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { fullName, email, password, role } =
      this.signupForm.value;

    this.authService
      .register({
        fullName,
        email,
        password,
        role 
      })
      .subscribe({
        next: (user) => {
          this.isLoading = false;

          this.router.navigate([
            user.role === 'admin'
              ? '/admin/dashboard'
              : '/employee/dashboard'
          ]);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err.message ||
            'Registration failed. Please try again.';
        }
      });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password, role } = this.loginForm.value;

    this.authService
      .login({
        email,
        password,
        role
      })
      .subscribe({
        next: (user) => {
          this.isLoading = false;

          this.router.navigate([
            user.role === 'admin'
              ? '/admin/dashboard'
              : '/employee/dashboard'
          ]);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err.message ||
            'Invalid email or password.';
        }
      });
  }
}