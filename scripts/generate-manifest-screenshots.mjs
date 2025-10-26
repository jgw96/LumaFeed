import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { preview as vitePreview } from 'vite';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const previewPort = Number.parseInt(process.env.PREVIEW_PORT ?? '4173', 10);
const baseUrl = `http://127.0.0.1:${previewPort}`;
const baseTargets = [
  {
    label: 'home-desktop',
    route: '/',
    viewport: { width: 1440, height: 1024 },
    deviceScaleFactor: 1,
    isMobile: false,
  },
  {
    label: 'home-mobile',
    route: '/',
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  },
  {
    label: 'diapers-desktop',
    route: '/diapers',
    viewport: { width: 1440, height: 1024 },
    deviceScaleFactor: 1,
    isMobile: false,
  },
  {
    label: 'diapers-mobile',
    route: '/diapers',
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  },
  {
    label: 'insights-desktop',
    route: '/insights',
    viewport: { width: 1440, height: 1024 },
    deviceScaleFactor: 1,
    isMobile: false,
  },
  {
    label: 'insights-mobile',
    route: '/insights',
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  },
  {
    label: 'settings-desktop',
    route: '/settings',
    viewport: { width: 1440, height: 1024 },
    deviceScaleFactor: 1,
    isMobile: false,
  },
  {
    label: 'settings-mobile',
    route: '/settings',
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  },
];

const colorThemes = [
  { suffix: 'light', colorScheme: 'light' },
  { suffix: 'dark', colorScheme: 'dark' },
];

const screenshotTargets = baseTargets.flatMap((target) =>
  colorThemes.map((theme) => ({
    label: `${target.label}-${theme.suffix}`,
    route: target.route,
    path: resolve(projectRoot, `public/screenshots/${target.label}-${theme.suffix}.png`),
    viewport: target.viewport,
    deviceScaleFactor: target.deviceScaleFactor,
    isMobile: target.isMobile,
    hasTouch: target.hasTouch ?? false,
    colorScheme: theme.colorScheme,
  })),
);

let previewServerRef = null;

function createSampleLogs(now = Date.now()) {
  const hour = 60 * 60 * 1000;
  const minute = 60 * 1000;
  // Create a realistic day of feeding logs (7-8 feedings typical for newborns/infants)
  
  // Helper to create a log entry with consistent timestamp calculations
  const createLog = (id, feedType, amountMl, amountOz, durationMinutes, isBottleFed, hoursAgo, nextFeedHoursFromNow) => {
    const startTime = now - hoursAgo * hour;
    const endTime = startTime + durationMinutes * minute;
    return {
      id,
      feedType,
      amountMl,
      amountOz,
      durationMinutes,
      isBottleFed,
      startTime,
      endTime,
      timestamp: endTime,
      nextFeedTime: now + nextFeedHoursFromNow * hour,
    };
  };
  
  return [
    createLog('log-1', 'formula', 150, 5, 18, true, 2, 1),
    createLog('log-2', 'milk', 120, 4, 22, false, 4.5, -1),
    createLog('log-3', 'formula', 135, 4.5, 20, true, 7, -3.5),
    createLog('log-4', 'milk', 105, 3.5, 25, false, 10, -6.5),
    createLog('log-5', 'formula', 120, 4, 15, true, 13, -9.5),
    createLog('log-6', 'milk', 150, 5, 28, false, 16, -12.5),
    createLog('log-7', 'formula', 135, 4.5, 17, true, 19, -15.5),
    createLog('log-8', 'milk', 120, 4, 24, false, 22, -18.5),
  ];
}

async function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  child.stdout.on('data', (data) => process.stdout.write(data));
  child.stderr.on('data', (data) => process.stderr.write(data));

  const [code, signal] = await once(child, 'exit');
  if (code !== 0) {
    const details = signal ? `signal ${signal}` : `exit code ${code}`;
    throw new Error(`${command} ${args.join(' ')} failed with ${details}`);
  }
}

async function startPreviewServer() {
  const server = await vitePreview({
    root: projectRoot,
    preview: {
      host: '127.0.0.1',
      port: previewPort,
      strictPort: true,
    },
  });
  return server;
}

async function stopPreviewServer(server) {
  if (!server) {
    return;
  }

  try {
    await server.close();
  } catch (error) {
    console.warn('Failed to close preview server cleanly.', error);
  }
}

function registerSignalHandlers() {
  const signals = new Map([
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ]);

  for (const [signal, code] of signals) {
    process.once(signal, () => {
      console.log(`Received ${signal}, cleaning up...`);
      stopPreviewServer(previewServerRef).finally(() => {
        process.exit(code);
      });
    });
  }
}

