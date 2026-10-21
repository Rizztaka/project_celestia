// Explicit local operator commands only; never imported by the API or run on a schedule.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  candidateFromCheck,
  checkTrackedSources,
  importTrackedSources,
  readCapturedFile,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.maintenance.ts';
import {
  activateRelease,
  activeIdentity,
  compileCandidate,
  decisionSchema,
  impactedClaims,
  loadRelease,
  loadSelectedRelease,
  parseCandidate,
  publishCandidate,
  readBoundedJson,
  releaseMetadata,
  safeReleasePath,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts';
import { digest } from '../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.pack.ts';
import { migrateApprovedBaseline } from './contextual-baseline.mjs';

const save = (path, value) =>
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
export async function knowledgeCommand(args) {
  const [command, rawStore, ...values] = args;
  if (!rawStore)
    throw Error(
      'Usage: contextual-knowledge.mjs migrate|metadata|check|import|candidate|impact|review|validate|publish|activate|rollback store ... See k3-operator-runbook.md.',
    );
  const store = resolve(rawStore);
  if (command === 'migrate' && values.length === 0) return migrateApprovedBaseline(store);
  if (command === 'metadata' && values.length === 0)
    return releaseMetadata(loadSelectedRelease(store));
  if (['check', 'import'].includes(command) && values.length >= 1 && values.length <= 2) {
    const base = loadSelectedRelease(store);
    const output = resolve(values[0]);
    // Exclusive new workspace: retained reports are not overwritten by subsequent checks.
    mkdirSync(output);
    const startedAt = new Date().toISOString();
    let result;
    if (command === 'check')
      result = await checkTrackedSources(
        base,
        values[1] ? readBoundedJson(resolve(values[1]), 8000) : {},
      );
    else {
      if (!values[1])
        throw Error('Import needs an explicit capture directory of <tracked-id>.raw files.');
      const capture = resolve(values[1]);
      const names = readdirSync(capture);
      if (names.some((name) => !base.tracking.some((entry) => `${entry.id}.raw` === name)))
        throw Error('Untracked capture file.');
      result = importTrackedSources(
        base,
        Object.fromEntries(
          names.map((name) => [
            name.slice(0, -4),
            readCapturedFile(safeReleasePath(capture, name)),
          ]),
        ),
      );
    }
    save(join(output, 'report.json'), result.report);
    save(join(output, 'evidence.json'), result.evidence);
    save(join(output, 'run.json'), {
      mode: command,
      startedAt,
      finishedAt: new Date().toISOString(),
      reportDigest: result.report.digest,
      semanticReview: false,
      note: 'Reachability/fetch time does not establish game version, mechanic correctness or approval. No active mutation.',
    });
    return { output, report: result.report };
  }
  if (command === 'candidate' && values.length === 2) {
    const checked = resolve(values[0]);
    const report = readBoundedJson(safeReleasePath(checked, 'report.json'));
    const base = loadRelease(store, report.base.id);
    const result = candidateFromCheck(
      base,
      report,
      readBoundedJson(safeReleasePath(checked, 'evidence.json')),
    );
    save(resolve(values[1]), result.candidate);
    return result.impact;
  }
  if (['impact', 'validate'].includes(command) && values.length === 1) {
    const candidate = parseCandidate(readBoundedJson(resolve(values[0])));
    const base = loadRelease(store, candidate.base.id);
    if (command === 'validate') compileCandidate(candidate, base);
    return { valid: command === 'validate', ...impactedClaims(candidate, base) };
  }
  if (command === 'review' && values.length === 3) {
    const candidate = parseCandidate(readBoundedJson(resolve(values[0])));
    const raw = readBoundedJson(resolve(values[1]), 100_000);
    if (!Array.isArray(raw))
      throw Error(
        'Supply explicit decisions with actual reviewer/type/date/evidence/scope and exact impact hashes.',
      );
    candidate.decisions = raw.map((decision) => decisionSchema.parse(decision));
    compileCandidate(candidate, loadRelease(store, candidate.base.id));
    save(resolve(values[2]), candidate);
    return { reviewedCandidate: values[2] };
  }
  if (command === 'amend' && values.length === 3) {
    const candidate = parseCandidate(readBoundedJson(resolve(values[0])));
    const amendment = readBoundedJson(resolve(values[1]), 100_000);
    if (
      !amendment ||
      typeof amendment !== 'object' ||
      Object.keys(amendment).sort().join(',') !== 'claim,claimId' ||
      amendment.claim?.id !== amendment.claimId
    )
      throw Error('Supply exactly claimId and a complete typed replacement claim.');
    const index = candidate.pack.claims.findIndex((claim) => claim.id === amendment.claimId);
    if (index < 0) throw Error('Cannot expand the claim inventory.');
    candidate.pack.claims[index] = amendment.claim;
    const { contentHash, ...content } = candidate.pack;
    void contentHash;
    candidate.pack.contentHash = digest(content);
    candidate.decisions = [];
    const parsed = parseCandidate(candidate);
    save(resolve(values[2]), parsed);
    return impactedClaims(parsed, loadRelease(store, parsed.base.id));
  }
  if (command === 'publish' && (values.length === 2 || values.length === 3)) {
    const kind = values[2] ?? 'approved';
    if (!['approved', 'fixture'].includes(kind)) throw Error('Invalid release kind.');
    return publishCandidate(store, values[1], readBoundedJson(resolve(values[0])), kind);
  }
  if (['activate', 'rollback'].includes(command) && values.length === 3) {
    const expected = values[1] === 'none' ? null : readBoundedJson(resolve(values[1]), 4096);
    return activateRelease(store, values[0], expected, values[2], command);
  }
  if (command === 'identity' && !values.length) return activeIdentity(store);
  throw Error('Unsupported command or argument count. No action performed.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await knowledgeCommand(process.argv.slice(2)), null, 2));
}
