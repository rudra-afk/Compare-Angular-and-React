import { Component, Input } from '@angular/core';
import type { TaskPriority } from '../../models';
import { PRIORITY_LABELS } from '../../models';

const PRIORITY_GLYPH: Record<TaskPriority, string> = {
  low: '↓',
  medium: '→',
  high: '↑',
};

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  templateUrl: './priority-badge.html',
  styleUrl: './priority-badge.css',
})
export class PriorityBadgeComponent {
  @Input({ required: true }) priority!: TaskPriority;
  protected readonly PRIORITY_LABELS = PRIORITY_LABELS;
  protected readonly PRIORITY_GLYPH = PRIORITY_GLYPH;
}
