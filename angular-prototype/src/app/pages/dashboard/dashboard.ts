import { Component, OnInit } from '@angular/core';
import { StoreService } from '../../state/store.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardPage implements OnInit {
  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly PRIORITY_LABELS = PRIORITY_LABELS;
  protected readonly TASK_STATUSES = TASK_STATUSES;
  protected readonly TASK_PRIORITIES = TASK_PRIORITIES;

  constructor(protected readonly store: StoreService) {}

  ngOnInit(): void {
    this.store.loadDashboardStats();
  }

  retry(): void {
    this.store.loadDashboardStats();
  }

  private statusMax(): number {
    const stats = this.store.dashboardStats();
    if (!stats) return 1;
    return Math.max(...TASK_STATUSES.map((s) => stats.byStatus[s]), 1);
  }

  private priorityMax(): number {
    const stats = this.store.dashboardStats();
    if (!stats) return 1;
    return Math.max(...TASK_PRIORITIES.map((p) => stats.byPriority[p]), 1);
  }

  statusWidth(status: TaskStatus): number {
    const stats = this.store.dashboardStats();
    if (!stats) return 0;
    return (stats.byStatus[status] / this.statusMax()) * 100;
  }

  priorityWidth(priority: TaskPriority): number {
    const stats = this.store.dashboardStats();
    if (!stats) return 0;
    return (stats.byPriority[priority] / this.priorityMax()) * 100;
  }
}
