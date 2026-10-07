import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import * as mockApi from '../api/mockApi';
import type { TaskDraft } from '../models';
import { storeReducer } from './reducer';
import { initialStoreState, type StoreState } from './types';

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export interface StoreContextValue extends StoreState {
  loadDashboardStats: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadProjectById: (projectId: string) => Promise<void>;
  loadTasksByProject: (projectId: string) => Promise<void>;
  createTask: (projectId: string, draft: TaskDraft) => Promise<boolean>;
  updateTask: (taskId: string, draft: TaskDraft) => Promise<boolean>;
  deleteTask: (taskId: string, projectId: string) => Promise<boolean>;
  resetTaskMutation: () => void;
  resetTaskDeletion: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialStoreState);

  // Monotonic request tokens guard against a slow, stale request overwriting
  // state after the user has already navigated to a different project.
  const projectRequestToken = useRef(0);
  const tasksRequestToken = useRef(0);
  const savingRef = useRef(false);
  const deletingRef = useRef(false);

  // Every action below is wrapped in useCallback with an empty dependency
  // array (they only close over dispatch/refs, both stable) so consuming
  // pages can safely list them in a useEffect dependency array without
  // triggering a re-fetch loop on every render.
  const loadDashboardStats = useCallback(async () => {
    dispatch({ type: 'DASHBOARD_LOADING' });
    try {
      const stats = await mockApi.fetchDashboardStats();
      dispatch({ type: 'DASHBOARD_LOADED', payload: stats });
    } catch (error) {
      dispatch({ type: 'DASHBOARD_ERROR', payload: toMessage(error) });
    }
  }, []);

  const loadProjects = useCallback(async () => {
    dispatch({ type: 'PROJECTS_LOADING' });
    try {
      const projects = await mockApi.fetchProjects();
      dispatch({ type: 'PROJECTS_LOADED', payload: projects });
    } catch (error) {
      dispatch({ type: 'PROJECTS_ERROR', payload: toMessage(error) });
    }
  }, []);

  const loadProjectById = useCallback(async (projectId: string) => {
    const token = ++projectRequestToken.current;
    dispatch({ type: 'PROJECT_LOADING' });
    try {
      const project = await mockApi.fetchProjectById(projectId);
      if (projectRequestToken.current !== token) return;
      if (project) {
        dispatch({ type: 'PROJECT_LOADED', payload: project });
      } else {
        dispatch({ type: 'PROJECT_NOT_FOUND' });
      }
    } catch (error) {
      if (projectRequestToken.current !== token) return;
      dispatch({ type: 'PROJECT_ERROR', payload: toMessage(error) });
    }
  }, []);

  const loadTasksByProject = useCallback(async (projectId: string) => {
    const token = ++tasksRequestToken.current;
    dispatch({ type: 'TASKS_LOADING', payload: { projectId } });
    try {
      const tasks = await mockApi.fetchTasksByProject(projectId);
      if (tasksRequestToken.current !== token) return;
      dispatch({ type: 'TASKS_LOADED', payload: tasks });
    } catch (error) {
      if (tasksRequestToken.current !== token) return;
      dispatch({ type: 'TASKS_ERROR', payload: toMessage(error) });
    }
  }, []);

  const createTask = useCallback(async (projectId: string, draft: TaskDraft) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    dispatch({ type: 'TASK_MUTATION_START' });
    try {
      const task = await mockApi.createTask(projectId, draft);
      dispatch({ type: 'TASK_CREATE_SUCCESS', payload: task });
      return true;
    } catch (error) {
      dispatch({ type: 'TASK_MUTATION_ERROR', payload: toMessage(error) });
      return false;
    } finally {
      savingRef.current = false;
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, draft: TaskDraft) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    dispatch({ type: 'TASK_MUTATION_START' });
    try {
      const task = await mockApi.updateTask(taskId, draft);
      dispatch({ type: 'TASK_UPDATE_SUCCESS', payload: task });
      return true;
    } catch (error) {
      dispatch({ type: 'TASK_MUTATION_ERROR', payload: toMessage(error) });
      return false;
    } finally {
      savingRef.current = false;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string, projectId: string) => {
    if (deletingRef.current) return false;
    deletingRef.current = true;
    dispatch({ type: 'TASK_DELETE_START', payload: { taskId } });
    try {
      await mockApi.deleteTask(taskId);
      dispatch({ type: 'TASK_DELETE_SUCCESS', payload: { taskId, projectId } });
      return true;
    } catch (error) {
      dispatch({ type: 'TASK_DELETE_ERROR', payload: { taskId, error: toMessage(error) } });
      return false;
    } finally {
      deletingRef.current = false;
    }
  }, []);

  const resetTaskMutation = useCallback(() => {
    dispatch({ type: 'TASK_MUTATION_RESET' });
  }, []);

  const resetTaskDeletion = useCallback(() => {
    dispatch({ type: 'TASK_DELETE_RESET' });
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      loadDashboardStats,
      loadProjects,
      loadProjectById,
      loadTasksByProject,
      createTask,
      updateTask,
      deleteTask,
      resetTaskMutation,
      resetTaskDeletion,
    }),
    [
      state,
      loadDashboardStats,
      loadProjects,
      loadProjectById,
      loadTasksByProject,
      createTask,
      updateTask,
      deleteTask,
      resetTaskMutation,
      resetTaskDeletion,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
