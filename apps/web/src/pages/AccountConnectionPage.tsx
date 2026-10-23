import type { HoyolabStatus } from '@celestia/api-contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../components/Ui';
import { type AccountSession, captureSession, isCurrentSession } from '../lib/account-session';
import { fetchApi } from '../lib/api';
import { useHoyolabCommand, useHoyolabStatus } from '../lib/hoyolab';

export default function AccountConnectionPage() {
  const status = useHoyolabStatus();
  const command = useHoyolabCommand();
  const client = useQueryClient();
  const [connector, setConnector] = useState(false);
  const [armed, setArmed] = useState(false);
  const intent = useRef<{ nonce: string; expires: number; session: AccountSession } | null>(null);
  // Credentials live only until the authenticated request is constructed. They never
  // become mutation variables, query data, storage, analytics or error messages.
  const payload = useRef<{ cookies: Record<string, string>; session: AccountSession } | null>(null);
  const connect = useMutation({
    gcTime: 0,
    retry: false,
    mutationFn: async () => {
      const p = payload.current;
      payload.current = null;
      if (!p || !isCurrentSession(p.session)) throw Error('Connection request expired. Try again.');
      return fetchApi<HoyolabStatus>(
        '/games/genshin/hoyolab/connect',
        { method: 'POST', body: JSON.stringify({ cookies: p.cookies, consent: true }) },
        p.session,
      );
    },
    onSuccess: async (data) => {
      client.setQueryData(['genshin', 'hoyolab'], data);
      await client.invalidateQueries({ queryKey: ['genshin'] });
    },
  });
  const receive = useRef(connect.mutate);
  useEffect(() => {
    receive.current = connect.mutate;
  }, [connect.mutate]);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const m = event.data;
      if (m?.type === 'CELESTIA_HOYOLAB_READY' && m.version === 1) setConnector(true);
      const pending = intent.current;
      if (
        m?.type !== 'CELESTIA_HOYOLAB_CREDENTIALS' ||
        !pending ||
        m.nonce !== pending.nonce ||
        pending.expires <= Date.now() ||
        !isCurrentSession(pending.session)
      )
        return;
      intent.current = null;
      setArmed(false);
      window.postMessage({ type: 'CELESTIA_HOYOLAB_DISARM' }, location.origin);
      if (!m.cookies || typeof m.cookies !== 'object' || Array.isArray(m.cookies)) return;
      payload.current = { cookies: m.cookies, session: pending.session };
      receive.current();
    };
    window.addEventListener('message', listener);
    window.postMessage({ type: 'CELESTIA_HOYOLAB_PING' }, location.origin);
    const timer = window.setInterval(() => {
      if (
        intent.current &&
        (intent.current.expires <= Date.now() || !isCurrentSession(intent.current.session))
      ) {
        intent.current = null;
        setArmed(false);
        window.postMessage({ type: 'CELESTIA_HOYOLAB_DISARM' }, location.origin);
      }
    }, 1000);
    return () => {
      intent.current = null;
      payload.current = null;
      clearInterval(timer);
      window.removeEventListener('message', listener);
      window.postMessage({ type: 'CELESTIA_HOYOLAB_DISARM' }, location.origin);
    };
  }, []);
  const s = status.data;
  const busy = command.isPending || connect.isPending;
  const needsConnection = !s?.connected || s.state === 'reconnect';
  return (
    <main id="companion-content" tabIndex={-1} className="today-page">
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Your builds, connected."
        description="Sign in with HoYoLAB. Keep your roster and equipped gear together."
      />
      <section className="glass-panel space-y-5 rounded-2xl p-6" aria-label="HoYoLAB connection">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">HOYOLAB</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {s?.connected
                ? s.role
                  ? `${s.role.nickname} · ${s.role.uid}`
                  : 'Choose your Genshin account'
                : 'Connect once. Refresh automatically.'}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {s?.syncedAt
                ? `Last successful refresh: ${new Date(s.syncedAt).toLocaleString()}`
                : 'No HoYoLAB snapshot yet.'}
            </p>
          </div>
          {s?.connected && (
            <div className="flex flex-wrap gap-3">
              <button
                className="button-primary"
                disabled={busy || !s.role || !s.available}
                onClick={() => command.mutate({ kind: 'sync' })}
              >
                {command.isPending ? 'Working…' : 'Refresh now'}
              </button>
              <button
                className="button-secondary"
                disabled={busy}
                onClick={() => {
                  intent.current = null;
                  setArmed(false);
                  command.mutate({ kind: 'disconnect' });
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
        {status.isPending && <p role="status">Checking connection…</p>}
        {status.isError && (
          <p role="alert">
            Connection status could not load.{' '}
            <button className="underline" onClick={() => void status.refetch()}>
              Retry
            </button>
          </p>
        )}
        {s && !s.available && (
          <p className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-200">
            HoYoLAB connection is being prepared on the server. Your saved builds are still
            available.
          </p>
        )}
        {s?.state === 'verification' && (
          <p role="status">
            Complete verification in{' '}
            <a
              href="https://act.hoyolab.com/app/community-game-records-sea/index.html"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              HoYoLAB Battle Chronicle
            </a>
            , then refresh here.
          </p>
        )}
        {s?.state === 'reconnect' && (
          <p role="status">Your HoYoLAB session expired. Connect again below.</p>
        )}
        {s?.state === 'unavailable' && (
          <p role="status">
            HoYoLAB could not refresh. Your last successful builds were kept; Celestia will retry.
          </p>
        )}
        {s?.state === 'syncing' && <p role="status">Refreshing from HoYoLAB…</p>}
        {s?.state === 'choose_account' && (
          <div className="flex flex-wrap gap-3">
            {s.roles.map((role) => (
              <button
                className="button-secondary"
                key={`${role.server}:${role.uid}`}
                disabled={busy}
                onClick={() =>
                  command.mutate({ kind: 'select', uid: role.uid, server: role.server })
                }
              >
                {role.nickname} · {role.uid} · {role.server.replace('os_', '')}
              </button>
            ))}
          </div>
        )}
        {(connect.error || command.error) && (
          <p role="alert" className="text-amber-200">
            {(connect.error ?? command.error)?.message}
          </p>
        )}
        {(needsConnection || s?.connected) && (
          <details open={needsConnection} className="border-t border-white/10 pt-4">
            <summary className="cursor-pointer font-medium text-white">
              {s?.connected ? 'Reconnect HoYoLAB' : 'Set up the browser connector'}
            </summary>
            <ol className="my-5 list-decimal space-y-4 pl-5 text-sm text-zinc-300">
              <li>
                <a
                  className="text-indigo-200 underline"
                  href="/downloads/celestia-hoyolab-connector.zip"
                  download
                >
                  Download the connector
                </a>
                , unzip it, then open Chrome or Edge Extensions. Enable Developer mode, choose Load
                unpacked and select the folder. Reload this page.
              </li>
              <li>
                <a
                  className="text-indigo-200 underline"
                  href="https://www.hoyolab.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Sign in on HoYoLAB ↗
                </a>
                . Return to this tab afterwards.
              </li>
              <li>
                Choose Ready to connect below, then open the extension and click Connect HoYoLAB.
              </li>
            </ol>
            <p className="mb-4 text-sm text-zinc-400">
              This desktop connector is installed unpacked. By connecting, you allow Celestia to
              encrypt your HoYoLAB session on its server and refresh about every 15 minutes. HoYoLAB
              keeps your password. Disconnect removes the stored session; saved builds remain.
            </p>
            <button
              className="button-primary"
              disabled={!connector || !s?.available || busy || armed}
              onClick={() => {
                const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
                  b.toString(16).padStart(2, '0'),
                ).join('');
                intent.current = { nonce, expires: Date.now() + 120000, session: captureSession() };
                window.postMessage({ type: 'CELESTIA_HOYOLAB_ARM', nonce }, location.origin);
                setArmed(true);
              }}
            >
              {armed
                ? 'Ready — open the connector (2 minutes)'
                : connector
                  ? 'Ready to connect'
                  : 'Install connector and reload first'}
            </button>
          </details>
        )}
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="font-semibold text-white">What syncs</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Characters, levels, constellations, displayed talents, equipped weapons and artifacts.
            Daily notes appear when HoYoLAB makes them available. Snapshots can lag behind the game.
          </p>
        </section>
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="font-semibold text-white">Keep the next step clear</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Only equipped gear appears in Equipment. HoYoLAB doesn’t supply your complete bag or
            material counts.
          </p>
          <Link className="mt-3 inline-block text-sm text-indigo-200" to="/roster">
            View your characters →
          </Link>
        </section>
      </div>
    </main>
  );
}
