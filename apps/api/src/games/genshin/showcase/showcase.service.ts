import {
  type ShowcaseResult,
  type ShowcaseSnapshot,
  showcaseUidSchema,
} from '@celestia/api-contracts';

import { parseShowcase } from './showcase.parser.js';

type Issue = NonNullable<ShowcaseResult['issue']>;
interface Entry {
  snapshot: ShowcaseSnapshot | null;
  fetchedAt: string | null;
  nextFetch: number;
  issue: Issue | null;
}
const messages: Record<number, string> = {
  400: 'Enka did not accept this UID. Check the digits.',
  404: 'No public player was found for this UID.',
  424: 'Game data is temporarily unavailable, often during maintenance or an update.',
  429: 'Enka is rate limiting requests. Wait until the next refresh time.',
  500: 'Enka could not complete the lookup. Try again later.',
  503: 'Enka is temporarily unavailable. Try again later.',
};
function retryDelay(header: string | null, now: number): number {
  if (header === null) return 60000;
  const seconds = Number(header);
  if (
    header.trim() &&
    Number.isFinite(seconds) &&
    seconds >= 0 &&
    seconds * 1000 + now < 8_640_000_000_000_000
  )
    return Math.max(1000, seconds * 1000);
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(1000, date - now) : 60000;
}
const unavailable = (code: string, message: string, status = 502): Issue => ({
  code,
  message,
  status,
});

/** Public observations only. No account, import, Prisma, or equipment repository dependency. */
export class ShowcaseService {
  private readonly cache = new Map<string, Entry>();
  private readonly pending = new Map<string, Promise<ShowcaseResult>>();
  private blockedUntil = 0;
  private blockedIssue: Issue | null = null;
  private lastStarted = -Infinity;
  constructor(
    private readonly transport: typeof fetch = fetch,
    private readonly clock: () => number = Date.now,
    private readonly capacity = 64,
  ) {}

  private result(
    entry: Entry | undefined,
    delivery: ShowcaseResult['delivery'],
    nextFetch: number,
    issue: Issue | null,
  ): ShowcaseResult {
    return {
      source: 'enka.network',
      delivery,
      snapshot: entry?.snapshot ?? null,
      fetchedAt: entry?.fetchedAt ?? null,
      nextRefreshAt: new Date(nextFetch).toISOString(),
      issue,
    };
  }
  async lookup(input: string): Promise<ShowcaseResult> {
    const uid = showcaseUidSchema.parse(input);
    const now = this.clock();
    const prior = this.cache.get(uid);
    if (prior && prior.nextFetch > now) {
      return this.result(
        prior,
        prior.issue ? (prior.snapshot ? 'stale' : 'unavailable') : 'cached',
        prior.nextFetch,
        prior.issue,
      );
    }
    const pending = this.pending.get(uid);
    if (pending) {
      const result = await pending;
      return { ...result, delivery: result.delivery === 'fetched' ? 'cached' : result.delivery };
    }
    if (this.blockedUntil > now)
      return this.result(
        prior,
        prior?.snapshot ? 'stale' : 'unavailable',
        this.blockedUntil,
        this.blockedIssue,
      );
    if (this.pending.size > 0 || now - this.lastStarted < 1000) {
      const issue = unavailable(
        'SHOWCASE_BUSY',
        'Another public lookup just started. Wait a moment, then refresh.',
        429,
      );
      return this.result(prior, prior?.snapshot ? 'stale' : 'unavailable', now + 2000, issue);
    }
    if (!prior && this.cache.size >= this.capacity) {
      const expired = [...this.cache].find(([, entry]) => entry.nextFetch <= now);
      if (expired) this.cache.delete(expired[0]);
      else
        return this.result(
          undefined,
          'unavailable',
          now + 10000,
          unavailable('SHOWCASE_BUSY', 'The local showcase cache is busy. Try again shortly.', 503),
        );
    }
    this.lastStarted = now;
    const operation = this.read(uid, prior);
    this.pending.set(uid, operation);
    try {
      return await operation;
    } finally {
      this.pending.delete(uid);
    }
  }
  private async read(uid: string, prior: Entry | undefined): Promise<ShowcaseResult> {
    let issue: Issue;
    let delay = 30000;
    const signal = AbortSignal.timeout(10000);
    try {
      const response = await this.transport(`https://enka.network/api/uid/${uid}/`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ProjectCelestia-P1/1.0 (+https://github.com/Rizztaka/project_celestia)',
        },
        redirect: 'error',
        signal,
      });
      if (!response.ok) {
        const status = response.status;
        delay =
          status === 429 || response.headers.has('Retry-After')
            ? retryDelay(response.headers.get('Retry-After'), this.clock())
            : 30000;
        issue = unavailable(
          `ENKA_${status}`,
          messages[status] ?? 'Enka could not complete the lookup.',
          [400, 404, 429, 500, 503].includes(status) ? status : status === 424 ? 503 : 502,
        );
        if (status === 429 || response.headers.has('Retry-After')) {
          this.blockedUntil = this.clock() + delay;
          this.blockedIssue = issue;
        }
        await response.body?.cancel();
      } else {
        if (!response.body) throw new Error('Empty response.');
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let length = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > 2_000_000) throw new Error('Oversized response.');
            chunks.push(value);
          }
        } finally {
          await reader.cancel().catch(() => undefined);
        }
        const parsed = parseShowcase(uid, JSON.parse(Buffer.concat(chunks).toString('utf8')));
        const completed = this.clock();
        const entry: Entry = {
          snapshot: parsed.snapshot,
          fetchedAt: new Date(completed).toISOString(),
          nextFetch: completed + Math.max(parsed.ttl * 1000, 1000),
          issue: null,
        };
        this.cache.set(uid, entry);
        return this.result(entry, 'fetched', entry.nextFetch, null);
      }
    } catch {
      issue = unavailable(
        signal.aborted ? 'ENKA_TIMEOUT' : 'ENKA_INVALID_OR_NETWORK',
        signal.aborted
          ? 'Enka took too long to respond. Try again later.'
          : 'Enka could not return valid showcase data. Check your connection and try again later.',
      );
    }
    const entry: Entry = {
      snapshot: prior?.snapshot ?? null,
      fetchedAt: prior?.fetchedAt ?? null,
      nextFetch: this.clock() + delay,
      issue,
    };
    this.cache.set(uid, entry);
    return this.result(entry, entry.snapshot ? 'stale' : 'unavailable', entry.nextFetch, issue);
  }
}
