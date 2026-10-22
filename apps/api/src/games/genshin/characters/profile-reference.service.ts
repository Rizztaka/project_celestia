import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  artifactProfileReferenceSchema,
  characterKeySchema,
  characterProfileReferenceSchema,
  weaponProfileReferenceSchema,
} from '@celestia/api-contracts';
import { z } from 'zod';

import { AppError, BadRequestError, NotFoundError } from '@/core/errors/app-error.js';

const fileSchema = z
  .object({
    file: z.string().regex(/^(characters|weapons|artifacts)-[A-Za-z0-9]+\.json$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
const indexSchema = z
  .object({
    contractVersion: z.literal(1),
    characters: z.record(fileSchema),
    weapons: z.record(fileSchema),
    artifacts: z.record(fileSchema),
  })
  .strict();
const runtimeRoot = fileURLToPath(new URL('../static/profile-reference/', import.meta.url));
export class ProfileReferenceService {
  constructor(private readonly root = runtimeRoot) {}

  private read<T>(
    kind: 'characters' | 'weapons' | 'artifacts',
    rawKey: unknown,
    schema: z.ZodType<T>,
  ): T {
    const parsed = characterKeySchema.safeParse(rawKey);
    if (!parsed.success) throw new BadRequestError('Invalid reference key.');
    try {
      const index = indexSchema.parse(
        JSON.parse(readFileSync(join(this.root, 'index.json'), 'utf8')),
      );
      const entry = Object.hasOwn(index[kind], parsed.data) ? index[kind][parsed.data] : undefined;
      if (!entry) throw new NotFoundError('Reference not available for this key.');
      const bytes = readFileSync(join(this.root, entry.file));
      if (
        bytes.length > 150000 ||
        createHash('sha256').update(bytes).digest('hex') !== entry.sha256
      )
        throw Error('Reference integrity mismatch');
      const result = schema.parse(JSON.parse(bytes.toString('utf8')));
      if ((result as { key: string }).key !== parsed.data)
        throw Error('Reference identity mismatch');
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError(
        'Reference descriptions are temporarily unavailable.',
        503,
        'REFERENCE_UNAVAILABLE',
      );
    }
  }
  character(key: unknown) {
    return this.read('characters', key, characterProfileReferenceSchema);
  }
  weapon(key: unknown) {
    return this.read('weapons', key, weaponProfileReferenceSchema);
  }
  artifact(key: unknown) {
    return this.read('artifacts', key, artifactProfileReferenceSchema);
  }
}
