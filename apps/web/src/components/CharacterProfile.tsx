import type {
  CharacterEquipmentResponse,
  CharacterProfileReference,
} from '@celestia/api-contracts';
import { Link } from 'react-router-dom';

import { artworkDisplayName } from '../lib/artwork';
import { constellationState, talentValue } from '../lib/profile-presentation';
import { GenshinAvatar } from './GenshinAvatar';
import { ProfileDescription, SourceText } from './ProfileDescription';

export function CharacterProfileHeader({
  characterKey,
  reference,
  data,
  recordsStatus = 'not_recorded',
}: {
  characterKey: string;
  reference?: CharacterProfileReference;
  data?: CharacterEquipmentResponse;
  recordsStatus?: 'loading' | 'unavailable' | 'not_recorded';
}) {
  const c = data?.character;
  const absentLabel =
    recordsStatus === 'loading'
      ? 'Loading…'
      : recordsStatus === 'unavailable'
        ? 'Unknown · Unavailable'
        : 'Not recorded';
  return (
    <header className="glass-panel mb-6 space-y-5 rounded-2xl border border-white/15 p-5 sm:p-6">
      <div className="flex items-center gap-5">
        <GenshinAvatar characterKey={characterKey} size="xl" constellation={c?.constellation} />
        <div className="min-w-0">
          <p className="mb-1 text-xs uppercase tracking-widest text-indigo-200">
            {c ? 'Recorded character' : 'Character reference'}
          </p>
          <h1 className="font-display break-words text-3xl font-bold text-white">
            {reference?.name ?? artworkDisplayName(characterKey)}
          </h1>
          {reference && (
            <p className="mt-2 text-sm">
              {reference.element} · {reference.weaponType} · {reference.rarity}★
            </p>
          )}
        </div>
      </div>
      {reference && <SourceText text={reference.description} />}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Level', c?.level],
          ['Ascension', c?.ascension],
          ['Constellations', c ? `C${c.constellation}` : undefined],
          [
            'Talents · Normal / Skill / Burst',
            c ? `${c.talents.normal} / ${c.talents.skill} / ${c.talents.burst}` : undefined,
          ],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/5 p-3">
            <dt className="text-xs text-zinc-300">{label}</dt>
            <dd className="mt-1 font-semibold text-white">{value ?? absentLabel}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-relaxed text-zinc-300">
        {c
          ? 'Talent values are stored as supplied. Base versus constellation-adjusted levels and legacy/default origins are unknown; no bonuses have been added.'
          : recordsStatus === 'loading'
            ? 'Loading recorded progression and equipment.'
            : recordsStatus === 'unavailable'
              ? 'Recorded progression and equipment could not be checked. Ownership and unlock states are unknown.'
              : 'Progression and equipment are not recorded here. This does not establish in-game ownership.'}
      </p>
      {!!reference?.forms.length && (
        <div className="space-y-3">
          <p className="text-amber-200">
            Traveler form unresolved. Choose a reference form; recorded progression is not
            transferred.
          </p>
          <div className="flex flex-wrap gap-3">
            {reference.forms.map((f) => (
              <Link
                className="rounded-lg border border-white/20 px-3 py-2 text-sm text-indigo-200"
                key={f.key}
                to={`/characters/${f.key}`}
              >
                {f.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
export function CharacterProfileKit({
  reference,
  data,
}: {
  reference: CharacterProfileReference;
  data?: CharacterEquipmentResponse;
}) {
  return (
    <div className="my-6 space-y-6">
      <section aria-label="Talents and special abilities">
        <h2 className="mb-4 text-xl font-semibold text-white">Talents & special abilities</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {reference.talents.map((e) => {
            const value = talentValue(e, data);
            return (
              <ProfileDescription
                key={e.key}
                title={e.name}
                state={value === undefined ? 'unknown' : 'bright'}
                label={
                  value === undefined ? 'Unlock unknown · Reference' : `Recorded level ${value}`
                }
              >
                <p className="text-xs capitalize text-indigo-200">
                  {e.kind === 'normal' ? 'Normal / Charged / Plunging Attack' : e.kind}
                </p>
                <SourceText text={e.description} />
                {value === undefined && (
                  <p className="text-xs text-zinc-300">
                    Unlock requirement not supplied by the pinned source. Availability is unknown.
                  </p>
                )}
              </ProfileDescription>
            );
          })}
        </div>
      </section>
      <section aria-label="Constellations">
        <h2 className="mb-4 text-xl font-semibold text-white">Constellations</h2>
        <p className="mb-3 text-sm text-zinc-300">
          Bright entries are recorded unlocked. Dark entries are locked by recorded C-count. Every
          entry opens.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {reference.constellations.map((e) => {
            const state = constellationState(
              e.unlock === 'constellation' ? data?.character.constellation : undefined,
              e.constellation!,
            );
            return (
              <ProfileDescription
                key={e.key}
                title={`${e.key.toUpperCase()} · ${e.name}`}
                state={state}
                label={
                  state === 'bright'
                    ? 'Unlocked · Recorded'
                    : state === 'dark'
                      ? 'Locked · Recorded C-count'
                      : 'Unlock unknown · Reference'
                }
              >
                <SourceText text={e.description} />
              </ProfileDescription>
            );
          })}
        </div>
      </section>
      <details className="rounded-xl border border-white/10 p-4 text-xs text-zinc-300">
        <summary className="cursor-pointer">Reference sources & coverage</summary>
        <div className="mt-3 space-y-3">
          <p>
            Pinned genshin-db snapshot; mechanics may differ in later game versions. Passive/special
            unlocks and live effect conditions are not verified.
          </p>
          {reference.gaps.map((g) => (
            <p key={g}>{g}</p>
          ))}
          {reference.sources.map((s) => (
            <p key={s.url}>
              <a
                className="text-indigo-200 underline"
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                genshin-db · MIT · {s.revision.slice(0, 7)}
              </a>
              <span className="mt-1 block break-all">SHA-256 {s.sha256}</span>
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}
