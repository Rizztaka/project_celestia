/**
 * EndgamePage — Spiral Abyss Tracker (Milestone 5B)
 *
 * Allows the user to:
 *   1. Select or create an Abyss cycle (e.g. "5.0-1")
 *   2. Log which teams they used per chamber half (Floors 9-12, 3 chambers, 2 halves)
 *   3. Record 0-3 stars per chamber
 *   4. Auto-save via TanStack Query mutation — no "Save" button
 *
 * Architecture:
 *   - TanStack Query: owns server state (history, roster, mutations)
 *   - Local React state: UI state (selectedCycle, charPickerTarget, etc.)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { AbyssCycleResult, AbyssFloor, LogAbyssRunPayload, RosterCharacter } from '../lib/api';
import {
  fetchAbyssHistory,
  fetchGenshinRoster,
  logAbyssRun,
} from '../lib/api';
import { ApiError } from '../lib/api';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const FLOORS = [9, 10, 11, 12] as const;
const CHAMBERS = [1, 2, 3] as const;
const HALVES = [1, 2] as const;

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function formatName(key: string): string {
  // "HuTao" → "Hu Tao", "RaidenShogun" → "Raiden Shogun"
  return key.replace(/([A-Z])/g, ' $1').trim();
}

function StarRating({
  stars,
  onChange,
  disabled,
}: {
  stars: number;
  onChange: (s: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          title={`Set ${n} star${n > 1 ? 's' : ''}`}
          disabled={disabled}
          onClick={() => onChange(stars === n ? 0 : n)}
          className={`h-6 w-6 transition-transform hover:scale-125 disabled:cursor-not-allowed ${
            n <= stars ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <svg viewBox="0 0 24 24" fill={n <= stars ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------
// Character Picker Modal
// -------------------------------------------------------

interface CharPickerTarget {
  floor: number;
  chamber: number;
  half: 1 | 2;
  slotIndex: number;
}

function CharPickerModal({
  target,
  roster,
  currentTeam,
  onSelect,
  onClose,
}: {
  target: CharPickerTarget;
  roster: RosterCharacter[];
  currentTeam: string[];
  onSelect: (charKey: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = roster.filter((c) =>
    formatName(c.characterKey).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="mb-1 font-bold text-white">
          Pick Character
        </h3>
        <p className="mb-4 text-xs text-zinc-500">
          Floor {target.floor} · Chamber {target.chamber} · Half {target.half} · Slot {target.slotIndex + 1}
        </p>

        <input
          autoFocus
          type="text"
          placeholder="Search character…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
        />

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">No characters found.</p>
        ) : (
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
            {filtered.map((c) => {
              const isInTeam = currentTeam.includes(c.characterKey);
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.characterKey)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all hover:border-violet-500/40 hover:bg-violet-500/10 ${
                    isInTeam
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                      : 'border-white/10 bg-white/5 text-zinc-300'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-zinc-300">
                    {c.characterKey.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{formatName(c.characterKey)}</p>
                    <p className="text-xs text-zinc-500">Lv.{c.level}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Clear slot option */}
        <button
          onClick={() => onSelect('')}
          className="mt-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
        >
          Clear slot
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Team Slot
// -------------------------------------------------------

