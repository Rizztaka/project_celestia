import { type BuildInsightQuery, buildInsightsResponseSchema } from '@celestia/api-contracts';

import type { AccountSession } from './account-session';
import { fetchApi } from './api';

export async function fetchBuildInsights(
  key: string,
  query: BuildInsightQuery,
  signal?: AbortSignal,
  session?: AccountSession,
) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query))
    if (value !== undefined) params.set(name, String(value));
  return buildInsightsResponseSchema.parse(
    await fetchApi(
      `/games/genshin/characters/${encodeURIComponent(key)}/build-insights?${params}`,
      { signal },
      session,
    ),
  );
}
