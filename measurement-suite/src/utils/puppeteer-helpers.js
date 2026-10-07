// Shared Puppeteer scripting helpers used by both interaction-timing.js and
// memory-runner.js, so the two modules drive the exact same selectors and
// wait/retry logic against both apps.
import puppeteer from 'puppeteer';

// These selectors rely only on structure that is intentionally identical in
// both apps (same route hrefs, same element ids), not on CSS class names -
// React's CSS Modules hash class names in production, so class-based
// selectors would not be reliably comparable between the two apps.
export const SELECTORS = {
  projectCardLink: 'a[href^="/projects/"]:not([href*="/tasks/"])',
  // Scoped to the page content area (a stable, un-hashed global class shared
  // by both apps) because the sidebar's "Projects" nav link has the exact
  // same href and would otherwise be matched first.
  backToListLink: '.app-shell__content a[href="/projects"]',
  statusFilterSelect: '#status-filter',
  dueSortSelect: '#due-sort',
  taskEditLink: 'a[href*="/tasks/"][href*="/edit"]',
};

export async function launchPage(extraArgs = []) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', ...extraArgs] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  return { browser, page };
}

// Waits for a selector to appear; if the app's mock API happens to hit its
// ~5% simulated failure rate and shows an error state instead, clicks
// "Retry" and keeps waiting, rather than letting the whole run fail on
// what the app itself already recovers from.
export async function waitForContent(page, selector, { timeout = 20000, step = 3000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      await page.waitForSelector(selector, { timeout: step });
      return;
    } catch {
      const retried = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent?.trim() === 'Retry',
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (!retried && Date.now() >= deadline) {
        throw new Error(`Timed out waiting for "${selector}" (no Retry button found either)`);
      }
    }
  }
  throw new Error(`Timed out waiting for "${selector}"`);
}

// Like waitForContent, but waits for a performance.measure() entry to
// exist rather than a DOM selector - also recovers from the mock API's
// simulated failure rate by clicking "Retry" if it appears while waiting,
// since a failed fetch means the mark this measure depends on never fires.
export async function waitForMeasureWithRetry(page, measureName, { timeout = 20000, step = 3000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      await page.waitForFunction(
        (name) => performance.getEntriesByName(name).length > 0,
        { timeout: step },
        measureName,
      );
      return;
    } catch {
      const retried = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent?.trim() === 'Retry',
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (!retried && Date.now() >= deadline) {
        throw new Error(`Timed out waiting for measure "${measureName}" (no Retry button found either)`);
      }
    }
  }
  throw new Error(`Timed out waiting for measure "${measureName}"`);
}

export async function getMeasureDurations(page) {
  return page.evaluate(() => {
    const out = {};
    for (const entry of performance.getEntriesByType('measure')) {
      out[entry.name] = entry.duration;
    }
    return out;
  });
}

export async function clearPerfEntries(page) {
  await page.evaluate(() => {
    performance.clearMarks();
    performance.clearMeasures();
  });
}
