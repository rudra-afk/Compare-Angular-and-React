import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../state/store.service';
import { MockApiService } from '../../services/mock-api.service';
import { FormInputComponent } from '../../components/form-input/form-input';
import {
  FormSelectComponent,
  type FormSelectOption,
} from '../../components/form-select/form-select';
import { FormTextareaComponent } from '../../components/form-textarea/form-textarea';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import {
  hasTaskDraftErrors,
  validateTaskDraft,
  type TaskDraftErrors,
} from '../../utils/validate-task-draft';
import { toDateInputValue } from '../../utils/format-date';
import type { TaskDraft, TaskPriority, TaskStatus } from '../../models';

const emptyDraft: TaskDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    FormInputComponent,
    FormSelectComponent,
    FormTextareaComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskFormPage implements OnInit {
  protected readonly statusOptions: FormSelectOption[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];
  protected readonly priorityOptions: FormSelectOption[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  protected mode: 'create' | 'edit' = 'create';
  protected projectId = '';
  protected taskId: string | null = null;

  protected readonly draft = signal<TaskDraft>({ ...emptyDraft });
  protected readonly touched = signal<Record<string, boolean>>({});
  protected readonly submitAttempted = signal(false);
  protected readonly taskLoading = signal(false);
  protected readonly taskLoadError = signal<string | null>(null);
  protected readonly taskNotFound = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private taskRequestToken = 0;

  constructor(
    protected readonly store: StoreService,
    private readonly api: MockApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    // Route guard: an edit/new task URL for a project id that doesn't exist
    // redirects to the project detail page, which renders the shared
    // "not found" UI instead of crashing on missing data.
    effect(() => {
      if (this.store.currentProjectNotFound() && this.projectId) {
        this.router.navigateByUrl(`/projects/${this.projectId}`, { replaceUrl: true });
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const projectId = params.get('projectId');
      const taskId = params.get('taskId');
      if (!projectId) return;
      this.projectId = projectId;
      this.taskId = taskId;
      this.mode = taskId ? 'edit' : 'create';
      this.store.loadProjectById(projectId);
      if (this.mode === 'edit' && taskId) {
        this.loadTask(taskId);
      }
    });
  }

  private loadTask(taskId: string): void {
    const token = ++this.taskRequestToken;
    this.taskLoading.set(true);
    this.taskLoadError.set(null);
    this.taskNotFound.set(false);
    this.api
      .fetchTaskById(taskId)
      .then((task) => {
        if (token !== this.taskRequestToken) return;
        this.taskLoading.set(false);
        if (!task) {
          this.taskNotFound.set(true);
        } else {
          this.draft.set({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: toDateInputValue(task.dueDate),
          });
        }
      })
      .catch((error: unknown) => {
        if (token !== this.taskRequestToken) return;
        this.taskLoading.set(false);
        this.taskLoadError.set(error instanceof Error ? error.message : 'Something went wrong.');
      });
  }

  retryLoadTask(): void {
    if (this.taskId) this.loadTask(this.taskId);
  }

  retryProject(): void {
    this.store.loadProjectById(this.projectId);
  }

  goToProject(): void {
    this.router.navigateByUrl(`/projects/${this.projectId}`);
  }

  get errors(): TaskDraftErrors {
    return validateTaskDraft(this.draft(), { isCreate: this.mode === 'create' });
  }

  get isInvalid(): boolean {
    return hasTaskDraftErrors(this.errors);
  }

  fieldError(field: keyof TaskDraftErrors): string | null {
    if (!this.touched()[field] && !this.submitAttempted()) return null;
    return this.errors[field] ?? null;
  }

  markTouched(field: string): void {
    this.touched.set({ ...this.touched(), [field]: true });
  }

  setTitle(value: string): void {
    this.draft.set({ ...this.draft(), title: value });
  }

  setDescription(value: string): void {
    this.draft.set({ ...this.draft(), description: value });
  }

  setStatus(value: string): void {
    this.draft.set({ ...this.draft(), status: value as TaskStatus });
  }

  setPriority(value: string): void {
    this.draft.set({ ...this.draft(), priority: value as TaskPriority });
  }

  setDueDate(value: string): void {
    this.draft.set({ ...this.draft(), dueDate: value });
  }

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitAttempted.set(true);
    if (hasTaskDraftErrors(validateTaskDraft(this.draft(), { isCreate: this.mode === 'create' }))) {
      return;
    }
    const ok =
      this.mode === 'create'
        ? await this.store.createTask(this.projectId, this.draft())
        : this.taskId
          ? await this.store.updateTask(this.taskId, this.draft())
          : false;
    if (ok) {
      this.router.navigateByUrl(`/projects/${this.projectId}`);
    }
  }
}
