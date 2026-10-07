import { useEffect } from 'react';
import { useStore } from '../../state/StoreContext';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '../../models';
import styles from './Dashboard.module.css';

type SummaryAccent = 'primary' | 'neutral' | 'success' | 'danger';

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: SummaryAccent;
}) {
  return (
    <div className={`${styles.summaryCard} ${styles[accent]}`}>
      <span className={styles.summaryValue}>{value}</span>
      <span className={styles.summaryLabel}>{label}</span>
    </div>
  );
}

export function Dashboard() {
  const { dashboardStats, dashboardLoading, dashboardError, loadDashboardStats } = useStore();

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  if (dashboardError && !dashboardStats) {
    return (
      <EmptyState
        title="Couldn't load the dashboard"
        description={dashboardError}
        action={
          <button type="button" className="btn btn-primary" onClick={() => loadDashboardStats()}>
            Retry
          </button>
        }
      />
    );
  }

  if (!dashboardStats) {
    return (
      <div className={styles.loadingWrap}>
        <LoadingSpinner size="lg" label={dashboardLoading ? 'Loading dashboard…' : undefined} />
      </div>
    );
  }

  const stats = dashboardStats;
  const statusMax = Math.max(...TASK_STATUSES.map((s) => stats.byStatus[s]), 1);
  const priorityMax = Math.max(...TASK_PRIORITIES.map((p) => stats.byPriority[p]), 1);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Dashboard</h1>
        <p>An overview of everything happening across your projects.</p>
      </header>

      <div className={styles.cards}>
        <SummaryCard label="Total Projects" value={stats.totalProjects} accent="primary" />
        <SummaryCard label="Total Tasks" value={stats.totalTasks} accent="neutral" />
        <SummaryCard label="Completed" value={stats.completedTasks} accent="success" />
        <SummaryCard label="Overdue" value={stats.overdueTasks} accent="danger" />
      </div>

      <div className={styles.charts}>
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Tasks by status</h2>
          <div className={styles.barList}>
            {TASK_STATUSES.map((status) => (
              <div key={status} className={styles.barRow}>
                <span className={styles.barLabel}>{STATUS_LABELS[status]}</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[`status-${status}`]}`}
                    style={{ width: `${(stats.byStatus[status] / statusMax) * 100}%` }}
                  />
                </div>
                <span className={styles.barValue}>{stats.byStatus[status]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Tasks by priority</h2>
          <div className={styles.barList}>
            {TASK_PRIORITIES.map((priority) => (
              <div key={priority} className={styles.barRow}>
                <span className={styles.barLabel}>{PRIORITY_LABELS[priority]}</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[`priority-${priority}`]}`}
                    style={{ width: `${(stats.byPriority[priority] / priorityMax) * 100}%` }}
                  />
                </div>
                <span className={styles.barValue}>{stats.byPriority[priority]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
