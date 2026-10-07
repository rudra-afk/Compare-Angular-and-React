import { Routes } from '@angular/router';
import { AppShellComponent } from './components/app-shell/app-shell';
import { DashboardPage } from './pages/dashboard/dashboard';
import { ProjectsListPage } from './pages/projects-list/projects-list';
import { ProjectDetailPage } from './pages/project-detail/project-detail';
import { TaskFormPage } from './pages/task-form/task-form';
import { NotFoundPage } from './pages/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: DashboardPage },
      { path: 'projects', component: ProjectsListPage },
      { path: 'projects/:projectId', component: ProjectDetailPage },
      { path: 'projects/:projectId/tasks/new', component: TaskFormPage },
      { path: 'projects/:projectId/tasks/:taskId/edit', component: TaskFormPage },
      { path: '**', component: NotFoundPage },
    ],
  },
];
