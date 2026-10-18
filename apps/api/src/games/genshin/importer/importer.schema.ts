import { z } from 'zod';

import { importLimits } from './importer.limits.js';

const keyString = () =>
  z.string().max(importLimits.key, 'Import text exceeds the supported length.');

// ============================================================
// GOOD Format Sub-schemas
//
// GOOD (Genshin Open Object Description) is the community-standard
// JSON export format produced by tools like Genshin Optimizer and
// Inventory Kamera. This file is the single source of truth for
// what shape the importer accepts.
//
// Reference: https://frzyc.github.io/genshin-optimizer/#/doc
// ============================================================

const SLOT_KEYS = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;

export const GoodSubStatSchema = z.object({
  key: keyString(), // May be "" if the artifact slot is empty
  value: z.number().finite(),
});

export const GoodCharacterSchema = z.object({
  key: keyString().min(1), // e.g. "HuTao", "RaidenShogun"
  level: z.number().int().min(1).max(90),
  constellation: z.number().int().min(0).max(6),
  ascension: z.number().int().min(0).max(6),
  talent: z.object({
    // Accept up to 15: most tools export base levels (1–10), but
    // some export effective levels that include C3/C5 constellation bonuses.
    // Preserve the supplied values; this import does not infer which convention was used.
    auto: z.number().int().min(1).max(15),
    skill: z.number().int().min(1).max(15),
    burst: z.number().int().min(1).max(15),
  }),
});

export const GoodWeaponSchema = z.object({
  key: keyString().min(1), // e.g. "StaffOfHoma"
  level: z.number().int().min(1).max(90),
  ascension: z.number().int().min(0).max(6),
  refinement: z.number().int().min(1).max(5),
  location: keyString().default(''), // character key, or "" if unequipped
  lock: z.boolean().default(false),
});

export const GoodArtifactSchema = z.object({
  setKey: keyString().min(1), // e.g. "ShimenawasReminiscence"
  slotKey: z.enum(SLOT_KEYS),
  level: z.number().int().min(0).max(20),
  rarity: z.number().int().min(1).max(5),
  mainStatKey: keyString().min(1), // e.g. "critRate_", "pyro_dmg_"
  lock: z.boolean().default(false),
  location: keyString().default(''), // character key, or "" if unequipped
  substats: z.array(GoodSubStatSchema).max(4),
});

export const GoodPayloadSchema = z.object({
  format: z.literal('GOOD'),
  version: z.number().int().positive(),
  source: keyString().optional(),
  characters: z.array(GoodCharacterSchema).optional(),
  weapons: z.array(GoodWeaponSchema).optional(),
  artifacts: z.array(GoodArtifactSchema).optional(),
  // materials is a flat map of item key → quantity.
  // GOOD format: { "SilkFlower": 43, "WhopperflowerNectar": 120 }
  // Zero quantities are accepted but not stored. A zero-only selected section clears inventory.
  materials: z.record(keyString().min(1), z.number().int().min(0).max(2147483647)).optional(),
});

// TypeScript type inferred from the schema.
// Used throughout the importer service and the HTTP controller (Milestone 2C).
export type GoodPayload = z.infer<typeof GoodPayloadSchema>;
export type GoodCharacter = z.infer<typeof GoodCharacterSchema>;
export type GoodWeapon = z.infer<typeof GoodWeaponSchema>;
export type GoodArtifact = z.infer<typeof GoodArtifactSchema>;
