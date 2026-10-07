import type { DashboardStats, ProjectWithTaskCount, Task } from '../models';

export interface MutationState {
  status: 'idle' | 'saving' | 'error';
  error: string | null;
}

export interface DeletionState {
  status: 'idle' | 'deleting' | 'error';
  error: string | null;
  taskId: string | null;
}

export interface StoreState {
  dashboardStats: DashboardStats | null;
  dashboardLoading: boolean;
  dashboardError: string | null;

  projects: ProjectWithTaskCount[] | null;
  projectsLoading: boolean;
  projectsError: string | null;

  currentProject: ProjectWithTaskCount | null;
  currentProjectLoading: boolean;
  currentProjectError: string | null;
  currentProjectNotFound: boolean;

  currentProjectTasks: Task[] | null;
  currentTasksProjectId: string | null;
  tasksLoading: boolean;
  tasksError: string | null;

  taskMutation: MutationState;
  taskDeletion: DeletionState;
}

export const initialStoreState: StoreState = {
  dashboardStats: null,
  dashboardLoading: false,
  dashboardError: null,

  projects: null,
  projectsLoading: false,
  projectsError: null,

  currentProject: null,
  currentProjectLoading: false,
  currentProjectError: null,
  currentProjectNotFound: false,

  currentProjectTasks: null,
  currentTasksProjectId: null,
  tasksLoading: false,
  tasksError: null,

  taskMutation: { status: 'idle', error: null },
  taskDeletion: { status: 'idle', error: null, taskId: null },
};

export type StoreAction =
  | { type: 'DASHBOARD_LOADING' }
  | { type: 'DASHBOARD_LOADED'; payload: DashboardStats }
  | { type: 'DASHBOARD_ERROR'; payload: string }
  | { type: 'PROJECTS_LOADING' }
  | { type: 'PROJECTS_LOADED'; payload: ProjectWithTaskCount[] }
  | { type: 'PROJECTS_ERROR'; payload: string }
  | { type: 'PROJECT_LOADING' }
  | { type: 'PROJECT_LOADED'; payload: ProjectWithTaskCount }
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'PROJECT_ERROR'; payload: string }
  | { type: 'TASKS_LOADING'; payload: { projectId: string } }
  | { type: 'TASKS_LOADED'; payload: Task[] }
  | { type: 'TASKS_ERROR'; payload: string }
  | { type: 'TASK_MUTATION_START' }
  | { type: 'TASK_CREATE_SUCCESS'; payload: Task }
  | { type: 'TASK_UPDATE_SUCCESS'; payload: Task }
  | { type: 'TASK_MUTATION_ERROR'; payload: string }
  | { type: 'TASK_MUTATION_RESET' }
  | { type: 'TASK_DELETE_START'; payload: { taskId: string } }
  | { type: 'TASK_DELETE_SUCCESS'; payload: { taskId: string; projectId: string } }
  | { type: 'TASK_DELETE_ERROR'; payload: { taskId: string; error: string } }
  | { type: 'TASK_DELETE_RESET' };
