// Retained, explicitly synthetic maintenance example; never changes the normal application store.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  candidateFromCheck,
  importTrackedSources,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.maintenance.ts';
import {
  activeIdentity,
  compileCandidate,
  impactedClaims,
  loadSelectedRelease,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts';
import { digest } from '../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.pack.ts';
import { baselineId } from './contextual-baseline.mjs';
import { knowledgeCommand } from './contextual-knowledge.mjs';
import { isolatedEnvironment } from './recovery/policy.mjs';
import { repoRoot } from './recovery/process.mjs';

isolatedEnvironment(process.env);
const output = join(repoRoot, 'docs/plans/contextual-guide-knowledge/k3-fixture-workflow');
mkdirSync(output);
const save = (name, value) =>
  writeFileSync(join(output, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const store = join(output, 'store');
mkdirSync(store);
writeFileSync(join(store, 'fixture.json'), JSON.stringify('isolated-synthetic-knowledge'));
const commands = [];
const command = async (...args) => {
  commands.push(args);
  return knowledgeCommand(args);
};
save('initial-release.json', await command('migrate', store));
save(
  'initial-activation.json',
  await command('activate', store, baselineId, 'none', 'OmniRush.ai K3 fixture implementor'),
);
const base = loadSelectedRelease(store);
save('base-identity.json', activeIdentity(store));
const first = importTrackedSources(base, {}),
  second = importTrackedSources(base, {});
assert.deepEqual(first, second);
save('noop-first-report.json', first.report);
save('noop-second-report.json', second.report);
const record = JSON.parse(Buffer.from(base.evidence['db-goldentroupe'], 'base64').toString('utf8'));
const result = importTrackedSources(base, {
  'db-goldentroupe': Buffer.from(
    JSON.stringify({
      ...record,
      k3FixtureMarker: 'SYNTHETIC byte change only, not an upstream/game change',
    }),
  ),
});
save('source-change-report.json', result.report);
const { candidate } = candidateFromCheck(base, result.report, result.evidence);
save('candidate-unreviewed.json', candidate);
const impact = impactedClaims(candidate, base);
save('impact.json', impact);
let unresolved;
try {
  compileCandidate(candidate, base);
} catch (error) {
  unresolved = error.message;
}
assert.match(unresolved, /Unresolved/);
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Calcutta' }).format(new Date());
const decisions = impact.affected.map((claimId) => ({
  claimId,
  candidateDigest: impact.candidateDigest,
  claimDigest: digest(candidate.pack.claims.find((claim) => claim.id === claimId)),
  decision: 'keep',
  reviewer: 'OmniRush.ai (gpt-6-astra), fixture-only reviewer',
  type: 'agent',
  date,
  scope:
    'Isolated fixture only: original fields/constants unchanged; added synthetic marker tests byte-change review binding. No real upstream or semantic review approval.',
  evidence: [
    `source:db-goldentroupe:${candidate.registry.find((source) => source.id === 'db-goldentroupe').sha256}`,
  ],
}));
save('explicit-review-decisions.json', decisions);
await command(
  'review',
  store,
  join(output, 'candidate-unreviewed.json'),
  join(output, 'explicit-review-decisions.json'),
  join(output, 'candidate-reviewed.json'),
);
save('validation.json', await command('validate', store, join(output, 'candidate-reviewed.json')));
const next = await command(
  'publish',
  store,
  join(output, 'candidate-reviewed.json'),
  'k3-synthetic-source-review',
  'fixture',
);
save('fixture-release.json', next);
save(
  'activation.json',
  await command(
    'activate',
    store,
    next.id,
    join(output, 'base-identity.json'),
    'OmniRush.ai K3 fixture implementor',
  ),
);
save('fixture-identity.json', activeIdentity(store));
assert.equal(loadSelectedRelease(store).descriptor.id, next.id);
save(
  'rollback.json',
  await command(
    'rollback',
    store,
    baselineId,
    join(output, 'fixture-identity.json'),
    'OmniRush.ai K3 fixture implementor',
  ),
);
assert.deepEqual(loadSelectedRelease(store), base);
save('results.json', {
  syntheticOnly: true,
  unresolvedPromotionRejected: unresolved,
  affected: impact.affected,
  noOpReportsIdentical: true,
  exactRollback: true,
  commands,
  baseline: activeIdentity(store),
  semanticReviewOfLiveChange: false,
  normalApplicationStoreMutated: false,
});
// Retain our earlier failed publication bytes outside the runtime/static package.
const failed = join(
  repoRoot,
  'apps/api/src/games/genshin/static/knowledge-releases/staging-26afeb46-0140-403c-be1c-7edd51e0650a',
);
if (existsSync(failed))
  renameSync(
    failed,
    join(repoRoot, 'docs/plans/contextual-guide-knowledge/k3-evidence/failed-finalization-stage'),
  );
console.log(
  JSON.stringify({
    output,
    affected: impact.affected,
    exactRollback: true,
    normalApplicationRelease: baselineId,
  }),
);
