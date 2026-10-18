import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let store, sessions, auth, api, cache;
const token = (sid) =>
  `e30.${Buffer.from(JSON.stringify({ sub: 'owner-a', sid })).toString('base64url')}.synthetic`;
const oldToken = token('session-a'),
  newToken = oldToken + 'rotated';
const user = {
  id: 'owner-a',
  email: 'a@test.invalid',
  username: 'a',
  createdAt: '',
  updatedAt: '',
};
const response = (status, data, code) => ({
  status,
  ok: status === 200,
  json: async () =>
    status === 200
      ? { success: true, data }
      : { success: false, error: { code, message: 'Synthetic error' } },
});
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  ({ useAuthStore: store } = await import('../../web/src/stores/auth.store.ts'));
  sessions = await import('../../web/src/lib/account-session.ts');
  auth = await import('../../web/src/lib/auth-client.ts');
  api = await import('../../web/src/lib/api.ts');
  cache = await import('../../web/src/lib/account-cache.ts');
});
beforeEach(() => {
  store.getState().login(oldToken, user);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Section 2 browser token rotation and account boundaries', () => {
  it('retries a pre-handler authentication failure once with cookies and a fresh bearer', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(401, null, 'AUTH_SESSION_INVALID'))
      .mockResolvedValueOnce(response(200, { token: newToken }))
      .mockResolvedValueOnce(response(200, { saved: true }));
    vi.stubGlobal('fetch', fetcher);
    const captured = sessions.captureSession();
    expect(
      await api.fetchApi('/companion/plan', { method: 'PATCH', body: '{}' }, captured),
    ).toEqual({ saved: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[1][0]).toContain('/auth/refresh');
    expect(fetcher.mock.calls[1][1].credentials).toBe('include');
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe(`Bearer ${newToken}`);
    expect(sessions.isCurrentSession(captured)).toBe(true);
  });
  it('uses one in-flight refresh across concurrent failures and a browser lock across tabs', async () => {
    const lock = vi.fn(async (_name, operation) => operation());
    vi.stubGlobal('navigator', { locks: { request: lock } });
    const fetcher = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/refresh')) {
        await Promise.resolve();
        return response(200, { token: newToken });
      }
      return options.headers.Authorization === `Bearer ${oldToken}`
        ? response(401, null, 'AUTH_SESSION_INVALID')
        : response(200, 'confirmed');
    });
    vi.stubGlobal('fetch', fetcher);
    expect(await Promise.all([api.fetchApi('/one'), api.fetchApi('/two')])).toEqual([
      'confirmed',
      'confirmed',
    ]);
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(lock).toHaveBeenCalledOnce();
  });
  it('keeps query data and existing draft sessions across access-token rotation', async () => {
    const client = cache.createAccountQueryClient(),
      unbind = cache.bindAccountCache(client);
    const captured = sessions.captureSession();
    client.setQueryData(['draft'], { text: 'Keep my choices' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { token: newToken })));
    await auth.refreshAccessToken();
    expect(client.getQueryData(['draft'])).toEqual({ text: 'Keep my choices' });
    expect(sessions.isCurrentSession(captured)).toBe(true);
    unbind();
    client.clear();
  });
  it('does not retry password failures or other application-level 401 responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(401, null, 'UNAUTHORIZED'));
    vi.stubGlobal('fetch', fetcher);
    await expect(
      api.fetchApi('/users/me/delete', { method: 'POST', body: '{}' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it('does not replay a streaming or binary request body', async () => {
    const fetcher = vi.fn().mockResolvedValue(response(401, null, 'AUTH_SESSION_INVALID'));
    vi.stubGlobal('fetch', fetcher);
    await expect(
      api.fetchApi('/upload', { method: 'POST', body: new Blob(['synthetic']) }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it('discards a delayed refresh after another owner signs in', async () => {
    let finish;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    );
    const pending = auth.refreshAccessToken();
    store.getState().login(token('session-b'), { ...user, id: 'owner-b' });
    finish(response(200, { token: newToken }));
    await expect(pending).rejects.toThrow('Session changed');
    expect(store.getState().user.id).toBe('owner-b');
  });
  it('rejects a refresh cookie belonging to a different session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response(200, { token: token('different-session') })),
    );
    await expect(auth.refreshAccessToken()).rejects.toThrow('account changed');
    expect(store.getState().token).toBe(oldToken);
  });
  it('clears local authentication when the server rejects refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response(401, null, 'AUTH_SESSION_INVALID'))
        .mockResolvedValueOnce(response(401, null, 'UNAUTHORIZED')),
    );
    await expect(api.fetchApi('/companion/plan')).rejects.toMatchObject({ status: 401 });
    expect(store.getState().isAuthenticated).toBe(false);
  });
});
