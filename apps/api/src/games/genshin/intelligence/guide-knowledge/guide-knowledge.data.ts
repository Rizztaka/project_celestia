import { createRequire } from 'node:module';

import { validatePack } from './guide-knowledge.pack.js';

const require = createRequire(import.meta.url);
export const guideKnowledgePack = validatePack(require('../../static/guide-knowledge.json'));
