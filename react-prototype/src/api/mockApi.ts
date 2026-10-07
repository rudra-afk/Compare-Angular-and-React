import type {
  DashboardStats,
  Project,
  ProjectWithTaskCount,
  Task,
  TaskDraft,
} from '../models';
import { TASK_PRIORITIES, TASK_STATUSES } from '../models';
import { getDelayMs, shouldSimulateFailure } from './config';
import { ApiError } from './errors';
import * as db from './db';

export { ApiError } from './errors';
export {
  getDelayMs,
  setDelayMs,
  getFailureRate,
  setFailureRate,
  isForceFailureMode,
  setForceFailureMode,
} from './config';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateNetwork(): Promise<void> {
  await wait(getDelayMs());
  if (shouldSimulateFailure()) {
    throw new ApiError();
  }
}

function withTaskCount(project: Project, allTasks: Task[]): ProjectWithTaskCount {
  return {
    ...project,
    taskCount: allTasks.filter((t) => t.projectId === project.id).length,
  };
}

export async function fetchProjects(): Promise<ProjectWithTaskCount[]> {
  await simulateNetwork();
  const tasks = db.getTasksDb();
  return db.getProjectsDb().map((p) => withTaskCount(p, tasks));
}

export async function fetchProjectById(id: string): Promise<ProjectWithTaskCount | undefined> {
  await simulateNetwork();
  const tasks = db.getTasksDb();
  const project = db.getProjectsDb().find((p) => p.id === id);
  return project ? withTaskCount(project, tasks) : undefined;
}

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  await simulateNetwork();
  return db.getTasksDb().filter((t) => t.projectId === projectId);
}

export async function fetchTaskById(taskId: string): Promise<Task | undefined> {
  await simulateNetwork();
  return db.getTasksDb().find((t) => t.id === taskId);
}

export async function createTask(projectId: string, draft: TaskDraft): Promise<Task> {
  await simulateNetwork();
  const task: Task = {
    id: crypto.randomUUID(),
    projectId,
    ...draft,
    createdAt: new Date().toISOString(),
  };
  db.addTaskDb(task);
  return task;
}

export async function updateTask(taskId: string, draft: TaskDraft): Promise<Task> {
  await simulateNetwork();
  const existing = db.getTasksDb().find((t) => t.id === taskId);
  if (!existing) {
    throw new ApiError('Task not found.');
  }
  const updated: Task = { ...existing, ...draft };
  db.updateTaskDb(updated);
  return updated;
}

export async function deleteTask(taskId: string): Promise<void> {
  await simulateNetwork();
  db.deleteTaskDb(taskId);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await simulateNetwork();
  const projects = db.getProjectsDb();
  const tasks = db.getTasksDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0])) as DashboardStats['byStatus'];
  const byPriority = Object.fromEntries(
    TASK_PRIORITIES.map((p) => [p, 0]),
  ) as DashboardStats['byPriority'];
  let completedTasks = 0;
  let overdueTasks = 0;

  for (const task of tasks) {
    byStatus[task.status] += 1;
    byPriority[task.priority] += 1;
    if (task.status === 'done') {
      completedTasks += 1;
    } else if (new Date(task.dueDate) < today) {
      overdueTasks += 1;
    }
  }

  return {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks,
    overdueTasks,
    byStatus,
    byPriority,
  };
}
