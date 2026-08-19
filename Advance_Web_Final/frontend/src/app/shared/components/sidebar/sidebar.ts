import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { SidebarStateService } from '../../services/sidebar-state';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  readonly isOpen;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarState: SidebarStateService
  ) {
    this.isOpen = this.sidebarState.isOpen;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isEmployee(): boolean {
    return this.authService.isEmployee();
  }

  onNavigate(): void {
    // Collapse the drawer on mobile once a destination is picked
    this.sidebarState.close();
  }

  onBackdropClick(): void {
    this.sidebarState.close();
  }

  logout(): void {
    this.authService.logout();
    this.sidebarState.close();
    this.router.navigate(['/']);
  }

}
