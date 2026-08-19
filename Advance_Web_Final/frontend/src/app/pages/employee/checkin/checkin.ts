import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsQR from 'jsqr';

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

  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  mode: Mode = 'scan';

  manualCode = '';

  isScanning = false;
  cameraError = '';

  isSubmitting = false;
  resultError = '';
  resultSuccess = '';

  myRegistrations: Registration[] = [];
  myCheckins: Checkin[] = [];
  activities: Activity[] = [];
  isLoadingStatus = true;

  private stream: MediaStream | null = null;
  private frameHandle: number | null = null;

  constructor(
    private authService: AuthService,
    private checkinService: CheckinService,
    private registrationService: RegistrationService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  private get currentUsername(): string {
    return this.authService.getCurrentUser()?.email || 'employee1';
  }

  private get currentEmployeeName(): string {
    return this.authService.getCurrentUser()?.fullName || this.currentUsername;
  }

  loadStatus(): void {
    this.isLoadingStatus = true;

    this.activityService.getActivities().subscribe({
      next: (activities) => (this.activities = activities),
      error: () => undefined
    });

    this.registrationService
      .getRegistrations({ username: this.currentUsername, status: 'registered' })
      .subscribe({
        next: (regs) => {
          this.myRegistrations = regs;

          this.checkinService.getCheckins({ username: this.currentUsername }).subscribe({
            next: (checkins) => {
              this.myCheckins = checkins;
              this.isLoadingStatus = false;
            },
            error: () => (this.isLoadingStatus = false)
          });
        },
        error: () => (this.isLoadingStatus = false)
      });
  }

  isCheckedIn(activityId: string): boolean {
    return this.myCheckins.some(c => c.activityId === activityId);
  }

  activityTitle(activityId: string): string {
    return this.activities.find(a => a.id === activityId)?.title || 'Activity';
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    this.resultError = '';
    this.resultSuccess = '';

    if (mode === 'scan') {
      this.startScanning();
    } else {
      this.stopScanning();
    }
  }

  async startScanning(): Promise<void> {
    this.cameraError = '';

    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraError = 'Camera access is not supported on this device. Please enter the code manually.';
      this.mode = 'manual';
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const video = this.videoRef?.nativeElement;
      if (!video) {
        return;
      }

      video.srcObject = this.stream;
      await video.play();

      this.isScanning = true;
      this.scanFrame();
    } catch (err) {
      this.cameraError = 'Unable to access the camera. You can enter the code manually instead.';
      this.mode = 'manual';
    }
  }

  stopScanning(): void {
    this.isScanning = false;

    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }

    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  private scanFrame(): void {
    if (!this.isScanning) {
      return;
    }

    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);

        if (result?.data) {
          this.stopScanning();
          this.submitCode(result.data.trim());
          return;
        }
      }
    }

    this.frameHandle = requestAnimationFrame(() => this.scanFrame());
  }

  submitManualCode(): void {
    const code = this.manualCode.trim();
    if (!code) {
      return;
    }
    this.submitCode(code);
  }

  private submitCode(code: string): void {
    this.isSubmitting = true;
    this.resultError = '';
    this.resultSuccess = '';

    this.checkinService
      .checkIn({
        code,
        username: this.currentUsername,
        employeeName: this.currentEmployeeName
      })
      .subscribe({
        next: (checkin) => {
          this.resultSuccess = `You're checked in to "${checkin.activityTitle}".`;
          this.manualCode = '';
          this.isSubmitting = false;
          this.loadStatus();
        },
        error: (err) => {
          this.resultError = err.message || 'Check-in failed. Please try again.';
          this.isSubmitting = false;
        }
      });
  }
}
