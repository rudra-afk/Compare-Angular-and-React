import { Link } from 'react-router-dom';
import type { Task } from '../../models';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { PriorityBadge } from '../PriorityBadge/PriorityBadge';
import { formatDate, isOverdue } from '../../utils/formatDate';
import styles from './TaskRow.module.css';

interface TaskRowProps {
  task: Task;
  projectId: string;
  onDelete: (task: Task) => void;
}

export function TaskRow({ task, projectId, onDelete }: TaskRowProps) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <p className={styles.title}>{task.title}</p>
        {task.description && <p className={styles.description}>{task.description}</p>}
      </div>
      <div className={styles.badges}>
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>
      <div className={`${styles.due} ${overdue ? styles.overdue : ''}`}>
        {overdue && <span className={styles.overdueLabel}>Overdue</span>}
        <span>{formatDate(task.dueDate)}</span>
      </div>
      <div className={styles.actions}>
        <Link to={`/projects/${projectId}/tasks/${task.id}/edit`} className="btn btn-ghost">
          Edit
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </div>
  );
}
