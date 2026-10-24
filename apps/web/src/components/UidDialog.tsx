import type { ShowcaseResult } from '@celestia/api-contracts';
import { showcaseUidSchema } from '@celestia/api-contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { showcaseServer } from '../lib/showcase';
import { canAddUidCandidate, connectUidCandidate, lookupUidCandidate } from '../lib/uid-connection';
import { useRefreshSeconds } from '../lib/use-showcase';
import { CelestiaMark } from './Ui';

export function UidPreview({ result }: { result: ShowcaseResult }) {
  const profile = result.snapshot;
  if (!profile) return null;
  return (
    <section aria-label="UID preview" className="uid-preview">
      <header>
        <div>
          <h3>{profile.nickname}</h3>
          <p>
            UID {profile.uid} · {showcaseServer(profile.uid) ?? 'Server not identified'}
          </p>
        </div>
        {profile.adventureRank !== null ? (
          <span className="build-badge">AR {profile.adventureRank}</span>
        ) : null}
      </header>
      <p className="uid-preview-caption">
        Publicly showcased characters · {profile.characters.length}
      </p>
      {profile.characters.length ? (
        <ul className="uid-preview-grid">
          {profile.characters.map((character) => (
            <li key={character.key}>
              {character.portrait ? (
                <img
                  src={character.portrait}
                  alt=""
                  width={48}
                  height={48}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="uid-preview-placeholder">?</span>
              )}
              <span>
                <strong>{character.name}</strong>
                <small>
                  {character.level === null ? 'Level not reported' : `Lv. ${character.level}`} · C
                  {character.constellation}
                </small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="uid-dialog-note">
          This showcase is empty or private. You can add the UID and refresh from Public Profile
          after making characters public.
        </p>
      )}
      <p className="uid-dialog-note">
        Adding this UID connects its whole public showcase to Celestia.
      </p>
    </section>
  );
}

export function UidDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pendingRequest = useRef(false);
  const [input, setInput] = useState('');
  const [validation, setValidation] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ShowcaseResult>();
  const [error, setError] = useState('');
  const client = useQueryClient();
  const navigate = useNavigate();
  const wait = useRefreshSeconds(result);
  const ready = canAddUidCandidate(input, result);
  useEffect(() => {
    const modal = dialog.current!;
    const active = document.activeElement as HTMLElement | null;
    const trigger = active?.closest('dialog:not([open])')
      ? document.querySelector<HTMLElement>('.companion-menu-toggle')
      : active;
    modal.showModal();
    modal.querySelector<HTMLInputElement>('input')?.focus();
    return () => {
      modal.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (pendingRequest.current || (result?.issue && wait > 0)) return;
    if (!showcaseUidSchema.safeParse(input.trim()).success) {
      setValidation('Enter a 9- or 10-digit Genshin UID, using numbers only.');
      return;
    }
    pendingRequest.current = true;
    setPending(true);
    setValidation('');
    setError('');
    setResult(undefined);
    try {
      setResult(await lookupUidCandidate(client, input));
    } catch {
      setError('Could not reach the showcase service. Check your connection and try again.');
    } finally {
      pendingRequest.current = false;
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="uid-dialog"
      aria-labelledby="uid-dialog-title"
      aria-describedby="uid-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="uid-dialog-heading">
        <div>
          <p className="eyebrow">YOUR CELESTIA</p>
          <h2 id="uid-dialog-title">Add a Genshin UID</h2>
        </div>
        <button
          type="button"
          className="uid-dialog-close"
          aria-label="Close UID dialog"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <p id="uid-dialog-description" className="uid-dialog-note">
        Find a public showcase, preview its characters, then add the UID.
      </p>
      <form onSubmit={(event) => void search(event)} className="uid-search-form">
        <label htmlFor="uid-dialog-input">Genshin UID</label>
        <div className="uid-search-row">
          <input
            id="uid-dialog-input"
            name="uid"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={32}
            value={input}
            disabled={pending}
            aria-invalid={!!validation}
            aria-describedby="uid-input-help uid-input-error"
            onChange={(event) => {
              setInput(event.target.value);
              setValidation('');
              setResult(undefined);
              setError('');
            }}
          />
          <button
            type="submit"
            className="button-secondary"
            disabled={pending || !!(result?.issue && wait > 0)}
          >
            {pending ? 'Searching…' : result?.issue && wait > 0 ? `Retry in ${wait}s` : 'Search'}
          </button>
        </div>
        <p id="uid-input-help" className="uid-dialog-note">
          Your UID is at the bottom right of the Genshin Impact screen.
        </p>
        <p
          id="uid-input-error"
          role={validation ? 'alert' : undefined}
          className="uid-dialog-error"
        >
          {validation}
        </p>
      </form>
      <div aria-live="polite" aria-busy={pending}>
        {pending ? (
          <p className="uid-dialog-note" role="status">
            Finding the public showcase…
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="uid-dialog-error">
            {error}
          </p>
        ) : null}
        {result?.issue ? (
          <p role="alert" className="uid-dialog-error">
            {result.issue.message}
          </p>
        ) : null}
        {ready && result ? <UidPreview result={result} /> : null}
        {result && !result.snapshot && !result.issue ? (
          <p role="status" className="uid-dialog-note">
            No public profile is available for this UID.
          </p>
        ) : null}
      </div>
      <footer className="uid-dialog-footer">
        <span>
          <CelestiaMark /> Public data via Enka.Network
        </span>
        <div>
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={!ready || pending}
            onClick={() => {
              const uid = connectUidCandidate(input, result);
              if (uid) {
                onClose();
                navigate(`/u/${uid}`);
              }
            }}
          >
            Add UID
          </button>
        </div>
      </footer>
    </dialog>
  );
}
