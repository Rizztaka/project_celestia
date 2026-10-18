import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PlanPreferencesForm } from '../../web/src/components/PlanPreferencesForm.tsx';
import {
  adviceMatches,
  newestPlan,
  PLAN_KEY,
  planExpired,
  planMutationOptions,
} from '../../web/src/lib/plan-state.ts';

const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement } = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
let api, session, cache, useAuthStore;
const cleanups = [];
beforeAll(async () => {
  const storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
  api = await import('../../web/src/lib/api.ts');
  session = await import('../../web/src/lib/account-session.ts');
  cache = await import('../../web/src/lib/account-cache.ts');
  ({ useAuthStore } = await import('../../web/src/stores/auth.store.ts'));
});
afterEach(() => {
  cleanups.splice(0).forEach((f) => f());
  vi.unstubAllGlobals();
});
function setup() {
  useAuthStore.setState({ token: 'synthetic-c4-a' });
  const client = cache.createAccountQueryClient();
  const unbind = cache.bindAccountCache(client);
  cleanups.push(() => {
    unbind();
    client.clear();
  });
  return client;
}
const plan = (extra = {}) => ({
  contractVersion: 1,
  revision: 0,
  routineRevision: 0,
  serverNow: '2026-10-05T00:00:00Z',
  serverId: null,
  period: null,
  preferences: { dailyResinBudget: null, enabledRoutineKinds: [] },
  goals: [],
  goalRevisions: [],
  routines: [],
  weekly: { available: false, rewardClaims: null },
  ...extra,
});
const command = {
  contractVersion: 1,
  expectedRevision: 0,
  action: 'preferences',
  preferences: { dailyResinBudget: 0, enabledRoutineKinds: ['teapot'] },
};
const response = (data) => ({ ok: true, json: async () => ({ success: true, data }) });
describe('C4 actual client and cache path', () => {
  it('pins the originating token and strict command; GET carries AbortSignal', async () => {
    setup();
    const fetcher = vi.fn().mockResolvedValue(response(plan()));
    vi.stubGlobal('fetch', fetcher);
    const origin = session.captureSession();
    await api.patchPlan(command, origin);
    expect(fetcher.mock.calls[0][0]).toContain('/companion/plan');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(command);
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer synthetic-c4-a');
    const controller = new AbortController();
    await api.fetchPlan(controller.signal, origin);
    expect(fetcher.mock.calls[1][1].signal).toBe(controller.signal);
  });
  it('does not dispatch a queued mutation after the original session generation changed', async () => {
    setup();
    const origin = session.captureSession();
    useAuthStore.setState({ token: null });
    useAuthStore.setState({ token: 'synthetic-c4-a' });
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await expect(api.patchPlan(command, origin)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects delayed old-owner query data after logout/login', async () => {
    setup();
    let resolve;
    vi.stubGlobal(
      'fetch',
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const request = api.fetchPlan(undefined, session.captureSession());
    useAuthStore.setState({ token: 'synthetic-c4-b' });
    resolve(response(plan({ revision: 50 })));
    await expect(request).rejects.toThrow();
  });
  it('guards real mutation callbacks after token reuse and leaves the new owner cache intact', async () => {
    const client = setup();
    const options = planMutationOptions(client, session.captureSession());
    useAuthStore.setState({ token: null });
    useAuthStore.setState({ token: 'synthetic-c4-a' });
    const confirmed = { snapshot: plan({ revision: 2 }), receivedAt: 20 };
    client.setQueryData(PLAN_KEY, confirmed);
    await options.onSuccess(plan({ revision: 99 }));
    expect(client.getQueryData(PLAN_KEY)).toEqual(confirmed);
  });
  it('keeps last confirmed choices after failed save, uses no retry and no offline queue', async () => {
    const client = setup();
    const confirmed = { snapshot: plan({ revision: 2 }), receivedAt: 20 };
    client.setQueryData(PLAN_KEY, confirmed);
    const options = planMutationOptions(client, session.captureSession());
    const fetcher = vi.fn().mockRejectedValue(new Error('Synthetic save failure'));
    vi.stubGlobal('fetch', fetcher);
    const mutation = client.getMutationCache().build(client, options);
    await expect(mutation.execute(command)).rejects.toThrow('Synthetic save failure');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(PLAN_KEY)).toEqual(confirmed);
    expect(options).toMatchObject({ retry: false, networkMode: 'always' });
  });
  it('cancels an outstanding plan read before save', async () => {
    const client = setup();
    let aborted = false;
    const pending = client
      .fetchQuery({
        queryKey: PLAN_KEY,
        queryFn: ({ signal }) =>
          new Promise((_resolve, reject) =>
            signal.addEventListener('abort', () => {
              aborted = true;
              reject(new Error('canceled'));
            }),
          ),
      })
      .catch(() => null);
    await planMutationOptions(client, session.captureSession()).onMutate();
    await pending;
    expect(aborted).toBe(true);
    expect(client.getQueryData(PLAN_KEY)).toBeUndefined();
  });
  it('blocks dispatch when the cached server period expired after the last render', async () => {
    const client = setup();
    client.setQueryData(PLAN_KEY, {
      snapshot: plan({ period: { dailyEnd: '2026-10-05T00:00:00Z' } }),
      receivedAt: performance.now(),
    });
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const mutation = client
      .getMutationCache()
      .build(client, planMutationOptions(client, session.captureSession()));
    await expect(mutation.execute(command)).rejects.toThrow('server period ended');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('confirms once and invalidates actual home/routine/material/goal/import/legacy namespaces', async () => {
    const client = setup();
    const keys = [
      ['companion', 'routine', 2],
      ['companion', 'goals'],
      ['companion', 'materials'],
      ['companion', 'plan', 'advice'],
      ['genshin', 'import-status'],
      ['intelligence', 'planner'],
    ];
    keys.forEach((key) => client.setQueryData(key, {}));
    await planMutationOptions(client, session.captureSession()).onSuccess(plan({ revision: 1 }));
    expect(client.getQueryData(PLAN_KEY).snapshot.revision).toBe(1);
    keys.forEach((key) => expect(client.getQueryState(key).isInvalidated).toBe(true));
  });
  it('refuses out-of-order plan, routine and goal revisions including a reintroduced closed goal', () => {
    const old = {
      snapshot: plan({
        revision: 3,
        routineRevision: 4,
        goalRevisions: [{ id: 'closed', revision: 5 }],
      }),
      receivedAt: 10,
    };
    for (const extra of [
      { revision: 2 },
      { routineRevision: 3 },
      { goalRevisions: [{ id: 'closed', revision: 4 }] },
      { goalRevisions: [] },
      { serverNow: '2026-10-04T00:00:00Z' },
    ])
      expect(newestPlan(old, { snapshot: { ...old.snapshot, ...extra }, receivedAt: 20 })).toBe(
        old,
      );
    const fresh = { snapshot: { ...old.snapshot, revision: 4 }, receivedAt: 20 };
    expect(newestPlan(old, fresh)).toBe(fresh);
  });
  it('refuses to combine advice with mismatched goal/resin/preferences/period snapshots', () => {
    const snapshot = plan({
      revision: 3,
      routineRevision: 4,
      goalRevisions: [{ id: 'a', revision: 2 }],
    });
    const advice = {
      revision: 3,
      routineRevision: 4,
      goalRevisions: snapshot.goalRevisions,
      dailyPeriodId: null,
    };
    expect(adviceMatches(snapshot, advice)).toBe(true);
    for (const extra of [
      { revision: 2 },
      { routineRevision: 3 },
      { dailyPeriodId: 'old' },
      { goalRevisions: [{ id: 'a', revision: 1 }] },
    ])
      expect(adviceMatches(snapshot, { ...advice, ...extra })).toBe(false);
  });
  it('expires on exact server boundary using monotonic elapsed time without client wall-clock inference', () => {
    const received = {
      snapshot: plan({ period: { dailyEnd: '2026-10-05T00:00:01Z' } }),
      receivedAt: 10,
    };
    expect(planExpired(received, 1009)).toBe(false);
    expect(planExpired(received, 1010)).toBe(true);
    expect(planExpired(received, -1000)).toBe(false);
  });
  it('renders optional unchecked routines and a blank unset budget with explicit restore/save actions', () => {
    const html = renderToStaticMarkup(
      createElement(PlanPreferencesForm, {
        initial: plan().preferences,
        disabled: false,
        saving: false,
        onSave() {},
        onRestore() {},
      }),
    );
    expect(html).toContain('value=""');
    expect(html).not.toContain('checked=""');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="200"');
    expect(html).toContain('step="1"');
    expect(html).toContain('Restore confirmed choices');
    expect(html).toContain('Save plan choices');
  });
});
