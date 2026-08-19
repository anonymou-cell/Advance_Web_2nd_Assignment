import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { SidebarStateService } from '../../services/sidebar-state';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarState: SidebarStateService
  ) {}

  get currentUserName(): string {
    return this.authService.getCurrentUser()?.fullName || 'Guest User';
  }

  get currentUserRole(): string {
    const role = this.authService.getCurrentUser()?.role;
    if (role === 'admin') return 'Administrator';
    if (role === 'employee') return 'Employee';
    return 'Not Logged In';
  }

  toggleSidebar(): void {
    this.sidebarState.toggle();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

}
