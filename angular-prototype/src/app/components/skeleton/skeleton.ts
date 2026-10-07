import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
})
export class SkeletonComponent {
  @Input() rows = 4;
  @Input() rowHeight = 56;

  protected get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, index) => index);
  }
}
