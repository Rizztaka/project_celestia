import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  type ArtifactSubStat,
  fetchGenshinArtifacts,
  fetchGenshinWeapons,
  type InventoryArtifact,
  type InventoryWeapon,
} from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

// -------------------------------------------------------
// Formatting utilities
// -------------------------------------------------------

/** PascalCase → spaced display name. "StaffOfHoma" → "Staff Of Homa" */
function formatName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  hp_: 'HP%',
  atk: 'ATK',
  atk_: 'ATK%',
  def: 'DEF',
  def_: 'DEF%',
  eleMas: 'EM',
  enerRech_: 'ER%',
  critRate_: 'CR',
  critDMG_: 'CD',
  heal_: 'Heal%',
  pyro_dmg_: 'Pyro%',
  hydro_dmg_: 'Hydro%',
  cryo_dmg_: 'Cryo%',
  electro_dmg_: 'Electro%',
  anemo_dmg_: 'Anemo%',
  geo_dmg_: 'Geo%',
  dendro_dmg_: 'Dendro%',
  physical_dmg_: 'Phys%',
};

function formatStat(key: string): string {
  return STAT_LABELS[key] ?? key;
}

const SLOT_LABELS: Record<string, { label: string; letter: string }> = {
  flower: { label: 'Flower', letter: 'F' },
  plume: { label: 'Plume', letter: 'P' },
  sands: { label: 'Sands', letter: 'S' },
  goblet: { label: 'Goblet', letter: 'G' },
  circlet: { label: 'Circlet', letter: 'C' },
};

// -------------------------------------------------------
// Refinement color system
// -------------------------------------------------------
function refinementClasses(r: number): { border: string; text: string; glow: string } {
  if (r === 5)
    return {
      border: 'border-amber-400',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
    };
  if (r === 4) return { border: 'border-amber-500/70', text: 'text-amber-400', glow: '' };
  if (r === 3) return { border: 'border-violet-500/70', text: 'text-violet-400', glow: '' };
  if (r === 2) return { border: 'border-accent-500/70', text: 'text-accent-400', glow: '' };
  return { border: 'border-zinc-600', text: 'text-zinc-400', glow: '' };
}

// -------------------------------------------------------
// Artifact level tier color
// -------------------------------------------------------
function levelColor(level: number): string {
  if (level >= 17) return 'text-amber-400';
  if (level >= 13) return 'text-violet-400';
  if (level >= 9) return 'text-accent-400';
  return 'text-zinc-400';
}

