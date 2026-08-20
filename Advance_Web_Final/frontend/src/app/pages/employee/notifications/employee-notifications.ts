import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../services/notification';
import { ActivityService, Activity } from '../../../services/activity';

@Component({
  selector: 'app-employee-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-notifications.html',
  styleUrl: './employee-notifications.scss'
})
export class EmployeeNotifications implements OnInit {

  notifications: Notification[] = [];
  activities: Activity[] = [];
  private activityMap = new Map<string, Activity>();

  isLoading = true;
  errorMessage = '';

  constructor(
    private notificationService: NotificationService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [notifications, activities] = await Promise.all([
        this.notificationService.getNotifications().toPromise(),
        this.activityService.getActivities().toPromise()
      ]);

      this.notifications = notifications || [];
      this.activities = activities || [];

      this.activityMap.clear();
      for (const a of this.activities) {
        this.activityMap.set(String(a._id || a.id), a);
      }
    } catch (err) {
      this.errorMessage = 'Unable to load notifications.';
    } finally {
      this.isLoading = false;
    }
  }

  activityName(activityId: any): string {
    if (!activityId) return '';
    return this.activityMap.get(String(activityId))?.title || '';
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  typeIcon(type: string): string {
    switch (type) {
      case 'broadcast': return '📢';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'broadcast': return 'Broadcast';
      case 'reminder': return 'Reminder';
      default: return 'Notification';
    }
  }
}
