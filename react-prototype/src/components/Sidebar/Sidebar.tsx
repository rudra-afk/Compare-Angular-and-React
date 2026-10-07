import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { isForceFailureMode, setForceFailureMode } from '../../api/mockApi';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const [failuresEnabled, setFailuresEnabled] = useState(isForceFailureMode());

  function toggleFailures() {
    const next = !failuresEnabled;
    setForceFailureMode(next);
    setFailuresEnabled(next);
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>TF</span>
        <span className={styles.brandName}>TaskFlow</span>
      </div>
      <nav className={styles.nav}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
        >
          <DashboardIcon />
          Dashboard
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
        >
          <ProjectsIcon />
          Projects
        </NavLink>
      </nav>
      <div className={styles.footer}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={failuresEnabled} onChange={toggleFailures} />
          <span>Simulate API failures</span>
        </label>
        <p className={styles.hint}>React prototype · TaskFlow</p>
      </div>
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
