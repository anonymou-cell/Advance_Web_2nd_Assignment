import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivityService } from '../../../services/activity';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './activity-form.html',
  styleUrl: './activity-form.scss'
})
export class ActivityForm implements OnInit {

  form: FormGroup;

  isEditMode = false;
  activityId: string | null = null;

  isLoading = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      serviceType: [''],
      location: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      time: [''],
      maxSeats: ['', [Validators.required, Validators.min(1)]],
      cutOffDateTime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.activityId = this.route.snapshot.paramMap.get('id');

    if (this.activityId) {
      this.isEditMode = true;
      this.loadActivity(this.activityId);
    }
  }

  loadActivity(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.activityService.getActivity(id).subscribe({
      next: (activity) => {
        this.form.patchValue({
          title: activity.title,
          serviceType: activity.serviceType,
          location: activity.location,
          description: activity.description,
          date: activity.date,
          time: activity.time,
          maxSeats: activity.maxSeats,
          cutOffDateTime: activity.cutOffDateTime
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Unable to load activity.';
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const value = this.form.value;

    if (this.isEditMode && this.activityId) {
      this.activityService.updateActivity(this.activityId, value).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/admin/activities']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to update activity.';
          this.isSaving = false;
        }
      });
    } else {
      this.activityService.createActivity(value).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/admin/activities']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to create activity.';
          this.isSaving = false;
        }
      });
    }
  }

}
