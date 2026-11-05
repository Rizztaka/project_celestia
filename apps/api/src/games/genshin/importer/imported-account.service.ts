import { z } from 'zod';

import { NotFoundError } from '@/core/errors/app-error.js';

import { importedAccountContext } from './imported-account.calculator.js';
import { GenshinImportRepository } from './importer.repository.js';

const selectionSchema = z.object({ accountId: z.string().min(1).max(200).optional() }).strict();

export class ImportedAccountService {
  constructor(
    private readonly repository: Pick<
      GenshinImportRepository,
      'readSnapshot'
    > = new GenshinImportRepository(),
  ) {}

  async read(owner: string, query: unknown) {
    const selection = selectionSchema.parse(query);
    // There is at most one Genshin account per owner. Resolve it through the existing
    // owner-scoped, bounded repeatable-read repository, never through a public UID.
    const state = await this.repository.readSnapshot(owner);
    if (
      (state && state.userId !== owner) ||
      (selection.accountId && selection.accountId !== state?.id)
    )
      throw new NotFoundError('Account not found.');
    return importedAccountContext(state);
  }
}
