import { Injectable } from '@angular/core';
import seedData from '../mock-data/seed-data.json';
import type {
  DashboardStats,
  Project,
  ProjectWithTaskCount,
  Task,
  TaskDraft,
} from '../models';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models';
import { getDelayMs, shouldSimulateFailure } from './mock-api-config';
import { ApiError } from './mock-api-errors';

export {
  getDelayMs,
  setDelayMs,
  getFailureRate,
  setFailureRate,
  isForceFailureMode,
  setForceFailureMode,
} from './mock-api-config';
export { ApiError } from './mock-api-errors';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Injectable so it participates in Angular DI like a real API client would;
// internally it's the same in-memory mock backend as the React version,
// seeded once per app load from the shared seed-data.json.
@Injectable({ providedIn: 'root' })
export class MockApiService {
  private projects: Project[] = (seedData.projects as Project[]).map((p) => ({ ...p }));
  private tasks: Task[] = (seedData.tasks as Task[]).map((t) => ({ ...t }));

  private async simulateNetwork(): Promise<void> {
    await wait(getDelayMs());
    if (shouldSimulateFailure()) {
      throw new ApiError();
    }
  }

  private withTaskCount(project: Project): ProjectWithTaskCount {
    return {
      ...project,
      taskCount: this.tasks.filter((t) => t.projectId === project.id).length,
    };
  }

  async fetchProjects(): Promise<ProjectWithTaskCount[]> {
    await this.simulateNetwork();
    return this.projects.map((p) => this.withTaskCount(p));
  }

  async fetchProjectById(id: string): Promise<ProjectWithTaskCount | undefined> {
    await this.simulateNetwork();
    const project = this.projects.find((p) => p.id === id);
    return project ? this.withTaskCount(project) : undefined;
  }

  async fetchTasksByProject(projectId: string): Promise<Task[]> {
    await this.simulateNetwork();
    return this.tasks.filter((t) => t.projectId === projectId);
  }

  async fetchTaskById(taskId: string): Promise<Task | undefined> {
    await this.simulateNetwork();
    return this.tasks.find((t) => t.id === taskId);
  }

  async createTask(projectId: string, draft: TaskDraft): Promise<Task> {
    await this.simulateNetwork();
    const task: Task = {
      id: crypto.randomUUID(),
      projectId,
      ...draft,
      createdAt: new Date().toISOString(),
    };
    this.tasks = [...this.tasks, task];
    return task;
  }

  async updateTask(taskId: string, draft: TaskDraft): Promise<Task> {
    await this.simulateNetwork();
    const existing = this.tasks.find((t) => t.id === taskId);
    if (!existing) {
      throw new ApiError('Task not found.');
    }
    const updated: Task = { ...existing, ...draft };
    this.tasks = this.tasks.map((t) => (t.id === taskId ? updated : t));
    return updated;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.simulateNetwork();
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
  }

  async fetchDashboardStats(): Promise<DashboardStats> {
    await this.simulateNetwork();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byStatus = Object.fromEntries(
      TASK_STATUSES.map((s) => [s, 0]),
    ) as DashboardStats['byStatus'];
    const byPriority = Object.fromEntries(
      TASK_PRIORITIES.map((p) => [p, 0]),
    ) as DashboardStats['byPriority'];
    let completedTasks = 0;
    let overdueTasks = 0;

    for (const task of this.tasks) {
      byStatus[task.status] += 1;
      byPriority[task.priority] += 1;
      if (task.status === 'done') {
        completedTasks += 1;
      } else if (new Date(task.dueDate) < today) {
        overdueTasks += 1;
      }
    }

    return {
      totalProjects: this.projects.length,
      totalTasks: this.tasks.length,
      completedTasks,
      overdueTasks,
      byStatus,
      byPriority,
    };
  }
}
