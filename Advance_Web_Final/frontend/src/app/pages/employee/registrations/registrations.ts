import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RegistrationService,
  Registration
} from '../../../services/registration';
import { ActivityService, Activity } from '../../../services/activity';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-employee-registrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registrations.html',
  styleUrl: './registrations.scss'
})
export class Registrations implements OnInit {

  registrations: Registration[] = [];
  activities: Activity[] = [];
  private activityMap = new Map<string, Activity>();

  isLoading = true;
  errorMessage = '';
  actionError = '';
  actionSuccess = '';

  constructor(
    private registrationService: RegistrationService,
    private activityService: ActivityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRegistrations();
  }

  private get currentUserEmail(): string {
    return this.authService.getCurrentUser()?.email || '';
  }

  async loadRegistrations(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [regs, activities] = await Promise.all([
        this.registrationService.getRegistrations({ username: this.currentUserEmail }).toPromise(),
        this.activityService.getActivities().toPromise()
      ]);

      this.registrations = regs || [];
      this.activities = activities || [];

      this.activityMap.clear();
      for (const a of this.activities) {
        this.activityMap.set(String(a._id || a.id), a);
      }
    } catch (err) {
      this.errorMessage = 'Unable to load registrations.';
    } finally {
      this.isLoading = false;
    }
  }

  activityTitle(activityId: string): string {
    return this.activityMap.get(String(activityId))?.title || 'Unknown Activity';
  }

  activityDate(activityId: string): string {
    const act = this.activityMap.get(String(activityId));
    if (!act) return '';
    return new Date(act.date).toLocaleDateString();
  }

  cancel(registration: Registration): void {
    const confirmed = window.confirm('Cancel this registration?');

    if (!confirmed) return;

    this.registrationService.cancelRegistration(registration._id || registration.id)
      .subscribe({
        next: () => {
          registration.status = 'cancelled';
          this.actionSuccess = 'Registration cancelled.';
          this.actionError = '';
        },
        error: (err) => {
          this.actionError = err.message || 'Failed to cancel registration.';
          this.actionSuccess = '';
        }
      });
  }

  statusClass(status: string): string {
    return status.toLowerCase();
  }
}
