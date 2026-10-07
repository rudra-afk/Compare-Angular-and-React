import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ label, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      {label ? <span className={styles.label}>{label}</span> : <span className="visually-hidden">Loading…</span>}
    </div>
  );
}
