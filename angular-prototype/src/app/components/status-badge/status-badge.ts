import { Component, Input } from '@angular/core';
import type { TaskStatus } from '../../models';
import { STATUS_LABELS } from '../../models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: TaskStatus;
  protected readonly STATUS_LABELS = STATUS_LABELS;
}
