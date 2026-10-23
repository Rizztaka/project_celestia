import type { MeResponse } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { captureSession, isCurrentSession } from '../lib/account-session';
import { fetchApi, fetchGenshinRoster } from '../lib/api';
import { artworkDisplayName, characterMetadata } from '../lib/artwork';
import {
  exportTeams,
  loadSavedTeams,
  parseTeamFile,
  type SavedTeam,
  saveTeams,
} from '../lib/saved-teams';
import { GenshinAvatar } from './GenshinAvatar';

interface Evaluation {
  recommendation: { complete: boolean; reactions: string[] };
  resonances: { element: string; name: string; description: string; active: boolean }[];
  explanations: string[];
}
const button = 'rounded-lg border border-zinc-600 px-3 py-2 text-sm text-white disabled:opacity-50';
const field = 'w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-white';

function OwnedTeamBuilder({ ownerId }: { ownerId: string }) {
  const [session] = useState(captureSession);
  const [initial] = useState(() => loadSavedTeams(ownerId));
  const [saved, setSaved] = useState(initial.teams);
  const latestSaved = useRef(initial.teams);
  const [message, setMessage] = useState(initial.error);
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [element, setElement] = useState('All');
  const [slot, setSlot] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const roster = useQuery({
    queryKey: ['genshin', 'characters'],
    queryFn: ({ signal }) => fetchGenshinRoster(signal),
  });
  const owned = new Set(roster.data?.characters.map((character) => character.characterKey));
  const keys = slots.filter((key): key is string => key !== null);
  const canEvaluate = !roster.error && !!roster.data && keys.every((key) => owned.has(key));
  const evaluation = useQuery({
    queryKey: ['genshin', 'team-evaluation', keys],
    queryFn: ({ signal }) =>
      fetchApi<Evaluation>(
        '/games/genshin/intelligence/teams/evaluate',
        { method: 'POST', body: JSON.stringify({ characterKeys: keys }), signal },
        session,
      ),
    enabled: canEvaluate,
    retry: false,
  });
  function persist(next: SavedTeam[]) {
    try {
      if (!isCurrentSession(session)) return;
      saveTeams(ownerId, next);
      latestSaved.current = next;
      setSaved(next);
      setMessage('Saved on this browser.');
    } catch {
      setMessage(
        'Could not save teams. Browser storage may be full or unavailable; existing teams were preserved.',
      );
    }
  }
  const choices =
    roster.data?.characters.filter(
      (character) =>
        (!keys.includes(character.characterKey) || slots[slot] === character.characterKey) &&
        artworkDisplayName(character.characterKey).toLowerCase().includes(search.toLowerCase()) &&
        (element === 'All' || characterMetadata[character.characterKey]?.element === element),
    ) ?? [];
  return (
    <section className="companion-info-card space-y-6 rounded-2xl p-5" aria-label="Team builder">
      <header>
        <h2 className="text-xl font-semibold text-white">Team Builder</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Build from your saved roster, inspect resonances and save teams for your next run.
        </p>
      </header>
      {roster.isPending && <p role="status">Loading your roster…</p>}
      {roster.error && (
        <p role="alert">
          {roster.error.message}{' '}
          <button type="button" className={button} onClick={() => void roster.refetch()}>
            Retry roster
          </button>
        </p>
      )}
      {roster.data?.characters.length === 0 && <p>Connect HoYoLAB to load your characters.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((key, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-zinc-700 p-3">
            <button
              type="button"
              className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-lg"
              disabled={!roster.data?.characters.length}
              onClick={() => {
                setSlot(index);
                setSearch('');
                setElement('All');
                dialog.current?.showModal();
              }}
              aria-label={`Choose character for slot ${index + 1}${key ? `, currently ${artworkDisplayName(key)}` : ''}`}
            >
              {key ? (
                <>
                  <GenshinAvatar characterKey={key} size="lg" />
                  <span className="text-sm text-white">{artworkDisplayName(key)}</span>
                  <span className="text-xs text-zinc-400">
                    {characterMetadata[key]?.element ?? 'Unknown element'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl text-indigo-300">+</span>
                  <span>Slot {index + 1}</span>
                </>
              )}
            </button>
            {key && (
              <button
                type="button"
                className={button}
                aria-label={`Remove ${artworkDisplayName(key)}`}
                onClick={() =>
                  setSlots((current) => current.map((value, i) => (i === index ? null : value)))
                }
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      {keys.some((key) => !owned.has(key)) && roster.data && (
        <p role="alert" className="text-amber-200">
          This saved team contains characters outside your current roster. Replace them before
          evaluating or saving.
        </p>
      )}
      {evaluation.isFetching && <p role="status">Evaluating composition…</p>}
      {evaluation.error && <p role="alert">{evaluation.error.message}</p>}
      {canEvaluate && evaluation.data && !evaluation.error && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Elemental resonances</h3>
          {!evaluation.data.resonances.length && (
            <p className="text-sm text-zinc-400">No two-character elemental resonance selected.</p>
          )}
          <div className="flex flex-wrap gap-3">
            {evaluation.data.resonances.map((resonance) => (
              <details
                key={resonance.element}
                className="max-w-full rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3"
              >
                <summary className="cursor-pointer text-indigo-100">
                  {resonance.name}
                  {resonance.active ? '' : ' · preview'}
                </summary>
                <p className="mt-2 max-w-md text-sm">{resonance.description}</p>
              </details>
            ))}
          </div>
          <h3 className="font-semibold text-white">Reaction synergies</h3>
          <p>
            {evaluation.data.recommendation.reactions.join(' · ') ||
              'No modeled reaction combination yet.'}
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            {evaluation.data.explanations.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-3">
        <label className="block">
          Team name
          <input
            className={field}
            maxLength={80}
            placeholder="Raiden National"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={button}
          disabled={
            keys.length !== 4 ||
            !name.trim() ||
            !roster.data ||
            keys.some((key) => !owned.has(key)) ||
            saved.length >= 100
          }
          onClick={() =>
            persist([...saved, { id: crypto.randomUUID(), name: name.trim(), characterKeys: keys }])
          }
        >
          Save team
        </button>
        <p className="text-sm text-zinc-400">
          Saved teams are private to your signed-in account on this browser. Export a copy to move
          them to another device. Up to 100 teams.
        </p>
      </div>
      <section aria-label="Saved teams" className="space-y-3">
        <h3 className="font-semibold text-white">Saved teams ({saved.length})</h3>
        {saved.length === 0 && (
          <p className="text-sm text-zinc-400">Your saved compositions will appear here.</p>
        )}
        {saved.map((team) => (
          <div key={team.id} className="space-y-3 rounded-xl border border-zinc-700 p-3">
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-white">{team.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {team.characterKeys.map((key) => (
                  <GenshinAvatar key={key} characterKey={key} size="sm" />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={button}
                onClick={() => {
                  setSlots(team.characterKeys);
                  setName(team.name);
                }}
              >
                Load <span className="sr-only">{team.name}</span>
              </button>
              <button
                type="button"
                className={button}
                onClick={() => persist(saved.filter((item) => item.id !== team.id))}
              >
                Delete <span className="sr-only">{team.name}</span>
              </button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={button}
            disabled={!saved.length}
            onClick={() => {
              try {
                exportTeams(saved);
              } catch {
                setMessage('Could not export teams.');
              }
            }}
          >
            Export teams
          </button>
          <label className={`${button} min-w-0 max-w-full`}>
            Import teams
            <input
              type="file"
              accept=".json,application/json"
              className="mt-2 block w-full min-w-0 max-w-full text-xs"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                try {
                  if (file.size > 200_000) throw new Error('Team file exceeds 200 KB.');
                  const imported = parseTeamFile(await file.text());
                  if (!isCurrentSession(session)) return;
                  const merged = [
                    ...latestSaved.current,
                    ...imported.filter(
                      (team) => !latestSaved.current.some((existing) => existing.id === team.id),
                    ),
                  ];
                  if (merged.length > 100) throw new Error('Import would exceed 100 teams.');
                  persist(merged);
                } catch (error) {
                  if (isCurrentSession(session))
                    setMessage(error instanceof Error ? error.message : 'Could not import teams.');
                }
              }}
            />
          </label>
        </div>
      </section>
      {message && (
        <p role="status" className="text-amber-100">
          {message}
        </p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="team-picker-title"
        className="m-auto max-h-[85dvh] w-[min(95vw,42rem)] overflow-y-auto rounded-2xl border border-zinc-600 bg-zinc-950 p-5 text-zinc-200 backdrop:bg-black/70"
      >
        <div className="mb-4 flex justify-between gap-3">
          <h3 id="team-picker-title" className="text-lg font-semibold text-white">
            Choose slot {slot + 1}
          </h3>
          <button type="button" className={button} onClick={() => dialog.current?.close()}>
            Close picker
          </button>
        </div>
        <label className="block">
          Search your roster
          <input
            className={field}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="mt-3 block">
          Element
          <select
            aria-label="Element"
            className={field}
            value={element}
            onChange={(event) => setElement(event.target.value)}
          >
            {['All', 'Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {choices.map((character) => (
            <button
              type="button"
              key={character.id}
              className={`${button} flex items-center gap-2 text-left`}
              onClick={() => {
                setSlots((current) =>
                  current.map((key, index) => (index === slot ? character.characterKey : key)),
                );
                dialog.current?.close();
              }}
            >
              <GenshinAvatar characterKey={character.characterKey} size="sm" />
              <span>{artworkDisplayName(character.characterKey)}</span>
            </button>
          ))}
        </div>
        {!choices.length && <p className="mt-4">No unlocked characters match these filters.</p>}
      </dialog>
    </section>
  );
}

export default function TeamBuilder() {
  const profile = useQuery({
    queryKey: ['me'],
    queryFn: ({ signal }) => fetchApi<MeResponse>('/auth/me', { signal }),
    retry: false,
  });
  if (profile.isPending) return <p role="status">Loading your account…</p>;
  if (profile.error)
    return (
      <p role="alert">
        {profile.error.message}{' '}
        <button type="button" onClick={() => void profile.refetch()}>
          Retry
        </button>
      </p>
    );
  return <OwnedTeamBuilder key={profile.data.id} ownerId={profile.data.id} />;
}
