import {
  artifactProfileReferenceSchema,
  characterProfileReferenceSchema,
  weaponProfileReferenceSchema,
} from '@celestia/api-contracts';

import { type AccountSession } from './account-session';
import { fetchApi } from './api';

export async function fetchProfileReference(
  key: string,
  signal?: AbortSignal,
  session?: AccountSession,
) {
  return characterProfileReferenceSchema.parse(
    await fetchApi(
      `/games/genshin/characters/${encodeURIComponent(key)}/reference`,
      { signal },
      session,
    ),
  );
}
export async function fetchWeaponReference(
  key: string,
  signal?: AbortSignal,
  session?: AccountSession,
) {
  return weaponProfileReferenceSchema.parse(
    await fetchApi(
      `/games/genshin/references/weapons/${encodeURIComponent(key)}`,
      { signal },
      session,
    ),
  );
}
export async function fetchArtifactReference(
  key: string,
  signal?: AbortSignal,
  session?: AccountSession,
) {
  return artifactProfileReferenceSchema.parse(
    await fetchApi(
      `/games/genshin/references/artifacts/${encodeURIComponent(key)}`,
      { signal },
      session,
    ),
  );
}
