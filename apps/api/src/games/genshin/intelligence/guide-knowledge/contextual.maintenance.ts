import { lstatSync, readFileSync } from 'node:fs';

import { z } from 'zod';

import {
  byteHash,
  candidateDigest,
  impactedClaims,
  type KnowledgeCandidate,
  type KnowledgeRelease,
  parseCandidate,
  type TrackedSource,
} from './contextual.release.js';
import { digest } from './guide-knowledge.pack.js';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const checkEntrySchema = z
  .object({
    id: z.string().max(80),
    status: z.enum(['unchanged', 'changed', 'removed', 'unavailable', 'parse_failed']),
    before: z
      .object({
        revision: z.string(),
        sha256: hash,
        responseSha256: hash.nullable(),
        sectionSha256: hash.nullable(),
      })
      .strict(),
    after: z
      .object({
        revision: z.string(),
        sha256: hash.nullable(),
        responseSha256: hash.nullable(),
        sectionSha256: hash.nullable(),
      })
      .strict(),
    reason: z.string().max(300),
    sections: z
      .array(
        z
          .object({
            heading: z.string().max(100),
            sha256: hash,
            characters: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();
export const checkReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    mode: z.enum(['remote', 'captured']),
    base: z.object({ id: z.string(), digest: hash }).strict(),
    entries: z.array(checkEntrySchema).max(32),
    reverse: z.record(z.array(z.string())),
    affected: z.array(z.string()).max(80),
    digest: hash,
  })
  .strict();
export type SourceCheckReport = z.infer<typeof checkReportSchema>;
type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
function withinDeadline<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error('Source request deadline exceeded.'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    pending.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
export async function boundedSourceFetch(
  url: string,
  fetcher: Fetcher = fetch,
  limit = 2_000_000,
  timeoutMs = 6000,
) {
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 6000 ||
    limit < 1 ||
    limit > 2_000_000
  )
    throw Error('Invalid source resource bound.');
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.hash ||
    ![
      'api.github.com',
      'raw.githubusercontent.com',
      'keqingmains.com',
      'library.keqingmains.com',
    ].includes(parsed.hostname)
  )
    throw Error('Disallowed source origin.');
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await withinDeadline(
    fetcher(url, {
      redirect: 'manual',
      signal,
      headers: {
        Accept: 'application/vnd.github+json, text/html, text/plain',
        'User-Agent': 'Celestia-bounded-source-check',
      },
    }),
    signal,
  );
  if (response.status !== 200) {
    await response.body?.cancel();
    return { status: response.status, bytes: null };
  }
  if (Number(response.headers.get('content-length') ?? 0) > limit) {
    await response.body?.cancel();
    throw Error('Oversized source.');
  }
  if (!response.body) throw Error('Missing source body.');
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await withinDeadline(reader.read(), signal);
      if (done) break;
      length += value.length;
      if (length > limit) throw Error('Oversized source.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return { status: 200, bytes: Buffer.concat(chunks) };
}
export function inspectTrackedBytes(source: TrackedSource, bytes: Uint8Array) {
  if (bytes.length > 2_000_000) throw Error('Oversized tracked input.');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (text.includes('\0') || !text.trim()) throw Error('Invalid tracked text.');
  if (source.extractor === 'json-record-v1') {
    const record = JSON.parse(text) as unknown;
    if (
      !record ||
      typeof record !== 'object' ||
      Array.isArray(record) ||
      !('name' in record) ||
      typeof record.name !== 'string'
    )
      throw Error('JSON record parser drift.');
  } else if (source.extractor === 'typescript-text-v1') {
    // Syntax-shaped byte observation only. Never import/evaluate a sheet or infer helper semantics.
    if (!text.includes('import ') || !text.includes('export '))
      throw Error('TypeScript text extractor drift.');
  }
  return text;
}
const normalize = (text: string) =>
  text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|amp|#\d+);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function inspectReferenceSections(source: TrackedSource, bytes: Uint8Array) {
  if (source.origin.kind !== 'reference') throw Error('Reference source required.');
  const html = inspectTrackedBytes(source, bytes);
  // Versioned heading fingerprint extractor, not a game-mechanics/prose importer.
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)];
  const sections = source.origin.sections.map((label) => {
    const index = headings.findIndex(
      (heading) => normalize(heading[2]).toLowerCase() === label.toLowerCase(),
    );
    if (index < 0) throw Error('Tracked reference section missing; no text fallback.');
    const start = headings[index];
    const end = headings.slice(index + 1).find((heading) => Number(heading[1]) <= Number(start[1]));
    const text = normalize(html.slice(start.index! + start[0].length, end?.index ?? html.length));
    if (!text) throw Error('Tracked reference section empty.');
    return { heading: label, sha256: byteHash(text), characters: text.length };
  });
  return { sections, sha256: digest(sections) };
}
function report(
  base: KnowledgeRelease,
  entries: SourceCheckReport['entries'],
  mode: SourceCheckReport['mode'],
) {
  const reverse = Object.fromEntries(
    base.pack.sources.map((source) => [
      source.id,
      base.pack.claims
        .filter((claim) => claim.sourceIds.includes(source.id))
        .map((claim) => claim.id),
    ]),
  );
  const attention = entries
    .filter((entry) => entry.status !== 'unchanged')
    .map((entry) => entry.id);
  const content = {
    schemaVersion: 1 as const,
    mode,
    base: { id: base.descriptor.id, digest: base.descriptor.digest },
    entries,
    reverse,
    affected: base.pack.claims
      .filter((claim) => claim.sourceIds.some((source) => attention.includes(source)))
      .map((claim) => claim.id),
  };
  return checkReportSchema.parse({ ...content, digest: digest(content) });
}
export function validateCheckReport(raw: unknown, base: KnowledgeRelease) {
  const parsed = checkReportSchema.parse(raw),
    { digest: expected, ...content } = parsed;
  if (
    digest(content) !== expected ||
    digest(parsed) !== digest(report(base, parsed.entries, parsed.mode)) ||
    parsed.entries.length !== base.tracking.length ||
    new Set(parsed.entries.map((entry) => entry.id)).size !== parsed.entries.length ||
    parsed.entries.some((entry) => !base.tracking.some((source) => source.id === entry.id))
  )
    throw Error('Check report identity/reference mismatch.');
  for (const entry of parsed.entries) {
    const source = base.tracking.find((source) => source.id === entry.id)!;
    if (digest(entry.before) !== digest(before(source)))
      throw Error('Check before identity mismatch.');
  }
  return parsed;
}
const before = (source: TrackedSource) => ({
  revision: source.revision,
  sha256: source.sha256,
  responseSha256: source.responseSha256,
  sectionSha256: source.sectionSha256,
});
export async function checkTrackedSources(
  base: KnowledgeRelease,
  refs: Readonly<Record<string, string>> = {},
  fetcher: Fetcher = fetch,
) {
  const repositories: string[] = [
    ...new Set(
      base.tracking.flatMap((source) =>
        source.origin.kind === 'repository' ? [source.origin.repository] : [],
      ),
    ),
  ];
  if (Object.keys(refs).some((repository) => !repositories.includes(repository)))
    throw Error('Untracked repository ref.');
  const resolved = new Map<string, string | null>();
  await Promise.all(
    repositories.map(async (repository) => {
      const old = base.tracking.find(
        (source) => source.origin.kind === 'repository' && source.origin.repository === repository,
      )!;
      const ref = refs[repository] ?? old.revision;
      if (!/^[A-Za-z0-9._/-]{1,100}$/.test(ref) || ref.includes('..'))
        throw Error('Invalid repository ref.');
      try {
        const response = await boundedSourceFetch(
          `https://api.github.com/repos/${repository}/commits/${encodeURIComponent(ref)}`,
          fetcher,
          1_000_000,
        );
        const commit =
          response.bytes && (JSON.parse(response.bytes.toString('utf8')) as { sha?: string });
        resolved.set(
          repository,
          commit && /^[a-f0-9]{40}$/.test(commit.sha ?? '') ? commit.sha! : null,
        );
      } catch {
        resolved.set(repository, null);
      }
    }),
  );
  const evidence: Record<string, string> = {},
    entries: SourceCheckReport['entries'] = [];
  // Three simultaneous inputs maximum; report order always follows the stable manifest.
  for (let offset = 0; offset < base.tracking.length; offset += 3) {
    entries.push(
      ...(await Promise.all(
        base.tracking.slice(offset, offset + 3).map(async (source) => {
          const entry: SourceCheckReport['entries'][number] = {
            id: source.id,
            status: 'unavailable',
            before: before(source),
            after: {
              revision: source.revision,
              sha256: null,
              responseSha256: null,
              sectionSha256: null,
            },
            reason: 'Upstream unavailable; no deletion or review inference.',
            sections: [],
          };
          try {
            const revision =
              source.origin.kind === 'repository'
                ? resolved.get(source.origin.repository)
                : source.revision;
            if (!revision) return entry;
            entry.after.revision = revision;
            const url =
              source.origin.kind === 'repository'
                ? `https://raw.githubusercontent.com/${source.origin.repository}/${revision}/${source.origin.path}`
                : source.origin.url;
            const response = await boundedSourceFetch(url, fetcher);
            if (response.status === 404)
              return {
                ...entry,
                status: 'removed' as const,
                reason: 'Exact tracked input returned HTTP 404; prior approved evidence retained.',
              };
            if (!response.bytes)
              return {
                ...entry,
                reason: `Exact tracked input returned HTTP ${response.status}; redirects/304 without verified cache are not followed or trusted.`,
              };
            // Retain bounded source-code bytes, including parser failures, but never guide HTML.
            if (source.origin.kind === 'repository') {
              entry.after.sha256 = byteHash(response.bytes);
              evidence[source.id] = response.bytes.toString('base64');
            } else entry.after.responseSha256 = byteHash(response.bytes);
            try {
              if (source.origin.kind === 'reference') {
                entry.after.sha256 = source.sha256; // This is the retained author note, never the page hash.
                entry.after.responseSha256 = byteHash(response.bytes);
                const sections = inspectReferenceSections(source, response.bytes);
                entry.sections = sections.sections;
                entry.after.sectionSha256 = sections.sha256;
                const unchanged = source.sectionSha256
                  ? source.sectionSha256 === sections.sha256
                  : source.responseSha256 === entry.after.responseSha256;
                entry.status = unchanged ? 'unchanged' : 'changed';
                entry.reason = unchanged
                  ? 'Tracked inspected sections match available baseline identity; note digest remains separate.'
                  : 'Reference response/section identity changed; manual inspection required, no mechanic change inferred.';
              } else {
                inspectTrackedBytes(source, response.bytes);
                entry.after.sha256 = byteHash(response.bytes);
                entry.status = source.sha256 === entry.after.sha256 ? 'unchanged' : 'changed';
                entry.reason = 'Pinned tracked bytes checked; semantic review is separate.';
                evidence[source.id] = response.bytes.toString('base64');
              }
            } catch {
              entry.status = 'parse_failed';
              entry.reason =
                'Input received but parser/section extraction failed; no approval or deletion.';
            }
          } catch (error) {
            entry.reason =
              error instanceof Error && error.message.startsWith('Oversized')
                ? 'Oversized response rejected by byte bound; no deletion or approval.'
                : 'Transport/timeout failure; no deletion or approval.';
          }
          return entry;
        }),
      )),
    );
  }
  return { report: report(base, entries, 'remote'), evidence };
}
export function importTrackedSources(
  base: KnowledgeRelease,
  captured: Readonly<Record<string, Uint8Array>>,
) {
  if (Object.keys(captured).some((key) => !base.tracking.some((source) => source.id === key)))
    throw Error('Untracked captured input.');
  const evidence: Record<string, string> = {};
  const entries = base.tracking.map((source): SourceCheckReport['entries'][number] => {
    const bytes = captured[source.id];
    const entry: SourceCheckReport['entries'][number] = {
      id: source.id,
      before: before(source),
      after: { ...before(source) },
      status: 'unchanged',
      reason: 'Retained base bytes used; this local import makes no upstream freshness assertion.',
      sections: [],
    };
    if (!bytes) return entry;
    try {
      const text = inspectTrackedBytes(source, bytes);
      if (source.origin.kind === 'reference') {
        const note = JSON.parse(text) as {
          id: string;
          url: string;
          sections: string[];
          responseSha256: string;
          sectionSha256?: string;
        };
        if (
          note.id !== source.id ||
          note.url !== source.origin.url ||
          digest(note.sections) !== digest(source.origin.sections) ||
          !hash.safeParse(note.responseSha256).success ||
          (note.sectionSha256 && !hash.safeParse(note.sectionSha256).success)
        )
          throw Error('Captured reference identity mismatch.');
        entry.after.responseSha256 = note.responseSha256;
        entry.after.sectionSha256 = note.sectionSha256 ?? null;
      }
      entry.after.sha256 = byteHash(bytes);
      entry.status = source.sha256 === entry.after.sha256 ? 'unchanged' : 'changed';
      evidence[source.id] = Buffer.from(bytes).toString('base64');
    } catch {
      entry.status = 'parse_failed';
      entry.reason = 'Captured input invalid; active bytes unchanged.';
    }
    return entry;
  });
  return { report: report(base, entries, 'captured'), evidence };
}
export function candidateFromCheck(
  base: KnowledgeRelease,
  rawReport: unknown,
  captured: Record<string, string>,
) {
  const checked = validateCheckReport(rawReport, base);
  if (checked.entries.some((entry) => !['unchanged', 'changed'].includes(entry.status)))
    throw Error('Resolve failed/removed tracked inputs before constructing an update.');
  const candidate: KnowledgeCandidate = {
    schemaVersion: 1,
    base: checked.base,
    registry: structuredClone(base.registry),
    pack: structuredClone(base.pack),
    tracking: structuredClone(base.tracking),
    evidence: { ...base.evidence },
    notices: { ...base.notices },
    decisions: [],
  };
  for (const entry of checked.entries.filter((entry) => entry.status === 'changed')) {
    const source = candidate.registry.find((source) => source.id === entry.id)!;
    const tracked = candidate.tracking.find((source) => source.id === entry.id)!;
    if (
      !captured[entry.id] ||
      byteHash(Buffer.from(captured[entry.id], 'base64')) !== entry.after.sha256
    )
      throw Error(
        'Changed reference needs an explicit inspected note; captured byte identity required.',
      );
    candidate.evidence[entry.id] = captured[entry.id];
    source.sha256 = entry.after.sha256!;
    source.revision = entry.after.revision;
    tracked.sha256 = source.sha256;
    tracked.revision = source.revision;
    tracked.responseSha256 = entry.after.responseSha256;
    tracked.sectionSha256 = entry.after.sectionSha256;
    if (tracked.origin.kind === 'repository')
      source.url = `https://raw.githubusercontent.com/${tracked.origin.repository}/${source.revision}/${tracked.origin.path}`;
  }
  const pack = candidate.pack as KnowledgeRelease['pack'];
  pack.sources = candidate.registry;
  const { contentHash: _hash, ...content } = pack;
  pack.contentHash = digest(content);
  void _hash;
  return {
    candidate: parseCandidate(candidate),
    impact: impactedClaims(candidate, base),
    digest: candidateDigest(candidate),
  };
}
export function readCapturedFile(path: string) {
  // Caller must contain the path in its explicitly selected capture directory.
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2_000_000)
    throw Error('Oversized or linked captured input.');
  return readFileSync(path);
}
