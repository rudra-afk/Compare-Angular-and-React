import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Task } from '../../models';
import { StatusBadgeComponent } from '../status-badge/status-badge';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge';
import { formatDate, isOverdue } from '../../utils/format-date';

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, PriorityBadgeComponent],
  templateUrl: './task-row.html',
  styleUrl: './task-row.css',
})
export class TaskRowComponent {
  @Input({ required: true }) task!: Task;
  @Input({ required: true }) projectId!: string;
  @Output() delete = new EventEmitter<Task>();

  protected readonly formatDate = formatDate;

  protected get overdue(): boolean {
    return isOverdue(this.task.dueDate, this.task.status);
  }
}
