#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const ENTRY_HTML = path.join(DIST_DIR, 'index.html');

// Maximum allowed JavaScript bundle size in bytes
// Limit: 95,232 bytes (93.0 KB)
const MAX_JS_SIZE_BYTES = 93 * 1024; // 95,232 bytes

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 2 : 1)} ${sizes[i]}`;
}

function normalizeAssetReference(ref) {
  if (!ref) return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;

  // Skip external resources
  if (/^(https?:)?\/\//i.test(trimmed)) {
    return null;
  }

  const withoutQuery = trimmed.split(/[?#]/)[0];
  if (!withoutQuery) return null;

  const cleaned = withoutQuery.replace(/^\/+/, '');
  const resolved = path.resolve(DIST_DIR, cleaned);

  if (!resolved.startsWith(DIST_DIR)) {
    return null;
  }

  const relative = path.relative(DIST_DIR, resolved);
  if (!relative || relative.startsWith('..')) {
    return null;
  }

  return {
    relative,
    absolute: resolved,
  };
}

async function getInitialLoadJsFiles() {
  let html;
  try {
    html = await fs.readFile(ENTRY_HTML, 'utf8');
  } catch (e) {
    throw new Error(`Failed to read ${ENTRY_HTML}: ${e.message}`);
  }

  const patterns = [
    /<script\s+[^>]*type=["']module["'][^>]*src=["']([^"']+\.js)["'][^>]*>/gi,
    /<link\s+[^>]*rel=["']modulepreload["'][^>]*href=["']([^"']+\.js)["'][^>]*>/gi,
    /<link\s+[^>]*rel=["']preload["'][^>]*as=["']script["'][^>]*href=["']([^"']+\.js)["'][^>]*>/gi,
  ];

  const assets = new Map();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const normalized = normalizeAssetReference(match[1]);
      if (normalized) {
        assets.set(normalized.relative, normalized.absolute);
      }
    }
  }

  if (assets.size === 0) {
    throw new Error('No initial-load JavaScript assets found in index.html.');
  }

  return Array.from(assets.values());
}

async function getImmediateEntryDeps(entryFile) {
  let content;
  try {
    content = await fs.readFile(entryFile, 'utf8');
  } catch (e) {
    console.warn(`Warning: unable to read entry module ${entryFile}: ${e.message}`);
    return [];
  }

  const mapMatch = content.match(/m\.f\|\|\(m\.f=\[([^\]]*)\]/);
  if (!mapMatch) {
    return [];
  }

  const depMatches = Array.from(mapMatch[1].matchAll(/["']([^"']+\.js)["']/g));
  if (depMatches.length === 0) {
    return [];
  }

  const depList = depMatches.map(([, dep]) => dep);

  const firstCallMatch = content.match(/__vite__mapDeps\(\s*\[([^\]]+)\]/);
  if (!firstCallMatch) {
    return [];
  }

  const indexes = firstCallMatch[1]
    .split(',')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((num) => Number.isInteger(num) && num >= 0 && num < depList.length);

  const deps = [];
  for (const index of indexes) {
    const relative = depList[index];
    if (!relative) continue;
    const normalized = normalizeAssetReference(relative);
    if (normalized) {
      deps.push(normalized.absolute);
    }
  }

  return deps;
}

async function calculateTotalSize(files) {
  let totalSize = 0;
  for (const file of files) {
    const stats = await fs.stat(file);
    totalSize += stats.size;
  }
  return totalSize;
}

async function main() {
  // Check if dist directory exists
  try {
    await fs.access(DIST_DIR);
  } catch (e) {
    console.error('Error: dist directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Get all JavaScript files
  const initialLoadSet = new Set(await getInitialLoadJsFiles());

  if (initialLoadSet.size === 0) {
    console.error('Error: No initial-load JavaScript files found.');
    process.exit(1);
  }

  // Include immediate dependencies eagerly pulled in by the entry module
  for (const file of Array.from(initialLoadSet)) {
    const deps = await getImmediateEntryDeps(file);
    for (const dep of deps) {
      initialLoadSet.add(dep);
    }
  }

  // Calculate total size
  const initialLoadFiles = Array.from(initialLoadSet);
  const totalSize = await calculateTotalSize(initialLoadFiles);
  const maxSizeFormatted = formatBytes(MAX_JS_SIZE_BYTES);
  const totalSizeFormatted = formatBytes(totalSize);

  console.log(`Bundle size check:`);
  console.log(`  Initial load JavaScript files: ${initialLoadFiles.length}`);
  console.log(`  Files:`);
  for (const file of initialLoadFiles) {
    const rel = path.relative(DIST_DIR, file) || file;
    console.log(`   - ${rel}`);
  }
  console.log(`  Total size: ${totalSizeFormatted} (${totalSize.toLocaleString()} bytes)`);
  console.log(`  Size limit: ${maxSizeFormatted} (${MAX_JS_SIZE_BYTES.toLocaleString()} bytes)`);

  if (totalSize > MAX_JS_SIZE_BYTES) {
    const excess = totalSize - MAX_JS_SIZE_BYTES;
    const excessFormatted = formatBytes(excess);
    console.error(`\n❌ Bundle size check FAILED!`);
    console.error(
      `   Bundle size exceeds limit by ${excessFormatted} (${excess.toLocaleString()} bytes)`
    );
    console.error(
      `\nPlease reduce the bundle size or update the limit in scripts/check-bundle-size.mjs`
    );
    process.exit(1);
  }

  const remaining = MAX_JS_SIZE_BYTES - totalSize;
  const remainingFormatted = formatBytes(remaining);
  console.log(`\n✅ Bundle size check PASSED!`);
  console.log(
    `   ${remainingFormatted} (${remaining.toLocaleString()} bytes) remaining before limit`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
