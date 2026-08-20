import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../../services/activity';
import { RegistrationService } from '../../../services/registration';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-employee-activities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activities.html',
  styleUrl: './activities.scss'
})
export class Activities implements OnInit {

  activities: Activity[] = [];
  registeredIds = new Set<string>();

  isLoading = true;
  errorMessage = '';
  actionError = '';
  actionSuccess = '';

  constructor(
    private activityService: ActivityService,
    private registrationService: RegistrationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  private get currentUser() {
    return this.authService.getCurrentUser();
  }

  loadActivities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.activityService.getActivities().subscribe({
      next: (data) => {
        this.activities = data;
        this.isLoading = false;
        this.loadMyRegistrations();
      },
      error: () => {
        this.errorMessage = 'Unable to load activities.';
        this.isLoading = false;
      }
    });
  }

  loadMyRegistrations(): void {
    const username = this.currentUser?.email;
    if (!username) return;

    this.registrationService.getRegistrations({ username, status: 'registered' }).subscribe({
      next: (regs) => {
        regs.forEach(r => this.registeredIds.add(String(r.activityId)));
      },
      error: () => {}
    });
  }

  availableSeats(activity: Activity): number {
    return activity.maxSeats - activity.seatsTaken;
  }

  isRegistered(activity: Activity): boolean {
    return this.registeredIds.has(activity._id || activity.id);
  }

  isFull(activity: Activity): boolean {
    return this.availableSeats(activity) <= 0;
  }

  isClosed(activity: Activity): boolean {
    return new Date() > new Date(activity.cutOffDateTime);
  }

  register(activity: Activity): void {
    if (this.isRegistered(activity)) {
      return;
    }

    if (this.isFull(activity)) {
      this.actionError = 'No seats available.';
      return;
    }

    if (this.isClosed(activity)) {
      this.actionError = 'Registration cut-off has passed.';
      return;
    }

    const username = this.currentUser?.email || '';
    const employeeName = this.currentUser?.fullName || username;

    this.registrationService.registerForActivity({
      activityId: activity._id || activity.id,
      username,
      employeeName
    }).subscribe({
      next: () => {
        activity.seatsTaken++;
        this.registeredIds.add(activity._id || activity.id);
        this.actionSuccess = `Successfully registered for "${activity.title}"!`;
        this.actionError = '';
      },
      error: (err) => {
        this.actionError = err.message || 'Registration failed.';
        this.actionSuccess = '';
      }
    });
  }
}
