import {
  defaultTeamSearchPreferences,
  type TeamPreferencesResponse,
  teamPreferencesResponseSchema,
  teamPreferencesScopeSchema,
  teamPreferencesWriteSchema,
  teamSearchPreferencesSchema,
} from '@celestia/api-contracts';
import { z } from 'zod';

import { BadRequestError, ConflictError, NotFoundError } from '@/core/errors/app-error.js';

import {
  GenshinTeamPreferencesRepository,
  type TeamPreferenceRow,
  TeamPreferencesRevisionConflictError,
} from './team-preferences.repository.js';

const querySchema = teamPreferencesScopeSchema;
type Scope = z.infer<typeof teamPreferencesScopeSchema>;

export class GenshinTeamPreferencesService {
  constructor(
    private readonly repository: Pick<
      GenshinTeamPreferencesRepository,
      'find' | 'findAccount' | 'create' | 'update' | 'findOrThrow'
    > = new GenshinTeamPreferencesRepository(),
  ) {}

  async read(userId: string, input: unknown): Promise<TeamPreferencesResponse> {
    const parsed = querySchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestError('A valid UID or authenticated account scope is required.');
    const scope = await this.resolveAccountScope(userId, parsed.data);
    const row = await this.repository.find(userId, this.scopeKey(scope));
    if (!row)
      return teamPreferencesResponseSchema.parse({
        revision: 0,
        preferences: defaultTeamSearchPreferences(scope.uid, {
          ownerId: userId,
          accountId: scope.accountId,
        }),
      });
    return this.project(userId, scope, row);
  }

  async write(userId: string, input: unknown): Promise<TeamPreferencesResponse> {
    const command = teamPreferencesWriteSchema.safeParse(input);
    if (!command.success) throw new BadRequestError('Invalid team preference contract.');
    const scope = await this.resolveAccountScope(userId, command.data.scope);
    const preferences = teamSearchPreferencesSchema.parse({
      ...command.data.preferences,
      ownerId: userId,
      accountId: scope.accountId,
      uid: scope.uid,
    });
    const key = this.scopeKey(scope);
    const existing = await this.repository.find(userId, key);
    try {
      if (!existing) {
        if (command.data.expectedRevision !== 0) throw new TeamPreferencesRevisionConflictError();
        await this.repository.create(userId, scope, preferences);
      } else {
        if (existing.revision !== command.data.expectedRevision)
          throw new TeamPreferencesRevisionConflictError();
        await this.repository.update(userId, scope, command.data.expectedRevision, preferences);
      }
    } catch (error) {
      if (error instanceof TeamPreferencesRevisionConflictError)
        throw new ConflictError(error.message);
      throw error;
    }
    return this.project(userId, scope, await this.repository.findOrThrow(userId, key));
  }

  /**
   * The account scope is authoritative when an account ID is supplied. A missing
   * UID is filled from the account; only an explicit mismatch is rejected.
   */
  private async resolveAccountScope(userId: string, scope: Scope): Promise<Scope> {
    if (!scope.accountId) return scope;
    const account = await this.repository.findAccount(scope.accountId, userId);
    if (!account || (scope.uid !== null && account.uid !== null && account.uid !== scope.uid))
      throw new NotFoundError('Genshin account not found.');
    return { ...scope, uid: scope.uid ?? account.uid };
  }

  private scopeKey(scope: Scope) {
    return scope.accountId ? `account:${scope.accountId}` : `uid:${scope.uid}`;
  }

  private project(userId: string, scope: Scope, row: TeamPreferenceRow) {
    const preferences = teamSearchPreferencesSchema.parse({
      ...(row.payload as object),
      ownerId: userId,
      accountId: scope.accountId,
      uid: scope.uid,
    });
    return teamPreferencesResponseSchema.parse({ preferences, revision: row.revision });
  }
}
