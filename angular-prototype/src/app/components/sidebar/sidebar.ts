import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { isForceFailureMode, setForceFailureMode } from '../../services/mock-api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  protected readonly failuresEnabled = signal(isForceFailureMode());

  toggleFailures(): void {
    const next = !this.failuresEnabled();
    setForceFailureMode(next);
    this.failuresEnabled.set(next);
  }
}
