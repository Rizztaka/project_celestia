import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

import { contextualReleaseMetadataSchema, contextualSourceSchema } from '@celestia/api-contracts';
import { z } from 'zod';

import {
  type ContextualPack,
  contextualSourceRegistry,
  validateContextualPack,
} from './contextual.pack.js';
import { digest } from './guide-knowledge.pack.js';

const id = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const identity = z.object({ id, digest: hash }).strict();
export type ReleaseIdentity = z.infer<typeof identity>;
const repositoryOrigin = z
  .object({
    kind: z.literal('repository'),
    repository: z.enum(['theBowja/genshin-db', 'frzyc/genshin-optimizer']),
    path: z
      .string()
      .regex(
        /^(src\/data\/English\/(talents|artifacts)\/[a-z]+\.json|libs\/gi\/sheets\/src\/(Characters|Artifacts)\/[A-Za-z]+\/index\.tsx)$/,
      ),
  })
  .strict();
const referenceOrigin = z
  .object({
    kind: z.literal('reference'),
    url: z.string().url(),
    sections: z.array(z.string().min(1).max(100)).min(1).max(8),
  })
  .strict();
export const trackedSourceSchema = z
  .object({
    id,
    origin: z.discriminatedUnion('kind', [repositoryOrigin, referenceOrigin]),
    revision: z.string().min(1).max(100),
    sha256: hash,
    extractor: z.enum(['json-record-v1', 'typescript-text-v1', 'heading-sections-v1']),
    reuse: z.string().min(1).max(1000),
    notices: z.array(z.string().regex(/^notices\/[a-z-]+\.txt$/)).max(2),
    responseSha256: hash.nullable(),
    sectionSha256: hash.nullable(),
  })
  .strict();
export const trackingSchema = z.array(trackedSourceSchema).min(1).max(32);
export type TrackedSource = z.infer<typeof trackedSourceSchema>;
export const decisionSchema = z
  .object({
    claimId: id,
    candidateDigest: hash,
    claimDigest: hash,
    decision: z.enum(['keep', 'amend', 'exclude', 'conflict', 'unsupported']),
    reviewer: z.string().min(1).max(100),
    type: z.enum(['agent', 'human']),
    date: z.string().date(),
    scope: z.string().min(1).max(500),
    evidence: z.array(z.string().min(1).max(500)).min(1).max(12),
  })
  .strict();
export type ReviewDecision = z.infer<typeof decisionSchema>;
const candidateSchema = z
  .object({
    schemaVersion: z.literal(1),
    base: identity,
    registry: z.array(contextualSourceSchema).min(1).max(32),
    pack: z.unknown(),
    tracking: trackingSchema,
    decisions: z.array(decisionSchema).max(80),
    evidence: z.record(id, z.string().max(4_000_000)),
    notices: z.record(z.string().regex(/^notices\/[a-z-]+\.txt$/), z.string().max(100_000)),
  })
  .strict();
export type KnowledgeCandidate = z.infer<typeof candidateSchema>;
const descriptorSchema = z
  .object({
    schemaVersion: z.literal(1),
    id,
    kind: z.enum(['approved', 'fixture']),
    base: identity.nullable(),
    files: z.record(z.string().min(1).max(160), hash),
    digest: hash,
  })
  .strict();
type Descriptor = z.infer<typeof descriptorSchema>;
const pointerSchema = z
  .object({ schemaVersion: z.literal(1), id, digest: hash, event: id })
  .strict();
