import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import GoalForm from '../../web/src/components/GoalForm.tsx';
import GoalPriorityForm from '../../web/src/components/GoalPriorityForm.tsx';
import { mergeConfirmedGoals } from '../../web/src/lib/goal-state.ts';

const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement } = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
let api;
let session;
let cache;
let useAuthStore;
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
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.unstubAllGlobals();
});
function setup() {
  useAuthStore.setState({ token: 'synthetic-owner-a' });
  const client = cache.createAccountQueryClient();
  const unsubscribe = cache.bindAccountCache(client);
  cleanups.push(() => {
    unsubscribe();
    client.clear();
  });
  return client;
}
const draft = () => ({
  contractVersion: 3,
  requestId: crypto.randomUUID(),
  goalType: 'CHARACTER_TALENT',
  targetKey: 'HuTao',
  talentType: 'normal',
  fromPhase: 1,
  toPhase: 6,
  priority: 3,
});
describe('C3b actual client, mutation cache and originating session', () => {
  it('priority-only client writes omit legacy range/slot and the form requires no intent repair', async () => {
    setup();
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
    vi.stubGlobal('fetch', fetcher);
    await api.updateGoal(
      'legacy-goal',
      { contractVersion: 3, expectedRevision: 7, action: 'priority', priority: 1 },
      session.captureSession(),
    );
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      contractVersion: 3,
      expectedRevision: 7,
      action: 'priority',
      priority: 1,
    });
    const markup = renderToStaticMarkup(
      createElement(GoalPriorityForm, {
        initialPriority: 3,
        isPending: false,
        onSubmit() {},
        onCancel() {},
      }),
    );
    expect(markup).toContain('Save priority');
    expect(markup).toContain('stored target, range and talent slot stay as recorded');
    expect(markup).not.toContain('type="number"');
    expect(markup).not.toContain('Character key');
  });
  it.each(['invalid', null, undefined])(
    'shows fixed legacy talent slot %s without displaying a valid substitute',
    (slot) => {
      const markup = renderToStaticMarkup(
        createElement(GoalForm, {
          initial: {
            goalType: 'CHARACTER_TALENT',
            targetKey: 'Legacy',
            talentType: slot,
            fromPhase: -8,
            toPhase: 99,
          },
          fixedIdentity: true,
          isPending: false,
          onSubmit() {},
          onCancel() {},
        }),
      );
      expect(markup).toContain(
        `value="${slot ?? ''}" selected="">Unsupported stored slot: ${slot ?? '(missing)'}`,
      );
      expect(markup).toContain('value="-8"');
      expect(markup).toContain('value="99"');
    },
  );
  it('accepts authoritative revisions in priority order and never regresses a newer confirmed goal', () => {
    const old = { id: 'a', priority: 3, createdAt: '2026-01-01', revision: 3, status: 'paused' };
    const child = { id: 'b', priority: 1, createdAt: '2026-01-02', revision: 0, status: 'active' };
    expect(mergeConfirmedGoals([old], { ...old, revision: 2, status: 'active' })).toEqual([old]);
    expect(
      mergeConfirmedGoals([old], {
        goal: { ...old, revision: 4, status: 'archived' },
        successor: child,
      }).map((goal) => goal.id),
    ).toEqual(['b', 'a']);
  });
  it('pins goal/focus bodies, revisions and encoded natural keys to the captured owner', async () => {
    setup();
    const origin = session.captureSession();
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
    vi.stubGlobal('fetch', fetcher);
    const input = draft();
    await api.createGoal(input, origin);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(input);
    await api.setFocus(
      'Opaque / 字',
      { contractVersion: 1, expectedRevision: 7, focused: false },
      origin,
    );
    expect(fetcher.mock.calls[1][0]).toContain('/Opaque%20%2F%20%E5%AD%97/focus');
    expect(
      fetcher.mock.calls.every(
        (call) => call[1].headers.Authorization === 'Bearer synthetic-owner-a',
      ),
    ).toBe(true);
  });
  it('rejects dispatch after account change, including a return to the same token', async () => {
    setup();
    const origin = session.captureSession();
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    useAuthStore.setState({ token: null });
    useAuthStore.setState({ token: 'synthetic-owner-a' });
    await expect(api.createGoal(draft(), origin)).rejects.toThrow('Session changed');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not replay a mutation under new credentials after async onMutate yields', async () => {
    const client = setup();
    const origin = session.captureSession();
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    let release;
    let entered;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const reached = new Promise((resolve) => {
      entered = resolve;
    });
    const mutation = client.getMutationCache().build(client, {
      retry: false,
      networkMode: 'always',
      onMutate: async () => {
        entered();
        await gate;
      },
      mutationFn: (body) => api.createGoal(body, origin),
    });
    const saving = mutation.execute(draft()).catch((error) => error);
    await reached;
    useAuthStore.setState({ token: 'synthetic-owner-b' });
    release();
    expect((await saving).message).toContain('Session changed');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([true, false])(
    'suppresses delayed old-session %s callbacks and preserves the new form/cache',
    async (success) => {
      const client = setup();
      const origin = session.captureSession();
      let release;
      const response = new Promise((resolve) => {
        release = resolve;
      });
      const fetcher = vi.fn(() => response);
      vi.stubGlobal('fetch', fetcher);
      let form;
      const mutation = client.getMutationCache().build(client, {
        retry: false,
        networkMode: 'always',
        mutationFn: (body) => api.createGoal(body, origin),
        onSuccess: () => {
          if (session.isCurrentSession(origin)) {
            form = '';
            client.setQueryData(['companion', 'goals'], ['owner-a']);
          }
        },
        onError: () => {
          if (session.isCurrentSession(origin)) form = 'owner-a failure';
        },
      });
      const saving = mutation.execute(draft()).catch(() => undefined);
      await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
      useAuthStore.setState({ token: 'synthetic-owner-b' });
      const next = cache.createAccountQueryClient();
      cleanups.push(() => next.clear());
      next.setQueryData(['companion', 'goals'], ['owner-b']);
      form = 'owner-b draft';
      release({
        ok: success,
        status: success ? 200 : 409,
        json: async () =>
          success
            ? { success: true, data: { id: 'a' } }
            : { success: false, error: { message: 'stale' } },
      });
      await saving;
      expect(form).toBe('owner-b draft');
      expect(next.getQueryData(['companion', 'goals'])).toEqual(['owner-b']);
      expect(client.getQueryData(['companion', 'goals'])).toBeUndefined();
      expect(fetcher).toHaveBeenCalledOnce();
    },
  );
  it('failed save retains a draft and last confirmed state with no retries', async () => {
    const client = setup();
    const origin = session.captureSession();
    const input = draft();
    client.setQueryData(['companion', 'goals'], ['confirmed']);
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: { code: 'CONFLICT', message: 'Goal changed. Refresh and review.' },
      }),
    });
    vi.stubGlobal('fetch', fetcher);
    const mutation = client
      .getMutationCache()
      .build(client, { mutationFn: (body) => api.createGoal(body, origin) });
    await expect(mutation.execute(input)).rejects.toMatchObject({ status: 409 });
    expect(mutation.state.variables).toEqual(input);
    expect(client.getQueryData(['companion', 'goals'])).toEqual(['confirmed']);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it('successful intent/import invalidation reaches both namespaces and legacy planner keys', async () => {
    const client = setup();
    const keys = [
      ['companion', 'goals'],
      ['companion', 'materials'],
      ['companion', 'today'],
      ['genshin', 'focus'],
      ['genshin', 'character-equipment', 'HuTao'],
      ['intelligence', 'planner'],
    ];
    keys.forEach((key) => client.setQueryData(key, ['confirmed']));
    await cache.invalidateIntentQueries(client);
    keys.forEach((key) => expect(client.getQueryState(key).isInvalidated).toBe(true));
  });
  it('delayed goal query cannot enter the next session and carries cancellation', async () => {
    const client = setup();
    let release;
    const response = new Promise((resolve) => {
      release = resolve;
    });
    const fetcher = vi.fn(() => response);
    vi.stubGlobal('fetch', fetcher);
    const reading = client
      .fetchQuery({
        queryKey: ['companion', 'goals'],
        queryFn: ({ signal }) => api.fetchGoals(signal),
      })
      .catch(() => undefined);
    useAuthStore.setState({ token: 'synthetic-owner-b' });
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    release({ ok: true, json: async () => ({ success: true, data: ['private-a'] }) });
    await reading;
    expect(client.getQueryData(['companion', 'goals'])).toBeUndefined();
  });
  it('renders bounded labeled inputs, explicit weapon scope and talent ambiguity', () => {
    const render = (initial) =>
      renderToStaticMarkup(
        createElement(GoalForm, { initial, onSubmit() {}, onCancel() {}, isPending: false }),
      );
    const weapon = render({ goalType: 'WEAPON_ASCENSION', targetKey: 'SelectedWeapon' });
    expect(weapon).toContain('SelectedWeapon');
    expect(weapon).toContain('not one physical copy');
    expect(weapon).toContain('Priority (1 first, 5 last)');
    const talent = render({ goalType: 'CHARACTER_TALENT', fromPhase: 1, toPhase: 6 });
    expect(talent).toContain('min="1"');
    expect(talent).toContain('max="9"');
    expect(talent).toContain('max="10"');
    expect(talent).toContain('excluding constellation bonuses');
    expect(talent).toContain('Sync does not change your chosen starting value');
    expect(talent).toContain('for=');
  });
});
