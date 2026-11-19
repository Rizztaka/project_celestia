import React, { useState, useMemo, useEffect, useTransition, useRef } from 'react';
import type {
  Character,
  Element,
  TheaterDifficulty,
  TheaterActPlan,
  TheaterSeasonConfig,
  OwnedCharacterProfile,
} from '../types/genshin';
import {
  THEATER_SEASONS,
  THEATER_DIFFICULTIES,
  THEATER_BOSS_INFO,
  createCustomSeason,
  DEFAULT_ACTIVE_THEATER_SEASON_ID,
} from '../data/theater-seasons';
import { CHARACTERS } from '../data/characters';
import { DataFreshnessBadge } from './DataFreshnessBadge';
import {
  filterEligibleTheaterRoster,
  swapTheaterActMember,
  removeTheaterActMember,
  evaluateBossActMatchup,
  recommendSupportCastBorrow,
} from '../engines/theater-solver';
import { isSameCharacterOrTraveler } from '../engines/team-rules';
import { dispatchAutoDraftTheater } from '../services/solver-dispatcher';
import { CharacterPortrait } from './CharacterPortrait';
import { LazyCharacterDetailModal } from './LazyCharacterDetailModal';
import {
  Sparkles,
  Swords,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  X,
  Crown,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';

interface ImaginariumTheaterViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
}

const ALL_ELEMENTS: Element[] = [
  'Pyro',
  'Hydro',
  'Anemo',
  'Electro',
  'Dendro',
  'Cryo',
  'Geo',
];

