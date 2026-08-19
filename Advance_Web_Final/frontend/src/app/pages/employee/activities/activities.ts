import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../../services/activity';
import { RegistrationService } from '../../../services/registration';

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

  constructor(
    private activityService: ActivityService,
    private registrationService: RegistrationService
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.activityService.getActivities().subscribe({
      next: (data) => {
        this.activities = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load activities.';
        this.isLoading = false;
      }
    });
  }

  availableSeats(activity: Activity): number {
    return activity.maxSeats - activity.seatsTaken;
  }

  isRegistered(activity: Activity): boolean {
    return this.registeredIds.has(activity.id);
  }

register(activity: Activity): void {

  if (this.isRegistered(activity)) {
    return;
  }

  if (this.availableSeats(activity) <= 0) {
    alert('No seats available.');
    return;
  }

  this.registrationService.registerForActivity({
    activityId: activity.id,
    username: 'employee1',
    employeeName: 'Employee One'
  }).subscribe({
    next: () => {
      activity.seatsTaken++;
      this.registeredIds.add(activity.id);
      alert('Successfully registered!');
    },
    error: (err) => {
      console.error(err);
      alert('Registration failed.');
    }
  });

}
}