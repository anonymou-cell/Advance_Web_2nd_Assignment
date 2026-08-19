import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RegistrationService,
  Registration
} from '../../../services/registration';

@Component({
  selector: 'app-employee-registrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registrations.html',
  styleUrl: './registrations.scss'
})
export class Registrations implements OnInit {

  registrations: Registration[] = [];

  isLoading = true;
  errorMessage = '';

  constructor(
    private registrationService: RegistrationService
  ) {}

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations(): void {

    this.isLoading = true;

    this.registrationService.getRegistrations({
      username: 'employee1'
    }).subscribe({

      next: (data) => {
        this.registrations = data;
        this.isLoading = false;
      },

      error: () => {
        this.errorMessage = 'Unable to load registrations.';
        this.isLoading = false;
      }

    });

  }

  cancel(registration: Registration): void {

    const confirmed = window.confirm(
      'Cancel this registration?'
    );

    if (!confirmed) {
      return;
    }

    this.registrationService.cancelRegistration(registration.id)
      .subscribe({

        next: () => {
          registration.status = 'cancelled';
        },

        error: () => {
          alert('Failed to cancel registration.');
        }

      });

  }

  statusClass(status: string): string {
    return status.toLowerCase();
  }

}