export const approvedK2Hash = '319d168130ededae60172dc7b708c04d57e641b5bf43d8112f020272ede90450';
export const byteHash = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');
function requireValid(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function safeReleasePath(root: string, path: string, mustExist = true): string {
  requireValid(
    path.length > 0 &&
      !path.includes('\\') &&
      !path.includes(':') &&
      !path.split('/').some((part) => !part || part === '.' || part === '..'),
    'Unsafe knowledge path.',
  );
  const base = realpathSync(root),
    result = resolve(base, path),
    rel = relative(base, result);
  requireValid(
    !lstatSync(root).isSymbolicLink() &&
      resolve(base).toLowerCase() === resolve(root).toLowerCase(),
    'Linked knowledge root.',
  );
  requireValid(rel && !rel.startsWith('..') && !rel.includes(':'), 'Escaped knowledge path.');
  let cursor = base;
  for (const part of rel.split(sep)) {
    cursor = join(cursor, part);
    if (!existsSync(cursor)) {
      requireValid(!mustExist, 'Missing knowledge file.');
      break;
    }
    requireValid(
      !lstatSync(cursor).isSymbolicLink() &&
        resolve(realpathSync(cursor)).toLowerCase() === resolve(cursor).toLowerCase(),
      'Linked knowledge path.',
    );
  }
  return result;
}
export function readBoundedJson(path: string, limit = 8_000_000): unknown {
  requireValid(
    lstatSync(path).isFile() && lstatSync(path).size <= limit && !lstatSync(path).isSymbolicLink(),
    'Oversized or linked knowledge JSON.',
  );
  return JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)),
  ) as unknown;
}
export function parseCandidate(raw: unknown): KnowledgeCandidate {
  requireValid(JSON.stringify(raw).length <= 8_000_000, 'Oversized knowledge candidate.');
  const candidate = candidateSchema.parse(raw);
  validateContextualPack(candidate.pack, undefined, candidate.registry);
  return candidate;
}
export function candidateDigest(candidate: KnowledgeCandidate) {
  const { decisions: _decisions, ...inputs } = candidate;
  void _decisions;
  return digest(inputs);
}
const unique = (items: string[]) => new Set(items).size === items.length;
const noticeHashes: Record<string, string> = {
  'notices/genshin-db.txt': '9b4edf56612dd31a97ade0d2d408154eb2e3dcf620f5b832fefec036ba9b50e1',
  'notices/optimizer.txt': '6c51d31f2009cda50d5112c2870e4a4d37696f2d5b29fa601b5ef186f4a5d11c',
};
function evidenceBytes(evidence: KnowledgeCandidate['evidence']) {
  return Object.fromEntries(
    Object.entries(evidence).map(([key, value]) => {
      requireValid(
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value),
        'Invalid evidence encoding.',
      );
      return [key, Buffer.from(value, 'base64')];
    }),
  );
}
function validateInputs(
  pack: ContextualPack,
  tracking: TrackedSource[],
  evidence: Record<string, Uint8Array>,
  notices: Record<string, string>,
) {
  requireValid(
    unique(tracking.map((entry) => entry.id)) && tracking.length === pack.sources.length,
    'Tracking registry mismatch.',
  );
  requireValid(Object.keys(evidence).length === pack.sources.length, 'Evidence registry mismatch.');
  const referencedNotices = new Set<string>();
  for (const source of pack.sources) {
    const entry = tracking.find((item) => item.id === source.id);
    requireValid(
      entry && entry.sha256 === source.sha256 && entry.revision === source.revision,
      'Tracking source identity mismatch.',
    );
    if (entry.origin.kind === 'repository') {
      requireValid(
        /^[a-f0-9]{40}$/.test(entry.revision) &&
          source.url ===
            `https://raw.githubusercontent.com/${entry.origin.repository}/${entry.revision}/${entry.origin.path}`,
        'Repository pin mismatch.',
      );
      requireValid(
        source.kind === 'mit_source' &&
          entry.notices.length === 1 &&
          entry.responseSha256 === null &&
          entry.sectionSha256 === null,
        'Repository reuse mismatch.',
      );
    } else {
      requireValid(
        source.kind === 'reference_observation' &&
          entry.origin.url === source.url &&
          ['keqingmains.com', 'library.keqingmains.com'].includes(new URL(source.url).hostname) &&
          new URL(source.url).protocol === 'https:',
        'Reference origin mismatch.',
      );
      const note = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(evidence[source.id]),
      );
      requireValid(
        note.id === source.id &&
          note.url === source.url &&
          note.responseSha256 === entry.responseSha256 &&
          (note.sectionSha256 ?? null) === entry.sectionSha256 &&
          digest(note.sections) === digest(entry.origin.sections),
        'Reference note/response identity mismatch.',
      );
    }
    for (const path of entry.notices) {
      requireValid(
        notices[path] && byteHash(notices[path]) === noticeHashes[path],
        'Missing or mismatched retained source notice.',
      );
      referencedNotices.add(path);
    }
  }
  requireValid(
    Object.keys(notices).every((path) => referencedNotices.has(path)),
    'Unreferenced notice.',
  );
}
export type KnowledgeRelease = Readonly<{
  descriptor: Descriptor;
  pack: ContextualPack;
  registry: ContextualPack['sources'];
  tracking: TrackedSource[];
  decisions: ReviewDecision[];
  evidence: Record<string, string>;
  notices: Record<string, string>;
}>;
export function reverseClaimMap(pack: ContextualPack) {
  const map = Object.fromEntries(pack.sources.map((source) => [source.id, [] as string[]]));
  for (const claim of pack.claims)
    for (const source of claim.sourceIds) {
      requireValid(map[source], 'Dangling source-to-claim reference.');
      map[source].push(claim.id);
    }
  return map;
}
const substantive = (claim: ContextualPack['claims'][number] | undefined) => {
  if (!claim) return null;
  const { review: _review, ...content } = claim;
  void _review;
  return content;
};
export function impactedClaims(candidate: KnowledgeCandidate, base: KnowledgeRelease) {
  const pack = validateContextualPack(candidate.pack, undefined, candidate.registry);
  const changedSources = candidate.registry
    .filter((source) => {
      const old = base.registry.find((entry) => entry.id === source.id);
      const tracked = candidate.tracking.find((entry) => entry.id === source.id);
      const oldTracked = base.tracking.find((entry) => entry.id === source.id);
      return (
        digest(source) !== digest(old) ||
        digest(tracked) !== digest(oldTracked) ||
        tracked?.notices.some((path) => candidate.notices[path] !== base.notices[path])
      );
    })
    .map((source) => source.id);
  const changedSubjects = pack.subjects
    .filter(
      (subject) =>
        digest(subject) !== digest(base.pack.subjects.find((old) => old.key === subject.key)),
    )
    .map((subject) => subject.key);
  const affected = pack.claims
    .filter(
      (claim) =>
        claim.sourceIds.some((ref) => changedSources.includes(ref)) ||
        claim.subjects.some((key) => changedSubjects.includes(key)) ||
        digest(substantive(claim)) !==
          digest(substantive(base.pack.claims.find((old) => old.id === claim.id)!)),
    )
    .map((claim) => claim.id);
  return {
    changedSources,
    affected,
    reverse: reverseClaimMap(pack),
    candidateDigest: candidateDigest(candidate),
    claims: Object.fromEntries(
      pack.claims
        .filter((claim) => affected.includes(claim.id))
        .map((claim) => [claim.id, digest(claim)]),
    ),
  };
}
export function compileCandidate(
  raw: unknown,
  base: KnowledgeRelease,
): { candidate: KnowledgeCandidate; pack: ContextualPack } {
  const candidate = parseCandidate(raw);
  requireValid(
    digest(candidate.base) === digest({ id: base.descriptor.id, digest: base.descriptor.digest }),
    'Candidate base mismatch.',
  );
  const pack = validateContextualPack(
    candidate.pack,
    evidenceBytes(candidate.evidence),
    candidate.registry,
  );
  for (const key of ['claims', 'subjects', 'sources'] as const) {
    const keys = (value: ContextualPack) =>
      value[key].map((entry) => ('id' in entry ? entry.id : entry.key)).sort();
    requireValid(
      digest(keys(pack)) === digest(keys(base.pack)),
      'K3 coverage expansion/removal is outside scope; use explicit exclusions.',
    );
  }
  validateInputs(pack, candidate.tracking, evidenceBytes(candidate.evidence), candidate.notices);
  for (const entry of candidate.tracking) {
    requireValid(
      digest(entry.origin) === digest(base.tracking.find((old) => old.id === entry.id)?.origin),
      'Tracked origin/path/section changed.',
    );
  }
  const impact = impactedClaims(candidate, base);
  requireValid(
    unique(candidate.decisions.map((entry) => entry.claimId)),
    'Duplicate review decision.',
  );
  const compiled = structuredClone(pack);
  for (const claim of compiled.claims) {
    const prior = base.pack.claims.find((entry) => entry.id === claim.id)!;
    requireValid(
      digest(claim.review) === digest(prior.review),
      'Edit review through an explicit bound decision.',
    );
    const decision = candidate.decisions.find((entry) => entry.claimId === claim.id);
    if (!impact.affected.includes(claim.id)) {
      requireValid(!decision, 'Unrelated review must remain unchanged.');
      continue;
    }
    if (!decision) {
      requireValid(
        prior.status === 'excluded' && digest(claim) === digest(prior),
        'Unresolved affected claim; exclusion also requires an explicit review.',
      );
      continue;
    }
    requireValid(
      decision.candidateDigest === impact.candidateDigest && decision.claimDigest === digest(claim),
      'Stale candidate review decision.',
    );
    requireValid(
      decision.evidence.every((reference) => {
        const match = /^source:([a-z0-9-]+):([a-f0-9]{64})$/.exec(reference);
        return (
          match &&
          claim.sourceIds.includes(match[1]) &&
          candidate.registry.some((source) => source.id === match[1] && source.sha256 === match[2])
        );
      }),
      'Review evidence must link exact cited candidate source bytes.',
    );
    requireValid(
      claim.sourceIds
        .filter((source) => impact.changedSources.includes(source))
        .every((sourceId) =>
          decision.evidence.includes(
            `source:${sourceId}:${candidate.registry.find((source) => source.id === sourceId)!.sha256}`,
          ),
        ),
      'Review must cite each changed claim dependency.',
    );
    requireValid(
      decision.date <=
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Calcutta' }).format(new Date()),
      'Future review date.',
    );
    if (decision.decision === 'keep')
      requireValid(
        digest(substantive(claim)) === digest(substantive(prior)),
        'Keep cannot approve amended claim content.',
      );
    if (decision.decision === 'amend')
      requireValid(
        digest(substantive(claim)) !== digest(substantive(prior)),
        'Amend requires changed claim content.',
      );
    const excluded = ['exclude', 'conflict', 'unsupported'].includes(decision.decision);
    claim.status = excluded ? 'excluded' : 'active';
    claim.conflicted = decision.decision === 'conflict';
    claim.support = decision.decision === 'unsupported' ? 'unsupported_scope' : 'reviewed_scope';
    claim.excludedReason = excluded ? decision.scope : null;
    claim.review = {
      state:
        decision.decision === 'conflict'
          ? 'conflicted'
          : decision.decision === 'unsupported'
            ? 'unsupported'
            : 'reviewed',
      reviewer: decision.reviewer,
      type: decision.type,
      date: decision.date,
      scope: decision.scope,
    };
  }
  requireValid(
    candidate.decisions.every((entry) => impact.affected.includes(entry.claimId)),
    'Unreferenced review decision.',
  );
  const { contentHash: _hash, ...content } = compiled;
  void _hash;
  compiled.contentHash = digest(content);
  return {
    candidate,
    pack: validateContextualPack(compiled, evidenceBytes(candidate.evidence), candidate.registry),
  };
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export function releaseMetadata(release: KnowledgeRelease) {
  return contextualReleaseMetadataSchema.parse({
    contractVersion: 1,
    release: {
      id: release.descriptor.id,
      digest: release.descriptor.digest,
      packHash: release.pack.contentHash,
    },
    packVersion: release.pack.version,
    subjects: release.pack.subjects.map((entry) => entry.key),
    activeClaims: release.pack.claims.filter((entry) => entry.status === 'active').length,
    excludedClaims: release.pack.claims.filter((entry) => entry.status === 'excluded').length,
    reviewerTypes: [...new Set(release.pack.claims.map((entry) => entry.review.type))],
    reviewScope: [...new Set(release.pack.claims.map((entry) => entry.review.scope))],
    limitations: [
      ...release.pack.limitations,
      'Source reachability is not semantic or official-patch verification; maintenance owner remains unassigned.',
      ...(release.descriptor.kind === 'fixture'
        ? ['Isolated synthetic lifecycle fixture; not an approved normal application release.']
        : []),
    ],
    activation: 'startup_snapshot_restart_required',
  });
}
function assertFixture(root: string, kind: Descriptor['kind']) {
  if (kind === 'fixture')
    requireValid(
      process.env.NODE_ENV === 'test' &&
        process.env.DOTENV_CONFIG_PATH === (process.platform === 'win32' ? 'NUL' : '/dev/null') &&
        readBoundedJson(safeReleasePath(root, 'fixture.json')) === 'isolated-synthetic-knowledge',
      'Fixture release requires isolated test store and environment.',
    );
}
function releaseDescriptor(root: string, releaseId: string): Descriptor {
  id.parse(releaseId);
  const directory = safeReleasePath(root, `releases/${releaseId}`);
  const descriptor = descriptorSchema.parse(
    readBoundedJson(safeReleasePath(directory, 'release.json'), 64_000),
  );
  const { digest: expected, ...content } = descriptor;
  requireValid(
    descriptor.id === releaseId && expected === digest(content),
    'Release descriptor identity/digest mismatch.',
  );
  return descriptor;
}
export function loadRelease(
  root: string,
  releaseId: string,
  depth = 0,
  historyRoot = root,
): KnowledgeRelease {
  requireValid(depth < 16, 'Release history exceeds bounded depth.');
  id.parse(releaseId);
  const directory = safeReleasePath(root, `releases/${releaseId}`);
  const descriptor = descriptorSchema.parse(
    readBoundedJson(safeReleasePath(directory, 'release.json'), 64_000),
  );
  requireValid(
    descriptor.id === releaseId && Object.keys(descriptor.files).length <= 64,
    'Release identity/file count mismatch.',
  );
  const { digest: expected, ...content } = descriptor;
  requireValid(expected === digest(content), 'Release descriptor digest mismatch.');
  assertFixture(root, descriptor.kind);
  const files: Record<string, Buffer> = {};
  let total = 0;
  for (const [path, sha] of Object.entries(descriptor.files)) {
    const file = safeReleasePath(directory, path);
    requireValid(
      lstatSync(file).isFile() && lstatSync(file).size <= 4_000_000,
      'Oversized release file.',
    );
    files[path] = readFileSync(file);
    total += files[path].length;
    requireValid(
      total <= 12_000_000 && byteHash(files[path]) === sha,
      'Release file hash/size mismatch.',
    );
  }
  const parse = (path: string): unknown => {
    requireValid(files[path], 'Missing required release byte.');
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(files[path]));
  };
  const registry = z.array(contextualSourceSchema).parse(parse('registry.json'));
  const tracking = trackingSchema.parse(parse('tracking.json'));
  const evidence = Object.fromEntries(
    tracking.map((source) => {
      const bytes = files[`evidence/${source.id}.raw`];
      requireValid(bytes, 'Missing release evidence.');
      return [source.id, bytes.toString('base64')];
    }),
  );
  const notices = Object.fromEntries(
    Object.entries(files)
      .filter(([path]) => path.startsWith('notices/'))
      .map(([path, bytes]) => [path, bytes.toString('utf8')]),
  );
  const pack = validateContextualPack(parse('pack.json'), evidenceBytes(evidence), registry);
  validateInputs(pack, tracking, evidenceBytes(evidence), notices);
  const decisions = z.array(decisionSchema).parse(parse('reviews.json'));
  const requiredPaths = [
    'pack.json',
    'registry.json',
    'tracking.json',
    'reviews.json',
    ...tracking.map((source) => `evidence/${source.id}.raw`),
    ...new Set(tracking.flatMap((source) => source.notices)),
    ...(descriptor.base ? ['candidate.json'] : []),
  ].sort();
  requireValid(
    digest(requiredPaths) === digest(Object.keys(files).sort()),
    'Unexpected or missing release file/reference.',
  );
  if (descriptor.base) {
    const base = loadRelease(historyRoot, descriptor.base.id, depth + 1, historyRoot);
    requireValid(
      base.descriptor.digest === descriptor.base.digest,
      'Release base digest mismatch.',
    );
    const candidate = parseCandidate(parse('candidate.json'));
    const compiled = compileCandidate(candidate, base);
    requireValid(
      digest(compiled.pack) === digest(pack) &&
        digest(compiled.candidate.decisions) === digest(decisions) &&
        digest(candidate.registry) === digest(registry) &&
        digest(candidate.tracking) === digest(tracking) &&
        digest(candidate.evidence) === digest(evidence) &&
        digest(candidate.notices) === digest(notices),
      'Released candidate/review identity mismatch.',
    );
  } else {
    requireValid(
      pack.contentHash === approvedK2Hash &&
        digest(registry) === digest(contextualSourceRegistry) &&
        decisions.length === 0 &&
        pack.sources.length === 17 &&
        pack.claims.length === 24,
      'Only the independently reviewed K2 baseline may initialize a store.',
    );
  }
  return freeze({ descriptor, pack, registry, tracking, decisions, evidence, notices });
}
export function activeIdentity(root: string): ReleaseIdentity | null {
  if (!existsSync(join(root, 'active.json'))) return null;
  const pointer = pointerSchema.parse(readBoundedJson(safeReleasePath(root, 'active.json'), 4096));
  return { id: pointer.id, digest: pointer.digest };
}
export function loadSelectedRelease(root: string): KnowledgeRelease {
  const current = activeIdentity(root);
  requireValid(current, 'No selected contextual knowledge release.');
  const release = loadRelease(root, current.id);
  requireValid(release.descriptor.digest === current.digest, 'Selected release pointer mismatch.');
  return release;
}
export function withReleaseLock<T>(
  root: string,
  expected: ReleaseIdentity | null,
  action: () => T,
): T {
  requireValid(!lstatSync(root).isSymbolicLink(), 'Linked release store.');
  const lock = safeReleasePath(root, 'writer.lock', false);
  const fd = openSync(lock, 'wx');
  try {
    writeFileSync(
      fd,
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), expected }),
    );
    fsyncSync(fd);
    requireValid(
      digest(activeIdentity(root)) === digest(expected),
      'Stale expected active release.',
    );
    return action();
  } finally {
    closeSync(fd);
    unlinkSync(lock);
  }
}
type PublishInput = {
  id: string;
  kind: Descriptor['kind'];
  base: ReleaseIdentity | null;
  pack: unknown;
  registry: unknown;
  tracking: TrackedSource[];
  evidence: Record<string, string>;
  notices: Record<string, string>;
  decisions: ReviewDecision[];
  candidate?: KnowledgeCandidate;
};
type FailureHook = (phase: string) => void;
const serialized = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
function durableWrite(path: string, bytes: string | Buffer) {
  mkdirSync(dirname(path), { recursive: true });
  const fd = openSync(path, 'wx');
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function atomicRename(from: string, to: string) {
  // Windows may transiently hold freshly validated files (e.g. a local indexer).
  // Never fall back to copy/delete or remove the old pointer. A bounded failure is safe.
  for (let attempt = 0; ; attempt++) {
    try {
      renameSync(from, to);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (
        process.platform !== 'win32' ||
        !['EPERM', 'EACCES', 'EBUSY'].includes(code ?? '') ||
        attempt >= 5
      )
        throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * (attempt + 1));
    }
  }
}
export function publishRelease(
  root: string,
  input: PublishInput,
  expected: ReleaseIdentity | null,
  hook: FailureHook = () => {},
) {
  id.parse(input.id);
  assertFixture(root, input.kind);
  return withReleaseLock(root, expected, () => {
    requireValid(digest(input.base) === digest(expected), 'Publication base mismatch.');
    const pack = validateContextualPack(input.pack, evidenceBytes(input.evidence), input.registry);
    const files: Record<string, string | Buffer> = {
      'pack.json': serialized(pack),
      'registry.json': serialized(input.registry),
      'tracking.json': serialized(input.tracking),
      'reviews.json': serialized(input.decisions),
      ...input.notices,
    };
    for (const [key, bytes] of Object.entries(evidenceBytes(input.evidence)))
      files[`evidence/${key}.raw`] = Buffer.from(bytes);
    if (input.candidate) files['candidate.json'] = serialized(input.candidate);
    const content = {
      schemaVersion: 1 as const,
      id: input.id,
      kind: input.kind,
      base: input.base,
      files: Object.fromEntries(
        Object.entries(files)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([path, bytes]) => [path, byteHash(bytes)]),
      ),
    };
    const descriptor = { ...content, digest: digest(content) };
    const destination = safeReleasePath(root, `releases/${input.id}`, false);
    if (existsSync(destination)) {
      requireValid(
        loadRelease(root, input.id).descriptor.digest === descriptor.digest,
        'Release ID is immutable.',
      );
      return descriptor;
    }
    const stageStore = safeReleasePath(root, `staging-${randomUUID()}`, false);
    const stage = join(stageStore, 'releases', input.id);
    mkdirSync(stage, { recursive: true });
    for (const [path, bytes] of Object.entries(files))
      durableWrite(safeReleasePath(stage, path, false), bytes);
    durableWrite(join(stage, 'release.json'), serialized(descriptor));
    if (input.kind === 'fixture')
      durableWrite(join(stageStore, 'fixture.json'), serialized('isolated-synthetic-knowledge'));
    // Validate exact staged bytes and review closure against the intact retained base.
    validateInputs(pack, input.tracking, evidenceBytes(input.evidence), input.notices);
    if (input.base) {
      requireValid(input.candidate, 'Missing candidate review record.');
      const base = loadRelease(root, input.base.id);
      requireValid(
        base.descriptor.digest === input.base.digest &&
          digest(compileCandidate(input.candidate, base).pack) === digest(pack),
        'Candidate promotion mismatch.',
      );
    } else
      requireValid(
        pack.contentHash === approvedK2Hash &&
          digest(input.registry) === digest(contextualSourceRegistry) &&
          input.decisions.length === 0,
        'Unapproved baseline import.',
      );
    loadRelease(stageStore, input.id, 0, root);
    hook('after-stage');
    requireValid(digest(activeIdentity(root)) === digest(expected), 'Stale publication base.');
    atomicRename(join(stageStore, 'releases', input.id), destination);
    loadRelease(root, input.id);
    hook('after-finalize');
    return descriptor;
  });
}
export function publishCandidate(
  root: string,
  releaseId: string,
  raw: unknown,
  kind: Descriptor['kind'] = 'approved',
  hook?: FailureHook,
) {
  const candidate = parseCandidate(raw),
    base = loadRelease(root, candidate.base.id);
  const compiled = compileCandidate(candidate, base);
  return publishRelease(
    root,
    {
      id: releaseId,
      kind,
      base: candidate.base,
      pack: compiled.pack,
      registry: candidate.registry,
      tracking: candidate.tracking,
      evidence: candidate.evidence,
      notices: candidate.notices,
      decisions: candidate.decisions,
      candidate,
    },
    candidate.base,
    hook,
  );
}
export function activateRelease(
  root: string,
  releaseId: string,
  expected: ReleaseIdentity | null,
  actor: string,
  operation: 'activate' | 'rollback' = 'activate',
  hook: FailureHook = () => {},
) {
  requireValid(actor.length > 0 && actor.length <= 100, 'Actual local actor required.');
  return withReleaseLock(root, expected, () => {
    const next = loadRelease(root, releaseId);
    const eventId = `event-${randomUUID()}`;
    if (operation === 'rollback') {
      requireValid(
        expected && expected.id !== releaseId,
        'Rollback requires a different retained release.',
      );
      // Recovery must not require the damaged current payload to parse. Anchor the
      // bounded descriptor chain in the selected digest; validate target bytes above.
      let earlier = releaseDescriptor(root, expected.id);
      requireValid(earlier.digest === expected.digest, 'Rollback current descriptor mismatch.');
      for (let depth = 0; earlier.id !== releaseId && earlier.base && depth < 16; depth++) {
        const previous = releaseDescriptor(root, earlier.base.id);
        requireValid(previous.digest === earlier.base.digest, 'Rollback base descriptor mismatch.');
        earlier = previous;
      }
      requireValid(
        earlier.id === releaseId,
        'Rollback target is not an intact earlier base release.',
      );
    }
    const event = {
      schemaVersion: 1,
      id: eventId,
      state: 'prepared',
      operation,
      actor,
      at: new Date().toISOString(),
      from: expected,
      to: { id: next.descriptor.id, digest: next.descriptor.digest },
      restartRequired: true,
    };
    durableWrite(safeReleasePath(root, `events/${eventId}.json`, false), serialized(event));
    const temporary = safeReleasePath(root, `pointer-${randomUUID()}.tmp`, false);
    durableWrite(temporary, serialized({ schemaVersion: 1, ...event.to, event: eventId }));
    try {
      hook('before-pointer');
      atomicRename(temporary, safeReleasePath(root, 'active.json', false));
      hook('after-pointer');
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    const applied = { ...event, state: 'applied', appliedAt: new Date().toISOString() };
    durableWrite(
      safeReleasePath(root, `events/${eventId}.applied.json`, false),
      serialized(applied),
    );
    return applied;
  });
}
