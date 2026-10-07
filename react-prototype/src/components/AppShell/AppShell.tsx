import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <div className="app-shell__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
