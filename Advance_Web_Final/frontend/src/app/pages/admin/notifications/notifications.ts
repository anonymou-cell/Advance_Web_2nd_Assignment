import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Notification {
  id: string;
  message: string;
  activityTitle: string;
  sentAt: string;
  type: string;
}

export interface Activity {
  id: string;
  title: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications {

  activities: Activity[] = [
    {
      id: '1',
      title: 'Community Cleanup'
    },
    {
      id: '2',
      title: 'Blood Donation Camp'
    },
    {
      id: '3',
      title: 'Tree Plantation Drive'
    }
  ];

  notifications: Notification[] = [
    {
      id: '1',
      message: 'Community Cleanup starts tomorrow.',
      activityTitle: 'Community Cleanup',
      sentAt: '10 Jul 2026',
      type: 'Reminder'
    },
    {
      id: '2',
      message: 'Thank you for registering!',
      activityTitle: 'Blood Donation Camp',
      sentAt: '12 Jul 2026',
      type: 'Broadcast'
    }
  ];

  isLoading = false;
  errorMessage = '';

  broadcastMessage = '';
  broadcastActivityId = 'all';

  reminderActivityId = '';
  reminderInterval = '1_day';

  isSending = false;
  isScheduling = false;

  actionError = '';
  actionSuccess = '';

  loadNotifications(): void {
    this.errorMessage = '';
    this.isLoading = false;
  }

  sendBroadcast() {

    if (!this.broadcastMessage.trim()) {
      return;
    }

    this.notifications.unshift({
      id: Date.now().toString(),
      message: this.broadcastMessage,
      activityTitle:
        this.broadcastActivityId === 'all'
          ? 'All Employees'
          : this.activities.find(a => a.id === this.broadcastActivityId)?.title || '',
      sentAt: new Date().toLocaleString(),
      type: 'Broadcast'
    });

    this.broadcastMessage = '';

    this.actionSuccess = 'Broadcast sent successfully.';
  }

  scheduleReminder() {

    if (!this.reminderActivityId) {
      return;
    }

    const activity = this.activities.find(
      a => a.id === this.reminderActivityId
    );

    this.notifications.unshift({
      id: Date.now().toString(),
      message: `Reminder scheduled for ${activity?.title}`,
      activityTitle: activity?.title || '',
      sentAt: new Date().toLocaleString(),
      type: 'Reminder'
    });

    this.actionSuccess = 'Reminder scheduled successfully.';
  }

}