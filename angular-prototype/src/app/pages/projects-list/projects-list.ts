import { Component, OnInit, effect, signal } from '@angular/core';
import { StoreService } from '../../state/store.service';
import { ProjectCardComponent } from '../../components/project-card/project-card';
import { SkeletonComponent } from '../../components/skeleton/skeleton';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import type { ProjectWithTaskCount } from '../../models';
import { PERF_MARKS, markSafe, measureSafe } from '../../utils/perf-marks';

type SortField = 'name' | 'taskCount';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [ProjectCardComponent, SkeletonComponent, EmptyStateComponent],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.css',
})
export class ProjectsListPage implements OnInit {
  protected readonly sortField = signal<SortField>('name');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  // Interaction-timing instrumentation (measurement-suite only, no effect on
  // app behaviour): marks when the projects grid has painted after
  // navigating back from a detail page.
  private hasMarkedNavEnd = false;

  constructor(protected readonly store: StoreService) {
    effect(() => {
      if (this.store.projects() && !this.hasMarkedNavEnd) {
        this.hasMarkedNavEnd = true;
        requestAnimationFrame(() => {
          markSafe(PERF_MARKS.navToListEnd);
          measureSafe(PERF_MARKS.navToListMeasure, PERF_MARKS.navToListStart, PERF_MARKS.navToListEnd);
        });
      }
    });
  }

  ngOnInit(): void {
    this.store.loadProjects();
  }

  retry(): void {
    this.store.loadProjects();
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  get sortedProjects(): ProjectWithTaskCount[] {
    const projects = this.store.projects();
    if (!projects) return [];
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    const field = this.sortField();
    return [...projects].sort((a, b) => {
      if (field === 'name') return a.name.localeCompare(b.name) * dir;
      return (a.taskCount - b.taskCount) * dir;
    });
  }
}