const ELEMENT_BADGES: Record<Element, { bg: string; text: string; border: string }> = {
  Pyro: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Hydro: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  Anemo: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Electro: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Dendro: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Cryo: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Geo: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

export const ImaginariumTheaterView: React.FC<ImaginariumTheaterViewProps> = ({
  ownedIds,
  profiles,
}) => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    DEFAULT_ACTIVE_THEATER_SEASON_ID
  );
  const [customElements, setCustomElements] = useState<Element[]>(['Pyro', 'Hydro', 'Anemo']);
  const [difficulty, setDifficulty] = useState<TheaterDifficulty>('Visionary');
  const [schedule, setSchedule] = useState<TheaterActPlan[]>([]);
  const [vigorState, setVigorState] = useState<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [shortfallSuggestions, setShortfallSuggestions] = useState<Character[]>([]);
  const [lockedActNumbers, setLockedActNumbers] = useState<Set<number>>(new Set());
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [borrowedCharId, setBorrowedCharId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Swap / Add modal state
  const [swapTarget, setSwapTarget] = useState<{
    actNumber: number;
    oldChar: Character | null;
  } | null>(null);

  // Active Season Config
  const activeSeason: TheaterSeasonConfig = useMemo(() => {
    if (selectedSeasonId === 'custom') {
      return createCustomSeason(customElements);
    }
    const found = THEATER_SEASONS.find((s) => s.id === selectedSeasonId);
    return found || THEATER_SEASONS[0];
  }, [selectedSeasonId, customElements]);

  // Filter roster with trial cast integration, profile level, and Level 70 gate for Visionary
  const filteredRoster = useMemo(() => {
    return filterEligibleTheaterRoster(ownedIds, activeSeason, profiles, difficulty);
  }, [ownedIds, activeSeason, profiles, difficulty]);

  // Support Cast Borrow recommendations (top 3 unowned characters matching element/guest)
  const recommendedBorrows = useMemo(() => {
    return recommendSupportCastBorrow(filteredRoster.eligible, activeSeason, ownedIds);
  }, [filteredRoster.eligible, activeSeason, ownedIds]);

  // Effective eligible cast including borrowed friend character
  const effectiveEligible = useMemo(() => {
    if (!borrowedCharId) return filteredRoster.eligible;
    const borrowedChar = CHARACTERS.find((c) => c.id === borrowedCharId);
    if (!borrowedChar || filteredRoster.eligible.some((c) => c.id === borrowedCharId)) {
      return filteredRoster.eligible;
    }
    return [borrowedChar, ...filteredRoster.eligible];
  }, [filteredRoster.eligible, borrowedCharId]);

  // Generate initial or updated schedule respecting user-locked acts via Web Worker
  const handleGenerateSchedule = (currentLocked = lockedActNumbers) => {
    const userLocks: Record<number, string[]> = {};
    for (const actNum of currentLocked) {
      const existingAct = schedule.find((a) => a.actNumber === actNum);
      if (existingAct && existingAct.team.length > 0) {
        userLocks[actNum] = existingAct.team.map((m) => m.id);
      }
    }

    dispatchAutoDraftTheater(
      effectiveEligible,
      difficulty,
      activeSeason,
      Object.keys(userLocks).length > 0 ? userLocks : undefined,
      profiles,
    ).then((res) => {
      startTransition(() => {
        const actsWithLocks = res.acts.map((a) => ({
          ...a,
          isLocked: currentLocked.has(a.actNumber),
        }));

        setSchedule(actsWithLocks);
        setVigorState(res.vigorState);
        setValidationErrors(res.validationErrors);
        setShortfallSuggestions(res.shortfallSuggestions || []);
      });
    });
  };

  // Serialized key of eligible IDs to detect any roster composition shift even with identical count
  const eligibleKey = useMemo(
    () => effectiveEligible.map((c) => c.id).sort().join(','),
    [effectiveEligible],
  );

  const isInitialMount = useRef(true);

  // Clear borrowed character when season changes
  useEffect(() => {
    setBorrowedCharId(null);
  }, [activeSeason.id]);

  // Re-generate schedule when season or difficulty fundamentally shifts
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      handleGenerateSchedule(new Set());
      return;
    }
    setLockedActNumbers(new Set());
    handleGenerateSchedule(new Set());
  }, [activeSeason.id, difficulty]);

  // Re-generate schedule while preserving user locks when roster or borrowed character shifts
  useEffect(() => {
    if (isInitialMount.current) return;
    handleGenerateSchedule(lockedActNumbers);
  }, [eligibleKey]);

  const diffConfig = THEATER_DIFFICULTIES[difficulty];
  const requiredChars = diffConfig.requiredCharacters;
  const isShortfall = filteredRoster.eligible.length < requiredChars;

  // Toggle lock on an act
  const handleToggleLock = (actNumber: number) => {
    setLockedActNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(actNumber)) {
        next.delete(actNumber);
      } else {
        next.add(actNumber);
      }
      setSchedule((curr) =>
        curr.map((a) => (a.actNumber === actNumber ? { ...a, isLocked: next.has(actNumber) } : a)),
      );
      return next;
    });
  };

  // Toggle custom element selection (max 3)
  const handleToggleCustomElement = (elem: Element) => {
    if (customElements.includes(elem)) {
      if (customElements.length > 1) {
        setCustomElements(customElements.filter((e) => e !== elem));
      }
    } else {
      if (customElements.length < 3) {
        setCustomElements([...customElements, elem]);
      } else {
        setCustomElements([...customElements.slice(1), elem]);
      }
    }
  };

  // Handle character swap or addition from modal
  const handlePerformSwap = (newCharId: string) => {
    if (!swapTarget) return;
    setModalError(null);

    const res = swapTheaterActMember(
      schedule,
      swapTarget.actNumber,
      swapTarget.oldChar ? swapTarget.oldChar.id : '',
      newCharId,
      vigorState,
    );

    if (res.error) {
      setModalError(res.error);
      return;
    }

    const actsWithLock = res.acts.map((a) => {
      const isTarget = a.actNumber === swapTarget.actNumber;
      const updated = isTarget ? { ...a, isLocked: true } : a;
      if (updated.bossName) {
        updated.bossMatchup = evaluateBossActMatchup(updated.team, updated.bossName);
      }
      return updated;
    });
    setSchedule(actsWithLock);
    setVigorState(res.vigorState);
    setLockedActNumbers((prev) => new Set(prev).add(swapTarget.actNumber));
    setSwapTarget(null);
  };

  // Handle removing a member from an act
  const handleRemoveMember = (actNumber: number, charId: string) => {
    const res = removeTheaterActMember(schedule, actNumber, charId, vigorState);
    if (!res.error) {
      const actsWithLock = res.acts.map((a) => {
        const isTarget = a.actNumber === actNumber;
        const updated = isTarget ? { ...a, isLocked: true } : a;
        if (updated.bossName) {
          updated.bossMatchup = evaluateBossActMatchup(updated.team, updated.bossName);
        }
        return updated;
      });
      setSchedule(actsWithLock);
      setVigorState(res.vigorState);
      setLockedActNumbers((prev) => new Set(prev).add(actNumber));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#171a2b] via-[#1f243d] to-[#171a2b] p-6 rounded-2xl border border-[#2b3355] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,#d4af37,transparent_70%)]" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
              <Crown className="w-4 h-4" />
              <span>Visionary Mode Solver · 2-Vigor Act Planner</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              Imaginarium Theater
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Curate multi-act combat paths with strict 2-Vigor endurance tracking, boss reservation heuristics, act pin/lock controls, and slot swap management.
            </p>
          </div>

          <button
            onClick={() => handleGenerateSchedule()}
            className="flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b38f2a] hover:from-[#e5be3c] hover:to-[#c49e31] text-[#0f111a] font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Auto-Draft & Schedule</span>
          </button>
        </div>

        {/* Season & Difficulty Control Bar */}
        <div className="mt-6 pt-5 border-t border-[#2a314f] flex flex-wrap items-center justify-between gap-4">
          {/* Season Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Cycle:
            </span>
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="bg-[#121422] border border-[#2e375c] text-zinc-200 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#d4af37]"
            >
              <optgroup label="Active Seasons (Version 7.x)">
                {THEATER_SEASONS.filter((s) => s.id.startsWith('season-7')).map((s) => (
                  <option key={s.id} value={s.id} className="text-[#d4af37]">
                    ⭐ {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Historical Archive (Version 5.x)">
                {THEATER_SEASONS.filter((s) => !s.id.startsWith('season-7')).map((s) => (
                  <option key={s.id} value={s.id} className="text-zinc-300">
                    {s.name}
                  </option>
                ))}
              </optgroup>
              <option value="custom" className="text-amber-300 font-bold">⚙️ Custom Element Cycle...</option>
            </select>

            {/* Elements Display */}
            <div className="flex items-center gap-1.5 ml-1">
              {activeSeason.elements.map((elem) => {
                const style = ELEMENT_BADGES[elem];
                return (
                  <span
                    key={elem}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {elem}
                  </span>
                );
              })}
            </div>

            {/* Freshness Badge */}
            <DataFreshnessBadge datasetId={activeSeason.id} className="ml-1" />
          </div>

          {/* Difficulty Toggle Pills */}
          <div className="flex items-center gap-1.5 bg-[#121422] p-1 rounded-xl border border-[#2b3353]">
            {(['Normal', 'Hard', 'Visionary'] as TheaterDifficulty[]).map((mode) => {
              const acts = THEATER_DIFFICULTIES[mode].acts;
              const chars = THEATER_DIFFICULTIES[mode].requiredCharacters;
              const isActive = difficulty === mode;

              return (
                <button
                  key={mode}
                  onClick={() => setDifficulty(mode)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#d4af37] text-zinc-950 shadow-md font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{mode}</span>
                  <span className={`text-[10px] ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`}>
                    ({acts} Acts · {chars} Chars)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Element Selector Drawer */}
        {selectedSeasonId === 'custom' && (
          <div className="mt-4 p-3 bg-[#111320] border border-[#2c3355] rounded-xl flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold">
              Select 3 Season Elements:
            </span>
            {ALL_ELEMENTS.map((elem) => {
              const isSelected = customElements.includes(elem);
              const style = ELEMENT_BADGES[elem];
              return (
                <button
                  key={elem}
                  onClick={() => handleToggleCustomElement(elem)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? `${style.bg} ${style.text} ${style.border} ring-1 ring-[#d4af37]`
                      : 'bg-[#181b2a] text-zinc-400 border-[#262c44] hover:text-zinc-200'
                  }`}
                >
                  {elem}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Shortfall or Error Alert Banner */}
      {(isShortfall || validationErrors.length > 0) && (
        <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-300">
                Roster Shortfall for {difficulty} Mode ({filteredRoster.eligible.length} / {requiredChars} Characters)
              </div>
              {validationErrors.map((err, idx) => (
                <div key={idx} className="text-zinc-300">
                  {err}
                </div>
              ))}
              <div className="text-zinc-400">
                The auto-draft below provides best-effort assignments with your currently available roster.
              </div>
            </div>
          </div>

          {/* Shortfall Recommendations */}
          {shortfallSuggestions.length > 0 && (
            <div className="pt-2 border-t border-amber-500/20">
              <div className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-2">
                Recommended Characters to Unlock / Level for this Season:
              </div>
              <div className="flex flex-wrap gap-2">
                {shortfallSuggestions.map((sug) => {
                  const style = ELEMENT_BADGES[sug.element];
                  return (
                    <button
                      key={sug.id}
                      onClick={() => setSelectedCharacter(sug)}
                      className="flex items-center gap-1.5 bg-[#141726] hover:bg-[#1f243b] border border-[#2b3353] hover:border-[#d4af37]/60 p-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <CharacterPortrait
                        src={sug.icon}
                        name={sug.name}
                        element={sug.element}
                        rarity={sug.rarity}
                        size="xs"
                      />
                      <div className="text-left pr-1">
                        <div className="text-xs font-bold text-zinc-200 leading-none">
                          {sug.name}
                        </div>
                        <div className={`text-[10px] ${style.text} font-medium mt-0.5`}>
                          {sug.roles[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Support Cast Borrow Recommendation Banner */}
      <div className="bg-gradient-to-r from-[#151726] via-[#1a1d30] to-[#151726] border border-[#2b3352] rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222842] pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#d4af37]" />
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
                <span>Support Cast Borrow Advisor</span>
                <span className="text-[10px] font-mono text-[#d4af37] bg-[#161a2b] border border-[#d4af37]/30 px-2 py-0.5 rounded-full lowercase">
                  1 Friend Slot Available
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Borrow a high-impact carry or support character from friends to conquer this season's apex boss mechanics.
              </p>
            </div>
          </div>

          {borrowedCharId && (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">
                Active Borrow: {CHARACTERS.find((c) => c.id === borrowedCharId)?.name}
              </span>
              <button
                type="button"
                onClick={() => setBorrowedCharId(null)}
                className="text-zinc-400 hover:text-rose-300 ml-1 cursor-pointer"
                title="Return borrowed character"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Top 3 Borrow Recommendations */}
        {recommendedBorrows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {recommendedBorrows.map((char) => {
              const isBorrowed = borrowedCharId === char.id;
              const color = ELEMENT_BADGES[char.element] || {
                bg: 'bg-zinc-800',
                text: 'text-zinc-200',
                border: 'border-zinc-700',
              };

              return (
                <div
                  key={char.id}
                  className={`bg-[#111320] border rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-all ${
                    isBorrowed
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/40'
                      : 'border-[#232942] hover:border-[#d4af37]/50'
                  }`}
                >
                  <div
                    onClick={() => setSelectedCharacter(char)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <CharacterPortrait
                      src={char.icon}
                      name={char.name}
                      element={char.element}
                      rarity={char.rarity}
                      size="sm"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-zinc-100 truncate">
                        {char.name}
                      </div>
                      <div className={`text-[10px] ${color.text} font-medium`}>
                        {char.element} · {char.roles[0]}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                        {char.roles.slice(1).join(', ') || char.weapon}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBorrowedCharId(isBorrowed ? null : char.id)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isBorrowed
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#1b2034] hover:bg-[#272e4b] text-[#d4af37] border border-[#d4af37]/30'
                    }`}
                  >
                    {isBorrowed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Borrowed (Active)</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Borrow Character</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-zinc-400 italic py-1">
            Your roster already possesses all premier characters eligible for this season.
          </div>
        )}
      </div>

      {/* Eligible Roster & Vigor Strip */}
      <div className="bg-[#12141e] border border-[#21263c] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1d2236] pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Eligible Theater Cast & Vigor Gauge
            </h2>
            <span className="text-xs bg-[#1a1e30] text-zinc-400 font-mono px-2 py-0.5 rounded-full border border-[#272e48]">
              {effectiveEligible.length} Available
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              <span>2 Vigor</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>1 Vigor</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Exhausted (0)</span>
            </span>
          </div>
        </div>

        {/* Scrollable Cast Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {effectiveEligible.map((char) => {
            const vigor = vigorState[char.id] ?? 2;
            const isBorrowed = char.id === borrowedCharId;
            const vigorBadge =
              vigor === 2
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                : vigor === 1
                ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                : 'bg-rose-950/70 text-rose-300 border-rose-500/40';

            return (
              <div
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`group shrink-0 rounded-xl p-2 w-20 flex flex-col items-center gap-1.5 cursor-pointer transition-colors relative border ${
                  isBorrowed
                    ? 'bg-emerald-950/30 border-emerald-500/60 hover:bg-emerald-950/50'
                    : 'bg-[#161928] hover:bg-[#1e2338] border-[#252c46] hover:border-[#d4af37]/50'
                }`}
                title={`${char.name} (${char.element} ${char.weapon})${isBorrowed ? ' - Friend Borrow' : ''} - Click to inspect`}
              >
                {char.isTrial && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-[#d4af37] text-black font-extrabold text-[8px] px-1.5 py-0.2 rounded-full shadow z-10 uppercase tracking-tight">
                    Trial
                  </span>
                )}
                {isBorrowed && (
                  <span className="absolute -top-1.5 -left-1.5 bg-emerald-600 text-white font-extrabold text-[8px] px-1.5 py-0.2 rounded-full shadow z-10">
                    Friend
                  </span>
                )}
                <CharacterPortrait
                  src={char.icon}
                  name={char.name}
                  element={char.element}
                  rarity={char.rarity}
                  size="sm"
                />
                <span className="text-[10px] font-semibold text-zinc-200 truncate w-full text-center">
                  {char.name}
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${vigorBadge}`}
                    >
                      {vigor} Vigor
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      Lv.{char.level ?? (profiles?.[char.id]?.level ?? 90)}
                    </span>
                  </div>
                  {isBorrowed && (
                    <span className="text-[8px] font-bold text-emerald-400">
                      Borrow
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Act Roadmap Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-base font-bold text-zinc-100 font-serif flex items-center gap-2">
              <span>Act Schedule & Boss Strategy ({schedule.length} Acts)</span>
              {isPending && (
                <span className="text-[11px] font-mono text-amber-400 font-normal animate-pulse">
                  (drafting schedule...)
                </span>
              )}
            </h2>
          </div>
          <span className="text-xs text-zinc-400">
            Pin/lock acts to preserve customizations. Click <strong className="text-zinc-200">Replace</strong> or <strong className="text-zinc-200">+ Add</strong> to alter members.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedule.map((act) => {
            const isBoss = act.type === 'Boss';
            const isLocked = lockedActNumbers.has(act.actNumber);
            const bossInfo = act.bossName ? THEATER_BOSS_INFO[act.bossName] : undefined;
            const bossMatchup = act.bossMatchup || (act.bossName ? evaluateBossActMatchup(act.team, act.bossName) : undefined);

            return (
              <div
                key={act.actNumber}
                className={`rounded-2xl p-5 border transition-all duration-150 flex flex-col justify-between gap-4 ${
                  isLocked
                    ? 'bg-gradient-to-br from-[#1d1b28] via-[#161522] to-[#12111d] border-[#d4af37] shadow-xl'
                    : isBoss
                    ? 'bg-gradient-to-br from-[#1a1828] via-[#161424] to-[#12111d] border-amber-500/40 shadow-lg'
                    : 'bg-[#12141e] border-[#22273c]'
                }`}
              >
                <div>
                  {/* Act Header */}
                  <div className="flex items-center justify-between border-b border-[#22273e] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isBoss
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-[#1a1e30] text-zinc-300 border-[#2b3350]'
                        }`}
                      >
                        Act {act.actNumber}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                          {isBoss ? (
                            <>
                              <Crown className="w-4 h-4 text-[#d4af37]" />
                              <span>{act.bossName || 'Boss Encounter'}</span>
                            </>
                          ) : (
                            <span>{act.type === 'Defense' ? 'Monolith Defense' : 'Standard Encounter'}</span>
                          )}
                        </h3>
                        {bossInfo && (
                          <div className="text-[11px] text-zinc-400">
                            {bossInfo.title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isBoss && bossMatchup && (
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                            bossMatchup.rating === 'S'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                              : bossMatchup.rating === 'A'
                              ? 'bg-sky-950/70 text-sky-300 border-sky-500/50'
                              : bossMatchup.rating === 'B'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-500/50'
                              : 'bg-rose-950/70 text-rose-300 border-rose-500/50'
                          }`}
                          title={bossMatchup.reason}
                        >
                          Rating {bossMatchup.rating} ({bossMatchup.score}pts)
                        </span>
                      )}

                      {isBoss && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          Apex Boss Act
                        </span>
                      )}

                      {/* Lock Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLock(act.actNumber)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                          isLocked
                            ? 'bg-[#d4af37] text-zinc-950 border-[#d4af37] shadow-sm'
                            : 'bg-[#161928] text-zinc-400 border-[#262c46] hover:text-zinc-200'
                        }`}
                        title={isLocked ? 'Act Locked (preserved across Auto-Draft)' : 'Click to Lock / Pin this act'}
                      >
                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{isLocked ? 'Locked' : 'Pin'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Boss Hazard & Recommended Archetype Callout */}
                  {bossInfo && (
                    <div className="mt-3 p-3 bg-[#0d0e17] rounded-xl border border-[#1e2338] space-y-1.5 text-xs">
                      <div className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Hazard: {bossInfo.hazard}</span>
                      </div>
                      <div className="text-zinc-300 leading-relaxed">
                        💡 {bossInfo.weakness}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase">Archetypes:</span>
                        {bossInfo.recommendedArchetypes.map((arch) => (
                          <span
                            key={arch}
                            className="text-[10px] bg-[#1a1d2f] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af37]/20 font-medium"
                          >
                            {arch}
                          </span>
                        ))}
                      </div>

                      {/* Boss Matchup Score & Counter Highlights */}
                      {bossMatchup && (
                        <div className="mt-2 pt-2 border-t border-[#1e2338] space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-zinc-300">
                              Clear Rating: <strong className={bossMatchup.rating === 'S' ? 'text-emerald-300' : bossMatchup.rating === 'A' ? 'text-sky-300' : bossMatchup.rating === 'B' ? 'text-amber-300' : 'text-rose-400'}>{bossMatchup.rating} Tier</strong>
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Counter Score: {bossMatchup.score}/100
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-300 leading-snug">
                            {bossMatchup.reason}
                          </div>
                          {bossMatchup.counterHighlights && bossMatchup.counterHighlights.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {bossMatchup.counterHighlights.map((hl) => (
                                <span
                                  key={hl}
                                  className="text-[9px] bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded"
                                >
                                  ✓ {hl}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4 Team Member Slots */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const member = act.team[slotIdx];

                      if (member) {
                        const color = ELEMENT_BADGES[member.element] || {
                          bg: 'bg-zinc-800',
                          text: 'text-zinc-200',
                          border: 'border-zinc-700',
                        };

                        return (
                          <div
                            key={member.id}
                            className={`bg-[#0d0f19] border ${color.border} rounded-xl p-2.5 flex flex-col justify-between gap-2 relative group hover:border-[#d4af37]/60 transition-colors`}
                          >
                            {member.isTrial && (
                              <span className="absolute top-1.5 right-1.5 bg-gradient-to-r from-amber-400 to-[#d4af37] text-black font-extrabold text-[8px] px-1.5 py-0.2 rounded-full shadow z-10 uppercase tracking-tight">
                                Trial
                              </span>
                            )}
                            <div
                              onClick={() => setSelectedCharacter(member)}
                              className="cursor-pointer flex flex-col items-center gap-1"
                            >
                              <CharacterPortrait
                                src={member.icon}
                                name={member.name}
                                element={member.element}
                                rarity={member.rarity}
                                size="sm"
                              />
                              <div className="text-xs font-bold text-zinc-100 truncate w-full text-center">
                                {member.name}
                              </div>
                              <div className={`text-[10px] font-semibold ${color.text} truncate`}>
                                {member.roles[0] || member.element}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setSwapTarget({ actNumber: act.actNumber, oldChar: member })
                                }
                                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold bg-[#181c2d] hover:bg-[#252c46] text-zinc-300 hover:text-[#d4af37] py-1 rounded-lg border border-[#262d47] transition-colors cursor-pointer"
                                title="Replace this character"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>Swap</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveMember(act.actNumber, member.id)}
                                className="p-1 text-zinc-400 hover:text-rose-400 bg-[#181c2d] hover:bg-rose-950/40 border border-[#262d47] rounded-lg transition-colors cursor-pointer"
                                title="Remove from act"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot Placeholder
                      return (
                        <div
                          key={`empty-${slotIdx}`}
                          className="bg-[#0b0c15] border border-dashed border-[#272e48] rounded-xl p-2.5 flex flex-col items-center justify-center gap-2 min-h-[140px] text-center"
                        >
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                            Slot {slotIdx + 1}
                          </span>
                          <span className="text-[11px] text-zinc-400">Empty</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSwapTarget({ actNumber: act.actNumber, oldChar: null })
                            }
                            className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-[#171b2d] hover:bg-[#d4af37] text-zinc-300 hover:text-zinc-950 px-2.5 py-1 rounded-lg border border-[#262e4c] hover:border-[#d4af37] transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Swap / Add Modal */}
      {swapTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121422] border border-[#2b3356] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#212742] pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-bold text-zinc-100">
                  {swapTarget.oldChar
                    ? `Swap ${swapTarget.oldChar.name} (Act ${swapTarget.actNumber})`
                    : `Add Character to Act ${swapTarget.actNumber}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSwapTarget(null);
                  setModalError(null);
                }}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/50 text-xs text-rose-300">
                {modalError}
              </div>
            )}

            <p className="text-xs text-zinc-400">
              Select an available character from your eligible roster who has at least 1 remaining Vigor point and is not already deployed in Act {swapTarget.actNumber}:
            </p>

            {/* Candidate List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {effectiveEligible
                .filter((c) => {
                  const act = schedule.find((a) => a.actNumber === swapTarget.actNumber);
                  const otherMembers = swapTarget.oldChar
                    ? (act?.team.filter((m) => m.id !== swapTarget.oldChar?.id) || [])
                    : (act?.team || []);
                  const hasConflict = otherMembers.some((m) => isSameCharacterOrTraveler(m, c));
                  const isReplacingSameCharacter = isSameCharacterOrTraveler(swapTarget.oldChar?.id, c.id);
                  const vigor = isReplacingSameCharacter ? 1 : (vigorState[c.id] ?? 2);
                  return !hasConflict && vigor > 0;
                })
                .sort((a, b) => {
                  const vigorA = vigorState[a.id] ?? 2;
                  const vigorB = vigorState[b.id] ?? 2;
                  if (vigorB !== vigorA) return vigorB - vigorA;
                  if (b.rarity !== a.rarity) return b.rarity - a.rarity;
                  return a.name.localeCompare(b.name);
                })
                .map((candidate) => {
                  const vigor = vigorState[candidate.id] ?? 2;
                  const color = ELEMENT_BADGES[candidate.element];
                  const isBorrowed = candidate.id === borrowedCharId;

                  return (
                    <div
                      key={candidate.id}
                      className={`flex items-center justify-between border p-2.5 rounded-xl transition-colors ${
                        isBorrowed
                          ? 'bg-emerald-950/20 border-emerald-500/50 hover:bg-emerald-950/30'
                          : 'bg-[#181c2e] hover:bg-[#20263e] border-[#27304e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CharacterPortrait
                          src={candidate.icon}
                          name={candidate.name}
                          element={candidate.element}
                          rarity={candidate.rarity}
                          size="sm"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                            <span>{candidate.name}</span>
                            {isBorrowed && (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                                Friend Borrow
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                            <span className={color.text}>{candidate.element}</span>
                            <span>•</span>
                            <span>{candidate.weapon}</span>
                            <span>•</span>
                            <span>{candidate.roles[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          {vigor} Vigor
                        </span>
                        <button
                          onClick={() => handlePerformSwap(candidate.id)}
                          className="text-xs font-bold bg-[#d4af37] hover:bg-[#e6bf3d] text-zinc-950 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  );
                })}

              {effectiveEligible.filter((c) => {
                const act = schedule.find((a) => a.actNumber === swapTarget.actNumber);
                const otherMembers = swapTarget.oldChar
                  ? (act?.team.filter((m) => m.id !== swapTarget.oldChar?.id) || [])
                  : (act?.team || []);
                const hasConflict = otherMembers.some((m) => isSameCharacterOrTraveler(m, c));
                const isReplacingSameCharacter = isSameCharacterOrTraveler(swapTarget.oldChar?.id, c.id);
                const vigor = isReplacingSameCharacter ? 1 : (vigorState[c.id] ?? 2);
                return !hasConflict && vigor > 0;
              }).length === 0 && (
                <div className="text-center py-6 text-xs text-zinc-500">
                  No other eligible characters with remaining vigor available to swap.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <LazyCharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          isOwned={ownedIds.includes(selectedCharacter.id)}
          profile={profiles ? profiles[selectedCharacter.id] : undefined}
          onSelectCharacter={setSelectedCharacter}
        />
      )}
    </div>
  );
};
