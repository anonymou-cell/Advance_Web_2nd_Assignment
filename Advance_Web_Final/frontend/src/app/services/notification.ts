import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface Notification {
  id: string;
  message: string;
  activityId?: string | null;
  activityTitle?: string | null;
  targetUsername?: string;
  type: 'broadcast' | 'reminder';
  sentAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly apiUrl = 'http://localhost:3000/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  sendBroadcast(message: string, activityId?: string): Observable<Notification> {
    return this.http.post<Notification>(
      `${this.apiUrl}/broadcast`,
      { message, activityId }
    ).pipe(
      catchError(this.handleError)
    );
  }

  scheduleReminder(data: {
    activityId: string;
    interval: string;
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/schedule`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  sendReminder(participantId: string): Observable<Notification> {
    return this.http.post<Notification>(
      `${this.apiUrl}/remind/${participantId}`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    const message =
      error.error instanceof ErrorEvent
        ? `Client error: ${error.error.message}`
        : `Server returned ${error.status}: ${error.error?.message || error.message}`;

    console.error('NotificationService error:', message);

    return throwError(() => new Error(message));
  }
}