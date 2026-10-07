import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppErrorService } from './services/app-error.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(protected readonly appError: AppErrorService) {}

  resetError(): void {
    this.appError.reset();
  }
}
