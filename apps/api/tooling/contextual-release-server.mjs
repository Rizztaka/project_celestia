// Isolated browser-harness child. No ordinary DB or production launcher imports this.
import { readFileSync } from 'node:fs';

import { requireSafe, validateTarget } from './recovery/policy.mjs';

validateTarget(process.env);
requireSafe(
  process.env.NODE_ENV === 'test' && process.env.DOTENV_CONFIG_PATH === 'NUL',
  'TEST_CHILD_ENVIRONMENT_REQUIRED',
);
requireSafe(
  JSON.parse(
    readFileSync(
      new URL(
        'fixture.json',
        'file:///' + process.env.CELESTIA_CONTEXTUAL_RELEASE_ROOT.replaceAll('\\', '/') + '/',
      ),
      'utf8',
    ),
  ) === 'isolated-synthetic-knowledge',
  'ISOLATED_RELEASE_STORE_REQUIRED',
);
const [{ createApp }, { contextualLoadedMetadata }, { logger }] = await Promise.all([
  import('../dist/app.js'),
  import('../dist/games/genshin/intelligence/guide-knowledge/contextual.data.js'),
  import('../dist/core/logger/logger.js'),
]);
logger.level = 'silent';
const server = createApp().listen(45450, '127.0.0.1', () => {
  console.log(
    JSON.stringify({ ready: true, pid: process.pid, metadata: contextualLoadedMetadata }),
  );
});
process.on('SIGTERM', () => {
  server.closeAllConnections();
  server.close(() => process.exit(0));
});
