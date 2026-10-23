import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';

import {
  boundedSourceFetch,
  candidateFromCheck,
  checkTrackedSources,
  importTrackedSources,
  inspectReferenceSections,
  validateCheckReport,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.maintenance.ts';
import { validateContextualPack } from '../src/games/genshin/intelligence/guide-knowledge/contextual.pack.ts';
import {
  activateRelease,
  activeIdentity,
  compileCandidate,
  impactedClaims,
  loadRelease,
  loadSelectedRelease,
  publishCandidate,
  releaseMetadata,
  safeReleasePath,
  withReleaseLock,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts';
import { digest } from '../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.pack.ts';
import {
  approvedBaselineInput,
  baselineId,
  migrateApprovedBaseline,
} from './contextual-baseline.mjs';

const roots = [];
afterEach(() =>
  roots.splice(0).forEach((root) => {
    const target = realpathSync(root);
    const ownedName = relative(realpathSync(tmpdir()), target);
    if (
      !/^celestia-k3-(release-test|portable|link-outside|production-copy)-[^\\/]+$/.test(ownedName)
    )
      throw Error('Refusing cleanup outside the owned K3 temporary directory.');
    rmSync(target, { recursive: true, force: true });
  }),
);
const save = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
function store() {
  const root = mkdtempSync(join(tmpdir(), 'celestia-k3-release-test-'));
  roots.push(root);
  save(join(root, 'fixture.json'), 'isolated-synthetic-knowledge');
  migrateApprovedBaseline(root);
  activateRelease(root, baselineId, null, 'OmniRush.ai test agent');
  return { root, base: loadSelectedRelease(root) };
}
const candidate = (base) => ({
  schemaVersion: 1,
  base: { id: base.descriptor.id, digest: base.descriptor.digest },
  registry: structuredClone(base.registry),
  pack: structuredClone(base.pack),
  tracking: structuredClone(base.tracking),
  evidence: { ...base.evidence },
  notices: { ...base.notices },
  decisions: [],
});
function change(base, id = 'db-goldentroupe') {
  const bytes = Buffer.from(
    JSON.stringify({
      ...JSON.parse(Buffer.from(base.evidence[id], 'base64').toString('utf8')),
      fixtureOnly: 'changed byte identity; not real mechanics',
    }),
  );
  const result = importTrackedSources(base, { [id]: bytes });
  return { ...result, ...candidateFromCheck(base, result.report, result.evidence) };
}
function decide(input, base, decision = 'keep') {
  const impact = impactedClaims(input, base);
  input.decisions = impact.affected
    .filter((id) => input.pack.claims.find((claim) => claim.id === id).status === 'active')
    .map((claimId) => {
      const claim = input.pack.claims.find((entry) => entry.id === claimId);
      const source = input.registry.find((entry) => claim.sourceIds.includes(entry.id));
      return {
        claimId,
        candidateDigest: impact.candidateDigest,
        claimDigest: digest(claim),
        decision,
        reviewer: 'OmniRush.ai isolated fixture reviewer',
        type: 'agent',
        date: new Date().toISOString().slice(0, 10),
        scope:
          'Synthetic fixture review only; never promote fixture mechanics to the normal store.',
        evidence: [`source:${source.id}:${source.sha256}`],
      };
    });
  return input;
}
function upstream(base, overrides = {}) {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (url.includes('api.github.com')) {
      const repo = base.tracking.find(
        (source) => source.origin.kind === 'repository' && url.includes(source.origin.repository),
      );
      return new Response(JSON.stringify({ sha: repo.revision }));
    }
    const source = base.tracking.find((entry) =>
      entry.origin.kind === 'repository'
        ? url.endsWith(entry.origin.path)
        : url === entry.origin.url,
    );
    if (!source) throw Error('Untracked fixture URL.');
    if (source.id in overrides)
      return typeof overrides[source.id] === 'function'
        ? overrides[source.id]()
        : overrides[source.id];
    if (source.origin.kind === 'repository')
      return new Response(Buffer.from(base.evidence[source.id], 'base64'));
    return new Response(
      source.origin.sections
        .map(
          (section) => `<h2>${section}</h2><p>Selected fixture fingerprint; no prose mirror.</p>`,
        )
        .join(''),
    );
  };
  return { fetcher, calls };
}
describe('K3 bounded source and review workflow', () => {
  it('retains deterministic no-op reports and all inherited review dates', () => {
    const { root, base } = store(),
      before = readFileSync(join(root, 'active.json'));
    const first = importTrackedSources(base, {}),
      second = importTrackedSources(base, {});
    expect(first).toEqual(second);
    expect(first.report.entries).toHaveLength(17);
    expect(first.report.entries.every((entry) => entry.status === 'unchanged')).toBe(true);
    expect(first.report.affected).toEqual([]);
    expect(readFileSync(join(root, 'active.json'))).toEqual(before);
    const input = candidateFromCheck(base, first.report, first.evidence).candidate;
    expect(compileCandidate(input, base).pack).toEqual(base.pack);
    expect(base.pack.claims.every((claim) => claim.review.type === 'agent')).toBe(true);
  });
  it('reports exact changed source claims and never redates unrelated reviews', () => {
    const { base } = store(),
      result = change(base);
    expect(result.impact.affected).toEqual([
      'gt-two-piece',
      'gt-four-piece-base',
      'gt-four-piece-field',
    ]);
    expect(result.report.affected).toEqual(result.impact.affected);
    expect(() => compileCandidate(result.candidate, base)).toThrow('Unresolved');
    const compiled = compileCandidate(decide(result.candidate, base), base).pack;
    expect(compiled.claims.filter((claim) => !result.impact.affected.includes(claim.id))).toEqual(
      base.pack.claims.filter((claim) => !result.impact.affected.includes(claim.id)),
    );
  });
  it('pins repository refs once and fetches only the seventeen tracked inputs', async () => {
    const { base } = store(),
      { fetcher, calls } = upstream(base);
    const result = await checkTrackedSources(
      base,
      { 'theBowja/genshin-db': 'main', 'frzyc/genshin-optimizer': 'master' },
      fetcher,
    );
    expect(calls.filter((url) => url.includes('api.github.com'))).toHaveLength(2);
    expect(calls).toHaveLength(19);
    expect(
      result.report.entries
        .filter((entry) => entry.id.startsWith('db-') || entry.id.startsWith('go-'))
        .every((entry) => entry.status === 'unchanged'),
    ).toBe(true);
    expect(Object.keys(result.evidence)).toHaveLength(11);
    expect(JSON.stringify(result.evidence)).not.toContain('<h2>');
    await expect(checkTrackedSources(base, { 'untracked/repo': 'main' }, fetcher)).rejects.toThrow(
      'Untracked',
    );
  });
  it('distinguishes timeout, removal, malformed bytes, parser drift and section loss', async () => {
    const { root, base } = store(),
      before = readFileSync(join(root, 'active.json'));
    const { fetcher } = upstream(base, {
      'db-keqing': () => {
        throw Error('Timeout');
      },
      'db-fischl': new Response(null, { status: 404 }),
      'db-goldentroupe': new Response('{bad JSON'),
      'go-goldentroupe': new Response('no parser shape'),
      'kqm-fischl-quick': new Response('<h2>Unrelated</h2>no fallback'),
      'db-viridescentvenerer': new Response('x', { headers: { 'content-length': '2000001' } }),
    });
    const result = await checkTrackedSources(base, {}, fetcher);
    const states = Object.fromEntries(
      result.report.entries.map((entry) => [entry.id, entry.status]),
    );
    expect(states).toMatchObject({
      'db-keqing': 'unavailable',
      'db-fischl': 'removed',
      'db-goldentroupe': 'parse_failed',
      'go-goldentroupe': 'parse_failed',
      'kqm-fischl-quick': 'parse_failed',
      'db-viridescentvenerer': 'unavailable',
    });
    expect(() => candidateFromCheck(base, result.report, result.evidence)).toThrow('Resolve');
    expect(readFileSync(join(root, 'active.json'))).toEqual(before);
  });
  it('separates observation note digests from inspected response and section fingerprints', async () => {
    const { base } = store(),
      { fetcher } = upstream(base);
    const result = await checkTrackedSources(base, {}, fetcher);
    const reference = result.report.entries.find((entry) => entry.id === 'kqm-fischl-quick');
    expect(reference.after.sha256).toBe(reference.before.sha256);
    expect(reference.after.responseSha256).not.toBe(reference.after.sha256);
    expect(reference.after.sectionSha256).not.toBe(reference.after.responseSha256);
    const tracked = base.tracking.find((entry) => entry.id === reference.id);
    expect(() => inspectReferenceSections(tracked, Buffer.from('<h2>Other</h2>'))).toThrow(
      'missing',
    );
  });
  it('rejects untracked captures, oversized inputs and tampered report references', () => {
    const { base } = store();
    expect(() => importTrackedSources(base, { injected: Buffer.from('{}') })).toThrow('Untracked');
    expect(
      importTrackedSources(base, { 'db-keqing': Buffer.alloc(2_000_001) }).report.entries[0].status,
    ).toBe('parse_failed');
    const report = importTrackedSources(base, {}).report;
    report.reverse['db-keqing'] = ['missing'];
    expect(() => validateCheckReport(report, base)).toThrow('mismatch');
  });
  it('bounds actual stalled response bodies and rejects redirects, bad hosts and chunked oversize', async () => {
    const url = 'https://raw.githubusercontent.com/theBowja/genshin-db/main/tracked.json';
    await expect(
      boundedSourceFetch(
        url,
        async () => new Response(new ReadableStream({ start() {} })),
        1000,
        20,
      ),
    ).rejects.toThrow('deadline');
    const redirect = await boundedSourceFetch(
      url,
      async () =>
        new Response(null, { status: 302, headers: { location: 'https://untracked.invalid/' } }),
    );
    expect(redirect).toEqual({ status: 302, bytes: null });
    await expect(boundedSourceFetch('https://untracked.invalid/path')).rejects.toThrow(
      'Disallowed',
    );
    await expect(
      boundedSourceFetch(url, async () => new Response('x'.repeat(101)), 100),
    ).rejects.toThrow('Oversized');
  });
  it('invalidates decisions after candidate bytes, claim conditions or base change', () => {
    const { base } = store();
    for (const mutate of [
      (input) => {
        input.evidence['db-keqing'] += 'AAAA';
      },
      (input) => {
        input.pack.claims[0].condition = { op: 'known', fact: 'role' };
        const { contentHash: _, ...content } = input.pack;
        void _;
        input.pack.contentHash = digest(content);
      },
      (input) => {
        input.base.digest = '0'.repeat(64);
      },
    ]) {
      const input = decide(change(base).candidate, base);
      mutate(input);
      expect(() => compileCandidate(input, base)).toThrow();
    }
    const stale = decide(change(base).candidate, base);
    stale.decisions[0].candidateDigest = '0'.repeat(64);
    expect(() => compileCandidate(stale, base)).toThrow('Stale');
  });
  it('includes changed supported-role or reading context in impacted claim reviews', () => {
    const { base } = store(),
      input = candidate(base);
    input.pack.subjects[0].roles = ['unknown'];
    const { contentHash, ...content } = input.pack;
    void contentHash;
    input.pack.contentHash = digest(content);
    const impact = impactedClaims(input, base);
    expect(impact.affected).toEqual(
      base.pack.claims
        .filter((claim) => claim.subjects.includes('Keqing'))
        .map((claim) => claim.id),
    );
    expect(() => compileCandidate(input, base)).toThrow('Unresolved');
  });
  it.each(['exclude', 'conflict', 'unsupported'])(
    'requires explicit %s and publishes honest reduced coverage',
    (decision) => {
      const { base } = store(),
        input = change(base).candidate;
      const unsafe = structuredClone(input);
      unsafe.pack.claims.find((claim) => claim.id === 'gt-two-piece').status = 'excluded';
      unsafe.pack.claims.find((claim) => claim.id === 'gt-two-piece').excludedReason =
        'Not a review';
      const { contentHash: _, ...content } = unsafe.pack;
      unsafe.pack.contentHash = digest(content);
      void _;
      expect(() => compileCandidate(unsafe, base)).toThrow('Unresolved');
      const result = compileCandidate(decide(input, base, decision), base).pack;
      const claims = result.claims.filter((claim) => claim.id.startsWith('gt-'));
      expect(claims.every((claim) => claim.status === 'excluded')).toBe(true);
      expect(
        claims.every(
          (claim) =>
            claim.review.state ===
            (decision === 'conflict'
              ? 'conflicted'
              : decision === 'unsupported'
                ? 'unsupported'
                : 'reviewed'),
        ),
      ).toBe(true);
      expect(result.claims.find((claim) => claim.id === 'unmodeled-modern-interactions')).toEqual(
        base.pack.claims.find((claim) => claim.id === 'unmodeled-modern-interactions'),
      );
    },
  );
  it('binds amendments and evidence to exact typed claim content without executing imports', () => {
    const { base } = store(),
      input = change(base).candidate;
    const claim = input.pack.claims.find((claim) => claim.id === 'gt-two-piece');
    claim.condition = { op: 'known', fact: 'gt.field' };
    const { contentHash: _, ...content } = input.pack;
    input.pack.contentHash = digest(content);
    void _;
    decide(input, base);
    input.decisions.find((entry) => entry.claimId === claim.id).decision = 'amend';
    expect(
      compileCandidate(input, base).pack.claims.find((entry) => entry.id === claim.id).condition,
    ).toEqual(claim.condition);
    input.decisions[0].evidence = ['source:missing:' + '0'.repeat(64)];
    expect(() => compileCandidate(input, base)).toThrow('evidence');
    const malformed = structuredClone(base.pack);
    malformed.claims[0].condition = { op: 'equals', fact: 'mh.onField', value: 'execute()' };
    expect(() => validateContextualPack(malformed, undefined, base.registry)).toThrow(
      'type mismatch',
    );
  });
  it('validates registry, pack, notice and retained evidence hashes before promotion', () => {
    const { base } = store();
    for (const mutate of [
      (input) => {
        input.registry[0].sha256 = '0'.repeat(64);
      },
      (input) => {
        input.pack.contentHash = '0'.repeat(64);
      },
      (input) => {
        input.notices['notices/genshin-db.txt'] = 'MIT License altered';
      },
      (input) => {
        input.evidence['db-keqing'] = Buffer.from('{}').toString('base64');
      },
      (input) => {
        input.tracking[0].origin.path = '../escape';
      },
    ]) {
      const input = candidate(base);
      mutate(input);
      expect(() => compileCandidate(input, base)).toThrow();
    }
  });
});
describe('K3 immutable local release lifecycle', () => {
  it('imports the exact approved baseline without changing historical review provenance', () => {
    const { base } = store();
    expect(base.pack).toEqual(approvedBaselineInput().pack);
    expect(base.descriptor.digest).toBe(
      '158816aef44417ecfd4bf29c7bdc2e08b08cc439085083b9143b320bbddb634e',
    );
    expect(releaseMetadata(base)).toMatchObject({
      activeClaims: 23,
      excludedClaims: 1,
      reviewerTypes: ['agent'],
      activation: 'startup_snapshot_restart_required',
    });
    expect(Object.isFrozen(base.pack.claims[0])).toBe(true);
  });
  it('atomically activates and rolls back exact bytes while a running snapshot stays coherent', () => {
    const { root, base } = store(),
      input = candidate(base),
      before = activeIdentity(root);
    const next = publishCandidate(root, 'fixture-second-identity', input, 'fixture');
    expect(activeIdentity(root)).toEqual(before); // publication alone is not activation
    const event = activateRelease(root, next.id, before, 'OmniRush.ai lifecycle fixture');
    const restarted = loadSelectedRelease(root);
    expect(event.state).toBe('applied');
    expect(restarted.descriptor.id).toBe(next.id);
    expect(base.descriptor.id).toBe(baselineId);
    expect(base.pack).toEqual(restarted.pack);
    const rollback = activateRelease(
      root,
      baselineId,
      activeIdentity(root),
      'OmniRush.ai lifecycle fixture',
      'rollback',
    );
    expect(rollback.operation).toBe('rollback');
    expect(loadSelectedRelease(root)).toEqual(base);
    expect(loadRelease(root, next.id)).toEqual(restarted);
    expect(restarted.descriptor.id).toBe(next.id);
  });
  it('rejects concurrent writers and stale expected bases without losing the selected release', () => {
    const { root, base } = store(),
      current = activeIdentity(root);
    withReleaseLock(root, current, () =>
      expect(() => activateRelease(root, baselineId, current, 'concurrent')).toThrow(),
    );
    const next = publishCandidate(root, 'fixture-concurrent', candidate(base), 'fixture');
    activateRelease(root, next.id, current, 'first writer');
    expect(() => publishCandidate(root, 'stale-writer', candidate(base), 'fixture')).toThrow(
      'Stale',
    );
    expect(() => activateRelease(root, baselineId, current, 'stale writer')).toThrow('Stale');
    expect(loadSelectedRelease(root).descriptor.id).toBe(next.id);
  });
  it('excludes a second OS publisher process with the same expected base', () => {
    const { root } = store(),
      current = activeIdentity(root);
    const module = new URL(
      '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts',
      import.meta.url,
    ).href;
    withReleaseLock(root, current, () => {
      const code = `import {withReleaseLock} from ${JSON.stringify(module)}; try { withReleaseLock(${JSON.stringify(root)}, ${JSON.stringify(current)}, () => {}); process.exit(9); } catch(e) { process.stdout.write(String(e.code)); process.exit(e.code === 'EEXIST' ? 0 : 8); }`;
      const result = spawnSync(
        process.execPath,
        ['--import', 'tsx', '--input-type=module', '-e', code],
        { cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 15000 },
      );
      expect(result.status).toBe(0);
      expect(result.stdout).toBe('EEXIST');
    });
    expect(loadSelectedRelease(root).descriptor.id).toBe(baselineId);
  });
  it('keeps approved reads usable after a real publisher exits mid-publication and leaves its lock', () => {
    const { root, base } = store();
    const file = join(root, 'crash-candidate.json');
    save(file, candidate(base));
    const module = new URL(
      '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts',
      import.meta.url,
    ).href;
    const code = `import {readFileSync} from 'node:fs'; import {publishCandidate} from ${JSON.stringify(module)}; publishCandidate(${JSON.stringify(root)}, 'fixture-crash', JSON.parse(readFileSync(${JSON.stringify(file)}, 'utf8')), 'fixture', phase => { if(phase === 'after-stage') process.exit(23); });`;
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', code],
      { cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 15000 },
    );
    expect(result.status).toBe(23);
    expect(loadSelectedRelease(root)).toEqual(base);
    expect(JSON.parse(readFileSync(join(root, 'writer.lock'), 'utf8')).pid).toBe(result.pid);
    expect(() =>
      activateRelease(root, baselineId, activeIdentity(root), 'no automatic stale unlock'),
    ).toThrow();
  });
  it.each(['after-stage', 'after-finalize', 'before-pointer', 'after-pointer'])(
    'keeps a complete earlier or next release after interruption at %s',
    (phase) => {
      const { root, base } = store(),
        current = activeIdentity(root);
      const fail = (point) => {
        if (point === phase) throw Error(`Fixture interruption ${phase}`);
      };
      if (phase.startsWith('after-') && phase !== 'after-pointer') {
        expect(() =>
          publishCandidate(root, 'fixture-interrupted', candidate(base), 'fixture', fail),
        ).toThrow('interruption');
        expect(loadSelectedRelease(root)).toEqual(base);
      } else {
        publishCandidate(root, 'fixture-interrupted', candidate(base), 'fixture');
        expect(() =>
          activateRelease(
            root,
            'fixture-interrupted',
            current,
            'fixture interruption',
            'activate',
            fail,
          ),
        ).toThrow('interruption');
        expect(loadSelectedRelease(root).descriptor.id).toBe(
          phase === 'after-pointer' ? 'fixture-interrupted' : baselineId,
        );
      }
      expect(existsSync(join(root, 'writer.lock'))).toBe(false);
    },
  );
  // Full immutable bundles are read and verified repeatedly; allow bounded Windows filesystem latency.
  it(
    'rejects release-ID reuse with different content and preserves finalized evidence',
    { timeout: 15000 },
    () => {
      const { root, base } = store(),
        input = candidate(base);
      const first = publishCandidate(root, 'fixture-immutable', input, 'fixture');
      expect(publishCandidate(root, first.id, input, 'fixture')).toEqual(first);
      input.pack.limitations.push('Fixture-only changed bundle.');
      const { contentHash: _, ...content } = input.pack;
      input.pack.contentHash = digest(content);
      void _;
      expect(() => publishCandidate(root, first.id, input, 'fixture')).toThrow('immutable');
      expect(loadRelease(root, first.id).descriptor).toEqual(first);
    },
  );
  it('fails selected-bundle startup visibly on corruption but does not mutate a loaded snapshot', () => {
    const { root, base } = store();
    writeFileSync(join(root, 'releases', baselineId, 'registry.json'), '[]');
    expect(() => loadSelectedRelease(root)).toThrow('hash');
    expect(base.pack.contentHash).toBe(approvedBaselineInput().pack.contentHash);
    expect(base.pack.claims).toHaveLength(24);
  });
  it('rolls back to an intact earlier release even when the selected current payload is corrupt', () => {
    const { root, base } = store();
    publishCandidate(root, 'fixture-corrupt-current', candidate(base), 'fixture');
    activateRelease(root, 'fixture-corrupt-current', activeIdentity(root), 'fixture setup');
    writeFileSync(join(root, 'releases/fixture-corrupt-current/pack.json'), '{}');
    expect(() => loadSelectedRelease(root)).toThrow('hash');
    activateRelease(
      root,
      baselineId,
      activeIdentity(root),
      'OmniRush.ai corruption recovery fixture',
      'rollback',
    );
    expect(loadSelectedRelease(root)).toEqual(base);
  });
  it('rejects rollback through an unverified current descriptor and preserves the pointer', () => {
    const { root, base } = store();
    publishCandidate(root, 'fixture-invalid-descriptor', candidate(base), 'fixture');
    activateRelease(root, 'fixture-invalid-descriptor', activeIdentity(root), 'fixture setup');
    const current = activeIdentity(root);
    const file = join(root, 'releases/fixture-invalid-descriptor/release.json');
    const descriptor = JSON.parse(readFileSync(file, 'utf8'));
    descriptor.base.digest = '0'.repeat(64);
    save(file, descriptor);
    expect(() =>
      activateRelease(root, baselineId, current, 'fixture descriptor guard', 'rollback'),
    ).toThrow('descriptor');
    expect(activeIdentity(root)).toEqual(current);
    expect(loadRelease(root, baselineId)).toEqual(base);
    expect(existsSync(join(root, 'writer.lock'))).toBe(false);
  });
  it('rejects traversal, escaped roots, missing bytes and mismatched pointer identities', () => {
    const { root } = store();
    for (const path of [
      '../outside',
      'releases/../../outside',
      '/absolute',
      'C:/outside',
      'releases\\escape',
    ])
      expect(() => safeReleasePath(root, path, false)).toThrow();
    const pointer = JSON.parse(readFileSync(join(root, 'active.json'), 'utf8'));
    pointer.digest = '0'.repeat(64);
    save(join(root, 'active.json'), pointer);
    expect(() => loadSelectedRelease(root)).toThrow('pointer mismatch');
    rmSync(join(root, 'releases', baselineId, 'notices/genshin-db.txt'));
    expect(() => loadRelease(root, baselineId)).toThrow('Missing');
  });
  it('loads a portable copy with every required byte and no documentation or upstream reads', () => {
    const { root, base } = store(),
      portable = mkdtempSync(join(tmpdir(), 'celestia-k3-portable-'));
    roots.push(portable);
    cpSync(root, portable, { recursive: true });
    expect(loadSelectedRelease(portable)).toEqual(base);
    expect(
      createHash('sha256')
        .update(readFileSync(join(portable, 'releases', baselineId, 'evidence/db-keqing.raw')))
        .digest('hex'),
    ).toBe(base.registry[0].sha256);
  });
  it('rejects an actual junction or symlink escape in the release store', () => {
    const { root } = store(),
      outside = mkdtempSync(join(tmpdir(), 'celestia-k3-link-outside-'));
    roots.push(outside);
    symlinkSync(
      outside,
      join(root, 'releases/escape'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    expect(() => safeReleasePath(root, 'releases/escape/pack.json', false)).toThrow('Linked');
  });
  it('packages production-relative startup modules with all runtime bytes and no docs dependency', () => {
    const { root } = store(),
      portable = mkdtempSync(join(tmpdir(), 'celestia-k3-production-copy-'));
    roots.push(portable);
    const moduleRoot = join(portable, 'games/genshin/intelligence/guide-knowledge');
    cpSync(root, join(portable, 'games/genshin/static/knowledge-releases'), { recursive: true });
    cpSync(
      new URL('../src/games/genshin/static/contextual-sources.json', import.meta.url),
      join(portable, 'games/genshin/static/contextual-sources.json'),
    );
    cpSync(
      new URL('../src/games/genshin/intelligence/guide-knowledge', import.meta.url),
      moduleRoot,
      { recursive: true, filter: (path) => !path.endsWith('.test.ts') },
    );
    for (const name of [
      'contextual.data',
      'contextual.pack',
      'contextual.release',
      'guide-knowledge.pack',
    ]) {
      const code = ts.transpileModule(readFileSync(join(moduleRoot, `${name}.ts`), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      writeFileSync(join(moduleRoot, `${name}.js`), code);
    }
    save(join(portable, 'package.json'), { type: 'module' });
    symlinkSync(
      join(process.cwd(), 'node_modules'),
      join(portable, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const env = { ...process.env };
    delete env.CELESTIA_CONTEXTUAL_RELEASE_ROOT;
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import {contextualLoadedMetadata as m} from './games/genshin/intelligence/guide-knowledge/contextual.data.js'; process.stdout.write(m.release.id);`,
      ],
      { cwd: portable, env, encoding: 'utf8', timeout: 15000 },
    );
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(baselineId);
    writeFileSync(
      join(
        portable,
        'games/genshin/static/knowledge-releases/releases',
        baselineId,
        'registry.json',
      ),
      '[]',
    );
    const invalid = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import './games/genshin/intelligence/guide-knowledge/contextual.data.js';`,
      ],
      { cwd: portable, env, encoding: 'utf8', timeout: 15000 },
    );
    expect(invalid.status).not.toBe(0);
    expect(invalid.stderr).toContain('Release file hash/size mismatch');
  });
});
