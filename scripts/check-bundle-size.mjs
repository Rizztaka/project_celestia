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
      content: content.toString('utf8'),
      rawSize,
      rawKb: (rawSize / 1024).toFixed(2),
      gzipSize,
      gzipKb: (gzipSize / 1024).toFixed(2),
    });
  }
}

console.log('\n📊 Celestia M3 Bundle & Lazy-Isolation Budget Verification');
console.log('═'.repeat(72));
console.log('Chunk'.padEnd(44) + 'Raw Size'.padEnd(14) + 'Gzip Size'.padEnd(14));
console.log('─'.repeat(72));

for (const s of stats.sort((a, b) => b.rawSize - a.rawSize).slice(0, 25)) {
  console.log(
    s.file.padEnd(44) + `${s.rawKb} KB`.padEnd(14) + `${s.gzipKb} KB`.padEnd(14)
  );
}
console.log('═'.repeat(72));

const errors = [];

const findChunk = (prefix, ext = '.js') =>
  stats.find((s) => s.file.startsWith(prefix) && s.file.endsWith(ext));

// 1. Tight entry shell budgets (measured baseline: index ~70 KB raw / ~21 KB gzip; CSS ~99 KB raw / ~15 KB gzip)
const indexChunk = findChunk('index-', '.js');
if (!indexChunk) {
  errors.push('Missing entry chunk (index-*.js).');
} else {
  if (indexChunk.rawSize > 110 * 1024) {
    errors.push(`Entry chunk ${indexChunk.file} exceeded 110 KB raw budget: ${indexChunk.rawKb} KB`);
  }
  if (indexChunk.gzipSize > 35 * 1024) {
    errors.push(`Entry chunk ${indexChunk.file} exceeded 35 KB gzip budget: ${indexChunk.gzipKb} KB`);
  }
}

const cssChunk = findChunk('index-', '.css');
if (cssChunk && cssChunk.gzipSize > 22 * 1024) {
  errors.push(`Entry CSS ${cssChunk.file} exceeded 22 KB gzip budget: ${cssChunk.gzipKb} KB`);
}

// 2. Solver dispatcher must stay lightweight (worker-first, dynamic main-thread fallbacks)
const dispatcherChunk = findChunk('solver-dispatcher-');
if (dispatcherChunk && dispatcherChunk.rawSize > 20 * 1024) {
  errors.push(
    `solver-dispatcher chunk (${dispatcherChunk.rawKb} KB) exceeded 20 KB — ensure fallback solver imports remain dynamic.`
  );
}

// 3. Per-chunk size ceilings
for (const s of stats) {
  if (!s.file.endsWith('.js')) continue;
  if (s.file.startsWith('genshin-characters')) {
    if (s.rawSize > 950 * 1024) {
      errors.push(`Lazy chunk ${s.file} exceeded 950 KB raw: ${s.rawKb} KB`);
    }
    if (s.gzipSize > 230 * 1024) {
      errors.push(`Lazy chunk ${s.file} exceeded 230 KB gzip: ${s.gzipKb} KB`);
    }
  } else if (s.rawSize > 500 * 1024) {
    errors.push(`Chunk ${s.file} exceeded 500 KB raw limit: ${s.rawKb} KB`);
  }
}

// 4. Lazy chunk isolation checks (verify heavy datasets are not statically pulled into unrelated tabs)
const checkNoStaticImport = (chunkPrefix, forbiddenTarget) => {
  const chunk = findChunk(chunkPrefix);
  if (!chunk) return;
  const header = chunk.content.slice(0, 2000);
  const staticImportRe = new RegExp(`from["']\\.\\/${forbiddenTarget}[^"']*["']`);
  if (staticImportRe.test(header)) {
    errors.push(
      `Lazy-loading regression: ${chunk.file} statically imports ${forbiddenTarget}* chunk!`
    );
  }
};

checkNoStaticImport('TeamGeneratorView-', 'genshin-artifacts-master');
checkNoStaticImport('ArtifactStopView-', 'genshin-artifacts-master');
checkNoStaticImport('RosterView-', 'genshin-weapons');
checkNoStaticImport('RosterView-', 'AccountBackupModal');
checkNoStaticImport('PullAdvisorView-', 'PullDistributionModal');
checkNoStaticImport('PullAdvisorView-', 'GachaAssumptionsModal');

// 5. Validate zero game data preloaded in index.html
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
  console.error('\n❌ Bundle & performance budget checks FAILED:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('\n✅ All M3 bundle size and lazy-isolation budgets PASSED!\n');
