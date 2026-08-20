import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NotificationService, Notification } from '../../../services/notification';
import { ActivityService, Activity } from '../../../services/activity';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications implements OnInit {

  activities: Activity[] = [];
  notifications: Notification[] = [];

  isLoading = false;
  errorMessage = '';

  broadcastMessage = '';
  broadcastActivityId = '';

  reminderActivityId = '';
  reminderInterval = '1_day';

  isSending = false;
  isScheduling = false;

  actionError = '';
  actionSuccess = '';

  constructor(
    private notificationService: NotificationService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadActivities();
  }

  async loadActivities(): Promise<void> {
    try {
      this.activities = await this.activityService.getActivities().toPromise() || [];
    } catch {}
  }

  async loadNotifications(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.notifications = await this.notificationService.getNotifications().toPromise() || [];
    } catch (err: any) {
      this.errorMessage = err.message || 'Unable to load notifications.';
    } finally {
      this.isLoading = false;
    }
  }

  async sendBroadcast(): Promise<void> {
    if (!this.broadcastMessage.trim()) return;

    this.isSending = true;
    this.actionError = '';
    this.actionSuccess = '';

    try {
      const activityId = this.broadcastActivityId && this.broadcastActivityId !== 'all' ? this.broadcastActivityId : undefined;
      const notification = await this.notificationService.sendBroadcast(this.broadcastMessage, activityId).toPromise();
      if (notification) this.notifications.unshift(notification);
      this.broadcastMessage = '';
      this.broadcastActivityId = '';
      this.actionSuccess = 'Broadcast sent successfully.';
    } catch (err: any) {
      this.actionError = err.message || 'Failed to send broadcast.';
    } finally {
      this.isSending = false;
    }
  }

  async scheduleReminder(): Promise<void> {
    if (!this.reminderActivityId) return;

    this.isScheduling = true;
    this.actionError = '';
    this.actionSuccess = '';

    try {
      await this.notificationService.scheduleReminder({
        activityId: this.reminderActivityId,
        interval: this.reminderInterval
      }).toPromise();
      const activity = this.activities.find(
        a => String(a._id || a.id) === String(this.reminderActivityId)
      );
      this.actionSuccess = `Reminder scheduled for "${activity?.title}".`;
    } catch (err: any) {
      this.actionError = err.message || 'Failed to schedule reminder.';
    } finally {
      this.isScheduling = false;
    }
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }
}
