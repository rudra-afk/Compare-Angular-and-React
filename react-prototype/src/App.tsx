import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { StoreProvider } from './state/StoreContext';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { ProjectsList } from './pages/ProjectsList/ProjectsList';
import { ProjectDetail } from './pages/ProjectDetail/ProjectDetail';
import { TaskForm } from './pages/TaskForm/TaskForm';
import { NotFound } from './pages/NotFound/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="projects/:projectId/tasks/new" element={<TaskForm mode="create" />} />
              <Route
                path="projects/:projectId/tasks/:taskId/edit"
                element={<TaskForm mode="edit" />}
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
}
