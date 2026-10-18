import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

let bindAccountCache;
let createAccountQueryClient;
let useAuthStore;
const cleanups = [];
beforeAll(async () => {
  const storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
  ({ bindAccountCache, createAccountQueryClient } =
    await import('../../web/src/lib/account-cache.ts'));
  ({ useAuthStore } = await import('../../web/src/stores/auth.store.ts'));
});
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
});

function setup() {
  useAuthStore.setState({ token: 'account-a' });
  const client = createAccountQueryClient();
  const unsubscribe = bindAccountCache(client);
  cleanups.push(() => {
    unsubscribe();
    client.clear();
  });
  return client;
}

describe('Account cache isolation', () => {
  it('isolates late mutation callbacks from a subsequent session', async () => {
    const oldClient = setup();
    let rejectSave;
    const save = new Promise((_resolve, reject) => {
      rejectSave = reject;
    });
    const mutation = oldClient.getMutationCache().build(oldClient, {
      mutationFn: () => save,
      onError: () => oldClient.setQueryData(['genshin'], ['old-account-rollback']),
    });
    const pending = mutation.execute().catch(() => undefined);
    useAuthStore.setState({ token: 'account-b' });
    // App remounts AccountQueryProvider on token changes, creating a separate client.
    const nextClient = createAccountQueryClient();
    cleanups.push(() => nextClient.clear());
    nextClient.setQueryData(['genshin'], ['account-b']);
    rejectSave(new Error('Late network failure'));
    await pending;
    expect(nextClient.getQueryData(['genshin'])).toEqual(['account-b']);
  });
  it.each([null, 'account-b'])(
    'clears roster and mutation state on token change to %s',
    (token) => {
      const client = setup();
      client.setQueryData(['genshin', 'characters'], ['account-a-private-roster']);
      client.getMutationCache().build(client, { mutationKey: ['import'] });
      useAuthStore.setState({ token });
      expect(client.getQueryCache().getAll()).toHaveLength(0);
      expect(client.getMutationCache().getAll()).toHaveLength(0);
    },
  );
  it('preserves cache when unrelated auth state changes', () => {
    const client = setup();
    client.setQueryData(['genshin'], ['account-a']);
    useAuthStore.setState({ isAuthenticated: true });
    expect(client.getQueryData(['genshin'])).toEqual(['account-a']);
  });
  it('cannot repopulate the new account cache from a late old-account response', async () => {
    const client = setup();
    let finishOldRequest;
    const late = new Promise((resolve) => {
      finishOldRequest = resolve;
    });
    const oldRequest = client
      .fetchQuery({ queryKey: ['genshin'], queryFn: () => late })
      .catch(() => undefined);
    useAuthStore.setState({ token: 'account-b' });
    client.setQueryData(['genshin'], ['account-b']);
    finishOldRequest(['account-a']);
    await oldRequest;
    expect(client.getQueryData(['genshin'])).toEqual(['account-b']);
  });
});
