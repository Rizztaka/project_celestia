import type {
  AccountDeleteRequest,
  AccountDeleteResponse,
  AccountExportRequest,
  AccountExportV1,
} from '@celestia/api-contracts';

import { type AccountSession, assertCurrentSession } from './account-session';
import { ApiError, fetchApi } from './api';

/** A one-use POST download, deliberately outside the shared query cache. */
export async function downloadAccount(
  request: AccountExportRequest,
  session: AccountSession,
  signal: AbortSignal,
): Promise<void> {
  const data = await fetchApi<AccountExportV1>(
    '/users/me/export',
    {
      method: 'POST',
      body: JSON.stringify(request),
      signal,
      cache: 'no-store',
    },
    session,
  );
  assertCurrentSession(session);
  if (signal.aborted) throw new Error('Download cancelled.');
  if (data.exportVersion !== 1 || data.encoding !== 'postgresql-text-v1' || !data.tables)
    throw new Error('The account export response was not recognized. No download was started.');
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try {
    assertCurrentSession(session);
    if (signal.aborted) throw new Error('Download cancelled.');
    anchor.href = url;
    anchor.download = 'celestia-account-v1.json';
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
export async function deleteAccount(
  request: AccountDeleteRequest,
  session: AccountSession,
  signal: AbortSignal,
): Promise<void> {
  const data = await fetchApi<AccountDeleteResponse>(
    '/users/me/account',
    {
      method: 'DELETE',
      body: JSON.stringify(request),
      signal,
      cache: 'no-store',
    },
    session,
  );
  assertCurrentSession(session);
  if (signal.aborted || data.responseVersion !== 1 || data.deleted !== true)
    throw new Error('Deletion was not confirmed.');
}
export function accountDataError(error: unknown, deleting: boolean): string {
  if (error instanceof ApiError && error.status < 500)
    return `${error.message} Enter your password again when you choose to retry.`;
  return deleting
    ? 'The connection ended without a confirmed result. Your account may have been deleted. Do not repeat deletion automatically. Sign out and try signing in to check; a connection error alone does not establish whether the account exists.'
    : 'The export was not confirmed. Enter your password again and explicitly retry when ready.';
}
