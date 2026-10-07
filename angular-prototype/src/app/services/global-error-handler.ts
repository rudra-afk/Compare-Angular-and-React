import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { AppErrorService } from './app-error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private readonly injector: Injector) {}

  handleError(error: unknown): void {
    // Resolved lazily via Injector rather than constructor injection to avoid
    // circular-dependency ordering issues with Angular's own root injector setup.
    const appError = this.injector.get(AppErrorService);
    appError.reportFatalError(error);
  }
}
