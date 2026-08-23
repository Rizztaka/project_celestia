/**
 * EndgamePage — Endgame Center (Milestones 5A + 5D)
 *
 * Houses two trackers toggled via a Tab bar:
 *   1. ABYSS — Spiral Abyss Tracker (Milestone 5A)
 *   2. THEATER — Imaginarium Theater Tracker (Milestone 5D)
 *
 * Architecture:
 *   - TanStack Query: owns server state (history, roster, mutations)
 *   - Local React state: UI state (selected season/cycle, pickers, etc.)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  AbyssCycleResult,
  LogAbyssRunPayload,
  LogTheaterRunPayload,
  RosterCharacter,
  TheaterDifficulty,
  TheaterRun,
} from '../lib/api';
import {
  ApiError,
  fetchAbyssHistory,
  fetchGenshinRoster,
  fetchTheaterHistory,
  logAbyssRun,
  logTheaterRun,
} from '../lib/api';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const FLOORS = [9, 10, 11, 12] as const;
const CHAMBERS = [1, 2, 3] as const;
const HALVES = [1, 2] as const;

const DIFFICULTY_CONFIG: Record<
  TheaterDifficulty,
  { label: string; color: string; border: string; bg: string; glow: string }
> = {
  EASY: {
    label: 'Easy',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/15',
    glow: 'shadow-emerald-500/20',
  },
  NORMAL: {
    label: 'Normal',
    color: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/15',
    glow: 'shadow-sky-500/20',
  },
  HARD: {
    label: 'Hard',
    color: 'text-violet-400',
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/15',
    glow: 'shadow-violet-500/20',
  },
  VISIONARY: {
    label: 'Visionary',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/15',
    glow: 'shadow-amber-500/20',
  },
};

/** Generate the last 6 months as seasonId strings, e.g. "August 2024". */
function generateSeasonOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(
      d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    );
  }
  return options;
}

const SEASON_OPTIONS = generateSeasonOptions();

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function formatName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

// -------------------------------------------------------
// Shared: Character Picker Modal
// -------------------------------------------------------

interface AbyssPickerTarget {
  kind: 'ABYSS';
  floor: number;
  chamber: number;
  half: 1 | 2;
  slotIndex: number;
}

interface TheaterPickerTarget {
  kind: 'THEATER';
  slotIndex: number;
}

type CharPickerTarget = AbyssPickerTarget | TheaterPickerTarget;

function CharPickerModal({
  target,
  roster,
  currentCast,
  onSelect,
  onClose,
}: {
  target: CharPickerTarget;
  roster: RosterCharacter[];
  currentCast: string[];
  onSelect: (charKey: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = roster.filter((c) =>
    formatName(c.characterKey).toLowerCase().includes(search.toLowerCase()),
  );

  const subtitle =
    target.kind === 'ABYSS'
      ? `Floor ${target.floor} · Chamber ${target.chamber} · Half ${target.half} · Slot ${target.slotIndex + 1}`
      : `Cast Slot ${target.slotIndex + 1}`;

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
        <h3 className="mb-1 font-bold text-white">Pick Character</h3>
        <p className="mb-4 text-xs text-zinc-500">{subtitle}</p>

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
              const isInCast = currentCast.includes(c.characterKey);
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.characterKey)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all hover:border-violet-500/40 hover:bg-violet-500/10 ${
                    isInCast
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
// Abyss: StarRating
// -------------------------------------------------------

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
// Abyss: TeamSlot
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
// Abyss: HalfRow
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
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-xs font-medium text-zinc-500">Half {half}</span>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
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
// Abyss: ChamberCard
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
  onSlotClick: (target: AbyssPickerTarget) => void;
}) {
  const floorData = cycleData?.floors.find((f) => f.floor === floor);
  const chamberData = floorData?.chambers.find((c) => c.chamber === chamberNum);
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
                onSlotClick({ kind: 'ABYSS', floor, chamber: chamberNum, half, slotIndex })
              }
            />
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Abyss: FloorSection
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
  onSlotClick: (target: AbyssPickerTarget) => void;
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
// Abyss: AddCycleModal
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
// Theater: CastSlot
// -------------------------------------------------------

function CastSlot({
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
      title={isEmpty ? 'Add to cast' : formatName(charKey)}
      className={`group relative flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold transition-all hover:scale-105 hover:shadow-lg ${
        saving
          ? 'animate-pulse border-amber-500/50 bg-amber-500/15 text-amber-400'
          : isEmpty
            ? 'border-dashed border-white/20 bg-white/5 text-zinc-600 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/50'
      }`}
    >
      {isEmpty ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ) : (
        <>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[11px]">
            {charKey.slice(0, 2).toUpperCase()}
          </span>
          <span className="max-w-[48px] truncate leading-none text-amber-300/80">
            {formatName(charKey).split(' ')[0]}
          </span>
        </>
      )}
    </button>
  );
}

// -------------------------------------------------------
// Theater: NumberStepper
// -------------------------------------------------------

