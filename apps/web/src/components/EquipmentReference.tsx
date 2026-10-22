import type {
  CharacterEquipmentResponse,
  CharacterProfileReference,
} from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { setEligibility } from '../lib/profile-presentation';
import { fetchArtifactReference, fetchWeaponReference } from '../lib/profile-reference';
import { ProfileDescription, SourceText } from './ProfileDescription';

function ReferenceStatus({
  query,
}: {
  query: { isPending: boolean; isError: boolean; refetch: () => unknown };
}) {
  return (
    <>
      {query.isPending && (
        <p role="status" className="text-sm">
          Loading item description…
        </p>
      )}
      {query.isError && (
        <p role="alert" className="text-sm text-amber-200">
          Item description unavailable. Recorded equipment is retained.{' '}
          <button className="underline" onClick={() => void query.refetch()}>
            Retry item reference
          </button>
        </p>
      )}
    </>
  );
}
export function WeaponReference({ itemKey, refinement }: { itemKey: string; refinement?: number }) {
  const query = useQuery({
    queryKey: ['genshin', 'weapon-reference', itemKey],
    queryFn: ({ signal }) => fetchWeaponReference(itemKey, signal),
    retry: false,
  });
  const ref = query.data;
  const applicable = ref?.refinements.find((r) => r.rank === refinement);
  return (
    <div className="space-y-3">
      <ReferenceStatus query={query} />
      {ref && (
        <>
          <p className="text-sm text-indigo-200">
            {ref.name} · {ref.weaponType} · {ref.rarity}★
          </p>
          <SourceText text={ref.description} />
          {refinement !== undefined && (
            <ProfileDescription
              title={ref.effectName || 'Weapon passive'}
              label={
                applicable
                  ? `Refinement ${refinement} · Conditions apply`
                  : 'Refinement effect unknown'
              }
              state={applicable ? 'bright' : 'unknown'}
            >
              {applicable ? (
                <SourceText text={applicable.description} />
              ) : (
                <p className="text-sm">
                  No exact effect is available for the recorded refinement. Inspect reference ranks
                  below.
                </p>
              )}
            </ProfileDescription>
          )}
          <details className="rounded-lg border border-white/10 p-3">
            <summary className="cursor-pointer text-sm text-zinc-200">
              All refinement descriptions · Reference
            </summary>
            <div className="mt-3 space-y-3">
              {ref.refinements.length ? (
                ref.refinements.map((r) => (
                  <ProfileDescription
                    key={r.rank}
                    title={`${ref.effectName || 'Passive'} · R${r.rank}`}
                    label="Reference · Conditional effect"
                  >
                    <SourceText text={r.description} />
                  </ProfileDescription>
                ))
              ) : (
                <p>No refinement passive supplied by this source.</p>
              )}
            </div>
          </details>
          <details className="text-xs text-zinc-300">
            <summary className="cursor-pointer">Weapon source</summary>
            <a
              className="mt-2 block text-indigo-200 underline"
              href={ref.source.url}
              target="_blank"
              rel="noreferrer"
            >
              genshin-db · MIT · {ref.source.revision.slice(0, 7)}
            </a>
          </details>
        </>
      )}
    </div>
  );
}
export function ArtifactReference({
  itemKey,
  slot,
  count,
  data,
  includePieces,
}: {
  itemKey: string;
  slot?: string;
  count?: number;
  data?: CharacterEquipmentResponse;
  includePieces?: boolean;
}) {
  const query = useQuery({
    queryKey: ['genshin', 'artifact-reference', itemKey],
    queryFn: ({ signal }) => fetchArtifactReference(itemKey, signal),
    retry: false,
  });
  const ref = query.data;
  const pieces = slot
    ? ref?.pieces.filter((p) => p.slot === slot)
    : count === undefined || includePieces
      ? ref?.pieces
      : [];
  return (
    <div className="space-y-3">
      <ReferenceStatus query={query} />
      {ref && (
        <>
          {pieces?.map((p) => (
            <ProfileDescription
              key={p.slot}
              title={p.name}
              label={slot ? 'Equipped piece · Recorded' : 'Piece · Reference'}
              state={slot ? 'bright' : 'unknown'}
            >
              <SourceText text={p.description} />
            </ProfileDescription>
          ))}
          {!slot &&
            ref.effects.map((e) => {
              const state = count === undefined ? 'unknown' : setEligibility(count, e.pieces, data);
              return (
                <ProfileDescription
                  key={e.pieces}
                  title={`${ref.name} · ${e.pieces}-piece effect`}
                  state={state}
                  label={
                    count === undefined
                      ? 'Reference · Inventory not checked'
                      : `${count} recorded pieces · ${state === 'bright' ? 'Piece requirement met' : state === 'dark' ? 'Piece requirement not met' : 'Eligibility unknown'}`
                  }
                >
                  <SourceText text={e.description} />
                  <p className="text-xs text-zinc-300">
                    Piece eligibility does not establish activation of conditional effects in-game.
                  </p>
                </ProfileDescription>
              );
            })}
          <details className="text-xs text-zinc-300">
            <summary className="cursor-pointer">Artifact source</summary>
            <a
              className="mt-2 block text-indigo-200 underline"
              href={ref.source.url}
              target="_blank"
              rel="noreferrer"
            >
              genshin-db · MIT · {ref.source.revision.slice(0, 7)}
            </a>
          </details>
        </>
      )}
    </div>
  );
}
export function EquipmentReferenceBrowser({
  reference,
  data,
}: {
  reference: CharacterProfileReference;
  data?: CharacterEquipmentResponse;
}) {
  const [weapon, setWeapon] = useState('');
  const [artifact, setArtifact] = useState('');
  const recordedPieces = data
    ? Object.values(data.artifacts).filter((a) => a.item?.setKey === artifact).length
    : undefined;
  return (
    <section
      className="my-6 rounded-2xl border border-white/15 p-5"
      aria-label="Equipment reference library"
    >
      <h2 className="mb-2 text-xl font-semibold text-white">Equipment reference library</h2>
      <p className="mb-4 text-sm text-zinc-300">
        Browse compatible weapon types and artifact sets. Recorded assignments are shown when
        available; other inventory is not checked. Browsing makes no account changes.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <label className="block text-sm">
            {reference.weaponType} weapons
            <select
              className="mt-2 block w-full rounded-lg border border-zinc-600 bg-zinc-950 p-3 text-white"
              value={weapon}
              onChange={(e) => setWeapon(e.target.value)}
            >
              <option value="">Select a weapon reference</option>
              {reference.weapons.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          {weapon && (
            <>
              <p className="text-sm text-indigo-200">
                {data?.weapon.item?.weaponKey === weapon
                  ? 'Equipped on this character · Recorded'
                  : 'Reference · Other inventory unknown'}
              </p>
              <WeaponReference key={weapon} itemKey={weapon} />
            </>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          <label className="block text-sm">
            Artifact sets
            <select
              className="mt-2 block w-full rounded-lg border border-zinc-600 bg-zinc-950 p-3 text-white"
              value={artifact}
              onChange={(e) => setArtifact(e.target.value)}
            >
              <option value="">Select an artifact reference</option>
              {reference.artifactSets.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          {artifact && (
            <>
              <p className="text-sm text-indigo-200">
                {recordedPieces
                  ? `${recordedPieces} equipped pieces recorded on this character`
                  : 'Reference · Other inventory unknown'}
              </p>
              <ArtifactReference
                key={artifact}
                itemKey={artifact}
                count={recordedPieces || undefined}
                data={data}
                includePieces
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
