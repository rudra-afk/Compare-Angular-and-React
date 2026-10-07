import styles from './Skeleton.module.css';

interface SkeletonProps {
  rows?: number;
  rowHeight?: number;
}

export function Skeleton({ rows = 4, rowHeight = 56 }: SkeletonProps) {
  return (
    <div className={styles.stack} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={styles.bar} style={{ height: rowHeight }} />
      ))}
    </div>
  );
}
