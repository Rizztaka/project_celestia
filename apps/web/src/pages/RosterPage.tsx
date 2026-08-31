import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import type { RosterCharacter, RosterWeapon } from '../lib/api';
import { fetchGenshinRoster } from '../lib/api';
import { ASSET_MAPPING } from '../lib/asset-mapping';
import { useAuthStore } from '../stores/auth.store';

// -------------------------------------------------------
// Utility: format a GOOD PascalCase character key into a
// readable display name.
// Examples:
//   "HuTao"            → "Hu Tao"
//   "RaidenShogun"     → "Raiden Shogun"
//   "KaedeharaKazuha"  → "Kaedehara Kazuha"
// A full static lookup table is planned for Phase 4.
// -------------------------------------------------------
function formatName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

// -------------------------------------------------------
// Constellation-tier color mapping
// -------------------------------------------------------
function constellationColor(c: number): string {
  if (c === 0) return 'text-zinc-400 border-zinc-700';
  if (c <= 2) return 'text-accent-400 border-accent-500/50';
  if (c <= 4) return 'text-violet-400 border-violet-500/50';
  return 'text-amber-400 border-amber-500/50';
}

function constellationGlow(c: number): string {
  if (c === 0) return '';
  if (c <= 2) return 'shadow-[0_0_16px_rgba(99,102,241,0.4)]';
  if (c <= 4) return 'shadow-[0_0_16px_rgba(167,139,250,0.4)]';
  return 'shadow-[0_0_16px_rgba(251,191,36,0.4)]';
}

// -------------------------------------------------------
// CharacterCard
// -------------------------------------------------------
function CharacterCard({ character }: { character: RosterCharacter }) {
  const displayName = formatName(character.characterKey);
  // Generate initials from the display name
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const c = character.constellation;
  const colorClass = constellationColor(c);
  const glowClass = constellationGlow(c);

  return (
    <div className="glass-panel hover-lift group flex flex-col gap-4 rounded-2xl border border-white/5 p-5">
      {/* Header: avatar + name + constellation */}
      <div className="flex items-center gap-4">
        {/* Avatar circle */}
        <div
          className={`font-display relative flex h-12 w-12 shrink-0 select-none items-center justify-center overflow-hidden rounded-xl border-2 text-sm font-bold transition-all ${colorClass} ${glowClass}`}
        >
          <img
            src={`https://enka.network/ui/UI_AvatarIcon_${ASSET_MAPPING.characters[character.characterKey] || character.characterKey}.png`}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="relative z-[-1]">{initials}</span>
        </div>

        {/* Name + level */}
        <div className="min-w-0 flex-1">
          <p className="font-display group-hover:text-accent-400 truncate text-base font-bold text-white transition-colors">
            {displayName}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Lv.{character.level} · A{character.ascension}
          </p>
        </div>

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
    </div>
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
        <span>No weapon equipped</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <img
          src={`https://enka.network/ui/UI_EquipIcon_${ASSET_MAPPING.weapons[weapon.weaponKey] || weapon.weaponKey}.png`}
          alt={weapon.weaponKey}
          className="absolute inset-0 z-10 h-full w-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <svg
          className="relative z-0 h-4 w-4 shrink-0 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.25 2.25L21.75 9.75M19.5 4.5L4.5 19.5M4.5 19.5l-2.25 2.25M4.5 19.5l7.5-7.5"
          />
        </svg>
      </div>
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
      <h2 className="font-display mb-3 text-2xl font-bold text-white">Your roster is empty</h2>
      <p className="mb-8 max-w-sm text-base leading-relaxed text-zinc-400">
        Import your Genshin account data to populate your roster with your characters, weapons, and
        artifacts.
      </p>
      <Link
        to="/import"
        className="from-accent-500 hover:from-accent-400 shadow-accent-glow/30 rounded-xl bg-gradient-to-r to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:to-indigo-500"
      >
        Import Account
      </Link>
    </div>
  );
}

// -------------------------------------------------------
// Nav bar (same pattern as ImportPage)
// -------------------------------------------------------
function Nav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between border-b-0 border-white/10 px-6 py-4">
      <Link
        to="/"
        className="font-display text-gradient text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
      >
        Project Celestia
      </Link>
      <div className="flex items-center gap-6">
        <Link
          to="/import"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Import
        </Link>
        <button
          onClick={onLogout}
          className="hover:text-danger-400 text-sm font-medium text-zinc-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

// -------------------------------------------------------
// RosterPage — main export
// -------------------------------------------------------
export default function RosterPage() {
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['genshin', 'characters'],
    queryFn: fetchGenshinRoster,
    retry: false,
  });

  const characters = data?.characters ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Background ambient glow */}
      <div className="bg-accent-500/5 pointer-events-none absolute left-1/3 top-0 h-[400px] w-[600px] rounded-full mix-blend-screen blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        {/* Page heading */}
        <div className="animate-fade-in mb-10 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Your Roster
            </h1>
            <p className="mt-2 text-base text-zinc-400">
              {isLoading
                ? 'Loading your characters…'
                : `${data?.total ?? 0} character${(data?.total ?? 0) === 1 ? '' : 's'} in your roster`}
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
          </div>
        )}

        {/* Loading state: 6 skeleton cards */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && characters.length === 0 && <EmptyState />}

        {/* Populated state: character grid */}
        {!isLoading && !isError && characters.length > 0 && (
          <div className="animate-fade-in grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
