import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { PERF_MARKS, markSafe, measureSafe } from '../../utils/perfMarks';
import styles from './ProjectsList.module.css';

type SortField = 'name' | 'taskCount';
type SortDirection = 'asc' | 'desc';

export function ProjectsList() {
  const { projects, projectsLoading, projectsError, loadProjects } = useStore();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Interaction-timing instrumentation (measurement-suite only): marks when
  // the projects grid has painted after navigating back from a detail page.
  const hasMarkedNavEnd = useRef(false);
  useEffect(() => {
    if (projects && !hasMarkedNavEnd.current) {
      hasMarkedNavEnd.current = true;
      requestAnimationFrame(() => {
        markSafe(PERF_MARKS.navToListEnd);
        measureSafe(PERF_MARKS.navToListMeasure, PERF_MARKS.navToListStart, PERF_MARKS.navToListEnd);
      });
    }
  }, [projects]);

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    const copy = [...projects];
    copy.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
      return (a.taskCount - b.taskCount) * dir;
    });
    return copy;
  }, [projects, sortField, sortDirection]);

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  if (projectsError && !projects) {
    return (
      <EmptyState
        title="Couldn't load projects"
        description={projectsError}
        action={
          <button type="button" className="btn btn-primary" onClick={() => loadProjects()}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Projects</h1>
          <p>{projects ? `${projects.length} project${projects.length === 1 ? '' : 's'}` : ' '}</p>
        </div>
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Sort by</span>
          <button
            type="button"
            className={`btn btn-secondary ${sortField === 'name' ? styles.sortActive : ''}`}
            onClick={() => toggleSort('name')}
          >
            Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            type="button"
            className={`btn btn-secondary ${sortField === 'taskCount' ? styles.sortActive : ''}`}
            onClick={() => toggleSort('taskCount')}
          >
            Task count {sortField === 'taskCount' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </header>

      {!projects && projectsLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={`card ${styles.skeletonCard}`}>
              <Skeleton rows={3} rowHeight={16} />
            </div>
          ))}
        </div>
      )}

      {projects && projects.length === 0 && (
        <EmptyState title="No projects yet" description="Projects you create will show up here." />
      )}

      {projects && projects.length > 0 && (
        <div className={styles.grid}>
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
