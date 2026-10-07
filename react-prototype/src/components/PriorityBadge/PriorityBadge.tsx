import type { TaskPriority } from '../../models';
import { PRIORITY_LABELS } from '../../models';
import styles from './PriorityBadge.module.css';

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: styles.low,
  medium: styles.medium,
  high: styles.high,
};

const PRIORITY_GLYPH: Record<TaskPriority, string> = {
  low: '↓',
  medium: '→',
  high: '↑',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`badge ${PRIORITY_CLASS[priority]}`}>
      <span aria-hidden="true">{PRIORITY_GLYPH[priority]}</span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
