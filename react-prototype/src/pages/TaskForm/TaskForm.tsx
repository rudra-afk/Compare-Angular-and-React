import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../state/StoreContext';
import * as mockApi from '../../api/mockApi';
import { FormInput } from '../../components/FormInput/FormInput';
import { FormSelect } from '../../components/FormSelect/FormSelect';
import { FormTextarea } from '../../components/FormTextarea/FormTextarea';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import {
  hasTaskDraftErrors,
  validateTaskDraft,
  type TaskDraftErrors,
} from '../../utils/validateTaskDraft';
import { toDateInputValue } from '../../utils/formatDate';
import type { TaskDraft } from '../../models';
import styles from './TaskForm.module.css';

interface TaskFormProps {
  mode: 'create' | 'edit';
}

const emptyDraft: TaskDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

export function TaskForm({ mode }: TaskFormProps) {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    currentProjectLoading,
    currentProjectNotFound,
    currentProjectError,
    taskMutation,
    loadProjectById,
    createTask,
    updateTask,
  } = useStore();

  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [taskLoading, setTaskLoading] = useState(mode === 'edit');
  const [taskLoadError, setTaskLoadError] = useState<string | null>(null);
  const [taskNotFound, setTaskNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    loadProjectById(projectId);
  }, [projectId, loadProjectById]);

  // Route guard: an edit/new task URL for a project id that doesn't exist
  // redirects to the project detail page, which renders the shared
  // "not found" UI instead of crashing on missing data.
  useEffect(() => {
    if (currentProjectNotFound && projectId) {
      navigate(`/projects/${projectId}`, { replace: true });
    }
  }, [currentProjectNotFound, projectId, navigate]);

  useEffect(() => {
    if (mode !== 'edit' || !taskId) return;
    let cancelled = false;
    setTaskLoading(true);
    setTaskLoadError(null);
    setTaskNotFound(false);
    mockApi
      .fetchTaskById(taskId)
      .then((task) => {
        if (cancelled) return;
        if (!task) {
          setTaskNotFound(true);
        } else {
          setDraft({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: toDateInputValue(task.dueDate),
          });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTaskLoadError(error instanceof Error ? error.message : 'Something went wrong.');
      })
      .finally(() => {
        if (!cancelled) setTaskLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, taskId, reloadToken]);

  if (!projectId) return null;

  if (currentProjectNotFound) return null;

  if (currentProjectError && !currentProject) {
    return (
      <EmptyState
        title="Couldn't load this project"
        description={currentProjectError}
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => loadProjectById(projectId)}
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!currentProject) {
    return (
      <div className={styles.loadingWrap}>
        <LoadingSpinner size="lg" label={currentProjectLoading ? 'Loading project…' : undefined} />
      </div>
    );
  }

  if (taskNotFound) {
    return (
      <EmptyState
        title="Task not found"
        description="This task may have been deleted, or the link is incorrect."
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Back to project
          </button>
        }
      />
    );
  }

  if (taskLoadError) {
    return (
      <EmptyState
        title="Couldn't load this task"
        description={taskLoadError}
        action={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setReloadToken((n) => n + 1)}
          >
            Retry
          </button>
        }
      />
    );
  }

  if (taskLoading) {
    return (
      <div className={styles.loadingWrap}>
        <LoadingSpinner size="lg" label="Loading task…" />
      </div>
    );
  }

  const errors: TaskDraftErrors = validateTaskDraft(draft, { isCreate: mode === 'create' });
  const isInvalid = hasTaskDraftErrors(errors);
  const saving = taskMutation.status === 'saving';

  function fieldError(field: keyof TaskDraftErrors): string | null {
    if (!touched[field] && !submitAttempted) return null;
    return errors[field] ?? null;
  }

  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (hasTaskDraftErrors(validateTaskDraft(draft, { isCreate: mode === 'create' }))) {
      return;
    }
    if (!projectId) return;
    const ok =
      mode === 'create'
        ? await createTask(projectId, draft)
        : taskId
          ? await updateTask(taskId, draft)
          : false;
    if (ok) {
      navigate(`/projects/${projectId}`);
    }
  }

  return (
    <div className={styles.page}>
      <h1>{mode === 'create' ? 'New Task' : 'Edit Task'}</h1>
      <p className={styles.subtitle}>Project: {currentProject.name}</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormInput
          id="title"
          label="Title"
          required
          value={draft.title}
          onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
          onBlur={() => markTouched('title')}
          error={fieldError('title')}
          placeholder="e.g. Fix login flow"
        />
        <FormTextarea
          id="description"
          label="Description"
          value={draft.description}
          onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
          onBlur={() => markTouched('description')}
          error={fieldError('description')}
          maxLength={500}
          placeholder="Optional details…"
        />
        <div className={styles.row}>
          <FormSelect
            id="status"
            label="Status"
            required
            value={draft.status}
            onChange={(v) => setDraft((d) => ({ ...d, status: v as TaskDraft['status'] }))}
            onBlur={() => markTouched('status')}
            error={fieldError('status')}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
          />
          <FormSelect
            id="priority"
            label="Priority"
            required
            value={draft.priority}
            onChange={(v) => setDraft((d) => ({ ...d, priority: v as TaskDraft['priority'] }))}
            onBlur={() => markTouched('priority')}
            error={fieldError('priority')}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>
        <FormInput
          id="dueDate"
          label="Due date"
          type="date"
          required
          value={draft.dueDate}
          onChange={(v) => setDraft((d) => ({ ...d, dueDate: v }))}
          onBlur={() => markTouched('dueDate')}
          error={fieldError('dueDate')}
        />

        {taskMutation.status === 'error' && <p className={styles.formError}>{taskMutation.error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/projects/${projectId}`)}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isInvalid || saving}>
            {saving ? 'Saving…' : mode === 'create' ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
