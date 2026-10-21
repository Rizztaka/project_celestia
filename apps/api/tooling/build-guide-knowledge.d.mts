import type { KnowledgePack } from '../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.pack.js';

export function retainedSources(): Record<string, Buffer>;
export function writeValidatedPack(
  candidate: unknown,
  destination: string,
  bytes?: Readonly<Record<string, Uint8Array>>,
): KnowledgePack | void;