async function stubStorage(context, logs, now) {
  const logsJson = JSON.stringify(logs, null, 2);
  await context.addInitScript(({ snapshot, fixedNow }) => {
    // Mark intro experience as completed to prevent dialog from showing
    window.localStorage.setItem('feeding-tracker-intro-seen-v1', 'true');

    const storage = { 'feeding-logs.json': snapshot };

    class MemoryWritable {
      constructor(name) {
        this.name = name;
      }

      async write(chunk) {
        storage[this.name] = typeof chunk === 'string'
          ? chunk
          : new TextDecoder().decode(chunk);
      }

      async close() {}
    }

    class MemoryFileHandle {
      constructor(name) {
        this.name = name;
      }

      async getFile() {
        const name = this.name;
        return {
          async text() {
            return storage[name] ?? '[]';
          },
        };
      }

      async createWritable() {
        return new MemoryWritable(this.name);
      }
    }

    class MemoryDirectoryHandle {
      async getFileHandle(name, options = {}) {
        if (!(name in storage)) {
          if (options.create) {
            storage[name] = '[]';
          } else {
            throw new DOMException('File not found', 'NotFoundError');
          }
        }
        return new MemoryFileHandle(name);
      }
    }

    const directoryHandle = new MemoryDirectoryHandle();
    navigator.storage.getDirectory = async () => directoryHandle;

    const OriginalDate = Date;
    function FixedDate(...args) {
      if (!new.target) {
        return OriginalDate(...args);
      }

      if (args.length === 0) {
        return new OriginalDate(fixedNow);
      }

      return new OriginalDate(...args);
    }

    FixedDate.prototype = OriginalDate.prototype;
    FixedDate.now = () => fixedNow;
    FixedDate.UTC = OriginalDate.UTC;
    FixedDate.parse = OriginalDate.parse;
    Object.setPrototypeOf(FixedDate, OriginalDate);

    globalThis.Date = FixedDate;
  }, { snapshot: logsJson, fixedNow: now });
}

async function captureScreenshots() {
  const fixedNow = new Date('2024-03-15T12:00:00Z').getTime();
  const logs = createSampleLogs(fixedNow);
  
  // Try to use system chromium if playwright's chromium is not available
  // This helps in CI environments where playwright install might fail
  const launchOptions = { headless: true };
  try {
    // First try without explicit path (uses playwright's chromium if installed)
    await chromium.launch({ ...launchOptions, timeout: 5000 }).then(b => b.close());
  } catch {
    // Fallback to system chromium if playwright's chromium is not available
    const { execSync } = await import('node:child_process');
    try {
      const chromiumPath = execSync('which chromium-browser || which chromium || which google-chrome', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      if (chromiumPath) {
        launchOptions.executablePath = chromiumPath;
      }
    } catch {
      // If we can't find system chromium, let playwright try its default
    }
  }
  
  const browser = await chromium.launch(launchOptions);

  try {
    for (const target of screenshotTargets) {
      console.log(`Capturing ${target.label} screenshot...`);
      const context = await browser.newContext({
        baseURL: baseUrl,
        viewport: target.viewport,
        deviceScaleFactor: target.deviceScaleFactor,
        isMobile: target.isMobile,
        hasTouch: target.hasTouch,
        colorScheme: target.colorScheme,
        locale: 'en-US',
      });

      await stubStorage(context, logs, fixedNow);
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.error(`Console error (${target.label}):`, msg.text());
        }
      });

      await page.goto(target.route, { waitUntil: 'networkidle' });
      
      // Wait for the appropriate page component to be rendered based on the route
      if (target.route === '/') {
        const logListLocator = page.locator('home-page').locator('feeding-log-list');
        await logListLocator.waitFor({ state: 'attached', timeout: 8000 });
      } else if (target.route === '/diapers') {
        const diaperPageLocator = page.locator('diaper-page');
        await diaperPageLocator.waitFor({ state: 'attached', timeout: 8000 });
      } else if (target.route === '/insights') {
        const insightsPageLocator = page.locator('insights-page');
        await insightsPageLocator.waitFor({ state: 'attached', timeout: 8000 });
      } else if (target.route === '/settings') {
        const settingsPageLocator = page.locator('settings-page');
        await settingsPageLocator.waitFor({ state: 'attached', timeout: 8000 });
      }
      
      await page.addStyleTag({
        content: '* { animation-duration: 0s !important; transition-duration: 0s !important; }',
      });
  await page.waitForTimeout(500);

  await mkdir(dirname(target.path), { recursive: true });
  await page.screenshot({ path: target.path, fullPage: false });

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  if (process.env.SKIP_BUILD !== 'true') {
    console.log('Running build before capturing screenshots...');
    await runCommand('npm', ['run', 'build']);
  }

  console.log('Starting Vite preview server...');
  previewServerRef = await startPreviewServer();

  try {
    await captureScreenshots();
  } finally {
    console.log('Stopping Vite preview server...');
    await stopPreviewServer(previewServerRef);
  }
}

registerSignalHandlers();

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
