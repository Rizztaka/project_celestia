import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DIST_DIR = path.resolve('dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(DIST_DIR) || !fs.existsSync(ASSETS_DIR)) {
  console.error('❌ dist/ or dist/assets/ not found. Run "pnpm run build" first.');
  process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR);
const stats = [];

for (const file of files) {
  const filePath = path.join(ASSETS_DIR, file);
  const stat = fs.statSync(filePath);
  if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.css'))) {
    const content = fs.readFileSync(filePath);
    const rawSize = stat.size;
    const gzipSize = zlib.gzipSync(content).length;
    stats.push({
      file,
      rawSize,
      rawKb: (rawSize / 1024).toFixed(2),
      gzipSize,
      gzipKb: (gzipSize / 1024).toFixed(2),
    });
  }
}

console.log('\n📊 Celestia Bundle Budget Verification');
console.log('═'.repeat(70));
console.log(
  'Chunk'.padEnd(42) + 'Raw Size'.padEnd(14) + 'Gzip Size'.padEnd(14)
);
console.log('─'.repeat(70));

for (const s of stats.sort((a, b) => b.rawSize - a.rawSize)) {
  console.log(
    s.file.padEnd(42) + `${s.rawKb} KB`.padEnd(14) + `${s.gzipKb} KB`.padEnd(14)
  );
}
console.log('═'.repeat(70));

const errors = [];

// 1. Validate index-*.js entry chunk
const indexChunk = stats.find((s) => s.file.startsWith('index-') && s.file.endsWith('.js'));
if (!indexChunk) {
  errors.push('Missing entry chunk (index-*.js).');
} else {
  // Budget: <= 300 KB raw, <= 85 KB gzip
  if (indexChunk.rawSize > 300 * 1024) {
    errors.push(
      `Entry chunk index-*.js exceeded raw budget: ${indexChunk.rawKb} KB > 300 KB`
    );
  }
  if (indexChunk.gzipSize > 85 * 1024) {
    errors.push(
      `Entry chunk index-*.js exceeded gzip budget: ${indexChunk.gzipKb} KB > 85 KB`
    );
  }
}

// 2. Validate max chunk sizes
for (const s of stats) {
  if (s.file.endsWith('.js')) {
    // Dedicated lazy characters data chunk is ~207 KB gzip / ~858 KB raw
    if (s.file.startsWith('genshin-characters')) {
      if (s.rawSize > 1000 * 1024) {
        errors.push(`Lazy chunk ${s.file} exceeded 1000 KB raw: ${s.rawKb} KB`);
      }
      if (s.gzipSize > 250 * 1024) {
        errors.push(`Lazy chunk ${s.file} exceeded 250 KB gzip: ${s.gzipKb} KB`);
      }
    } else {
      // All other chunks (vendor, app views, modals, weapons, artifacts) must be <= 500 KB raw
      if (s.rawSize > 500 * 1024) {
        errors.push(`Chunk ${s.file} exceeded 500 KB limit: ${s.rawKb} KB > 500 KB`);
      }
    }
  }
}

// 3. Validate zero game data preloaded in index.html
if (fs.existsSync(INDEX_HTML)) {
  const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');
  const forbiddenPreloads = [
    'genshin-characters',
    'genshin-weapons',
    'genshin-artifacts',
    'genshin-rotations',
  ];

  for (const forbidden of forbiddenPreloads) {
    if (htmlContent.includes(forbidden)) {
      errors.push(
        `Critical regression: index.html preloads game data chunk "${forbidden}" in initial entry waterfall!`
      );
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ Bundle budget checks FAILED:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('\n✅ All performance budgets and bundle isolation checks PASSED!\n');
