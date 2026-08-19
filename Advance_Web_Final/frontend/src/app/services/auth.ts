import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
        localStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );

        return response.user;

      })
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
        localStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );

        return response.user;

      })
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

}