import { Link } from 'react-router-dom';
import type { ProjectWithTaskCount } from '../../models';
import { formatDate } from '../../utils/formatDate';
import { PERF_MARKS, markSafe } from '../../utils/perfMarks';
import styles from './ProjectCard.module.css';

export function ProjectCard({ project }: { project: ProjectWithTaskCount }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className={styles.card}
      onClick={() => markSafe(PERF_MARKS.navToDetailStart)}
    >
      <div className={styles.accent} aria-hidden="true" />
      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.name}>{project.name}</h3>
          <span className={styles.count}>
            {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        <p className={styles.description}>{project.description}</p>
        <div className={styles.footer}>
          <span>Created {formatDate(project.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
