import { Injectable, signal } from '@angular/core';
import { MockApiService } from '../services/mock-api.service';
import type { DashboardStats, ProjectWithTaskCount, Task, TaskDraft } from '../models';

export interface MutationState {
  status: 'idle' | 'saving' | 'error';
  error: string | null;
}

export interface DeletionState {
  status: 'idle' | 'deleting' | 'error';
  error: string | null;
  taskId: string | null;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

// Angular's equivalent of the React Context+useReducer store: a single
// root-provided service holding Signals, exposing the same operation names
// (loadProjects, loadProjectById, loadTasksByProject, createTask, updateTask,
// deleteTask) so both apps' state layers carry the same responsibilities.
@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly dashboardStats = signal<DashboardStats | null>(null);
  readonly dashboardLoading = signal(false);
  readonly dashboardError = signal<string | null>(null);

  readonly projects = signal<ProjectWithTaskCount[] | null>(null);
  readonly projectsLoading = signal(false);
  readonly projectsError = signal<string | null>(null);

  readonly currentProject = signal<ProjectWithTaskCount | null>(null);
  readonly currentProjectLoading = signal(false);
  readonly currentProjectError = signal<string | null>(null);
  readonly currentProjectNotFound = signal(false);

  readonly currentProjectTasks = signal<Task[] | null>(null);
  readonly currentTasksProjectId = signal<string | null>(null);
  readonly tasksLoading = signal(false);
  readonly tasksError = signal<string | null>(null);

  readonly taskMutation = signal<MutationState>({ status: 'idle', error: null });
  readonly taskDeletion = signal<DeletionState>({ status: 'idle', error: null, taskId: null });

  // Monotonic request tokens guard against a slow, stale request overwriting
  // state after the user has already navigated to a different project.
  private projectRequestToken = 0;
  private tasksRequestToken = 0;
  private saving = false;
  private deleting = false;

  constructor(private readonly api: MockApiService) {}

  async loadDashboardStats(): Promise<void> {
    this.dashboardLoading.set(true);
    this.dashboardError.set(null);
    try {
      const stats = await this.api.fetchDashboardStats();
      this.dashboardLoading.set(false);
      this.dashboardStats.set(stats);
    } catch (error) {
      this.dashboardLoading.set(false);
      this.dashboardError.set(toMessage(error));
    }
  }

  async loadProjects(): Promise<void> {
    this.projectsLoading.set(true);
    this.projectsError.set(null);
    try {
      const projects = await this.api.fetchProjects();
      this.projectsLoading.set(false);
      this.projects.set(projects);
    } catch (error) {
      this.projectsLoading.set(false);
      this.projectsError.set(toMessage(error));
    }
  }

  async loadProjectById(projectId: string): Promise<void> {
    const token = ++this.projectRequestToken;
    this.currentProjectLoading.set(true);
    this.currentProjectError.set(null);
    this.currentProjectNotFound.set(false);
    try {
      const project = await this.api.fetchProjectById(projectId);
      if (this.projectRequestToken !== token) return;
      this.currentProjectLoading.set(false);
      if (project) {
        this.currentProject.set(project);
      } else {
        this.currentProjectNotFound.set(true);
      }
    } catch (error) {
      if (this.projectRequestToken !== token) return;
      this.currentProjectLoading.set(false);
      this.currentProjectError.set(toMessage(error));
    }
  }

  async loadTasksByProject(projectId: string): Promise<void> {
    const token = ++this.tasksRequestToken;
    this.tasksLoading.set(true);
    this.tasksError.set(null);
    this.currentTasksProjectId.set(projectId);
    try {
      const tasks = await this.api.fetchTasksByProject(projectId);
      if (this.tasksRequestToken !== token) return;
      this.tasksLoading.set(false);
      this.currentProjectTasks.set(tasks);
    } catch (error) {
      if (this.tasksRequestToken !== token) return;
      this.tasksLoading.set(false);
      this.tasksError.set(toMessage(error));
    }
  }

  async createTask(projectId: string, draft: TaskDraft): Promise<boolean> {
    if (this.saving) return false;
    this.saving = true;
    this.taskMutation.set({ status: 'saving', error: null });
    try {
      const task = await this.api.createTask(projectId, draft);
      if (this.currentTasksProjectId() === task.projectId && this.currentProjectTasks()) {
        this.currentProjectTasks.set([...this.currentProjectTasks()!, task]);
      }
      this.bumpProjectTaskCount(task.projectId, 1);
      this.taskMutation.set({ status: 'idle', error: null });
      return true;
    } catch (error) {
      this.taskMutation.set({ status: 'error', error: toMessage(error) });
      return false;
    } finally {
      this.saving = false;
    }
  }

  async updateTask(taskId: string, draft: TaskDraft): Promise<boolean> {
    if (this.saving) return false;
    this.saving = true;
    this.taskMutation.set({ status: 'saving', error: null });
    try {
      const task = await this.api.updateTask(taskId, draft);
      const tasks = this.currentProjectTasks();
      if (tasks) {
        this.currentProjectTasks.set(tasks.map((t) => (t.id === task.id ? task : t)));
      }
      this.taskMutation.set({ status: 'idle', error: null });
      return true;
    } catch (error) {
      this.taskMutation.set({ status: 'error', error: toMessage(error) });
      return false;
    } finally {
      this.saving = false;
    }
  }

  async deleteTask(taskId: string, projectId: string): Promise<boolean> {
    if (this.deleting) return false;
    this.deleting = true;
    this.taskDeletion.set({ status: 'deleting', error: null, taskId });
    try {
      await this.api.deleteTask(taskId);
      const tasks = this.currentProjectTasks();
      if (tasks) {
        this.currentProjectTasks.set(tasks.filter((t) => t.id !== taskId));
      }
      this.bumpProjectTaskCount(projectId, -1);
      this.taskDeletion.set({ status: 'idle', error: null, taskId: null });
      return true;
    } catch (error) {
      this.taskDeletion.set({ status: 'error', error: toMessage(error), taskId });
      return false;
    } finally {
      this.deleting = false;
    }
  }

  resetTaskMutation(): void {
    this.taskMutation.set({ status: 'idle', error: null });
  }

  resetTaskDeletion(): void {
    this.taskDeletion.set({ status: 'idle', error: null, taskId: null });
  }

  private bumpProjectTaskCount(projectId: string, delta: number): void {
    const projects = this.projects();
    if (projects) {
      this.projects.set(
        projects.map((p) => (p.id === projectId ? { ...p, taskCount: p.taskCount + delta } : p)),
      );
    }
    const current = this.currentProject();
    if (current && current.id === projectId) {
      this.currentProject.set({ ...current, taskCount: current.taskCount + delta });
    }
  }
}
