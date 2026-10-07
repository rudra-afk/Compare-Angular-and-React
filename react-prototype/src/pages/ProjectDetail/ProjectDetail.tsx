import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../state/StoreContext';
import { TaskRow } from '../../components/TaskRow/TaskRow';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { FormSelect } from '../../components/FormSelect/FormSelect';
import type { Task, TaskPriority, TaskStatus } from '../../models';
import { formatDate } from '../../utils/formatDate';
import { PERF_MARKS, markSafe, measureSafe } from '../../utils/perfMarks';
import styles from './ProjectDetail.module.css';

type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | TaskPriority;
type DueSort = 'asc' | 'desc';

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    currentProjectLoading,
    currentProjectError,
    currentProjectNotFound,
    currentProjectTasks,
    tasksLoading,
    tasksError,
    taskDeletion,
    loadProjectById,
    loadTasksByProject,
    deleteTask,
    resetTaskDeletion,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [dueSort, setDueSort] = useState<DueSort>('asc');
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);

  useEffect(() => {
    if (!projectId) return;
    loadProjectById(projectId);
    loadTasksByProject(projectId);
  }, [projectId, loadProjectById, loadTasksByProject]);

  // Interaction-timing instrumentation (measurement-suite only, no effect on
  // app behaviour): marks the duration from "user changed the sort/filter
  // control" to "the resulting list has painted."
  const isSortInitialRender = useRef(true);
  useEffect(() => {
    if (isSortInitialRender.current) {
      isSortInitialRender.current = false;
      return;
    }
    requestAnimationFrame(() => {
      markSafe(PERF_MARKS.sortEnd);
      measureSafe(PERF_MARKS.sortMeasure, PERF_MARKS.sortStart, PERF_MARKS.sortEnd);
    });
  }, [dueSort]);

  const isFilterInitialRender = useRef(true);
  useEffect(() => {
    if (isFilterInitialRender.current) {
      isFilterInitialRender.current = false;
      return;
    }
    requestAnimationFrame(() => {
      markSafe(PERF_MARKS.filterEnd);
      measureSafe(PERF_MARKS.filterMeasure, PERF_MARKS.filterStart, PERF_MARKS.filterEnd);
    });
  }, [statusFilter]);

  const hasMarkedNavEnd = useRef(false);
  useEffect(() => {
    if (currentProjectTasks && !hasMarkedNavEnd.current) {
      hasMarkedNavEnd.current = true;
      requestAnimationFrame(() => {
        markSafe(PERF_MARKS.navToDetailEnd);
        measureSafe(PERF_MARKS.navToDetailMeasure, PERF_MARKS.navToDetailStart, PERF_MARKS.navToDetailEnd);
      });
    }
  }, [currentProjectTasks]);

  const filteredTasks = useMemo(() => {
    if (!currentProjectTasks) return [];
    let list = currentProjectTasks;
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter);
    const dir = dueSort === 'asc' ? 1 : -1;
    return [...list].sort(
      (a, b) => (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir,
    );
  }, [currentProjectTasks, statusFilter, priorityFilter, dueSort]);

  if (!projectId) return null;

  if (currentProjectNotFound) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been deleted, or the link is incorrect."
        action={
          <Link to="/projects" className="btn btn-primary">
            Back to projects
          </Link>
        }
      />
    );
  }

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

  async function handleConfirmDelete() {
    if (!taskPendingDelete || !projectId) return;
    const ok = await deleteTask(taskPendingDelete.id, projectId);
    if (ok) setTaskPendingDelete(null);
  }

  const deletionError =
    taskDeletion.status === 'error' && taskDeletion.taskId === taskPendingDelete?.id
      ? taskDeletion.error
      : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link
            to="/projects"
            className={styles.backLink}
            onClick={() => markSafe(PERF_MARKS.navToListStart)}
          >
            ← All projects
          </Link>
          <h1>{currentProject.name}</h1>
          <p className={styles.description}>{currentProject.description}</p>
          <p className={styles.meta}>
            Created {formatDate(currentProject.createdAt)} · {currentProject.taskCount} tasks
          </p>
        </div>
        <Link to={`/projects/${projectId}/tasks/new`} className="btn btn-primary">
          + Add Task
        </Link>
      </header>

      <div className={styles.toolbar}>
        <FormSelect
          id="status-filter"
          label="Status"
          value={statusFilter}
          onChange={(v) => {
            markSafe(PERF_MARKS.filterStart);
            setStatusFilter(v as StatusFilter);
          }}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'todo', label: 'To Do' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'done', label: 'Done' },
          ]}
        />
        <FormSelect
          id="priority-filter"
          label="Priority"
          value={priorityFilter}
          onChange={(v) => setPriorityFilter(v as PriorityFilter)}
          options={[
            { value: 'all', label: 'All priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
        <FormSelect
          id="due-sort"
          label="Due date"
          value={dueSort}
          onChange={(v) => {
            markSafe(PERF_MARKS.sortStart);
            setDueSort(v as DueSort);
          }}
          options={[
            { value: 'asc', label: 'Soonest first' },
            { value: 'desc', label: 'Latest first' },
          ]}
        />
      </div>

      {tasksError && !currentProjectTasks && (
        <EmptyState
          title="Couldn't load tasks"
          description={tasksError}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => loadTasksByProject(projectId)}
            >
              Retry
            </button>
          }
        />
      )}

      {!currentProjectTasks && tasksLoading && (
        <div className="card">
          <Skeleton rows={6} rowHeight={48} />
        </div>
      )}

      {currentProjectTasks && currentProjectTasks.length === 0 && (
        <EmptyState
          title="No tasks yet"
          description="Add the first task to get this project moving."
        />
      )}

      {currentProjectTasks && currentProjectTasks.length > 0 && filteredTasks.length === 0 && (
        <EmptyState
          title="No matching tasks"
          description="Try adjusting the status or priority filters."
        />
      )}

      {filteredTasks.length > 0 && (
        <div className="card">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              projectId={projectId}
              onDelete={setTaskPendingDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!taskPendingDelete}
        title="Delete task"
        message={`Are you sure you want to delete "${taskPendingDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={taskDeletion.status === 'deleting'}
        errorMessage={deletionError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setTaskPendingDelete(null);
          resetTaskDeletion();
        }}
      />
    </div>
  );
}
