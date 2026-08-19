import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss'
})
export class EmployeeDashboard {

  totalActivities = 12;

  registeredActivities = 4;

  notifications = 2;

}