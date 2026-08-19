import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {

  totalActivities = 12;

  totalEmployees = 48;

  totalRegistrations = 73;

  recentActivityLogs = [
    {
      title: 'Community Cleanup activity created',
      time: 'Today'
    },
    {
      title: 'Blood Donation Camp updated',
      time: 'Yesterday'
    },
    {
      title: 'Tree Plantation registration closed',
      time: '2 days ago'
    }
  ];

  participationSummary = [
    {
      activity: 'Community Cleanup',
      participants: 18
    },
    {
      activity: 'Blood Donation Camp',
      participants: 12
    },
    {
      activity: 'Tree Plantation Drive',
      participants: 25
    }
  ];

}