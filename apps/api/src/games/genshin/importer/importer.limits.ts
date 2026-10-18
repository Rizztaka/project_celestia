import { AppError } from '@/core/errors/app-error.js';

export const importLimits = {
  characters: 512,
  weapons: 3_000,
  artifacts: 5_000,
  materials: 5_000,
  total: 10_000,
  key: 128,
  string: 2_048,
  depth: 16,
  nodes: 200_000,
} as const;

function reject(): never {
  throw new AppError(
    'Import exceeds the supported item, text or nesting limits. Reduce the export and preview again.',
    400,
    'IMPORT_RESOURCE_LIMIT',
  );
}
export function assertImportCounts(
  counts: Record<'characters' | 'weapons' | 'artifacts' | 'materials', number>,
): void {
  let total = 0;
  for (const section of ['characters', 'weapons', 'artifacts', 'materials'] as const) {
    if (counts[section] > importLimits[section]) reject();
    total += counts[section];
  }
  if (total > importLimits.total) reject();
}

/** Run before Zod cloning or fingerprints; unknown exporter fields count too. */
export function assertImportResources(input: unknown): void {
  let nodes = 0;
  function visit(value: unknown, depth: number) {
    if (++nodes > importLimits.nodes || depth > importLimits.depth) reject();
    if (typeof value === 'string' && value.length > importLimits.string) reject();
    if (typeof value === 'number' && !Number.isFinite(value)) reject();
    if (Array.isArray(value)) {
      if (value.length > importLimits.total) reject();
      for (const item of value) visit(item, depth + 1);
    } else if (value !== null && typeof value === 'object') {
      for (const key in value) {
        if (!Object.hasOwn(value, key)) continue;
        if (key.length > importLimits.key) reject();
        visit((value as Record<string, unknown>)[key], depth + 1);
      }
    }
  }
  visit(input, 0);
  if (!input || typeof input !== 'object' || !('payload' in input)) return;
  const payload = input.payload;
  if (!payload || typeof payload !== 'object') return;
  const counts = { characters: 0, weapons: 0, artifacts: 0, materials: 0 };
  for (const section of ['characters', 'weapons', 'artifacts', 'materials'] as const) {
    const value = (payload as Record<string, unknown>)[section];
    counts[section] = Array.isArray(value)
      ? value.length
      : value && typeof value === 'object'
        ? Object.keys(value).length
        : 0;
  }
  assertImportCounts(counts);
}
