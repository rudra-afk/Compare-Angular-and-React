import type { StoreAction, StoreState } from './types';

function bumpProjectTaskCount(
  state: StoreState,
  projectId: string,
  delta: number,
): Pick<StoreState, 'projects' | 'currentProject'> {
  return {
    projects: state.projects
      ? state.projects.map((p) =>
          p.id === projectId ? { ...p, taskCount: p.taskCount + delta } : p,
        )
      : state.projects,
    currentProject:
      state.currentProject && state.currentProject.id === projectId
        ? { ...state.currentProject, taskCount: state.currentProject.taskCount + delta }
        : state.currentProject,
  };
}

export function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'DASHBOARD_LOADING':
      return { ...state, dashboardLoading: true, dashboardError: null };
    case 'DASHBOARD_LOADED':
      return { ...state, dashboardLoading: false, dashboardStats: action.payload };
    case 'DASHBOARD_ERROR':
      return { ...state, dashboardLoading: false, dashboardError: action.payload };

    case 'PROJECTS_LOADING':
      return { ...state, projectsLoading: true, projectsError: null };
    case 'PROJECTS_LOADED':
      return { ...state, projectsLoading: false, projects: action.payload };
    case 'PROJECTS_ERROR':
      return { ...state, projectsLoading: false, projectsError: action.payload };

    case 'PROJECT_LOADING':
      return {
        ...state,
        currentProjectLoading: true,
        currentProjectError: null,
        currentProjectNotFound: false,
      };
    case 'PROJECT_LOADED':
      return { ...state, currentProjectLoading: false, currentProject: action.payload };
    case 'PROJECT_NOT_FOUND':
      return { ...state, currentProjectLoading: false, currentProjectNotFound: true };
    case 'PROJECT_ERROR':
      return { ...state, currentProjectLoading: false, currentProjectError: action.payload };

    case 'TASKS_LOADING':
      return {
        ...state,
        tasksLoading: true,
        tasksError: null,
        currentTasksProjectId: action.payload.projectId,
      };
    case 'TASKS_LOADED':
      return { ...state, tasksLoading: false, currentProjectTasks: action.payload };
    case 'TASKS_ERROR':
      return { ...state, tasksLoading: false, tasksError: action.payload };

    case 'TASK_MUTATION_START':
      return { ...state, taskMutation: { status: 'saving', error: null } };
    case 'TASK_CREATE_SUCCESS': {
      const task = action.payload;
      const tasksMatch = state.currentTasksProjectId === task.projectId;
      return {
        ...state,
        taskMutation: { status: 'idle', error: null },
        currentProjectTasks:
          state.currentProjectTasks && tasksMatch
            ? [...state.currentProjectTasks, task]
            : state.currentProjectTasks,
        ...bumpProjectTaskCount(state, task.projectId, 1),
      };
    }
    case 'TASK_UPDATE_SUCCESS': {
      const task = action.payload;
      return {
        ...state,
        taskMutation: { status: 'idle', error: null },
        currentProjectTasks: state.currentProjectTasks
          ? state.currentProjectTasks.map((t) => (t.id === task.id ? task : t))
          : state.currentProjectTasks,
      };
    }
    case 'TASK_MUTATION_ERROR':
      return { ...state, taskMutation: { status: 'error', error: action.payload } };
    case 'TASK_MUTATION_RESET':
      return { ...state, taskMutation: { status: 'idle', error: null } };

    case 'TASK_DELETE_START':
      return {
        ...state,
        taskDeletion: { status: 'deleting', error: null, taskId: action.payload.taskId },
      };
    case 'TASK_DELETE_SUCCESS': {
      const { taskId, projectId } = action.payload;
      return {
        ...state,
        taskDeletion: { status: 'idle', error: null, taskId: null },
        currentProjectTasks: state.currentProjectTasks
          ? state.currentProjectTasks.filter((t) => t.id !== taskId)
          : state.currentProjectTasks,
        ...bumpProjectTaskCount(state, projectId, -1),
      };
    }
    case 'TASK_DELETE_ERROR':
      return {
        ...state,
        taskDeletion: {
          status: 'error',
          error: action.payload.error,
          taskId: action.payload.taskId,
        },
      };
    case 'TASK_DELETE_RESET':
      return { ...state, taskDeletion: { status: 'idle', error: null, taskId: null } };

    default:
      return state;
  }
}
