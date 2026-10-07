import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <svg className={styles.icon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M8 18L24 8l16 10v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V18Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M8 18l16 8 16-8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 26v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
