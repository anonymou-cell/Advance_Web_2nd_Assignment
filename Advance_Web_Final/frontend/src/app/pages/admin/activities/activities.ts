import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../../services/activity';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activities.html',
  styleUrl: './activities.scss'
})
export class Activities implements OnInit {

  activities: Activity[] = [];

  isLoading = false;
  errorMessage = '';
  actionError = '';
  actionSuccess = '';

  deletingId: string | null = null;

  constructor(private activityService: ActivityService) {}

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
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Unable to load activities.';
        this.isLoading = false;
      }
    });
  }

  availableSeats(activity: Activity): number {
    return activity.maxSeats - activity.seatsTaken;
  }

  isFull(activity: Activity): boolean {
    return this.availableSeats(activity) <= 0;
  }

  isClosed(activity: Activity): boolean {
    return new Date() > new Date(activity.cutOffDateTime);
  }

  deleteActivity(activity: Activity): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${activity.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.deletingId = activity._id || activity.id;
    this.actionError = '';
    this.actionSuccess = '';

    this.activityService.deleteActivity(activity._id || activity.id).subscribe({
      next: () => {
        this.activities = this.activities.filter(
          a => (a._id || a.id) !== (activity._id || activity.id)
        );
        this.deletingId = null;
        this.actionSuccess = `"${activity.title}" deleted successfully.`;
      },
      error: (err) => {
        console.error(err);
        this.actionError = 'Failed to delete activity.';
        this.deletingId = null;
      }
    });
  }

  dismissMessages(): void {
    this.actionError = '';
    this.actionSuccess = '';
  }
}
