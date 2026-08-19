import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, interval, startWith, takeUntil } from 'rxjs';

import { ActivityService, Activity } from '../../../services/activity';
import { RegistrationService, Registration } from '../../../services/registration';
import { CheckinService, Checkin } from '../../../services/checkin';

interface ParticipantRow {
  registration: Registration;
  checkin: Checkin | null;
}

interface QrResponse {
  activityId: string;
  checkInCode: string;
  qrCode: string;
}

@Component({
  selector: 'app-checkin-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkin-management.html',
  styleUrl: './checkin-management.scss'
})
export class CheckinManagement implements OnInit, OnDestroy {

  activities: Activity[] = [];
  selectedActivityId = '';

  registrations: Registration[] = [];
  checkins: Checkin[] = [];

  qrDataUrl = '';
  isGeneratingQr = false;
  qrError = false;

  isLoadingActivities = true;
  isLoadingDetail = false;
  errorMessage = '';
  actionError = '';
  actionSuccess = '';

  manualCheckinUsername: string | null = null;
  removingId: string | null = null;

  private destroy$ = new Subject<void>();
  private pollSub: Subscription | null = null;

  constructor(
    private activityService: ActivityService,
    private registrationService: RegistrationService,
    private checkinService: CheckinService
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollSub?.unsubscribe();
  }

  loadActivities(): void {
    this.isLoadingActivities = true;
    this.errorMessage = '';

    this.activityService.getActivities().subscribe({
      next: (data) => {
        this.activities = data;
        this.isLoadingActivities = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load activities.';
        this.isLoadingActivities = false;
      }
    });
  }

  get selectedActivity(): Activity | undefined {
    return this.activities.find(a => a.id === this.selectedActivityId);
  }

  onActivityChange(): void {
    this.actionError = '';
    this.actionSuccess = '';
    this.qrDataUrl = '';
    this.qrError = false;
    this.registrations = [];
    this.checkins = [];

    this.pollSub?.unsubscribe();

    if (!this.selectedActivityId) {
      return;
    }

    this.generateQrCode();
    this.loadRegistrations();
    this.startPolling();
  }

  generateQrCode(): void {
    this.qrDataUrl = '';
    this.qrError = false;
    this.isGeneratingQr = false;

    if (!this.selectedActivityId) {
      return;
    }

    this.isGeneratingQr = true;

    this.activityService
      .getQrCode(this.selectedActivityId)
      .subscribe({
        next: (response: QrResponse) => {
          this.qrDataUrl = response.qrCode;
          this.isGeneratingQr = false;
        },
        error: () => {
          this.qrDataUrl = '';
          this.isGeneratingQr = false;
          this.qrError = true;
        }
      });
  }

  private loadRegistrations(): void {
    this.isLoadingDetail = true;

    this.registrationService
      .getRegistrations({
        activityId: this.selectedActivityId,
        status: 'registered'
      })
      .subscribe({
        next: (data) => {
          this.registrations = data;
          this.isLoadingDetail = false;
        },
        error: () => {
          this.actionError = 'Unable to load registrations for this activity.';
          this.isLoadingDetail = false;
        }
      });
  }

  private startPolling(): void {
    this.pollSub = interval(4000)
      .pipe(
        startWith(0),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!this.selectedActivityId) {
          return;
        }

        this.checkinService
          .getCheckins({
            activityId: this.selectedActivityId
          })
          .subscribe({
            next: (data) => {
              this.checkins = data;
            },
            error: () => {}
          });
      });
  }

  get participantRows(): ParticipantRow[] {
    return this.registrations.map(registration => ({
      registration,
      checkin: this.checkins.find(
        c => c.username === registration.username
      ) || null
    }));
  }

  get checkedInCount(): number {
    return this.checkins.length;
  }

  get totalRegistered(): number {
    return this.registrations.length;
  }

  manualCheckIn(row: ParticipantRow): void {
    if (row.checkin || !this.selectedActivityId) {
      return;
    }

    this.manualCheckinUsername = row.registration.username;
    this.actionError = '';
    this.actionSuccess = '';

    this.checkinService
      .checkIn({
        activityId: this.selectedActivityId,
        username: row.registration.username,
        employeeName: row.registration.employeeName
      })
      .subscribe({
        next: (checkin) => {
          this.checkins = [checkin, ...this.checkins];
          this.actionSuccess = `${row.registration.employeeName} checked in.`;
          this.manualCheckinUsername = null;
        },
        error: (err) => {
          this.actionError =
            err.message || 'Failed to check in participant.';
          this.manualCheckinUsername = null;
        }
      });
  }

  undoCheckin(checkin: Checkin): void {
    const confirmed = window.confirm(
      `Remove the check-in for ${checkin.employeeName}?`
    );

    if (!confirmed) {
      return;
    }

    this.removingId = checkin.id;
    this.actionError = '';

    this.checkinService.removeCheckin(checkin.id).subscribe({
      next: () => {
        this.checkins = this.checkins.filter(
          c => c.id !== checkin.id
        );
        this.removingId = null;
      },
      error: () => {
        this.actionError = 'Failed to undo check-in.';
        this.removingId = null;
      }
    });
  }

  copyCode(): void {
    const code = this.selectedActivity?.checkInCode;

    if (!code) {
      return;
    }

    navigator.clipboard?.writeText(code).then(
      () => {
        this.actionSuccess = 'Code copied to clipboard.';
      },
      () => undefined
    );
  }
}