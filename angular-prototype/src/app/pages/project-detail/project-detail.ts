import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../state/store.service';
import { TaskRowComponent } from '../../components/task-row/task-row';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { SkeletonComponent } from '../../components/skeleton/skeleton';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { FormSelectComponent, type FormSelectOption } from '../../components/form-select/form-select';
import type { Task, TaskPriority, TaskStatus } from '../../models';
import { formatDate } from '../../utils/format-date';
import { PERF_MARKS, markSafe, measureSafe } from '../../utils/perf-marks';

type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | TaskPriority;
type DueSort = 'asc' | 'desc';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink,
    TaskRowComponent,
    LoadingSpinnerComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    FormSelectComponent,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetailPage implements OnInit {
  protected readonly formatDate = formatDate;

  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly priorityFilter = signal<PriorityFilter>('all');
  protected readonly dueSort = signal<DueSort>('asc');
  protected readonly taskPendingDelete = signal<Task | null>(null);

  protected readonly statusOptions: FormSelectOption[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];
  protected readonly priorityOptions: FormSelectOption[] = [
    { value: 'all', label: 'All priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];
  protected readonly dueSortOptions: FormSelectOption[] = [
    { value: 'asc', label: 'Soonest first' },
    { value: 'desc', label: 'Latest first' },
  ];

  protected projectId = '';

  private readonly destroyRef = inject(DestroyRef);

  // Interaction-timing instrumentation (measurement-suite only, no effect on
  // app behaviour): marks the duration from "user changed the sort/filter
  // control" to "the resulting list has painted," and from "navigated here"
  // to "the task list has painted."
  private isSortInitialRun = true;
  private isFilterInitialRun = true;
  private hasMarkedNavEnd = false;

  constructor(
    protected readonly store: StoreService,
    private readonly route: ActivatedRoute,
  ) {
    effect(() => {
      this.dueSort();
      if (this.isSortInitialRun) {
        this.isSortInitialRun = false;
        return;
      }
      requestAnimationFrame(() => {
        markSafe(PERF_MARKS.sortEnd);
        measureSafe(PERF_MARKS.sortMeasure, PERF_MARKS.sortStart, PERF_MARKS.sortEnd);
      });
    });

    effect(() => {
      this.statusFilter();
      if (this.isFilterInitialRun) {
        this.isFilterInitialRun = false;
        return;
      }
      requestAnimationFrame(() => {
        markSafe(PERF_MARKS.filterEnd);
        measureSafe(PERF_MARKS.filterMeasure, PERF_MARKS.filterStart, PERF_MARKS.filterEnd);
      });
    });

    effect(() => {
      if (this.store.currentProjectTasks() && !this.hasMarkedNavEnd) {
        this.hasMarkedNavEnd = true;
        requestAnimationFrame(() => {
          markSafe(PERF_MARKS.navToDetailEnd);
          measureSafe(PERF_MARKS.navToDetailMeasure, PERF_MARKS.navToDetailStart, PERF_MARKS.navToDetailEnd);
        });
      }
    });
  }

  markNavToListStart(): void {
    markSafe(PERF_MARKS.navToListStart);
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('projectId');
      if (!id) return;
      this.projectId = id;
      this.store.loadProjectById(id);
      this.store.loadTasksByProject(id);
    });
  }

  retryProject(): void {
    this.store.loadProjectById(this.projectId);
  }

  retryTasks(): void {
    this.store.loadTasksByProject(this.projectId);
  }

  get filteredTasks(): Task[] {
    const tasks = this.store.currentProjectTasks();
    if (!tasks) return [];
    let list = tasks;
    if (this.statusFilter() !== 'all') {
      list = list.filter((t) => t.status === this.statusFilter());
    }
    if (this.priorityFilter() !== 'all') {
      list = list.filter((t) => t.priority === this.priorityFilter());
    }
    const dir = this.dueSort() === 'asc' ? 1 : -1;
    return [...list].sort(
      (a, b) => (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir,
    );
  }

  get deletionError(): string | null {
    const deletion = this.store.taskDeletion();
    const pending = this.taskPendingDelete();
    if (deletion.status === 'error' && pending && deletion.taskId === pending.id) {
      return deletion.error;
    }
    return null;
  }

  setStatusFilter(value: string): void {
    markSafe(PERF_MARKS.filterStart);
    this.statusFilter.set(value as StatusFilter);
  }

  setPriorityFilter(value: string): void {
    this.priorityFilter.set(value as PriorityFilter);
  }

  setDueSort(value: string): void {
    markSafe(PERF_MARKS.sortStart);
    this.dueSort.set(value as DueSort);
  }

  requestDelete(task: Task): void {
    this.taskPendingDelete.set(task);
  }

  cancelDelete(): void {
    this.taskPendingDelete.set(null);
    this.store.resetTaskDeletion();
  }

  async confirmDelete(): Promise<void> {
    const task = this.taskPendingDelete();
    if (!task) return;
    const ok = await this.store.deleteTask(task.id, this.projectId);
    if (ok) this.taskPendingDelete.set(null);
  }
}
