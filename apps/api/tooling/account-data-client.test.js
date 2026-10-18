import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let data, session, auth, fetcher, clicked, created, revoked;
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
  data = await import('../../web/src/lib/account-data.ts');
  session = await import('../../web/src/lib/account-session.ts');
  ({ useAuthStore: auth } = await import('../../web/src/stores/auth.store.ts'));
});
beforeEach(() => {
  auth.setState({ token: 'synthetic-a' });
  clicked = vi.fn();
  created = vi.fn().mockReturnValue('blob:synthetic');
  revoked = vi.fn();
  vi.spyOn(URL, 'createObjectURL').mockImplementation(created);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoked);
  vi.stubGlobal('document', {
    body: { append() {} },
    createElement: () => ({ click: clicked, remove() {} }),
  });
  fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: { exportVersion: 1, encoding: 'postgresql-text-v1', tables: {} },
    }),
  });
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const request = { requestVersion: 1, password: 'synthetic-only' };
describe('C5d current-session download and deletion client', () => {
  it('downloads once, uses POST/no-store and revokes its object URL', async () => {
    await data.downloadAccount(request, session.captureSession(), new AbortController().signal);
    expect(clicked).toHaveBeenCalledOnce();
    expect(revoked).toHaveBeenCalledWith('blob:synthetic');
    expect(fetcher.mock.calls[0][1].method).toBe('POST');
    expect(fetcher.mock.calls[0][1].cache).toBe('no-store');
    expect(fetcher.mock.calls[0][0].includes('synthetic-only')).toBe(false);
  });
  it.each(['export', 'delete'])(
    'denies a delayed old-owner %s result before any side effect',
    async (kind) => {
      const origin = session.captureSession();
      let resolve;
      fetcher.mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
      const pending =
        kind === 'export'
          ? data.downloadAccount(request, origin, new AbortController().signal)
          : data.deleteAccount(
              { ...request, confirmation: 'DELETE MY CELESTIA ACCOUNT' },
              origin,
              new AbortController().signal,
            );
      auth.setState({ token: 'synthetic-b' });
      resolve({
        ok: true,
        json: async () => ({
          success: true,
          data:
            kind === 'export'
              ? { exportVersion: 1, encoding: 'postgresql-text-v1', tables: {} }
              : { responseVersion: 1, deleted: true },
        }),
      });
      await expect(pending).rejects.toThrow('Session changed');
      expect(created).not.toHaveBeenCalled();
      expect(clicked).not.toHaveBeenCalled();
      expect(auth.getState().token).toBe('synthetic-b');
    },
  );
  it('does not download after unmount abort or an unrecognized export', async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(
      data.downloadAccount(request, session.captureSession(), abort.signal),
    ).rejects.toThrow();
    expect(created).not.toHaveBeenCalled();
    fetcher.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
    await expect(
      data.downloadAccount(request, session.captureSession(), new AbortController().signal),
    ).rejects.toThrow();
    expect(created).not.toHaveBeenCalled();
  });
  it('reports ambiguous deletion without retrying or claiming account existence', async () => {
    fetcher.mockRejectedValue(new Error('disconnected'));
    await expect(
      data.deleteAccount(request, session.captureSession(), new AbortController().signal),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledOnce();
    expect(data.accountDataError(new Error(), true)).toContain('may have been deleted');
    expect(auth.getState().token).toBe('synthetic-a');
  });
});