function NumberStepper({
  value,
  min,
  max,
  onChange,
  label,
  accentColor,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  accentColor: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className={`min-w-[2.5rem] text-center font-display text-3xl font-bold ${accentColor}`}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <span className="text-xs text-zinc-600">/ {max}</span>
    </div>
  );
}

// -------------------------------------------------------
// Theater: TheaterView
// -------------------------------------------------------

function TheaterView({ roster }: { roster: RosterCharacter[] }) {
  const queryClient = useQueryClient();

  const [selectedSeason, setSelectedSeason] = useState<string>(SEASON_OPTIONS[0]);
  const [charPickerTarget, setCharPickerTarget] = useState<TheaterPickerTarget | null>(null);

  const { data: theaterData, isLoading } = useQuery({
    queryKey: ['theaterHistory'],
    queryFn: fetchTheaterHistory,
  });

  const mutation = useMutation({
    mutationFn: logTheaterRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theaterHistory'] });
    },
  });

  const runs = theaterData?.runs ?? [];
  const currentRun: TheaterRun | undefined = runs.find((r) => r.seasonId === selectedSeason);

  // Local draft state — mirrors saved values, updated optimistically
  const [difficulty, setDifficulty] = useState<TheaterDifficulty>('VISIONARY');
  const [actsCleared, setActsCleared] = useState(10);
  const [stars, setStars] = useState(10);
  const [cast, setCast] = useState<string[]>([]);

  // Sync local state when the selected season changes or data loads
  const [lastSyncedSeason, setLastSyncedSeason] = useState('');
  if ((currentRun || selectedSeason !== lastSyncedSeason) && lastSyncedSeason !== selectedSeason) {
    setLastSyncedSeason(selectedSeason);
    if (currentRun) {
      setDifficulty(currentRun.difficulty);
      setActsCleared(currentRun.actsCleared);
      setStars(currentRun.stars);
      setCast(currentRun.cast);
    } else {
      setDifficulty('VISIONARY');
      setActsCleared(10);
      setStars(10);
      setCast([]);
    }
  }

  function save(overrides: Partial<LogTheaterRunPayload> = {}) {
    mutation.mutate({
      seasonId: selectedSeason,
      difficulty,
      actsCleared,
      stars,
      cast: cast.filter(Boolean),
      ...overrides,
    });
  }

  function handleDifficultyChange(d: TheaterDifficulty) {
    setDifficulty(d);
    save({ difficulty: d });
  }

  function handleActsChange(v: number) {
    setActsCleared(v);
    save({ actsCleared: v });
  }

  function handleStarsChange(v: number) {
    setStars(v);
    save({ stars: v });
  }

  function handleCharSelect(charKey: string) {
    if (!charPickerTarget) return;
    const { slotIndex } = charPickerTarget;
    const newCast = [...cast];
    if (charKey === '') {
      newCast.splice(slotIndex, 1);
    } else {
      newCast[slotIndex] = charKey;
    }
    const filtered = newCast.filter(Boolean);
    setCast(filtered);
    save({ cast: filtered });
    setCharPickerTarget(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const activeDiff = DIFFICULTY_CONFIG[difficulty];
  // Build 12 cast slots
  const castSlots = Array.from({ length: 12 }, (_, i) => cast[i]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Season selector */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-zinc-400">Season</label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500/60"
          >
            {SEASON_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {currentRun ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              Saved
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
              New run
            </span>
          )}
        </div>
        {mutation.isPending && (
          <span className="animate-pulse text-xs text-amber-400">Saving…</span>
        )}
      </div>

      {/* Difficulty Selector */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Difficulty</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(DIFFICULTY_CONFIG) as TheaterDifficulty[]).map((d) => {
            const cfg = DIFFICULTY_CONFIG[d];
            const isActive = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                disabled={mutation.isPending}
                className={`group relative overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] disabled:cursor-not-allowed ${
                  isActive
                    ? `${cfg.border} ${cfg.bg} ${cfg.color} shadow-lg ${cfg.glow}`
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 ${cfg.bg} opacity-50 blur-xl`} />
                )}
                <span className="relative">{cfg.label}</span>
                {isActive && (
                  <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Performance — Acts + Stars */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-500">Performance</h3>
        <div className="flex flex-wrap items-center justify-around gap-8">
          <NumberStepper
            value={actsCleared}
            min={1}
            max={10}
            onChange={handleActsChange}
            label="Acts Cleared"
            accentColor={activeDiff.color}
            disabled={mutation.isPending}
          />
          <div className="h-16 w-px bg-white/10" />
          <NumberStepper
            value={stars}
            min={0}
            max={10}
            onChange={handleStarsChange}
            label="Stars / Medals"
            accentColor="text-amber-400"
            disabled={mutation.isPending}
          />
        </div>
      </div>

      {/* Cast Grid */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Principal Cast</h3>
          <span className="text-xs text-zinc-600">{cast.filter(Boolean).length} / 12 characters</span>
        </div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
          {castSlots.map((charKey, i) => (
            <CastSlot
              key={i}
              charKey={charKey}
              onClick={() => setCharPickerTarget({ kind: 'THEATER', slotIndex: i })}
              saving={mutation.isPending}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Click a slot to assign a character from your roster to this season's Theater cast.
        </p>
      </div>

      {/* History panel */}
      {runs.length > 1 && (
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Past Seasons</h3>
          <div className="space-y-3">
            {runs
              .filter((r) => r.seasonId !== selectedSeason)
              .map((r) => {
                const cfg = DIFFICULTY_CONFIG[r.difficulty];
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedSeason(r.seasonId)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/10"
                  >
                    <div>
                      <p className="font-medium text-white">{r.seasonId}</p>
                      <p className={`text-xs ${cfg.color}`}>{cfg.label} · {r.actsCleared}/10 Acts</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      <span className="font-bold text-amber-400">{r.stars}</span>
                      <span className="text-zinc-600">/10</span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Character Picker Modal */}
      {charPickerTarget && (
        <CharPickerModal
          target={charPickerTarget}
          roster={roster}
          currentCast={cast}
          onSelect={handleCharSelect}
          onClose={() => setCharPickerTarget(null)}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------
// Abyss: AbyssView
// -------------------------------------------------------

function AbyssView({ roster }: { roster: RosterCharacter[] }) {
  const queryClient = useQueryClient();

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [charPickerTarget, setCharPickerTarget] = useState<AbyssPickerTarget | null>(null);
  const [showAddCycleModal, setShowAddCycleModal] = useState(false);

  const { data: historyData } = useQuery({
    queryKey: ['abyssHistory'],
    queryFn: fetchAbyssHistory,
  });

  const mutation = useMutation({
    mutationFn: logAbyssRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abyssHistory'] });
    },
  });

  const cycles = historyData?.cycles ?? [];
  const effectiveCycleId = selectedCycleId ?? cycles[0]?.cycleId ?? null;
  const cycleData = cycles.find((c) => c.cycleId === effectiveCycleId) ?? null;
  const totalStars = cycleData?.totalStars ?? 0;

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

  const charPickerCurrentTeam = charPickerTarget
    ? getExistingTeam(charPickerTarget.floor, charPickerTarget.chamber, charPickerTarget.half)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cycle selector + stats bar */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
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

      {/* Modals */}
      {charPickerTarget && (
        <CharPickerModal
          target={charPickerTarget}
          roster={roster}
          currentCast={charPickerCurrentTeam}
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

// -------------------------------------------------------
// Main Page
// -------------------------------------------------------

type ActiveMode = 'ABYSS' | 'THEATER';

const MODE_CONFIG: Record<ActiveMode, { label: string; icon: React.ReactNode; accent: string }> = {
  ABYSS: {
    label: 'Spiral Abyss',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: 'text-violet-400',
  },
  THEATER: {
    label: 'Imaginarium Theater',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    accent: 'text-amber-400',
  },
};

export default function EndgamePage() {
  const [activeMode, setActiveMode] = useState<ActiveMode>('ABYSS');

  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ['roster'],
    queryFn: fetchGenshinRoster,
  });

  // We also need abyssHistory to check for 404 (no account)
  const { isLoading: abyssLoading, error: abyssError } = useQuery({
    queryKey: ['abyssHistory'],
    queryFn: fetchAbyssHistory,
  });

  if (abyssLoading || rosterLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading Endgame Center…</p>
        </div>
      </div>
    );
  }

  if (abyssError && abyssError instanceof ApiError && abyssError.status === 404) {
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

  const roster = rosterData?.characters ?? [];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-300">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-64 -top-64 h-[600px] w-[600px] rounded-full bg-violet-900/10 blur-[120px]" />
        <div className="absolute -bottom-64 -right-64 h-[600px] w-[600px] rounded-full bg-amber-900/8 blur-[120px]" />
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
        <div className="w-24" />
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Phase 5 · Endgame Center</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
            {MODE_CONFIG[activeMode].label}
          </h1>
          <p className="mt-2 text-zinc-400">
            {activeMode === 'ABYSS'
              ? 'Track your teams and star ratings for each chamber.'
              : 'Log your season runs, difficulty, acts cleared, and principal cast.'}
          </p>
        </div>

        {/* Mode Tab Bar */}
        <div className="mb-8 flex gap-2 rounded-2xl border border-white/10 bg-white/3 p-1.5">
          {(Object.keys(MODE_CONFIG) as ActiveMode[]).map((mode) => {
            const cfg = MODE_CONFIG[mode];
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={isActive ? cfg.accent : ''}>{cfg.icon}</span>
                {cfg.label}
                {isActive && (
                  <span className={`absolute bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full ${
                    mode === 'ABYSS' ? 'bg-violet-500' : 'bg-amber-500'
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active View */}
        {activeMode === 'ABYSS' ? (
          <AbyssView roster={roster} />
        ) : (
          <TheaterView roster={roster} />
        )}
      </main>
    </div>
  );
}
