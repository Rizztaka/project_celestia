import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { accountDataError, deleteAccount, downloadAccount } from '../lib/account-data';
import { captureSession, isCurrentSession } from '../lib/account-session';
import { planButton } from '../lib/plan-view';
import { useAuthStore } from '../stores/auth.store';

const confirmationValue = 'DELETE MY CELESTIA ACCOUNT';
export default function AccountDataControls() {
  const navigate = useNavigate();
  const [session] = useState(captureSession);
  const [mode, setMode] = useState<'export' | 'delete' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const active = useRef(true);
  const abort = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const exportTrigger = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<'export' | 'delete' | null>(null);
  // No credentials in mutation variables, result or cache. Clear the one-use job
  // immediately on invocation; only the in-flight network request retains its body.
  const job = useRef<(() => Promise<void>) | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const run = job.current;
      job.current = null;
      await run?.();
    },
    retry: false,
    gcTime: 0,
  });
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      abort.current?.abort();
      job.current = null;
    };
  }, []);
  useEffect(() => {
    if (mutation.isPending) return;
    if (mode) input.current?.focus();
    else if (returnFocus.current) {
      (returnFocus.current === 'export' ? exportTrigger : deleteTrigger).current?.focus();
      returnFocus.current = null;
    }
  }, [mode, mutation.isPending]);
  const current = () => active.current && isCurrentSession(session);
  const cancel = () => {
    abort.current?.abort();
    job.current = null;
    setPassword('');
    setConfirmation('');
    setMode(null);
    setMessage('');
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.isPending || !current() || !mode) return;
    const selected = mode;
    const credential = password;
    const intent = confirmation;
    setPassword('');
    setMessage('');
    setFailed(false);
    const controller = new AbortController();
    abort.current = controller;
    job.current = async () => {
      try {
        if (selected === 'export') {
          await downloadAccount(
            { requestVersion: 1, password: credential },
            session,
            controller.signal,
          );
          if (current()) {
            setMode(null);
            setMessage(
              'Download started. Check your browser downloads; Celestia cannot confirm the file was saved.',
            );
          }
        } else {
          await deleteAccount(
            {
              requestVersion: 1,
              password: credential,
              confirmation: intent as typeof confirmationValue,
            },
            session,
            controller.signal,
          );
          if (current()) {
            navigate('/login', { replace: true, state: { accountDeleted: true } });
            useAuthStore.getState().logout();
          }
        }
      } catch (error) {
        if (current()) {
          setFailed(true);
          setMessage(accountDataError(error, selected === 'delete'));
        }
      }
    };
    mutation.mutate();
  };
  return (
    <section aria-label="Account data" className="glass-panel space-y-4 rounded-xl p-5">
      <h2 className="text-xl font-semibold text-white">Your account data</h2>
      <p className="text-sm text-zinc-300">
        Download your stored Celestia profile, Genshin companion history and retained NIKKE records
        as versioned JSON. It is not GOOD and cannot be imported to restore an account. Store
        downloaded files privately.
      </p>
      <p className="text-sm text-zinc-300">
        Deleting your Celestia account permanently removes its active application records. There is
        no undo or grace period. It cannot delete your game-provider account, downloaded files,
        external logs or every historical backup. Restoring an old backup could reintroduce old
        records.
      </p>
      {!mode && (
        <div className="flex flex-wrap gap-3">
          <button
            ref={exportTrigger}
            className={planButton}
            type="button"
            onClick={() => {
              returnFocus.current = 'export';
              setMode('export');
              setMessage('');
            }}
          >
            Export account data
          </button>
          <button
            ref={deleteTrigger}
            className={`${planButton} text-red-200`}
            type="button"
            onClick={() => {
              returnFocus.current = 'delete';
              setMode('delete');
              setMessage('');
            }}
          >
            Review account deletion
          </button>
        </div>
      )}
      {mode && (
        <form
          onSubmit={submit}
          className="space-y-4"
          aria-label={mode === 'delete' ? 'Confirm account deletion' : 'Authorize account export'}
        >
          <label className="block space-y-2">
            <span>Current password</span>
            <input
              ref={input}
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              disabled={mutation.isPending}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded border border-zinc-600 bg-zinc-950 p-3"
            />
          </label>
          {mode === 'delete' && (
            <label className="block space-y-2">
              <span>
                Type <strong className="break-words">{confirmationValue}</strong> to confirm
                irreversible deletion
              </span>
              <input
                autoComplete="off"
                spellCheck={false}
                required
                value={confirmation}
                disabled={mutation.isPending}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full rounded border border-red-800 bg-zinc-950 p-3"
              />
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={planButton}
              onClick={cancel}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={planButton}
              disabled={
                mutation.isPending ||
                !password ||
                (mode === 'delete' && confirmation !== confirmationValue)
              }
            >
              {mutation.isPending
                ? 'Working…'
                : mode === 'delete'
                  ? 'Permanently delete my Celestia account'
                  : 'Download JSON export'}
            </button>
          </div>
          <p className="text-sm text-zinc-400">
            Your password is cleared after each attempt. Nothing is retried automatically.
          </p>
        </form>
      )}
      {message && (
        <p
          role={failed ? 'alert' : 'status'}
          className={failed ? 'text-amber-200' : 'text-zinc-200'}
        >
          {message}
        </p>
      )}
    </section>
  );
}
