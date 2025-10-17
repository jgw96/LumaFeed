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
  return [
    {
      id: 'log-1',
      feedType: 'formula',
      amountMl: 150,
      amountOz: 5,
      durationMinutes: 18,
      isBottleFed: true,
      startTime: now - 2 * hour,
      endTime: now - 2 * hour + 18 * minute,
      timestamp: now - 2 * hour + 18 * minute,
      nextFeedTime: now + hour,
    },
    {
      id: 'log-2',
      feedType: 'milk',
      amountMl: 120,
      amountOz: 4,
      durationMinutes: 22,
      isBottleFed: false,
      startTime: now - 4 * hour,
      endTime: now - 4 * hour + 22 * minute,
      timestamp: now - 4 * hour + 22 * minute,
      nextFeedTime: now - hour,
    },
    {
      id: 'log-3',
      feedType: 'formula',
      amountMl: 90,
      amountOz: 3,
      durationMinutes: 15,
      isBottleFed: true,
      startTime: now - 6 * hour,
      endTime: now - 6 * hour + 15 * minute,
      timestamp: now - 6 * hour + 15 * minute,
      nextFeedTime: now - 3 * hour,
    },
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
  const browser = await chromium.launch({ headless: true });

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
      const logListLocator = page.locator('home-page').locator('feeding-log-list');
      await logListLocator.waitFor({ state: 'attached', timeout: 8000 });
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
