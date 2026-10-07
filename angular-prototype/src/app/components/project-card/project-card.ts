import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ProjectWithTaskCount } from '../../models';
import { formatDate } from '../../utils/format-date';
import { PERF_MARKS, markSafe } from '../../utils/perf-marks';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-card.html',
  styleUrl: './project-card.css',
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: ProjectWithTaskCount;
  protected readonly formatDate = formatDate;

  markNavToDetailStart(): void {
    markSafe(PERF_MARKS.navToDetailStart);
  }
}
