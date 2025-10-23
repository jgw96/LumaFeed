#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');

// Maximum allowed JavaScript bundle size in bytes
// Current bundle size: 337,472 bytes (329.56 KB)
const MAX_JS_SIZE_BYTES = 337472;

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 && i > 0 ? 2 : 1)} ${sizes[i]}`;
}

async function getAllJsFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    throw new Error(`Failed to read directory ${dir}: ${e.message}`);
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllJsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
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
  const jsFiles = await getAllJsFiles(DIST_DIR);
  
  if (jsFiles.length === 0) {
    console.error('Error: No JavaScript files found in dist directory.');
    process.exit(1);
  }

  // Calculate total size
  const totalSize = await calculateTotalSize(jsFiles);
  const maxSizeFormatted = formatBytes(MAX_JS_SIZE_BYTES);
  const totalSizeFormatted = formatBytes(totalSize);

  console.log(`Bundle size check:`);
  console.log(`  JavaScript files: ${jsFiles.length}`);
  console.log(`  Total size: ${totalSizeFormatted} (${totalSize.toLocaleString()} bytes)`);
  console.log(`  Size limit: ${maxSizeFormatted} (${MAX_JS_SIZE_BYTES.toLocaleString()} bytes)`);

  if (totalSize > MAX_JS_SIZE_BYTES) {
    const excess = totalSize - MAX_JS_SIZE_BYTES;
    const excessFormatted = formatBytes(excess);
    console.error(`\n❌ Bundle size check FAILED!`);
    console.error(`   Bundle size exceeds limit by ${excessFormatted} (${excess.toLocaleString()} bytes)`);
    console.error(`\nPlease reduce the bundle size or update the limit in scripts/check-bundle-size.mjs`);
    process.exit(1);
  }

  const remaining = MAX_JS_SIZE_BYTES - totalSize;
  const remainingFormatted = formatBytes(remaining);
  console.log(`\n✅ Bundle size check PASSED!`);
  console.log(`   ${remainingFormatted} (${remaining.toLocaleString()} bytes) remaining before limit`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
