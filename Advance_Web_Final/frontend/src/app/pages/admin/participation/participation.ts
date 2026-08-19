import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Participant {
  id: string;
  activity: string;
  employee: string;
  status: string;
}

@Component({
  selector: 'app-participation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participation.html',
  styleUrl: './participation.scss'
})
export class Participation implements OnInit {

  participants: Participant[] = [];

  isLoading = true;
  errorMessage = '';

  removingId: string |null = null;
  remindingId: string | null = null;

  actionError = '';
  actionSuccess = '';

  activityFilter = 'all';

  ngOnInit(): void {
    this.loadParticipants();
  }

  loadParticipants(): void {

    this.isLoading = true;
    this.errorMessage = '';

    setTimeout(() => {

      this.participants = [

        {
          id: '1',
          activity: 'Community Cleanup',
          employee: 'John Smith',
          status: 'Registered'
        },

        {
          id: '2',
          activity: 'Blood Donation Camp',
          employee: 'Emma Wilson',
          status: 'Completed'
        },

        {
          id: '3',
          activity: 'Tree Plantation Drive',
          employee: 'Michael Brown',
          status: 'Registered'
        }

      ];

      this.isLoading = false;

    }, 500);

  }

  get activityOptions(): string[] {

    return Array.from(
      new Set(this.participants.map(p => p.activity))
    );

  }

  get filteredParticipants(): Participant[] {

    if (this.activityFilter === 'all') {
      return this.participants;
    }

    return this.participants.filter(
      p => p.activity === this.activityFilter
    );

  }

  get totalSlotsTaken(): number {
    return this.filteredParticipants.length;
  }

  get distributionByActivity() {

    return this.activityOptions.map(activity => ({

      activity,

      count: this.participants.filter(
        p => p.activity === activity
      ).length

    }));

  }

  removeParticipant(participant: Participant): void {

    const confirmed = window.confirm(
      `Remove ${participant.employee} from ${participant.activity}?`
    );

    if (!confirmed) {
      return;
    }

    this.participants = this.participants.filter(
      p => p.id !== participant.id
    );

    this.actionSuccess =
      `${participant.employee} has been removed.`;

  }

  sendReminder(participant: Participant): void {

    this.remindingId = participant.id;

    setTimeout(() => {

      this.actionSuccess =
        `Reminder sent to ${participant.employee}.`;

      this.remindingId = null;

    }, 700);

  }

  statusClass(status: string): string {
    return status.toLowerCase();
  }

}