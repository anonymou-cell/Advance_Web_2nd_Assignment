import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Checkin {
  id: string;
  activityId: string;
  activityTitle: string;
  username: string;
  employeeName: string;
  checkedInAt: string;
}

export interface CheckInDto {
  code?: string;
  activityId?: string;
  username: string;
  employeeName?: string;
}

export interface CheckinQueryParams {
  activityId?: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckinService {

  private readonly apiUrl = 'http://localhost:3000/checkins';

  constructor(private http: HttpClient) {}

  getCheckins(query?: CheckinQueryParams): Observable<Checkin[]> {
    let params = new HttpParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value) {
          params = params.set(key, value);
        }
      });
    }

    return this.http.get<Checkin[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  checkIn(data: CheckInDto): Observable<Checkin> {
    return this.http.post<Checkin>(this.apiUrl, data).pipe(
      catchError(this.handleError)
    );
  }

  removeCheckin(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    const message =
      error.error instanceof ErrorEvent
        ? `Client error: ${error.error.message}`
        : (error.error?.message || `Server returned ${error.status}: ${error.message}`);

    console.error('CheckinService error:', message);

    return throwError(() => new Error(message));
  }
}
