import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'employee';
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  register(data: {
    fullName: string;
    email: string;
    password: string;
    role: 'admin' | 'employee';
  }): Observable<User> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data
    ).pipe(
      map(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }),
      catchError(this.handleError)
    );
  }

  login(data: {
    email: string;
    password: string;
    role: 'admin' | 'employee';
  }): Observable<User> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}`,
      data
    ).pipe(
      map(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  isEmployee(): boolean {
    return this.getCurrentUser()?.role === 'employee';
  }

  private handleError(error: HttpErrorResponse) {
    let message: string;

    if (error.status === 0) {
      // Network error — server not running or CORS blocked
      message = 'Cannot connect to server. Please check if the backend is running.';
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      message = `Client error: ${error.error.message}`;
    } else if (error.error?.message) {
      // Server returned a JSON error message
      message = error.error.message;
    } else {
      // Fallback
      message = `Server error (${error.status}): ${error.statusText}`;
    }

    console.error('AuthService error:', message);
    return throwError(() => new Error(message));
  }
}