// -------------------------------------------------------
// WeaponCard
// -------------------------------------------------------
function WeaponCard({ weapon }: { weapon: InventoryWeapon }) {
  const displayName = formatName(weapon.weaponKey);
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const ref = refinementClasses(weapon.refinement);
  const isEquipped = weapon.equippedCharacterId !== null;

  return (
    <div
      className={`glass-panel hover-lift group flex flex-col gap-3 rounded-2xl border border-white/5 p-5 transition-all ${ref.glow}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`font-display flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl border-2 text-sm font-bold ${ref.border} ${ref.text}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display group-hover:text-accent-400 truncate text-sm font-bold text-white transition-colors">
            {displayName}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Lv.{weapon.level} · A{weapon.ascension}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border bg-black/30 px-2 py-0.5 text-xs font-bold ${ref.border} ${ref.text}`}
        >
          R{weapon.refinement}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Equipped status */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${isEquipped ? 'bg-emerald-400' : 'bg-zinc-600'}`}
        />
        <span className={isEquipped ? 'text-emerald-400' : 'text-zinc-600'}>
          {isEquipped ? 'Equipped' : 'Unequipped'}
        </span>
        {weapon.locked && (
          <svg
            className="ml-auto h-3 w-3 shrink-0 text-amber-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" />
          </svg>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// ArtifactRow
// -------------------------------------------------------
function ArtifactRow({ artifact }: { artifact: InventoryArtifact }) {
  const slot = SLOT_LABELS[artifact.slotKey] ?? { label: artifact.slotKey, letter: '?' };
  const setName = formatName(artifact.setKey);
  const mainStat = formatStat(artifact.mainStatKey);

  // Safely parse subStats — stored as JSON (Prisma `Json` column)
  const subStats: ArtifactSubStat[] = Array.isArray(artifact.subStats)
    ? (artifact.subStats as ArtifactSubStat[])
    : [];

  const rarityColor = artifact.rarity >= 5 ? 'text-amber-400' : 'text-violet-400';
  const stars = '★'.repeat(artifact.rarity);

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.05]">
      {/* Slot badge */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-zinc-400">
        {slot.letter}
      </div>

      {/* Set + slot */}
      <div className="w-44 min-w-0 shrink-0">
        <p className="group-hover:text-accent-400 truncate text-sm font-medium text-white transition-colors">
          {setName}
        </p>
        <p className="text-xs text-zinc-500">{slot.label}</p>
      </div>

      {/* Rarity + level */}
      <div className="flex w-20 shrink-0 flex-col">
        <span className={`text-xs font-bold tracking-tight ${rarityColor}`}>{stars}</span>
        <span className={`font-display text-sm font-bold ${levelColor(artifact.level)}`}>
          +{artifact.level}
        </span>
      </div>

      {/* Main stat */}
      <div className="w-20 shrink-0">
        <span className="text-sm font-semibold text-white">{mainStat}</span>
      </div>

      {/* Sub-stats */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {subStats.map((sub, i) => (
          <span
            key={i}
            className="shrink-0 whitespace-nowrap rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-zinc-300"
          >
            {formatStat(sub.key)}{' '}
            <span className="text-zinc-400">
              {Number.isInteger(sub.value) ? sub.value : sub.value.toFixed(1)}
            </span>
          </span>
        ))}
      </div>

      {/* Lock icon */}
      {artifact.locked ? (
        <svg
          className="h-3.5 w-3.5 shrink-0 text-amber-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      ) : (
        <div className="w-3.5 shrink-0" />
      )}
    </div>
  );
}

// -------------------------------------------------------
// Skeleton components
// -------------------------------------------------------
function WeaponSkeletonCard() {
  return (
    <div className="glass-panel flex animate-pulse flex-col gap-3 rounded-2xl border border-white/5 p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg bg-white/5" />
          <div className="h-3 w-1/2 rounded-lg bg-white/5" />
        </div>
        <div className="h-5 w-8 shrink-0 rounded-full bg-white/5" />
      </div>
      <div className="border-t border-white/5" />
      <div className="h-3 w-1/3 rounded bg-white/5" />
    </div>
  );
}

function ArtifactSkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-white/5" />
      <div className="w-44 shrink-0 space-y-1.5">
        <div className="h-4 w-5/6 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
      </div>
      <div className="w-20 shrink-0 space-y-1">
        <div className="h-3 w-12 rounded bg-white/5" />
        <div className="h-4 w-8 rounded bg-white/5" />
      </div>
      <div className="w-20 shrink-0">
        <div className="h-4 w-14 rounded bg-white/5" />
      </div>
      <div className="flex flex-1 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-5 w-14 rounded-md bg-white/5" />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Empty state
// -------------------------------------------------------
function EmptyState({ type }: { type: 'weapons' | 'artifacts' }) {
  const label = type === 'weapons' ? 'weapons' : 'artifacts';
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h2 className="font-display mb-3 text-2xl font-bold text-white">No {label} found</h2>
      <p className="mb-8 max-w-sm text-base leading-relaxed text-zinc-400">
        Import your Genshin account data to see your {label} here.
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
// Tab bar
// -------------------------------------------------------
type Tab = 'weapons' | 'artifacts';

function TabBar({
  active,
  weaponsTotal,
  artifactsTotal,
  onChange,
}: {
  active: Tab;
  weaponsTotal: number;
  artifactsTotal: number;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'weapons', label: 'Weapons', count: weaponsTotal },
    { id: 'artifacts', label: 'Artifacts', count: artifactsTotal },
  ];

  return (
    <div className="glass-panel mb-8 flex w-fit items-center gap-1 rounded-xl p-1">
      {tabs.map(({ id, label, count }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
            active === id
              ? 'bg-accent-500/20 text-accent-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {label}
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${active === id ? 'bg-accent-500/30 text-accent-300' : 'bg-white/5 text-zinc-600'}`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------
// Nav bar
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
          to="/roster"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Roster
        </Link>
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
// InventoryPage — main export
// -------------------------------------------------------
export default function InventoryPage() {
  const logout = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<Tab>('weapons');

  const weaponsQuery = useQuery({
    queryKey: ['genshin', 'weapons'],
    queryFn: fetchGenshinWeapons,
    retry: false,
  });

  const artifactsQuery = useQuery({
    queryKey: ['genshin', 'artifacts'],
    queryFn: fetchGenshinArtifacts,
    retry: false,
  });

  const weapons = weaponsQuery.data?.weapons ?? [];
  const artifacts = artifactsQuery.data?.artifacts ?? [];

  const isWeaponsLoading = weaponsQuery.isLoading;
  const isArtifactsLoading = artifactsQuery.isLoading;
  const activeError = activeTab === 'weapons' ? weaponsQuery.error : artifactsQuery.error;

  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Background ambient glow */}
      <div className="pointer-events-none absolute right-1/4 top-0 h-[400px] w-[600px] rounded-full bg-violet-500/5 mix-blend-screen blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        {/* Page heading */}
        <div className="animate-fade-in mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">Inventory</h1>
          <p className="mt-2 text-base text-zinc-400">
            {isWeaponsLoading || isArtifactsLoading
              ? 'Loading your inventory…'
              : `${weaponsQuery.data?.total ?? 0} weapon${(weaponsQuery.data?.total ?? 0) === 1 ? '' : 's'} · ${artifactsQuery.data?.total ?? 0} artifact${(artifactsQuery.data?.total ?? 0) === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Tab bar — rendered with live counts once data arrives */}
        <TabBar
          active={activeTab}
          weaponsTotal={weaponsQuery.data?.total ?? 0}
          artifactsTotal={artifactsQuery.data?.total ?? 0}
          onChange={setActiveTab}
        />

        {/* Error */}
        {activeError && (
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
            {activeError instanceof Error
              ? activeError.message
              : 'Failed to load inventory. Please try again.'}
          </div>
        )}

        {/* ── Weapons Tab ─────────────────────────────────────── */}
        {activeTab === 'weapons' && (
          <>
            {isWeaponsLoading && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <WeaponSkeletonCard key={i} />
                ))}
              </div>
            )}
            {!isWeaponsLoading && !weaponsQuery.isError && weapons.length === 0 && (
              <EmptyState type="weapons" />
            )}
            {!isWeaponsLoading && !weaponsQuery.isError && weapons.length > 0 && (
              <div className="animate-fade-in grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {weapons.map((w) => (
                  <WeaponCard key={w.id} weapon={w} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Artifacts Tab ────────────────────────────────────── */}
        {activeTab === 'artifacts' && (
          <>
            {isArtifactsLoading && (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ArtifactSkeletonRow key={i} />
                ))}
              </div>
            )}
            {!isArtifactsLoading && !artifactsQuery.isError && artifacts.length === 0 && (
              <EmptyState type="artifacts" />
            )}
            {!isArtifactsLoading && !artifactsQuery.isError && artifacts.length > 0 && (
              <div className="animate-fade-in flex flex-col gap-2">
                {/* Artifact list header */}
                <div className="flex items-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <div className="w-8 shrink-0" />
                  <div className="w-44 shrink-0">Set · Slot</div>
                  <div className="w-20 shrink-0">Rarity · Lv</div>
                  <div className="w-20 shrink-0">Main Stat</div>
                  <div className="flex-1">Sub-stats</div>
                </div>
                {artifacts.map((a) => (
                  <ArtifactRow key={a.id} artifact={a} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
