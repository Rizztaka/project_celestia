import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';

import { FocusButton } from '../components/FocusButton';
import { GenshinAvatar } from '../components/GenshinAvatar';
import { GenshinWeaponIcon } from '../components/GenshinWeaponIcon';
import type { RosterCharacter, RosterWeapon } from '../lib/api';
import { fetchFocus, fetchGenshinRoster } from '../lib/api';
import { artworkDisplayName, characterMetadata } from '../lib/artwork';
import { getElementTheme } from '../lib/element-colors';

// Catalog names, with a readable fallback for unrecognized imported keys.
const formatName = artworkDisplayName;

// -------------------------------------------------------
// Constellation-tier color mapping
// -------------------------------------------------------
function constellationColor(c: number): string {
  if (c === 0) return 'text-zinc-400 border-zinc-700';
  if (c <= 2) return 'text-accent-400 border-accent-500/50';
  if (c <= 4) return 'text-violet-400 border-violet-500/50';
  return 'text-amber-400 border-amber-500/50';
}

// -------------------------------------------------------
// CharacterCard
// -------------------------------------------------------
function CharacterCard({ character }: { character: RosterCharacter }) {
  const displayName = formatName(character.characterKey);
  const metadata = characterMetadata[character.characterKey];
  const theme = getElementTheme(character.characterKey);
  const c = character.constellation;
  const colorClass = constellationColor(c);

  return (
    <article
      aria-label={`${displayName}, ${metadata ? `${metadata.rarity} star ${theme.element} ${metadata.weapon} character, ` : ''}Level ${character.level}, Constellation ${c}`}
      className={`group flex min-w-0 flex-col gap-4 rounded-2xl border border-t-2 bg-zinc-900/40 p-4 transition-colors hover:bg-zinc-900/70 sm:p-5 ${metadata?.rarity === 5 ? 'border-amber-500/30' : metadata?.rarity === 4 ? 'border-purple-500/30' : 'border-zinc-700'}`}
    >
      {/* Header: avatar + name + constellation */}
      <div className="flex items-center gap-4">
        <GenshinAvatar characterKey={character.characterKey} constellation={c} />

        {/* Name + level */}
        <div className="min-w-0 flex-1">
          <Link
            to={`/roster/${encodeURIComponent(character.characterKey)}`}
            className="font-display group-hover:text-accent-400 block break-words text-base font-bold text-white transition-colors"
          >
            {displayName}
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500">
            Lv.{character.level} · A{character.ascension}
          </p>
        </div>

        {metadata && (
          <span
            className={`text-xs font-semibold ${metadata.rarity === 5 ? 'text-amber-300' : 'text-purple-300'}`}
          >
            {metadata.rarity}★
          </span>
        )}
        {/* Constellation badge */}
        <span
          className={`shrink-0 rounded-full border bg-black/30 px-2 py-0.5 text-xs font-bold ${colorClass}`}
        >
          C{character.constellation}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Talents */}
      <div className="flex items-center gap-1">
        <span className="mr-auto text-xs uppercase tracking-wider text-zinc-500">Talents</span>
        {(
          [
            { label: 'N', value: character.talentNormal },
            { label: 'S', value: character.talentSkill },
            { label: 'B', value: character.talentBurst },
          ] as const
        ).map(({ label, value }) => (
          <div key={label} className="flex w-10 flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {label}
            </span>
            <span
              className={`font-display text-base font-bold ${
                value >= 10 ? 'text-accent-400' : 'text-white'
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Equipped weapon */}
      <WeaponChip weapon={character.equippedWeapon} />
      <FocusButton characterKey={character.characterKey} />
      <Link
        to={`/roster/${encodeURIComponent(character.characterKey)}`}
        className="rounded-lg border border-indigo-500/20 px-3 py-2 text-center text-sm text-indigo-300 hover:bg-indigo-500/10"
      >
        View recorded equipment
      </Link>
    </article>
  );
}

// -------------------------------------------------------
// WeaponChip
// -------------------------------------------------------
function WeaponChip({ weapon }: { weapon: RosterWeapon | null }) {
  if (!weapon) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        <span>No weapon assignment recorded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <GenshinWeaponIcon weaponKey={weapon.weaponKey} size="sm" />
      <div className="flex flex-col">
        <span className="font-display text-sm font-bold text-white transition-colors group-hover:text-amber-400">
          {formatName(weapon.weaponKey)}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Lv.{weapon.level}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-amber-400/80">R{weapon.refinement}</span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Skeleton card — pulsing placeholder
// -------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="glass-panel flex animate-pulse flex-col gap-4 rounded-2xl border border-white/5 p-5">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg bg-white/5" />
          <div className="h-3 w-1/2 rounded-lg bg-white/5" />
        </div>
        <div className="h-5 w-8 shrink-0 rounded-full bg-white/5" />
      </div>
      <div className="border-t border-white/5" />
      <div className="flex items-center gap-2">
        <div className="mr-auto h-3 w-16 rounded bg-white/5" />
        <div className="h-8 w-9 rounded bg-white/5" />
        <div className="h-8 w-9 rounded bg-white/5" />
        <div className="h-8 w-9 rounded bg-white/5" />
      </div>
      <div className="border-t border-white/5" />
      <div className="h-4 w-2/3 rounded bg-white/5" />
    </div>
  );
}

// -------------------------------------------------------
// Empty state
// -------------------------------------------------------
function EmptyState() {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
      <div className="bg-accent-500/10 border-accent-500/20 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border">
        <svg
          className="text-accent-400 h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h2 className="font-display mb-3 text-2xl font-bold text-white">
        No character observations yet
      </h2>
      <p className="mb-8 max-w-sm text-base leading-relaxed text-zinc-400">
        An optional import adds recorded characters and equipment here. You can use Today routines
        and create catalog goals before importing.
      </p>
      <Link
        to="/import"
        className="from-accent-500 hover:from-accent-400 shadow-accent-glow/30 rounded-xl bg-gradient-to-r to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:to-indigo-500"
      >
        Import observations
      </Link>
      <Link
        to="/planner?tab=farming&newType=CHARACTER_TALENT"
        className="mt-4 text-indigo-200 underline"
      >
        Create a goal without importing
      </Link>
    </div>
  );
}

// -------------------------------------------------------
// Nav bar (same pattern as ImportPage)
// -------------------------------------------------------

// -------------------------------------------------------
// RosterPage — main export
// -------------------------------------------------------
import { ImportStatus } from '../components/ImportStatus';

export default function RosterPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['genshin', 'characters'],
    queryFn: ({ signal }) => fetchGenshinRoster(signal),
    retry: false,
  });

  const [params, setParams] = useSearchParams();
  const focusOnly = params.get('focus') === 'true';
  const search = params.get('q') ?? '';
  function setFilter(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace });
  }
  const focus = useQuery({
    queryKey: ['genshin', 'focus'],
    queryFn: ({ signal }) => fetchFocus(signal),
    retry: false,
  });
  const characters = data?.characters ?? [];
  const focusedCharacters = focusOnly
    ? characters.filter((character) =>
        focus.data?.some((row) => row.characterKey === character.characterKey && row.focused),
      )
    : characters;
  const visibleCharacters = focusedCharacters.filter((character) =>
    formatName(character.characterKey)
      .toLocaleLowerCase()
      .replace(/\s/g, '')
      .includes(search.toLocaleLowerCase().replace(/\s/g, '')),
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      {/* Background ambient glow */}
      <div className="bg-accent-500/5 pointer-events-none absolute left-1/3 top-0 h-[400px] w-[600px] rounded-full mix-blend-screen blur-[120px]" />

      <main
        id="companion-content"
        tabIndex={-1}
        className="relative z-10 mx-auto max-w-7xl px-6 py-12"
      >
        <ImportStatus />
        {/* Page heading */}
        <div className="animate-fade-in mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Characters
            </h1>
            <p className="mt-2 text-base text-zinc-400">
              {isLoading
                ? 'Loading your characters…'
                : data
                  ? `${data.total} recorded character${data.total === 1 ? '' : 's'}`
                  : 'Character count unavailable'}
            </p>
          </div>
          {!isLoading && characters.length > 0 && (
            <Link
              to="/import"
              className="text-accent-400 hover:text-accent-300 flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Re-import
            </Link>
          )}
        </div>

        <p className="mb-4 text-sm text-zinc-400">
          Focus is an optional shortlist, independent of goal status. Open a character for recorded
          equipment and goals. Stored talent values may include adjustments; they do not establish
          base-level progress.
        </p>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-2 text-sm">
            Search characters
            <input
              type="search"
              value={search}
              onChange={(event) => setFilter('q', event.target.value, true)}
              className="rounded-lg border border-white/20 bg-zinc-900 px-3 py-2"
            />
          </label>
          <button
            className="rounded-lg border border-white/20 px-3 py-2 text-sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? 'Refreshing characters…' : 'Refresh characters'}
          </button>
        </div>
        <label className="mb-6 flex items-center gap-3">
          <input
            type="checkbox"
            checked={focusOnly}
            onChange={(event) => setFilter('focus', event.target.checked ? 'true' : '')}
          />
          Focus characters only
        </label>
        {focusOnly && focus.isPending && <p role="status">Loading focus…</p>}
        {focusOnly && focus.error && (
          <p role="alert">
            {focus.error.message}{' '}
            <button className="underline" onClick={() => void focus.refetch()}>
              Retry focus
            </button>
          </p>
        )}
        {!isLoading &&
          data &&
          (!focusOnly || (focus.data && !focus.error)) &&
          characters.length > 0 &&
          visibleCharacters.length === 0 && (
            <p className="mb-6">
              No characters match these filters.{' '}
              <button
                className="underline"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.delete('q');
                  next.delete('focus');
                  setParams(next);
                }}
              >
                Show all characters
              </button>
              .
            </p>
          )}
        {/* Error state */}
        {isError && (
          <div
            role="alert"
            className="bg-danger-950/20 border-danger-500/30 text-danger-400 animate-fade-in mb-8 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error instanceof Error
              ? error.message
              : 'Failed to load your roster. Please try again.'}
            {data && ' Showing last confirmed character records; refresh failed.'}
          </div>
        )}

        {/* Loading state: 6 skeleton cards */}
        {isLoading && (
          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && characters.length === 0 && <EmptyState />}

        {/* Populated state: character grid */}
        {!isLoading && characters.length > 0 && (
          <div className="animate-fade-in grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCharacters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
