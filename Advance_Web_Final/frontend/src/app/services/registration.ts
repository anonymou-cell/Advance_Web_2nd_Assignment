import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export type RegistrationStatus = 'registered' | 'cancelled';

export interface Registration {
  _id: string;
  id: string;
  activityId: string;
  username: string;
  employeeName: string;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface CreateRegistrationDto {
  activityId: string;
  username: string;
  employeeName: string;
}

export interface RegistrationQueryParams {
  activityId?: string;
  username?: string;
  status?: RegistrationStatus;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private readonly apiUrl = 'http://localhost:3000/registrations';

  constructor(private http: HttpClient) {}

  getRegistrations(query?: RegistrationQueryParams): Observable<Registration[]> {
    let params = new HttpParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value) {
          params = params.set(key, value);
        }
      });
    }

    return this.http.get<Registration[]>(this.apiUrl, { params }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getRegistration(id: string): Observable<Registration> {
    return this.http.get<Registration>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  registerForActivity(registration: CreateRegistrationDto): Observable<Registration> {
    return this.http.post<Registration>(this.apiUrl, registration).pipe(
      catchError(this.handleError)
    );
  }

  cancelRegistration(id: string): Observable<Registration> {
    return this.http.put<Registration>(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      catchError(this.handleError)
    );
  }

  deleteRegistration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let message: string;

    if (error.status === 0) {
      message = 'Cannot connect to server. Please check if the backend is running.';
    } else if (error.error instanceof ErrorEvent) {
      message = `Client error: ${error.error.message}`;
    } else if (error.error?.message) {
      message = error.error.message;
    } else {
      message = `Server error (${error.status}): ${error.statusText}`;
    }

    console.error('RegistrationService error:', message);
    return throwError(() => new Error(message));
  }
}
