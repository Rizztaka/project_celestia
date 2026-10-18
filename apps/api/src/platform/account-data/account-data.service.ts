import type { AccountDeleteResponse } from '@celestia/api-contracts';
import bcrypt from 'bcryptjs';

import { AppError, UnauthorizedError } from '@/core/errors/app-error.js';

import { AccountDataRepository } from './account-data.repository.js';

export class AccountDataService {
  constructor(private readonly repository: AccountDataRepository) {}
  private async reauthenticate(owner: string, password: string) {
    const credential = await this.repository.credential(owner);
    // Existing registration uses cost 12. Malformed/expensive legacy credentials
    // must not turn this bounded route into unbounded password work.
    if (
      !credential ||
      !/^\$2[aby]\$(0[4-9]|1[0-2])\$[./A-Za-z0-9]{53}$/.test(credential) ||
      !(await bcrypt.compare(password, credential))
    )
      throw new UnauthorizedError('Current password could not be verified.');
    return credential;
  }
  private async safe<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppError) throw error;
      // DB diagnostics can contain stored values. Never log them via global error handling.
      throw new AppError(
        'Account operation could not be completed. No success was confirmed. Review your account before explicitly trying again.',
        503,
        'ACCOUNT_DATA_UNAVAILABLE',
      );
    }
  }
  export(owner: string, password: string) {
    return this.safe(async () =>
      this.repository.export(owner, await this.reauthenticate(owner, password)),
    );
  }
  delete(owner: string, password: string): Promise<AccountDeleteResponse> {
    return this.safe(async () => {
      await this.repository.delete(owner, await this.reauthenticate(owner, password));
      return { responseVersion: 1, deleted: true };
    });
  }
}
