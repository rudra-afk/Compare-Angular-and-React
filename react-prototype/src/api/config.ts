export const DEFAULT_DELAY_MS = 300;
export const DEFAULT_FAILURE_RATE = 0.05;

let delayMs = DEFAULT_DELAY_MS;
let failureRate = DEFAULT_FAILURE_RATE;
let forceFailureMode = false;

export function getDelayMs(): number {
  return delayMs;
}

export function setDelayMs(ms: number): void {
  delayMs = ms;
}

export function getFailureRate(): number {
  return failureRate;
}

export function setFailureRate(rate: number): void {
  failureRate = rate;
}

export function isForceFailureMode(): boolean {
  return forceFailureMode;
}

export function setForceFailureMode(enabled: boolean): void {
  forceFailureMode = enabled;
}

export function shouldSimulateFailure(): boolean {
  if (forceFailureMode) return true;
  return Math.random() < failureRate;
}
