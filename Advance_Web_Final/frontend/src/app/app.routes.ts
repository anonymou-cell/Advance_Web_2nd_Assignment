import { Routes } from '@angular/router';

import { Login } from './pages/login/login';

import { MainLayout } from './layouts/main-layout/main-layout';

import { EmployeeDashboard } from './pages/employee/dashboard/employee-dashboard';
import { Activities } from './pages/employee/activities/activities';
import { Registrations } from './pages/employee/registrations/registrations';
import { EmployeeCheckin } from './pages/employee/checkin/checkin';

import { AdminDashboard } from './pages/admin/dashboard/admin-dashboard';
import { Activities as AdminActivities } from './pages/admin/activities/activities';
import { ActivityForm } from './pages/admin/activity-form/activity-form';
import { Participation } from './pages/admin/participation/participation';
import { Notifications } from './pages/admin/notifications/notifications';
import { CheckinManagement } from './pages/admin/checkin-management/checkin-management';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },

  {
    path: 'employee',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        component: EmployeeDashboard
      },
      {
        path: 'activities',
        component: Activities
      },
      {
        path: 'registrations',
        component: Registrations
      },

      {
        path: 'checkin',
        component: EmployeeCheckin
      },
      
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: 'admin',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        component: AdminDashboard
      },
      {
        path: 'activities',
        component: AdminActivities
      },
      {
        path: 'activities/new',
        component: ActivityForm
      },
      {
        path: 'activities/:id/edit',
        component: ActivityForm
      },
      {
        path: 'participation',
        component: Participation
      },

      {
        path: 'checkin-management',
        component: CheckinManagement
      },
      {
        path: 'notifications',
        component: Notifications
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];