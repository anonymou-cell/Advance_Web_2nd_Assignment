import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ActivityService, Activity } from '../../../services/activity';
import { RegistrationService, Registration } from '../../../services/registration';
import { CheckinService, Checkin } from '../../../services/checkin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {

  totalActivities = 0;
  totalEmployees = 0;
  totalRegistrations = 0;
  totalCheckins = 0;

  isLoading = true;
  errorMessage = '';

  recentActivityLogs: { title: string; time: string }[] = [];

  // ── Bar Chart: Registrations per Activity ──
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartType = 'bar' as const;
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  // ── Doughnut Chart: Seat Utilization ──
  doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  doughnutChartType = 'doughnut' as const;
  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12 } }
    }
  };

  // ── Line Chart: Check-in Trend ──
  lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  lineChartType = 'line' as const;
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  constructor(
    private activityService: ActivityService,
    private registrationService: RegistrationService,
    private checkinService: CheckinService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.isLoading = true;

    try {
      const [activities, registrations, checkins] = await Promise.all([
        this.activityService.getActivities().toPromise(),
        this.registrationService.getRegistrations().toPromise(),
        this.checkinService.getCheckins().toPromise()
      ]);

      this.activities = activities || [];
      this.registrations = registrations || [];
      this.checkins = checkins || [];

      this.totalActivities = this.activities.length;
      this.totalRegistrations = this.registrations.length;
      this.totalCheckins = this.checkins.length;

      const uniqueUsers = new Set(this.registrations.map(r => r.username));
      this.totalEmployees = uniqueUsers.size;

      this.buildCharts();
      this.buildRecentLogs();
    } catch (err) {
      this.errorMessage = 'Unable to load dashboard data.';
    } finally {
      this.isLoading = false;
    }
  }

  private activities: Activity[] = [];
  private registrations: Registration[] = [];
  private checkins: Checkin[] = [];

  private buildCharts(): void {
    // ── Bar Chart: Registrations per Activity ──
    const regByActivity = new Map<string, number>();
    for (const r of this.registrations) {
      const actId = String(r.activityId);
      regByActivity.set(actId, (regByActivity.get(actId) || 0) + 1);
    }

    const barLabels: string[] = [];
    const barData: number[] = [];
    const barColors: string[] = [];

    const palette = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

    for (const act of this.activities) {
      const id = String(act._id || act.id);
      const count = regByActivity.get(id) || 0;
      barLabels.push(act.title.length > 15 ? act.title.substring(0, 15) + '…' : act.title);
      barData.push(count);
      barColors.push(palette[barLabels.length % palette.length]);
    }

    this.barChartData = {
      labels: barLabels,
      datasets: [{
        data: barData,
        backgroundColor: barColors,
        borderRadius: 6
      }]
    };

    // ── Doughnut Chart: Seat Utilization ──
    let totalSeats = 0;
    let totalTaken = 0;
    for (const act of this.activities) {
      totalSeats += act.maxSeats;
      totalTaken += act.seatsTaken;
    }
    const totalAvailable = totalSeats - totalTaken;

    this.doughnutChartData = {
      labels: ['Taken', 'Available'],
      datasets: [{
        data: [totalTaken, totalAvailable],
        backgroundColor: ['#059669', '#e5e7eb'],
        borderWidth: 0
      }]
    };

    // ── Line Chart: Check-ins over time ──
    const checkinsByDate = new Map<string, number>();
    for (const c of this.checkins) {
      const date = new Date(c.checkedInAt).toLocaleDateString();
      checkinsByDate.set(date, (checkinsByDate.get(date) || 0) + 1);
    }

    const sortedDates = Array.from(checkinsByDate.keys()).sort();
    this.lineChartData = {
      labels: sortedDates,
      datasets: [{
        data: sortedDates.map(d => checkinsByDate.get(d) || 0),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4
      }]
    };
  }

  private buildRecentLogs(): void {
    this.recentActivityLogs = this.activities
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(a => ({
        title: `${a.title} created`,
        time: this.formatTimeAgo(a.createdAt)
      }));
  }

  private formatTimeAgo(dateStr?: string): string {
    if (!dateStr) return 'Unknown';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  }
}
