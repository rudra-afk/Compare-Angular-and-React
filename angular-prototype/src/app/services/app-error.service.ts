import { Injectable, signal } from '@angular/core';

// Companion to GlobalErrorHandler: holds the "did an unexpected render error
// happen" flag that the root component reads to swap in a fallback UI,
// since Angular's ErrorHandler has no built-in way to replace a component
// subtree the way a React error boundary does.
@Injectable({ providedIn: 'root' })
export class AppErrorService {
  readonly hasFatalError = signal(false);

  reportFatalError(error: unknown): void {
    console.error('Unhandled application error:', error);
    this.hasFatalError.set(true);
  }

  reset(): void {
    this.hasFatalError.set(false);
  }
}
