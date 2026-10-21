import { fileURLToPath } from 'node:url';

import { loadSelectedRelease, releaseMetadata } from './contextual.release.js';

// One complete, validated snapshot per process. Invalid selection aborts module/startup.
// This path is copied with the rest of static data in both documented build paths.
export const contextualReleaseSnapshot = loadSelectedRelease(
  process.env.CELESTIA_CONTEXTUAL_RELEASE_ROOT ??
    fileURLToPath(new URL('../../static/knowledge-releases/', import.meta.url)),
);
export const contextualKnowledgePack = contextualReleaseSnapshot.pack;
export const contextualLoadedMetadata = releaseMetadata(contextualReleaseSnapshot);
