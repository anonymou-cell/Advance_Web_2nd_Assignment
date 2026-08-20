import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil, switchMap } from 'rxjs';
import { Html5Qrcode } from 'html5-qrcode';

import { AuthService } from '../../../services/auth';
import { CheckinService, Checkin } from '../../../services/checkin';
import { RegistrationService, Registration } from '../../../services/registration';
import { ActivityService, Activity } from '../../../services/activity';

type Mode = 'scan' | 'manual';

@Component({
  selector: 'app-employee-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkin.html',
  styleUrl: './checkin.scss'
})
export class EmployeeCheckin implements OnInit, OnDestroy {

  mode: Mode = 'manual'; // Start in manual mode (camera unreliable on http://localhost)
  manualCode = '';

  isScanning = false;
  cameraError = '';

  isSubmitting = false;
  resultError = '';
  resultSuccess = '';

  myRegistrations: Registration[] = [];
  myCheckins: Checkin[] = [];
  activities: Activity[] = [];
  activityMap: Map<string, Activity> = new Map();
  isLoadingStatus = true;

  private html5QrCode: Html5Qrcode | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private checkinService: CheckinService,
    private registrationService: RegistrationService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.loadStatus();
    this.startRealTimePolling();
  }

  ngOnDestroy(): void {
    this.stopScanning();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private get currentUsername(): string {
    return this.authService.getCurrentUser()?.email || '';
  }

  private get currentEmployeeName(): string {
    return this.authService.getCurrentUser()?.fullName || this.currentUsername;
  }

  // ── Load all data in parallel ──
  async loadStatus(): Promise<void> {
    this.isLoadingStatus = true;

    try {
      const [activities, registrations, checkins] = await Promise.all([
        this.activityService.getActivities().toPromise(),
        this.registrationService.getRegistrations({
          username: this.currentUsername,
          status: 'registered'
        }).toPromise(),
        this.checkinService.getCheckins({
          username: this.currentUsername
        }).toPromise()
      ]);

      this.activities = activities || [];
      this.myRegistrations = registrations || [];
      this.myCheckins = checkins || [];

      this.activityMap.clear();
      for (const a of this.activities) {
        const key = String(a._id || a.id);
        this.activityMap.set(key, a);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      this.isLoadingStatus = false;
    }
  }

  // ── Real-time polling: refresh check-ins every 3 seconds ──
  private startRealTimePolling(): void {
    interval(3000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.checkinService.getCheckins({ username: this.currentUsername })
        )
      )
      .subscribe({
        next: (checkins) => {
          this.myCheckins = checkins || [];
        },
        error: () => {}
      });
  }

  activityTitle(activityId: any): string {
    return this.activityMap.get(String(activityId))?.title || 'Unknown Activity';
  }

  isCheckedIn(activityId: any): boolean {
    const key = String(activityId);
    return this.myCheckins.some(c => String(c.activityId) === key);
  }

  registrationActivity(reg: Registration): Activity | undefined {
    return this.activityMap.get(String(reg.activityId));
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    this.resultError = '';
    this.resultSuccess = '';

    if (mode === 'scan') {
      // Wait for Angular to render the #qr-reader div, then start camera
      setTimeout(() => this.startScanning(), 150);
    } else {
      this.stopScanning();
    }
  }

  private retryCount = 0;

  async startScanning(): Promise<void> {
    this.cameraError = '';

    // Wait for Angular to render the #qr-reader div
    const element = document.getElementById('qr-reader');
    if (!element) {
      if (this.retryCount < 5) {
        this.retryCount++;
        setTimeout(() => this.startScanning(), 200);
        return;
      }
      this.cameraError = 'Scanner element not found. Please try manual entry.';
      return;
    }
    this.retryCount = 0;

    try {
      this.html5QrCode = new Html5Qrcode('qr-reader');

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // QR code scanned successfully
          this.stopScanning();
          this.submitCode(decodedText.trim());
        },
        () => {
          // QR scan error (ignorable — means no QR found in frame)
        }
      );

      this.isScanning = true;
    } catch (err: any) {
      console.error('Camera error:', err);
      this.cameraError = this.getCameraErrorMessage(err);
      this.isScanning = false;
    }
  }

  stopScanning(): void {
    this.isScanning = false;

    if (this.html5QrCode) {
      try { this.html5QrCode.stop(); } catch {}
      try { this.html5QrCode.clear(); } catch {}
      this.html5QrCode = null;
    }
  }

  private getCameraErrorMessage(err: any): string {
    const msg = err?.message || String(err);

    if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
      return 'Camera permission denied. Please allow camera access in your browser settings, or enter the code manually.';
    }
    if (msg.includes('NotFoundError') || msg.includes('DevicesNotFound')) {
      return 'No camera found. Enter the code manually.';
    }
    if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
      return 'Camera is in use by another app. Close other camera apps and try again.';
    }
    if (msg.includes('OverconstrainedError')) {
      return 'Camera does not support the required settings. Try manual entry.';
    }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return 'Camera requires HTTPS. Enter the code manually.';
    }
    return 'Camera failed to start. Enter the code manually.';
  }

  submitManualCode(): void {
    const code = this.manualCode.trim();
    if (!code) return;
    this.submitCode(code);
  }

  private async submitCode(rawCode: string): Promise<void> {
    this.isSubmitting = true;
    this.resultError = '';
    this.resultSuccess = '';

    // Parse QR code — it may be JSON {activityId, checkInCode} or just a plain code
    let code = rawCode;
    try {
      const parsed = JSON.parse(rawCode);
      if (parsed.checkInCode) {
        code = parsed.checkInCode;
      } else if (parsed.code) {
        code = parsed.code;
      }
    } catch {
      // Not JSON — use as plain text code
    }

    try {
      const checkin = await this.checkinService.checkIn({
        code: code.trim().toUpperCase(),
        username: this.currentUsername,
        employeeName: this.currentEmployeeName
      }).toPromise();

      this.resultSuccess = `Checked in to "${checkin?.activityTitle || 'Activity'}" successfully!`;
      this.manualCode = '';
      await this.loadStatus();
    } catch (err: any) {
      this.resultError = err.message || 'Check-in failed. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
