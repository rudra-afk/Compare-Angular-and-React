import type { TaskStatus } from '../../models';
import { STATUS_LABELS } from '../../models';
import styles from './StatusBadge.module.css';

const STATUS_CLASS: Record<TaskStatus, string> = {
  todo: styles.todo,
  'in-progress': styles.progress,
  done: styles.done,
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`badge ${STATUS_CLASS[status]}`}>
      <span className="badge__dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}