function TeamSlot({
  charKey,
  onClick,
  saving,
}: {
  charKey: string | undefined;
  onClick: () => void;
  saving?: boolean;
}) {
  const isEmpty = !charKey;
  return (
    <button
      onClick={onClick}
      title={isEmpty ? 'Pick a character' : formatName(charKey)}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-xl border text-xs font-bold transition-all hover:scale-105 hover:shadow-lg ${
        saving
          ? 'animate-pulse border-violet-500/60 bg-violet-500/20 text-violet-400'
          : isEmpty
            ? 'border-dashed border-white/20 bg-white/5 text-zinc-600 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-400'
            : 'border-violet-500/30 bg-violet-500/10 text-violet-300 hover:border-violet-400/50'
      }`}
    >
      {isEmpty ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ) : (
        <span>{charKey.slice(0, 2).toUpperCase()}</span>
      )}
    </button>
  );
}

// -------------------------------------------------------
// Half Row — one half of a chamber
// -------------------------------------------------------

function HalfRow({
  half,
  team,
  onSlotClick,
  saving,
}: {
  half: 1 | 2;
  team: string[];
  onSlotClick: (slotIndex: number) => void;
  saving: boolean;
}) {
  const slots = [0, 1, 2, 3];
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-xs font-medium text-zinc-500">Half {half}</span>
      <div className="flex gap-2">
        {slots.map((i) => (
          <TeamSlot
            key={i}
            charKey={team[i]}
            onClick={() => onSlotClick(i)}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Chamber Card
// -------------------------------------------------------

function ChamberCard({
  floor,
  chamberNum,
  cycleData,
  isSaving,
  onStarsChange,
  onSlotClick,
}: {
  floor: number;
  chamberNum: number;
  cycleData: AbyssCycleResult | null;
  isSaving: boolean;
  onStarsChange: (floor: number, chamber: number, stars: number) => void;
  onSlotClick: (target: CharPickerTarget) => void;
}) {
  const floorData = cycleData?.floors.find((f) => f.floor === floor);
  const chamberData = floorData?.chambers.find((c) => c.chamber === chamberNum);

  // Stars are stored on Half 1 (design decision from plan)
  const half1 = chamberData?.halves.find((h) => h.half === 1);
  const half2 = chamberData?.halves.find((h) => h.half === 2);

  const currentStars = half1?.stars ?? 0;
  const team1: string[] = half1?.team ?? [];
  const team2: string[] = half2?.team ?? [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-300">Chamber {chamberNum}</span>
        <StarRating
          stars={currentStars}
          onChange={(s) => onStarsChange(floor, chamberNum, s)}
          disabled={isSaving}
        />
      </div>
      <div className="space-y-2">
        {HALVES.map((half) => {
          const team = half === 1 ? team1 : team2;
          return (
            <HalfRow
              key={half}
              half={half}
              team={team}
              saving={isSaving}
              onSlotClick={(slotIndex) =>
                onSlotClick({ floor, chamber: chamberNum, half, slotIndex })
              }
            />
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Floor Section
// -------------------------------------------------------

function FloorSection({
  floor,
  cycleData,
  isSaving,
  onStarsChange,
  onSlotClick,
}: {
  floor: number;
  cycleData: AbyssCycleResult | null;
  isSaving: boolean;
  onStarsChange: (floor: number, chamber: number, stars: number) => void;
  onSlotClick: (target: CharPickerTarget) => void;
}) {
  const floorData = cycleData?.floors.find((f) => f.floor === floor);
  const floorStars = floorData?.totalStars ?? 0;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-lg font-bold text-violet-300">
            {floor}
          </div>
          <div>
            <h3 className="font-display font-bold text-white">Floor {floor}</h3>
            <p className="text-xs text-zinc-500">3 chambers · 2 halves each</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span className="font-bold text-amber-400">{floorStars}</span>
          <span className="text-zinc-600">/9</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CHAMBERS.map((chamber) => (
          <ChamberCard
            key={chamber}
            floor={floor}
            chamberNum={chamber}
            cycleData={cycleData}
            isSaving={isSaving}
            onStarsChange={onStarsChange}
            onSlotClick={onSlotClick}
          />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Add Cycle Modal
// -------------------------------------------------------

function AddCycleModal({
  onAdd,
  onClose,
}: {
  onAdd: (cycleId: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Cycle ID cannot be empty.');
      return;
    }
    // Basic format hint: version-half e.g. 5.0-1
    if (!/^\d+\.\d+-\d+$/.test(trimmed)) {
      setError('Use format like "5.0-1" (version-half).');
      return;
    }
    onAdd(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 font-bold text-white">Add Abyss Cycle</h3>
        <p className="mb-4 text-xs text-zinc-500">
          Enter the game version + reset half. e.g. <span className="text-violet-400">5.0-1</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="5.0-1"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Add Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Main Page
// -------------------------------------------------------

export default function EndgamePage() {
  const queryClient = useQueryClient();

  // ── Local UI state ──────────────────────────────────────
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [charPickerTarget, setCharPickerTarget] = useState<CharPickerTarget | null>(null);
  const [showAddCycleModal, setShowAddCycleModal] = useState(false);

  // ── Server state ────────────────────────────────────────
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['abyssHistory'],
    queryFn: fetchAbyssHistory,
    // Select the first cycle on first load if none chosen
    select: (data) => data,
  });

  const {
    data: rosterData,
    isLoading: rosterLoading,
  } = useQuery({
    queryKey: ['roster'],
    queryFn: fetchGenshinRoster,
  });

  const mutation = useMutation({
    mutationFn: logAbyssRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abyssHistory'] });
    },
  });

  // ── Derived state ───────────────────────────────────────
  const cycles = historyData?.cycles ?? [];

  // Auto-select first cycle if none selected and data arrives
  const effectiveCycleId = selectedCycleId ?? cycles[0]?.cycleId ?? null;
  const cycleData = cycles.find((c) => c.cycleId === effectiveCycleId) ?? null;

  const roster = rosterData?.characters ?? [];

  // ── Handlers ─────────────────────────────────────────────

  function handleStarsChange(floor: number, chamber: number, stars: number) {
    if (!effectiveCycleId) return;
    mutation.mutate({
      cycleId: effectiveCycleId,
      floor,
      chamber,
      half: 1,
      stars,
      team: getExistingTeam(floor, chamber, 1),
    });
  }

  function handleCharSelect(charKey: string) {
    if (!charPickerTarget || !effectiveCycleId) return;
    const { floor, chamber, half, slotIndex } = charPickerTarget;
    const existingTeam = getExistingTeam(floor, chamber, half);
    const newTeam = [...existingTeam];
    if (charKey === '') {
      newTeam.splice(slotIndex, 1);
    } else {
      newTeam[slotIndex] = charKey;
    }

    mutation.mutate({
      cycleId: effectiveCycleId,
      floor,
      chamber,
      half,
      stars: getExistingStars(floor, chamber),
      team: newTeam.filter(Boolean),
    });
    setCharPickerTarget(null);
  }

  function handleAddCycle(cycleId: string) {
    setSelectedCycleId(cycleId);
    setShowAddCycleModal(false);
    // No API call needed yet — it will be created on first logAbyssRun for this cycle
  }

  function getExistingTeam(floor: number, chamber: number, half: 1 | 2): string[] {
    const floorData = cycleData?.floors.find((f) => f.floor === floor);
    const chamberData = floorData?.chambers.find((c) => c.chamber === chamber);
    const halfData = chamberData?.halves.find((h) => h.half === half);
    return halfData?.team ?? [];
  }

  function getExistingStars(floor: number, chamber: number): number {
    const floorData = cycleData?.floors.find((f) => f.floor === floor);
    const chamberData = floorData?.chambers.find((c) => c.chamber === chamber);
    const half1 = chamberData?.halves.find((h) => h.half === 1);
    return half1?.stars ?? 0;
  }

  // ── Charger picker current team ──────────────────────────
  const charPickerCurrentTeam = charPickerTarget
    ? getExistingTeam(charPickerTarget.floor, charPickerTarget.chamber, charPickerTarget.half)
    : [];

  // ── Loading / Error states ───────────────────────────────
  if (historyLoading || rosterLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading Endgame Center…</p>
        </div>
      </div>
    );
  }

  if (historyError && historyError instanceof ApiError && historyError.status === 404) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold text-white">No Account Found</h2>
        <p className="max-w-sm text-sm text-zinc-400">
          Import your game data first before using the Endgame Center.
        </p>
        <Link to="/import" className="mt-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
          Go to Import
        </Link>
      </div>
    );
  }

  const totalStars = cycleData?.totalStars ?? 0;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-300">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-64 -top-64 h-[600px] w-[600px] rounded-full bg-violet-900/10 blur-[120px]" />
        <div className="absolute -bottom-64 -right-64 h-[600px] w-[600px] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="glass-panel sticky top-0 z-40 flex items-center justify-between border-b-0 border-white/10 px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <span className="font-display text-gradient text-lg font-bold tracking-tight">
          Endgame Center
        </span>
        <div className="w-24 text-right">
          {mutation.isPending && (
            <span className="animate-pulse text-xs text-violet-400">Saving…</span>
          )}
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Spiral Abyss
          </h1>
          <p className="mt-2 text-zinc-400">
            Track your teams and star ratings for each chamber.
          </p>
        </div>

        {/* Cycle selector + stats bar */}
        <div className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-zinc-400">Cycle</label>
            {cycles.length > 0 ? (
              <select
                value={effectiveCycleId ?? ''}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-500/60"
              >
                {cycles.map((c) => (
                  <option key={c.cycleId} value={c.cycleId}>
                    {c.cycleId}
                  </option>
                ))}
                {/* If we have a pending new cycle that isn't in history yet */}
                {selectedCycleId && !cycles.find((c) => c.cycleId === selectedCycleId) && (
                  <option value={selectedCycleId}>{selectedCycleId} (new)</option>
                )}
              </select>
            ) : effectiveCycleId ? (
              <span className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-300">
                {effectiveCycleId} (new)
              </span>
            ) : (
              <span className="text-sm text-zinc-500">No cycles yet</span>
            )}
            <button
              onClick={() => setShowAddCycleModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-sm text-zinc-400 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Cycle
            </button>
          </div>

          {/* Star totals */}
          {effectiveCycleId && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(totalStars / 12) ? 'text-amber-400' : 'text-zinc-700'}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-bold text-amber-400">{totalStars}</span>
              <span className="text-sm text-zinc-600">/ 36</span>
            </div>
          )}
        </div>

        {/* Floors */}
        {effectiveCycleId ? (
          <div className="space-y-4">
            {FLOORS.map((floor) => (
              <FloorSection
                key={floor}
                floor={floor}
                cycleData={cycleData}
                isSaving={mutation.isPending}
                onStarsChange={handleStarsChange}
                onSlotClick={setCharPickerTarget}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="mb-2 font-bold text-white">No Cycle Selected</h3>
            <p className="mb-4 max-w-xs text-sm text-zinc-500">
              Add your first Abyss cycle to start tracking your teams and star ratings.
            </p>
            <button
              onClick={() => setShowAddCycleModal(true)}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Add First Cycle
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {charPickerTarget && (
        <CharPickerModal
          target={charPickerTarget}
          roster={roster}
          currentTeam={charPickerCurrentTeam}
          onSelect={handleCharSelect}
          onClose={() => setCharPickerTarget(null)}
        />
      )}
      {showAddCycleModal && (
        <AddCycleModal
          onAdd={handleAddCycle}
          onClose={() => setShowAddCycleModal(false)}
        />
      )}
    </div>
  );
}
