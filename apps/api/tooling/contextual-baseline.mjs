// The only documentation-dependent operation: explicit, byte-preserving K2 migration.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  contextualSourceRegistry,
  validateContextualPack,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.pack.ts';
import {
  byteHash,
  publishRelease,
  safeReleasePath,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
export const baselineId = 'k3-approved-k2-baseline';
export function approvedBaselineInput() {
  const docs = join(root, 'docs/plans/contextual-guide-knowledge');
  const inputs = JSON.parse(readFileSync(join(docs, 'k2-reviewed-source-inputs.json'), 'utf8'));
  const evidence = Object.fromEntries(
    inputs.map((entry) => {
      const bytes = readFileSync(safeReleasePath(docs, entry.localPath));
      if (byteHash(bytes) !== entry.sha256) throw Error('Inherited reviewed evidence changed.');
      return [entry.id, bytes.toString('base64')];
    }),
  );
  const notices = Object.fromEntries(
    ['genshin-db', 'optimizer'].map((name) => [
      `notices/${name}.txt`,
      readFileSync(
        join(root, `apps/api/src/games/genshin/static/guide-knowledge-${name}-MIT.txt`),
        'utf8',
      ),
    ]),
  );
  const tracking = contextualSourceRegistry.map((source) => {
    const common = {
      id: source.id,
      revision: source.revision,
      sha256: source.sha256,
      responseSha256: null,
      sectionSha256: null,
    };
    if (source.kind === 'reference_observation') {
      const note = JSON.parse(Buffer.from(evidence[source.id], 'base64').toString('utf8'));
      return {
        ...common,
        origin: { kind: 'reference', url: source.url, sections: note.sections },
        extractor: 'heading-sections-v1',
        reuse: note.reuse,
        notices: [],
        responseSha256: note.responseSha256,
      };
    }
    const match =
      /^https:\/\/raw\.githubusercontent\.com\/([^/]+\/[^/]+)\/([a-f0-9]{40})\/(.+)$/.exec(
        source.url,
      );
    if (!match) throw Error('Inherited repository pin invalid.');
    return {
      ...common,
      origin: { kind: 'repository', repository: match[1], path: match[3] },
      extractor: source.id.startsWith('db-') ? 'json-record-v1' : 'typescript-text-v1',
      reuse:
        'Selected pinned MIT source bytes; not underlying artwork or bulk game/guide prose. No source execution or semantic approval from parsing.',
      notices: [`notices/${source.id.startsWith('db-') ? 'genshin-db' : 'optimizer'}.txt`],
    };
  });
  const pack = validateContextualPack(
    JSON.parse(
      readFileSync(
        join(root, 'apps/api/src/games/genshin/static/contextual-knowledge.json'),
        'utf8',
      ),
    ),
  );
  return {
    id: baselineId,
    kind: 'approved',
    base: null,
    pack,
    registry: contextualSourceRegistry,
    tracking,
    evidence,
    notices,
    decisions: [],
  };
}
export function migrateApprovedBaseline(store) {
  mkdirSync(join(store, 'releases'), { recursive: true });
  mkdirSync(join(store, 'events'), { recursive: true });
  return publishRelease(store, approvedBaselineInput(), null);
}
