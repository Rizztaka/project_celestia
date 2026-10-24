import reviewedHashes from './reviewed-hashes.json';
import manifest from './sources.json';
import { RULE_PACK_VERSION } from './types';

export const sources = manifest.sources;
export function sourceCurrent(id: string, overrides?: Record<string, string>) {
  const source = sources.find((s) => s.id === id);
  return (
    manifest.version === RULE_PACK_VERSION &&
    !!source &&
    (overrides?.[id] ?? source.sha256) === (reviewedHashes as Record<string, string>)[id]
  );
}
