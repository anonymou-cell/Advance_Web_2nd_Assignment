import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ActivityService, Activity } from '../../../services/activity';
import { RegistrationService, Registration } from '../../../services/registration';
import { CheckinService, Checkin } from '../../../services/checkin';

export interface ParticipantRow {
  registration: Registration;
  activityTitle: string;
  checkedIn: boolean;
}

@Component({
  selector: 'app-participation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participation.html',
  styleUrl: './participation.scss'
})
export class Participation implements OnInit {

  activities: Activity[] = [];
  registrations: Registration[] = [];
  checkins: Checkin[] = [];
  participants: ParticipantRow[] = [];

  isLoading = true;
  errorMessage = '';

  removingId: string | null = null;
  remindingId: string | null = null;

  actionError = '';
  actionSuccess = '';

  activityFilter = 'all';

  constructor(
    private activityService: ActivityService,
    private registrationService: RegistrationService,
    private checkinService: CheckinService
  ) {}

  ngOnInit(): void {
    this.loadParticipants();
  }

  async loadParticipants(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [activities, registrations, checkins] = await Promise.all([
        this.activityService.getActivities().toPromise(),
        this.registrationService.getRegistrations().toPromise(),
        this.checkinService.getCheckins().toPromise()
      ]);

      this.activities = activities || [];
      this.registrations = registrations || [];
      this.checkins = checkins || [];
      this.buildParticipantRows();
    } catch (err) {
      this.errorMessage = 'Unable to load dashboard data.';
    } finally {
      this.isLoading = false;
    }
  }

  private buildParticipantRows(): void {
    this.participants = this.registrations
      .filter(r => r.status !== 'cancelled')
      .map(reg => {
        const regActId = String(reg.activityId);
        const activity = this.activities.find(
          a => String(a._id || a.id) === regActId
        );
        const isCheckedIn = this.checkins.some(
          c => String(c.activityId) === regActId && String(c.username) === String(reg.username)
        );

        return {
          registration: reg,
          activityTitle: activity?.title || 'Unknown Activity',
          checkedIn: isCheckedIn
        };
      });
  }

  get activityOptions(): string[] {
    return Array.from(
      new Set(this.participants.map(p => p.activityTitle))
    );
  }

  get filteredParticipants(): ParticipantRow[] {
    if (this.activityFilter === 'all') {
      return this.participants;
    }

    return this.participants.filter(
      p => p.activityTitle === this.activityFilter
    );
  }

  get totalSlotsTaken(): number {
    return this.filteredParticipants.length;
  }

  get distributionByActivity() {
    return this.activityOptions.map(activity => ({
      activity,
      count: this.participants.filter(p => p.activityTitle === activity).length
    }));
  }

  removeParticipant(participant: ParticipantRow): void {
    const confirmed = window.confirm(
      `Remove ${participant.registration.employeeName} from ${participant.activityTitle}?`
    );

    if (!confirmed) return;

    this.removingId = participant.registration._id || participant.registration.id;

    this.registrationService.deleteRegistration(participant.registration._id || participant.registration.id).subscribe({
      next: () => {
        this.participants = this.participants.filter(
          p => (p.registration._id || p.registration.id) !== (participant.registration._id || participant.registration.id)
        );
        this.actionSuccess = `${participant.registration.employeeName} has been removed.`;
        this.actionError = '';
        this.removingId = null;
      },
      error: (err) => {
        this.actionError = err.message || 'Failed to remove participant.';
        this.actionSuccess = '';
        this.removingId = null;
      }
    });
  }

  sendReminder(participant: ParticipantRow): void {
    this.remindingId = participant.registration._id || participant.registration.id;

    this.registrationService.getRegistrations({
      activityId: participant.registration.activityId,
      username: participant.registration.username
    }).subscribe({
      next: (regs) => {
        if (regs.length > 0) {
          // In a real app, this would call a remind endpoint
          this.actionSuccess = `Reminder sent to ${participant.registration.employeeName}.`;
        }
        this.remindingId = null;
      },
      error: () => {
        this.remindingId = null;
      }
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase();
  }
}
