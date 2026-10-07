import seedData from '../mock-data/seed-data.json';
import type { Project, Task } from '../models';

// In-memory "database" seeded once at module load. Acts as the mock backend's
// persistent store for the lifetime of the tab; a full reload resets it back
// to the original seed data.
let projects: Project[] = (seedData.projects as Project[]).map((p) => ({ ...p }));
let tasks: Task[] = (seedData.tasks as Task[]).map((t) => ({ ...t }));

export function getProjectsDb(): Project[] {
  return projects;
}

export function getTasksDb(): Task[] {
  return tasks;
}

export function addTaskDb(task: Task): void {
  tasks = [...tasks, task];
}

export function updateTaskDb(updated: Task): void {
  tasks = tasks.map((t) => (t.id === updated.id ? updated : t));
}

export function deleteTaskDb(taskId: string): void {
  tasks = tasks.filter((t) => t.id !== taskId);
}
