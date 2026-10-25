import { z } from 'zod';

import { benchmarkSettings } from './benchmark.calculator';
import type { DamageSettings, RotationStep } from './calculator';

const settingsSchema = z
  .object({
    duration: z.number().int().min(10).max(180),
    enemyLevel: z.number().int().min(1).max(200),
    resistance: z.number().min(-100).max(300),
    samples: z.number().int().min(1).max(50),
    steps: z
      .array(
        z
          .object({
            characterKey: z.string().max(30),
            action: z.string().max(30),
            repeat: z.number().int().min(1).max(20),
            params: z.string().max(160),
            waitFrames: z.number().int().min(0).max(1800),
          })
          .strict(),
      )
      .max(64),
  })
  .strict();
const key = (uid: string, id: string) => `celestia.team-rotation.v1:${uid}:${id}`;
export function readDamageSettings(uid: string, id: string): DamageSettings | null {
  try {
    const raw = localStorage.getItem(key(uid, id));
    if (!raw || raw.length > 32000) return null;
    const value = JSON.parse(raw);
    if (value.version !== 1 || value.uid !== uid || value.teamId !== id) return null;
    return settingsSchema.parse(value.settings);
  } catch {
    return null;
  }
}
export function saveDamageSettings(uid: string, id: string, settings: DamageSettings) {
  localStorage.setItem(
    key(uid, id),
    JSON.stringify({ version: 1, uid, teamId: id, settings: settingsSchema.parse(settings) }),
  );
}

const rotationChoiceSchema = z.object({
  mode: z.enum(['default', 'custom']),
  driver: z.string().max(30),
});
export function readRotationChoice(uid: string, id: string) {
  const settings = readDamageSettings(uid, id);
  if (!settings) return null;
  try {
    const value = JSON.parse(localStorage.getItem(key(uid, id))!);
    const choice = rotationChoiceSchema.parse({
      mode: value.rotationMode ?? (settings.steps.length ? 'custom' : 'default'),
      driver: value.defaultDriver ?? '',
    });
    return { ...choice, customSteps: settings.steps };
  } catch {
    return null;
  }
}
export function saveRotationChoice(
  uid: string,
  id: string,
  mode: 'default' | 'custom',
  driver: string,
  customSteps: RotationStep[],
) {
  rotationChoiceSchema.parse({ mode, driver });
  localStorage.setItem(
    key(uid, id),
    JSON.stringify({
      version: 1,
      uid,
      teamId: id,
      rotationMode: mode,
      defaultDriver: driver,
      settings: settingsSchema.parse(benchmarkSettings(customSteps)),
    }),
  );
}
