import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface Activity {
  _id: string;
  id: string;
  title: string;
  serviceType: string;
  location: string;
  description: string;
  date: string;
  time: string;
  maxSeats: number;
  seatsTaken: number;
  cutOffDateTime: string;
  checkInCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateActivityDto = Omit<Activity, 'id' | 'seatsTaken'>;
export type UpdateActivityDto = Partial<CreateActivityDto>;

export interface ActivityQueryParams {
  serviceType?: string;
  location?: string;
  fromDate?: string;
}

export interface QrResponse {
  activityId: string;
  checkInCode: string;
  qrCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly apiUrl = 'http://localhost:3000/activities';

  constructor(private http: HttpClient) {}

  getActivities(query?: ActivityQueryParams): Observable<Activity[]> {
    let params = new HttpParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }

    return this.http.get<Activity[]>(this.apiUrl, { params }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getActivity(id: string): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getQrCode(id: string): Observable<QrResponse> {
    return this.http.get<QrResponse>(`${this.apiUrl}/${id}/qr`).pipe(
      catchError(this.handleError)
    );
  }

  createActivity(activity: CreateActivityDto): Observable<Activity> {
    return this.http.post<Activity>(this.apiUrl, activity).pipe(
      catchError(this.handleError)
    );
  }

  updateActivity(id: string, activity: UpdateActivityDto): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/${id}`, activity).pipe(
      catchError(this.handleError)
    );
  }

  deleteActivity(id: string): Observable<void> {
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

    console.error('ActivityService error:', message);
    return throwError(() => new Error(message));
  }
}
