import {
  type ShowcaseResult,
  showcaseResultSchema,
  showcaseUidSchema,
} from '@celestia/api-contracts';
import { queryOptions } from '@tanstack/react-query';

const storageKey = 'celestia.showcase.uid.v2';
export function readShowcaseUid(): string {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    return saved?.version === 2 ? showcaseUidSchema.parse(saved.uid) : '';
  } catch {
    return '';
  }
}
export function saveShowcaseUid(uid: string): boolean {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ version: 2, uid: showcaseUidSchema.parse(uid) }),
    );
    return true;
  } catch {
    return false;
  }
}
export function readShowcaseInput(): string {
  const successful = readShowcaseUid();
  if (successful) return successful;
  // The previous viewer saved before lookup. Keep that preference as a prefill,
  // but require a successful lookup before enabling automatic resume.
  try {
    const legacy = JSON.parse(localStorage.getItem('celestia.showcase.uid.v1') ?? 'null');
    return legacy?.version === 1 ? showcaseUidSchema.parse(legacy.uid) : '';
  } catch {
    return '';
  }
}
export function rememberSuccessfulShowcase(result: ShowcaseResult): boolean {
  return result.snapshot && !result.issue && result.delivery !== 'stale'
    ? saveShowcaseUid(result.snapshot.uid)
    : false;
}

/** Region inferred from the UID range, not a field reported by Enka.
 * Reference: genshin.py/genshin/utility/uid.py GENSHIN_SERVER_RANGE.
 */
export function showcaseServer(uid: string): string | null {
  if (!showcaseUidSchema.safeParse(uid).success) return null;
  const servers: Record<string, string> = {
    '1': 'China',
    '2': 'China',
    '3': 'China',
    '5': 'China (Bilibili)',
    '6': 'America',
    '7': 'Europe',
    '8': 'Asia',
    '18': 'Asia',
    '9': 'TW / HK / MO',
  };
  return servers[uid.slice(0, -8)] ?? null;
}

export function refreshSeconds(result: ShowcaseResult | undefined, now = Date.now()): number {
  return result ? Math.max(0, Math.ceil((Date.parse(result.nextRefreshAt) - now) / 1000)) : 0;
}

export function retainShowcaseSnapshot(
  previous: ShowcaseResult | undefined,
  next: ShowcaseResult,
): ShowcaseResult {
  // A restarted API may have lost its in-memory cache. Keep this UID's browser observation.
  if (!next.snapshot && next.issue && previous?.snapshot) {
    return {
      ...next,
      snapshot: previous.snapshot,
      fetchedAt: previous.fetchedAt,
      delivery: 'stale',
    };
  }
  return next;
}

export const showcaseQueryKey = (uid: string) => ['enka-showcase', uid] as const;
export const showcaseQueryOptions = (uid: string) =>
  queryOptions({
    queryKey: showcaseQueryKey(uid),
    queryFn: ({ signal }) => fetchShowcase(uid, signal),
    retry: false,
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
export async function fetchShowcase(uid: string, signal?: AbortSignal): Promise<ShowcaseResult> {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const response = await fetch(`${base}/games/genshin/showcase/${showcaseUidSchema.parse(uid)}`, {
    signal,
    credentials: 'omit',
    cache: 'no-store',
  });
  const parsed = showcaseResultSchema.safeParse(await response.json());
  if (!parsed.success || (parsed.data.snapshot && parsed.data.snapshot.uid !== uid)) {
    throw new Error('The showcase service returned an unsupported response. Try again later.');
  }
  return parsed.data;
}
