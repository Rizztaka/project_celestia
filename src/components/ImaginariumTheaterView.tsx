import React, { useState, useMemo, useEffect, useTransition, useRef, useReducer, useId } from 'react';
import type {
  Character,
  Element,
  TheaterDifficulty,
  TheaterSeasonConfig,
  OwnedCharacterProfile,
  RecommendationReliability,
} from '../types/genshin';
import {
  THEATER_SEASONS,
  THEATER_DIFFICULTIES,
  THEATER_BOSS_INFO,
  createCustomSeason,
  DEFAULT_ACTIVE_THEATER_SEASON_ID,
  getActiveTheaterSeason,
} from '../data/theater-seasons';
import { CHARACTERS } from '../data/characters';
import { RecommendationReliabilityBadge } from './RecommendationReliabilityBadge';
import { RecommendationReliabilityBanner } from './RecommendationReliabilityBanner';
import { ReliabilityDetailsPanel } from './ReliabilityDetailsPanel';
import {
  filterEligibleTheaterRoster,
  swapTheaterActMember,
  removeTheaterActMember,
  evaluateBossActMatchup,
  recommendSupportCastBorrow,
  analyzeTheaterSeasonPlan,
  type TheaterScheduleResult,
} from '../engines/theater-solver';
import { isSameCharacterOrTraveler } from '../engines/team-rules';
import { dispatchAutoDraftTheater } from '../services/solver-dispatcher';
import { CharacterPortrait } from './CharacterPortrait';
import { LazyCharacterDetailModal } from './LazyCharacterDetailModal';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
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
  Compass,
  ListChecks,
  Shield,
  ShieldAlert,
} from 'lucide-react';

interface ImaginariumTheaterViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
  evaluatedAt?: string;
}

function getCurrentUtcDateString(): string {
  const now = new Date();
  if (Number.isNaN(now.getTime())) {
    return '';
  }
  const yyyy = String(now.getUTCFullYear()).padStart(4, '0');
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function resolveDefaultSeasonId(evaluatedAt?: string): string {
  if (evaluatedAt !== undefined) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(evaluatedAt.trim());
    if (match) {
      const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) {
        return getActiveTheaterSeason(parsed).id;
      }
    }
    return DEFAULT_ACTIVE_THEATER_SEASON_ID;
  }
  return getActiveTheaterSeason().id;
}

export interface TheaterSolveRequestParams {
  effectiveEligible: Character[];
  difficulty: TheaterDifficulty;
  activeSeason: TheaterSeasonConfig;
  profiles?: Record<string, OwnedCharacterProfile>;
  evaluatedAt: string;
}

function canonicalizeTheaterInputValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeTheaterInputValue);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      const entry = record[key];
      if (entry !== undefined) {
        normalized[key] = canonicalizeTheaterInputValue(entry);
      }
    }
    return normalized;
  }
  return value;
}

/** Deterministic input snapshot key for Imaginarium Theater schedule auto-drafting. */
export function buildTheaterSolveInputKey(params: TheaterSolveRequestParams): string {
  const eligibleIds = params.effectiveEligible.map((c) => c.id).sort();
  return JSON.stringify({
    eligibleIds,
    difficulty: params.difficulty,
    season: canonicalizeTheaterInputValue(params.activeSeason),
    profiles: canonicalizeTheaterInputValue(params.profiles ?? {}),
    evaluatedAt: params.evaluatedAt,
  });
}

export interface TheaterSolveState {
  scheduleResult: TheaterScheduleResult | null;
  solvedSeasonId: string | null;
  resultInputKey: string | null;
  isSolving: boolean;
  solverError: string | null;
}

export const initialTheaterSolveState: TheaterSolveState = {
  scheduleResult: null,
  solvedSeasonId: null,
  resultInputKey: null,
  isSolving: true,
  solverError: null,
};

export type TheaterSolveAction =
  | { type: 'SOLVE_STARTED' }
  | {
      type: 'SOLVE_SUCCEEDED';
      result: TheaterScheduleResult;
      seasonId: string;
      inputKey: string;
    }
  | { type: 'SOLVE_FAILED'; error: string }
  | {
      type: 'UPDATE_RESULT';
      updater: (prev: TheaterScheduleResult | null) => TheaterScheduleResult | null;
    };

/** Pure reducer for async Imaginarium Theater auto-drafting and manual edits. */
export function theaterSolveReducer(
  state: TheaterSolveState,
  action: TheaterSolveAction,
): TheaterSolveState {
  switch (action.type) {
    case 'SOLVE_STARTED':
      return {
        ...state,
        isSolving: true,
        solverError: null,
      };
    case 'SOLVE_SUCCEEDED':
      return {
        scheduleResult: action.result,
        solvedSeasonId: action.seasonId,
        resultInputKey: action.inputKey,
        isSolving: false,
        solverError: null,
      };
    case 'SOLVE_FAILED':
      return {
        ...state,
        scheduleResult: null,
        solvedSeasonId: null,
        resultInputKey: null,
        isSolving: false,
        solverError: action.error,
      };
    case 'UPDATE_RESULT':
      return {
        ...state,
        scheduleResult: action.updater(state.scheduleResult),
      };
  }
}

export function startTheaterSolveRequest(
  params: TheaterSolveRequestParams,
  userLocks: Record<number, string[]> | undefined,
  lockedActNumbers: Set<number>,
  deps: {
    requestIdRef: { current: number };
    isMountedRef: { current: boolean };
    dispatch: (action: TheaterSolveAction) => void;
    scheduleTransition: (callback: () => void) => void;
    dispatchSolveFn?: typeof dispatchAutoDraftTheater;
  },
): () => void {
  const reqId = ++deps.requestIdRef.current;
  const inputKey = buildTheaterSolveInputKey(params);
  const runSolve = deps.dispatchSolveFn ?? dispatchAutoDraftTheater;

  deps.dispatch({ type: 'SOLVE_STARTED' });

  runSolve(
    params.effectiveEligible,
    params.difficulty,
    params.activeSeason,
    userLocks && Object.keys(userLocks).length > 0 ? userLocks : undefined,
    params.profiles,
    { evaluatedAt: params.evaluatedAt },
  )
    .then((res) => {
      if (!deps.isMountedRef.current || reqId !== deps.requestIdRef.current) return;
      deps.scheduleTransition(() => {
        if (!deps.isMountedRef.current || reqId !== deps.requestIdRef.current) return;
        const actsWithLocks = res.acts.map((a) => ({
          ...a,
          isLocked: lockedActNumbers.has(a.actNumber),
        }));
        deps.dispatch({
          type: 'SOLVE_SUCCEEDED',
          result: { ...res, acts: actsWithLocks },
          seasonId: params.activeSeason.id,
          inputKey,
        });
      });
    })
    .catch((err: unknown) => {
      if (!deps.isMountedRef.current || reqId !== deps.requestIdRef.current) return;
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : 'Unable to auto-draft Imaginarium Theater schedule right now.';
      deps.dispatch({ type: 'SOLVE_FAILED', error: message });
    });

  return () => {
    if (deps.requestIdRef.current === reqId) {
      deps.requestIdRef.current += 1;
    }
  };
}

export interface TheaterReliabilitySectionProps {
  reliability: RecommendationReliability | null;
  detailsControlsId: string;
  isDetailsOpen: boolean;
  onToggleDetails: () => void;
  onCloseDetails: () => void;
  solverError: string | null;
  onRetry: () => void;
}

export const TheaterReliabilitySection: React.FC<TheaterReliabilitySectionProps> = ({
  reliability,
  detailsControlsId,
  isDetailsOpen,
  onToggleDetails,
  onCloseDetails,
  solverError,
  onRetry,
}) => (
  <div className="space-y-3">
    {solverError && (
      <div className="w-full max-w-full min-w-0 p-3.5 rounded-xl border bg-rose-950/85 border-rose-500/65 text-rose-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div role="alert" aria-live="assertive" className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-0.5 text-xs leading-relaxed">
              <p className="font-bold text-rose-100">Imaginarium Theater Solver Error</p>
              <p className="text-rose-200 break-words">{solverError}</p>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-rose-200 text-rose-950 border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    )}

    <RecommendationReliabilityBanner
      reliability={reliability}
      contextLabel="Imaginarium Theater"
      detailsControlsId={detailsControlsId}
      isDetailsOpen={isDetailsOpen}
      onToggleDetails={onToggleDetails}
    />

    <ReliabilityDetailsPanel
      id={detailsControlsId}
      reliability={reliability}
      isOpen={isDetailsOpen}
      onClose={onCloseDetails}
      contextLabel="Imaginarium Theater"
    />
  </div>
);

export interface TheaterBorrowReliabilitySectionProps {
  reliability: RecommendationReliability | null;
  detailsControlsId: string;
  isDetailsOpen: boolean;
  onToggleDetails: () => void;
  onCloseDetails: () => void;
}

export const TheaterBorrowReliabilitySection: React.FC<TheaterBorrowReliabilitySectionProps> = ({
  reliability,
  detailsControlsId,
  isDetailsOpen,
  onToggleDetails,
  onCloseDetails,
}) => (
  <div className="space-y-2.5">
    <RecommendationReliabilityBanner
      reliability={reliability}
      contextLabel="Support Cast Borrow Advisor"
      detailsControlsId={detailsControlsId}
      isDetailsOpen={isDetailsOpen}
      onToggleDetails={onToggleDetails}
    />

    <ReliabilityDetailsPanel
      id={detailsControlsId}
      reliability={reliability}
      isOpen={isDetailsOpen}
      onClose={onCloseDetails}
      contextLabel="Support Cast Borrow Advisor"
    />
  </div>
);

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
  Pyro: { bg: 'bg-rose-500/15', text: 'text-rose-200', border: 'border-rose-400/40' },
  Hydro: { bg: 'bg-sky-500/15', text: 'text-sky-200', border: 'border-sky-400/40' },
  Anemo: { bg: 'bg-teal-500/15', text: 'text-teal-200', border: 'border-teal-400/40' },
  Electro: { bg: 'bg-purple-500/15', text: 'text-purple-200', border: 'border-purple-400/40' },
  Dendro: { bg: 'bg-emerald-500/15', text: 'text-emerald-200', border: 'border-emerald-400/40' },
  Cryo: { bg: 'bg-cyan-500/15', text: 'text-cyan-100', border: 'border-cyan-400/40' },
  Geo: { bg: 'bg-amber-500/15', text: 'text-amber-200', border: 'border-amber-400/40' },
};

export const ImaginariumTheaterView: React.FC<ImaginariumTheaterViewProps> = ({
  ownedIds,
  profiles,
  evaluatedAt,
}) => {
  const [defaultEvaluatedAt] = useState<string>(() => getCurrentUtcDateString());
  const resolvedEvaluatedAt = evaluatedAt !== undefined ? evaluatedAt : defaultEvaluatedAt;
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(() =>
    resolveDefaultSeasonId(evaluatedAt),
  );
  const [customElements, setCustomElements] = useState<Element[]>(['Pyro', 'Hydro', 'Anemo']);
  const [difficulty, setDifficulty] = useState<TheaterDifficulty>('Visionary');
  const [solveState, dispatchSolve] = useReducer(theaterSolveReducer, initialTheaterSolveState);
  const [solveNonce, setSolveNonce] = useState<number>(0);
  const [lockedActNumbers, setLockedActNumbers] = useState<Set<number>>(new Set());
  const latestUserLocksRef = useRef<Record<number, string[]>>({});
  const latestLockedActSetRef = useRef<Set<number>>(new Set());
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [borrowedCharId, setBorrowedCharId] = useState<string | null>(null);
  const [isTheaterDetailsOpen, setIsTheaterDetailsOpen] = useState<boolean>(false);
  const [isBorrowDetailsOpen, setIsBorrowDetailsOpen] = useState<boolean>(false);
  const theaterDetailsId = useId();
  const borrowDetailsId = useId();
  const [isPending, startTransition] = useTransition();
  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [swapTarget, setSwapTarget] = useState<{
    actNumber: number;
    oldChar: Character | null;
  } | null>(null);

  const swapDialogRef = useRef<HTMLDivElement>(null);
  const swapCloseBtnRef = useRef<HTMLButtonElement>(null);

  const closeSwapModal = () => {
    setSwapTarget(null);
    setModalError(null);
  };

  useModalAccessibility({
    isOpen: Boolean(swapTarget),
    onClose: closeSwapModal,
    containerRef: swapDialogRef,
    initialFocusRef: swapCloseBtnRef,
  });

  const activeSeason: TheaterSeasonConfig = useMemo(() => {
    if (selectedSeasonId === 'custom') {
      return createCustomSeason(customElements);
    }
    const found = THEATER_SEASONS.find((s) => s.id === selectedSeasonId);
    return found || THEATER_SEASONS[0];
  }, [selectedSeasonId, customElements]);

  const filteredRoster = useMemo(() => {
    return filterEligibleTheaterRoster(ownedIds, activeSeason, profiles, difficulty);
  }, [ownedIds, activeSeason, profiles, difficulty]);

  // Retain full RecommendationCollection envelope (items + reliability) for borrow advisor
  const borrowResult = useMemo(() => {
    return recommendSupportCastBorrow(filteredRoster.eligible, activeSeason, ownedIds, {
      evaluatedAt: resolvedEvaluatedAt,
    });
  }, [filteredRoster.eligible, activeSeason, ownedIds, resolvedEvaluatedAt]);
  const recommendedBorrows = borrowResult.items;

  const effectiveEligible = useMemo(() => {
    if (!borrowedCharId) return filteredRoster.eligible;
    const borrowedChar = CHARACTERS.find((c) => c.id === borrowedCharId);
    if (!borrowedChar || filteredRoster.eligible.some((c) => c.id === borrowedCharId)) {
      return filteredRoster.eligible;
    }
    return [borrowedChar, ...filteredRoster.eligible];
  }, [filteredRoster.eligible, borrowedCharId]);

  const solveParams = useMemo<TheaterSolveRequestParams>(
    () => ({
      effectiveEligible,
      difficulty,
      activeSeason,
      profiles,
      evaluatedAt: resolvedEvaluatedAt,
    }),
    [effectiveEligible, difficulty, activeSeason, profiles, resolvedEvaluatedAt],
  );
  const currentSolveInputKey = useMemo(
    () => buildTheaterSolveInputKey(solveParams),
    [solveParams],
  );

  useEffect(() => {
    return startTheaterSolveRequest(
      solveParams,
      latestUserLocksRef.current,
      latestLockedActSetRef.current,
      {
        requestIdRef,
        isMountedRef,
        dispatch: dispatchSolve,
        scheduleTransition: startTransition,
      },
    );
  }, [solveParams, solveNonce]);

  const hasMatchingResult =
    solveState.scheduleResult !== null &&
    solveState.solvedSeasonId === activeSeason.id &&
    solveState.resultInputKey !== null &&
    solveState.resultInputKey === currentSolveInputKey;

  const isPendingInputReevaluation =
    solveState.scheduleResult !== null &&
    (solveState.solvedSeasonId !== activeSeason.id ||
      solveState.resultInputKey === null ||
      solveState.resultInputKey !== currentSolveInputKey);

  const effectiveIsSolving = solveState.isSolving || isPendingInputReevaluation;
  const visibleScheduleResult =
    hasMatchingResult && !solveState.solverError ? solveState.scheduleResult : null;

  const schedule = useMemo(() => visibleScheduleResult?.acts ?? [], [visibleScheduleResult]);
  const vigorState = useMemo(() => visibleScheduleResult?.vigorState ?? {}, [visibleScheduleResult]);
  const validationErrors = visibleScheduleResult?.validationErrors ?? [];
  const shortfallSuggestions = visibleScheduleResult?.shortfallSuggestions ?? [];

  // Reuse the schedule's evaluatedAt context so TheaterSeasonAnalysis and TheaterScheduleResult
  // always produce identical reliability decisions across manual edits.
  const seasonAnalysis = useMemo(() => {
    if (!visibleScheduleResult || schedule.length === 0) return null;
    const syncEvaluatedAt = visibleScheduleResult.reliability.evaluatedAt ?? resolvedEvaluatedAt;
    return analyzeTheaterSeasonPlan(
      schedule,
      effectiveEligible,
      difficulty,
      activeSeason,
      { evaluatedAt: syncEvaluatedAt },
    );
  }, [visibleScheduleResult, schedule, effectiveEligible, difficulty, activeSeason, resolvedEvaluatedAt]);

  const planReliability: RecommendationReliability | null = visibleScheduleResult
    ? visibleScheduleResult.reliability ?? seasonAnalysis?.reliability ?? null
    : null;

  const preservedActsByCharId = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const entry of seasonAnalysis?.preservationPlan ?? []) {
      map.set(entry.characterId, entry.reservedForActs);
    }
    return map;
  }, [seasonAnalysis]);

  const swapCandidates = useMemo(() => {
    if (!swapTarget) return [];
    const act = schedule.find((a) => a.actNumber === swapTarget.actNumber);
    const otherMembers = swapTarget.oldChar
      ? act?.team.filter((m) => m.id !== swapTarget.oldChar?.id) || []
      : act?.team || [];

    return effectiveEligible
      .filter((c) => {
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
      });
  }, [swapTarget, schedule, effectiveEligible, vigorState]);

  const syncLockRefs = (nextLocked: Set<number>, currentActs = schedule) => {
    latestLockedActSetRef.current = nextLocked;
    const locksMap: Record<number, string[]> = {};
    for (const actNum of nextLocked) {
      const existingAct = currentActs.find((a) => a.actNumber === actNum);
      if (existingAct && existingAct.team.length > 0) {
        locksMap[actNum] = existingAct.team.map((m) => m.id);
      }
    }
    latestUserLocksRef.current = locksMap;
  };

  const handleSelectSeason = (nextSeasonId: string) => {
    setBorrowedCharId(null);
    const emptyLocks = new Set<number>();
    setLockedActNumbers(emptyLocks);
    latestLockedActSetRef.current = emptyLocks;
    latestUserLocksRef.current = {};
    setSelectedSeasonId(nextSeasonId);
    setSwapTarget(null);
    setModalError(null);
  };

  const handleSelectDifficulty = (nextDifficulty: TheaterDifficulty) => {
    const emptyLocks = new Set<number>();
    setLockedActNumbers(emptyLocks);
    latestLockedActSetRef.current = emptyLocks;
    latestUserLocksRef.current = {};
    setDifficulty(nextDifficulty);
    setSwapTarget(null);
    setModalError(null);
  };

  const handleGenerateSchedule = () => {
    syncLockRefs(lockedActNumbers);
    setSolveNonce((prev) => prev + 1);
  };

  const diffConfig = THEATER_DIFFICULTIES[difficulty];
  const requiredChars = diffConfig.requiredCharacters;
  const isShortfall = filteredRoster.eligible.length < requiredChars;

  const handleToggleLock = (actNumber: number) => {
    const next = new Set(lockedActNumbers);
    if (next.has(actNumber)) {
      next.delete(actNumber);
    } else {
      next.add(actNumber);
    }
    setLockedActNumbers(next);
    syncLockRefs(next);
    dispatchSolve({
      type: 'UPDATE_RESULT',
      updater: (prevResult) =>
        prevResult
          ? {
              ...prevResult,
              acts: prevResult.acts.map((a) =>
                a.actNumber === actNumber ? { ...a, isLocked: next.has(actNumber) } : a,
              ),
            }
          : prevResult,
    });
  };

  const handleToggleCustomElement = (elem: Element) => {
    if (customElements.includes(elem)) {
      if (customElements.length > 1) {
        setCustomElements(customElements.filter((e) => e !== elem));
      }
    } else if (customElements.length < 3) {
      setCustomElements([...customElements, elem]);
    } else {
      setCustomElements([...customElements.slice(1), elem]);
    }
  };

  const handlePerformSwap = (newCharId: string) => {
    if (!swapTarget) return;
    setModalError(null);

    const res = swapTheaterActMember(
      schedule,
      swapTarget.actNumber,
      swapTarget.oldChar ? swapTarget.oldChar.id : '',
      newCharId,
      vigorState
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
    const nextLocks = new Set(lockedActNumbers).add(swapTarget.actNumber);
    setLockedActNumbers(nextLocks);
    syncLockRefs(nextLocks, actsWithLock);
    dispatchSolve({
      type: 'UPDATE_RESULT',
      updater: (prev) =>
        prev
          ? {
              ...prev,
              acts: actsWithLock,
              vigorState: res.vigorState,
            }
          : prev,
    });
    setSwapTarget(null);
  };

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
      const nextLocks = new Set(lockedActNumbers).add(actNumber);
      setLockedActNumbers(nextLocks);
      syncLockRefs(nextLocks, actsWithLock);
      dispatchSolve({
        type: 'UPDATE_RESULT',
        updater: (prev) =>
          prev
            ? {
                ...prev,
                acts: actsWithLock,
                vigorState: res.vigorState,
              }
            : prev,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121420] via-[#191d30] to-[#121420] p-5 sm:p-6 rounded-2xl border border-[#24293d] shadow-xl relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 w-80 h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,#d4af37,transparent_70%)]"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[#f3cf58] text-xs font-bold tracking-wider uppercase mb-1">
              <Crown className="w-4 h-4" aria-hidden="true" />
              <span>Visionary Mode Solver · 2-Vigor Act Planner</span>
              <RecommendationReliabilityBadge
                reliability={planReliability}
                isLoading={effectiveIsSolving}
                size="sm"
                detailsControlsId={theaterDetailsId}
                isDetailsOpen={isTheaterDetailsOpen}
                onToggleDetails={() => setIsTheaterDetailsOpen((v) => !v)}
              />
              {(isPending || effectiveIsSolving) && (
                <span
                  role="status"
                  className="text-xs text-amber-300 animate-pulse motion-reduce:animate-none font-normal lowercase tracking-normal"
                >
                  (drafting…)
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              Imaginarium Theater
            </h1>
            <p className="text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Curate multi-act combat paths with strict 2-Vigor endurance tracking, boss reservation heuristics, act pin/lock controls, and slot swap management.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateSchedule()}
            className="min-h-[44px] flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Auto-Draft &amp; Schedule</span>
          </button>
        </div>

        {/* Season & Difficulty Control Bar */}
        <div className="mt-5 pt-4 border-t border-[#24293d] flex flex-wrap items-center justify-between gap-4">
          {/* Season Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="theater-season-select"
              className="text-xs text-zinc-300 font-semibold uppercase tracking-wider"
            >
              Cycle:
            </label>
            <select
              id="theater-season-select"
              value={selectedSeasonId}
              onChange={(e) => handleSelectSeason(e.target.value)}
              className="min-h-[38px] bg-[#161928] border border-[#323954] text-zinc-100 text-xs font-medium rounded-xl px-3 py-1.5 focus:border-[#d4af37]"
            >
              <optgroup label="Active Seasons (Version 7.x)">
                {THEATER_SEASONS.filter((s) => s.id.startsWith('season-7')).map((s) => (
                  <option key={s.id} value={s.id} className="text-[#f3cf58] bg-[#121420]">
                    ⭐ {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Historical Archive (Version 5.x)">
                {THEATER_SEASONS.filter((s) => !s.id.startsWith('season-7')).map((s) => (
                  <option key={s.id} value={s.id} className="text-zinc-200 bg-[#121420]">
                    {s.name}
                  </option>
                ))}
              </optgroup>
              <option value="custom" className="text-amber-300 font-bold bg-[#121420]">
                ⚙️ Custom Element Cycle…
              </option>
            </select>

            <div className="flex items-center gap-1.5">
              {activeSeason.elements.map((elem) => {
                const style = ELEMENT_BADGES[elem];
                return (
                  <span
                    key={elem}
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {elem}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Difficulty Toggle Pills */}
          <div
            role="group"
            aria-label="Theater Difficulty"
            className="flex flex-wrap items-center gap-1 bg-[#161928] p-1 rounded-xl border border-[#2c334d]"
          >
            {(['Normal', 'Hard', 'Visionary'] as TheaterDifficulty[]).map((mode) => {
              const acts = THEATER_DIFFICULTIES[mode].acts;
              const chars = THEATER_DIFFICULTIES[mode].requiredCharacters;
              const isActive = difficulty === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectDifficulty(mode)}
                  className={`min-h-[38px] sm:min-h-[34px] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#d4af37] text-[#0a0b0e] shadow-md font-bold'
                      : 'text-zinc-200 hover:text-white hover:bg-[#1f243b]'
                  }`}
                >
                  <span>{mode}</span>
                  <span className={`text-[11px] ${isActive ? 'text-[#0a0b0e]/85' : 'text-zinc-300'}`}>
                    ({acts} Acts · {chars} Chars)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommendation Reliability Disclosure */}
        <div className="mt-4 empty:hidden">
          <TheaterReliabilitySection
            reliability={planReliability}
            detailsControlsId={theaterDetailsId}
            isDetailsOpen={isTheaterDetailsOpen}
            onToggleDetails={() => setIsTheaterDetailsOpen((v) => !v)}
            onCloseDetails={() => setIsTheaterDetailsOpen(false)}
            solverError={solveState.solverError}
            onRetry={handleGenerateSchedule}
          />
        </div>

        {/* Custom Element Selector Drawer */}
        {selectedSeasonId === 'custom' && (
          <div
            role="group"
            aria-label="Select 3 custom season elements"
            className="mt-4 p-3 bg-[#0e1019] border border-[#2c334d] rounded-xl flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-zinc-200 font-semibold">Select 3 Season Elements:</span>
            {ALL_ELEMENTS.map((elem) => {
              const isSelected = customElements.includes(elem);
              const style = ELEMENT_BADGES[elem];
              return (
                <button
                  key={elem}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleToggleCustomElement(elem)}
                  className={`min-h-[38px] sm:min-h-[32px] text-xs font-bold px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? `${style.bg} ${style.text} ${style.border} ring-1 ring-[#d4af37]`
                      : 'bg-[#161928] text-zinc-300 border-[#2c334d] hover:text-white'
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
        <section
          aria-label="Roster shortfall notice"
          className="bg-amber-950/35 border border-amber-400/45 p-4 rounded-xl space-y-3"
        >
          <div role="status" className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-200">
                Roster Shortfall for {difficulty} Mode ({filteredRoster.eligible.length} / {requiredChars} Characters)
              </div>
              {validationErrors.map((err, idx) => (
                <div key={idx} className="text-zinc-200">
                  {err}
                </div>
              ))}
              <div className="text-zinc-300">
                The auto-draft below provides best-effort assignments with your currently available roster.
              </div>
            </div>
          </div>

          {shortfallSuggestions.length > 0 && (
            <div className="pt-2.5 border-t border-amber-400/25">
              <div className="text-[11px] font-bold text-[#f3cf58] uppercase tracking-wider mb-2">
                Recommended Characters to Unlock / Level for this Season:
              </div>
              <div className="flex flex-wrap gap-2">
                {shortfallSuggestions.map((sug) => {
                  const style = ELEMENT_BADGES[sug.element];
                  return (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => setSelectedCharacter(sug)}
                      className="min-h-[40px] flex items-center gap-2 bg-[#141726] hover:bg-[#1f243b] border border-[#323954] hover:border-[#d4af37]/60 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <CharacterPortrait
                        src={sug.icon}
                        name={sug.name}
                        element={sug.element}
                        rarity={sug.rarity}
                        size="xs"
                      />
                      <div className="text-left pr-1">
                        <div className="text-xs font-bold text-zinc-100 leading-none">
                          {sug.name}
                        </div>
                        <div className={`text-[11px] ${style.text} font-medium mt-0.5`}>
                          {sug.roles[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Support Cast Borrow Recommendation Banner */}
      <section className="bg-gradient-to-r from-[#121420] via-[#191d30] to-[#121420] border border-[#24293d] rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202538] pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#d4af37] shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex flex-wrap items-center gap-2 uppercase tracking-wider">
                <span>Support Cast Borrow Advisor</span>
                <span className="text-[11px] font-mono text-[#f3cf58] bg-[#161a2b] border border-[#d4af37]/35 px-2 py-0.5 rounded-full lowercase">
                  1 Friend Slot Available
                </span>
                <RecommendationReliabilityBadge
                  reliability={borrowResult.reliability}
                  size="sm"
                  detailsControlsId={borrowDetailsId}
                  isDetailsOpen={isBorrowDetailsOpen}
                  onToggleDetails={() => setIsBorrowDetailsOpen((v) => !v)}
                />
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Borrow a high-impact carry or support character from friends to conquer this season&apos;s apex boss mechanics.
              </p>
            </div>
          </div>

          {borrowedCharId && (
            <div className="flex items-center gap-2 bg-emerald-950/65 border border-emerald-400/45 px-3 py-1.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
              <span className="text-emerald-200 font-semibold">
                Active Borrow: {CHARACTERS.find((c) => c.id === borrowedCharId)?.name}
              </span>
              <button
                type="button"
                aria-label="Return borrowed character"
                onClick={() => setBorrowedCharId(null)}
                className="min-w-[28px] min-h-[28px] rounded-md flex items-center justify-center text-zinc-200 hover:text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                title="Return borrowed character"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <TheaterBorrowReliabilitySection
          reliability={borrowResult.reliability}
          detailsControlsId={borrowDetailsId}
          isDetailsOpen={isBorrowDetailsOpen}
          onToggleDetails={() => setIsBorrowDetailsOpen((v) => !v)}
          onCloseDetails={() => setIsBorrowDetailsOpen(false)}
        />

        {recommendedBorrows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {recommendedBorrows.map((char) => {
              const isBorrowed = borrowedCharId === char.id;
              const color = ELEMENT_BADGES[char.element] || {
                bg: 'bg-[#181c2b]',
                text: 'text-zinc-200',
                border: 'border-[#323954]',
              };

              return (
                <div
                  key={char.id}
                  className={`bg-[#0e1019] border rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                    isBorrowed
                      ? 'border-emerald-400/60 bg-emerald-950/25 shadow-md'
                      : 'border-[#24293d] hover:border-[#d4af37]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCharacter(char)}
                    aria-label={`Inspect ${char.name} details`}
                    className="flex items-center gap-3 cursor-pointer text-left bg-transparent border-0 p-0 w-full"
                  >
                    <CharacterPortrait
                      src={char.icon}
                      name={char.name}
                      element={char.element}
                      rarity={char.rarity}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-100 truncate">{char.name}</div>
                      <div className={`text-[11px] ${color.text} font-medium`}>
                        {char.element} · {char.roles[0]}
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-0.5 truncate">
                        {char.roles.slice(1).join(', ') || char.weapon}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={isBorrowed}
                    onClick={() => setBorrowedCharId(isBorrowed ? null : char.id)}
                    className={`w-full min-h-[38px] py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isBorrowed
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-[#1a1e2e] hover:bg-[#252b42] text-[#f3cf58] border border-[#d4af37]/40'
                    }`}
                  >
                    {isBorrowed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Borrowed (Active)</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Borrow Character</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-zinc-300 italic py-1">
            Your roster already possesses all premier characters eligible for this season.
          </div>
        )}
      </section>

      {/* Eligible Roster & Vigor Strip */}
      <section className="bg-[#121420] border border-[#24293d] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202538] pb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Eligible Theater Cast &amp; Vigor Gauge
            </h2>
            <span className="text-xs bg-[#1a1e2e] text-zinc-200 font-mono px-2.5 py-0.5 rounded-full border border-[#323954]">
              {effectiveEligible.length} Available
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" aria-hidden="true" />
              <span>2 Vigor</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" aria-hidden="true" />
              <span>1 Vigor</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" aria-hidden="true" />
              <span>Exhausted (0)</span>
            </span>
          </div>
        </div>

        {/* Scrollable Cast Strip (semantic buttons) */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 touch-pan-x">
          {effectiveEligible.map((char) => {
            const vigor = vigorState[char.id] ?? 2;
            const isBorrowed = char.id === borrowedCharId;
            const reservedActs = preservedActsByCharId.get(char.id);
            const vigorBadge =
              vigor === 2
                ? 'bg-emerald-950/75 text-emerald-200 border-emerald-400/45'
                : vigor === 1
                  ? 'bg-amber-950/75 text-amber-200 border-amber-400/45'
                  : 'bg-rose-950/75 text-rose-200 border-rose-400/45';

            return (
              <button
                key={char.id}
                type="button"
                onClick={() => setSelectedCharacter(char)}
                aria-label={`${char.name}, ${vigor} vigor remaining, inspect details`}
                className={`group shrink-0 rounded-xl p-2 w-22 flex flex-col items-center gap-1.5 cursor-pointer transition-colors relative border ${
                  isBorrowed
                    ? 'bg-emerald-950/30 border-emerald-400/60 hover:bg-emerald-950/50'
                    : 'bg-[#161928] hover:bg-[#1e2338] border-[#282f48] hover:border-[#d4af37]/60'
                }`}
              >
                {char.isTrial && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#d4af37] text-[#0a0b0e] font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shadow z-10 uppercase tracking-tight">
                    Trial
                  </span>
                )}
                {isBorrowed && (
                  <span className="absolute -top-1.5 -left-1.5 bg-emerald-700 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shadow z-10">
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
                <span className="text-[11px] font-semibold text-zinc-100 truncate w-full text-center">
                  {char.name}
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  {reservedActs && reservedActs.length > 0 && (
                    <span className="text-[9px] font-bold text-[#f3cf58] bg-[#d4af37]/15 border border-[#d4af37]/35 px-1.5 py-0.5 rounded">
                      Save A{reservedActs[reservedActs.length - 1]}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${vigorBadge}`}
                    >
                      {vigor}V
                    </span>
                    <span className="text-[10px] text-zinc-300 font-mono">
                      Lv.{char.level ?? (profiles?.[char.id]?.level ?? 90)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredRoster.excludedUnderleveled && filteredRoster.excludedUnderleveled.length > 0 && (
          <div className="pt-2.5 border-t border-[#202538] flex flex-wrap items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
            <span className="font-semibold">
              Below Lv. 70 Gate ({difficulty}):
            </span>
            <span className="text-zinc-300">
              {filteredRoster.excludedUnderleveled
                .slice(0, 6)
                .map((c) => `${c.name} (Lv.${c.level ?? '?'})`)
                .join(', ')}
              {filteredRoster.excludedUnderleveled.length > 6
                ? ` +${filteredRoster.excludedUnderleveled.length - 6} more`
                : ''}
            </span>
          </div>
        )}
      </section>

      {/* Season Strategy, Preservation & Phased Draft Plan */}
      {seasonAnalysis && (
        <section
          aria-label="Imaginarium Theater Strategy and Draft Plan"
          className="bg-[#121420] border border-[#24293d] rounded-2xl p-5 space-y-5 shadow-lg"
        >
          {/* Apex Boss Readiness & Season Blessing */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#202538] pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Season Intelligence · Preservation &amp; Draft Plan
                </h2>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {seasonAnalysis.apexBossSummary}
              </p>
              {activeSeason.blessingSummary && (
                <p className="text-xs text-amber-200/90">
                  ✨ {activeSeason.blessingSummary}
                </p>
              )}
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
                seasonAnalysis.apexBossReadiness === 'Ready'
                  ? 'bg-emerald-950/65 text-emerald-200 border-emerald-400/45'
                  : seasonAnalysis.apexBossReadiness === 'Needs Preparation'
                    ? 'bg-amber-950/65 text-amber-200 border-amber-400/45'
                    : 'bg-rose-950/65 text-rose-200 border-rose-400/45'
              }`}
            >
              Apex Boss: {seasonAnalysis.apexBossReadiness}
            </span>
          </div>

          {/* Archetypes & Roster Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0e1019] border border-[#202538] rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-[#f3cf58] uppercase tracking-wider">
                High-Value Season Archetypes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {seasonAnalysis.recommendedArchetypes.map((arch) => (
                  <span
                    key={arch}
                    className="text-xs bg-[#181c2e] text-zinc-100 border border-[#323954] px-2.5 py-1 rounded-lg font-medium"
                  >
                    {arch}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#0e1019] border border-[#202538] rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Roster Weaknesses &amp; Risk Checks</span>
              </div>
              {seasonAnalysis.rosterWeaknesses.length > 0 ? (
                <ul className="space-y-1 text-xs text-zinc-200 list-disc list-inside">
                  {seasonAnalysis.rosterWeaknesses.map((weakness, idx) => (
                    <li key={idx} className="leading-snug">
                      {weakness}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                  <span>Balanced carry, sustain, buffer, and boss counter coverage across all acts.</span>
                </div>
              )}
            </div>
          </div>

          {/* Preservation Priority Strip */}
          {seasonAnalysis.preservationPlan.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-[#f3cf58] uppercase tracking-wider">
                Preserve Vigor for Late Boss Acts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {seasonAnalysis.preservationPlan.map((entry) => {
                  const charObj = effectiveEligible.find((c) => c.id === entry.characterId);
                  return (
                    <button
                      key={entry.characterId}
                      type="button"
                      onClick={() => charObj && setSelectedCharacter(charObj)}
                      className="text-left bg-[#0e1019] hover:bg-[#161a29] border border-[#282f48] hover:border-[#d4af37]/50 rounded-xl p-3 space-y-1.5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {charObj && (
                            <CharacterPortrait
                              src={charObj.icon}
                              name={charObj.name}
                              element={charObj.element}
                              size="xs"
                            />
                          )}
                          <span className="text-xs font-bold text-zinc-100 truncate">
                            {entry.characterName}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            entry.priority === 'Critical'
                              ? 'bg-rose-950/75 text-rose-200 border border-rose-400/45'
                              : entry.priority === 'High'
                                ? 'bg-amber-950/75 text-amber-200 border border-amber-400/45'
                                : 'bg-sky-950/75 text-sky-200 border border-sky-400/45'
                          }`}
                        >
                          Act {entry.reservedForActs.join(', ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                        {entry.reason}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phased Practical Draft Plan */}
          {seasonAnalysis.draftPlan.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Practical Run Draft Roadmap</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {seasonAnalysis.draftPlan.map((step) => (
                  <div
                    key={step.phase}
                    className="bg-[#0e1019] border border-[#202538] rounded-xl p-3 space-y-1.5 text-xs"
                  >
                    <div className="font-bold text-[#f3cf58]">{step.phase}</div>
                    <p className="text-zinc-200 text-[11px] leading-relaxed">{step.guidance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Act Roadmap Grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
            <h2 className="text-base font-bold text-zinc-100 font-serif flex items-center gap-2">
              <span>Act Schedule &amp; Boss Strategy ({schedule.length} Acts)</span>
              {isPending && (
                <span
                  role="status"
                  className="text-xs font-mono text-amber-300 font-normal animate-pulse motion-reduce:animate-none"
                >
                  (drafting schedule…)
                </span>
              )}
            </h2>
          </div>
          <span className="text-xs text-zinc-300">
            Pin acts to preserve customizations. Use <strong className="text-zinc-100">Swap</strong> or{' '}
            <strong className="text-zinc-100">+ Add</strong> to edit slots.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedule.map((act) => {
            const isBoss = act.type === 'Boss';
            const isLocked = lockedActNumbers.has(act.actNumber);
            const bossInfo = act.bossName ? THEATER_BOSS_INFO[act.bossName] : undefined;
            const bossMatchup =
              act.bossMatchup ||
              (act.bossName ? evaluateBossActMatchup(act.team, act.bossName) : undefined);

            return (
              <article
                key={act.actNumber}
                className={`rounded-2xl p-5 border transition-colors flex flex-col justify-between gap-4 ${
                  isLocked
                    ? 'bg-gradient-to-br from-[#1d1b28] via-[#161522] to-[#12111d] border-[#d4af37] shadow-xl'
                    : isBoss
                      ? 'bg-gradient-to-br from-[#1a1828] via-[#161424] to-[#12111d] border-amber-400/45 shadow-lg'
                      : 'bg-[#121420] border-[#24293d]'
                }`}
              >
                <div>
                  {/* Act Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24293d] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isBoss
                            ? 'bg-amber-500/20 text-amber-200 border-amber-400/45'
                            : 'bg-[#1a1e2e] text-zinc-200 border-[#323954]'
                        }`}
                      >
                        Act {act.actNumber}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                          {isBoss ? (
                            <>
                              <Crown className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                              <span>{act.bossName || 'Boss Encounter'}</span>
                            </>
                          ) : (
                            <span>
                              {act.type === 'Defense' ? 'Monolith Defense' : 'Standard Encounter'}
                            </span>
                          )}
                        </h3>
                        {bossInfo && <div className="text-xs text-zinc-300">{bossInfo.title}</div>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {isBoss && bossMatchup && (
                        <span
                          className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                            bossMatchup.rating === 'S'
                              ? 'bg-emerald-950/75 text-emerald-200 border-emerald-400/50'
                              : bossMatchup.rating === 'A'
                                ? 'bg-sky-950/75 text-sky-200 border-sky-400/50'
                                : bossMatchup.rating === 'B'
                                  ? 'bg-amber-950/75 text-amber-200 border-amber-400/50'
                                  : 'bg-rose-950/75 text-rose-200 border-rose-400/50'
                          }`}
                          title={bossMatchup.reason}
                        >
                          Rating {bossMatchup.rating} ({bossMatchup.score}pts)
                        </span>
                      )}

                      {isBoss && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200 bg-amber-950/55 border border-amber-400/40 px-2 py-0.5 rounded-full">
                          Apex Boss
                        </span>
                      )}

                      <button
                        type="button"
                        aria-pressed={isLocked}
                        aria-label={
                          isLocked ? `Unpin Act ${act.actNumber}` : `Pin Act ${act.actNumber}`
                        }
                        onClick={() => handleToggleLock(act.actNumber)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                          isLocked
                            ? 'bg-[#d4af37] text-[#0a0b0e] border-[#d4af37] shadow-sm'
                            : 'bg-[#161928] text-zinc-200 border-[#323954] hover:text-white hover:bg-[#1f243b]'
                        }`}
                        title={
                          isLocked
                            ? 'Act Locked (preserved across Auto-Draft)'
                            : 'Pin this act so Auto-Draft preserves it'
                        }
                      >
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{isLocked ? 'Locked' : 'Pin'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Boss Hazard & Recommended Archetype Callout */}
                  {bossInfo && (
                    <div className="mt-3 p-3.5 bg-[#0e1019] rounded-xl border border-[#202538] space-y-2 text-xs">
                      <div className="text-rose-200 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" aria-hidden="true" />
                        <span>Hazard: {bossInfo.hazard}</span>
                      </div>
                      <div className="text-zinc-200 leading-relaxed">💡 {bossInfo.weakness}</div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-zinc-300 font-semibold uppercase">
                          Archetypes:
                        </span>
                        {bossInfo.recommendedArchetypes.map((arch) => (
                          <span
                            key={arch}
                            className="text-[11px] bg-[#1a1e2e] text-[#f3cf58] px-2 py-0.5 rounded border border-[#d4af37]/30 font-medium"
                          >
                            {arch}
                          </span>
                        ))}
                      </div>

                      {bossMatchup && (
                        <div className="mt-2 pt-2 border-t border-[#202538] space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-zinc-200">
                              Clear Rating:{' '}
                              <strong
                                className={
                                  bossMatchup.rating === 'S'
                                    ? 'text-emerald-300'
                                    : bossMatchup.rating === 'A'
                                      ? 'text-sky-300'
                                      : bossMatchup.rating === 'B'
                                        ? 'text-amber-300'
                                        : 'text-rose-300'
                                }
                              >
                                {bossMatchup.rating} Tier
                              </strong>
                            </span>
                            <span className="text-xs text-zinc-300 font-mono">
                              Counter Score: {bossMatchup.score}/100
                            </span>
                          </div>
                          <div className="text-xs text-zinc-200 leading-snug">
                            {bossMatchup.reason}
                          </div>
                          {bossMatchup.counterHighlights &&
                            bossMatchup.counterHighlights.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {bossMatchup.counterHighlights.map((hl) => (
                                  <span
                                    key={hl}
                                    className="text-[11px] bg-emerald-950/60 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded"
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const member = act.team[slotIdx];

                      if (member) {
                        const color = ELEMENT_BADGES[member.element] || {
                          bg: 'bg-[#181c2b]',
                          text: 'text-zinc-200',
                          border: 'border-[#323954]',
                        };

                        return (
                          <div
                            key={member.id}
                            className={`bg-[#0e1019] border ${color.border} rounded-xl p-2.5 flex flex-col justify-between gap-2 relative hover:border-[#d4af37]/65 transition-colors`}
                          >
                            {member.isTrial && (
                              <span className="absolute top-1.5 right-1.5 bg-[#d4af37] text-[#0a0b0e] font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shadow z-10 uppercase tracking-tight">
                                Trial
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedCharacter(member)}
                              aria-label={`View ${member.name} build and details`}
                              className="w-full cursor-pointer flex flex-col items-center gap-1 bg-transparent border-0 p-0 text-center"
                            >
                              <CharacterPortrait
                                src={member.icon}
                                name={member.name}
                                element={member.element}
                                rarity={member.rarity}
                                size="sm"
                              />
                              <div className="text-xs font-bold text-zinc-100 truncate w-full">
                                {member.name}
                              </div>
                              <div className={`text-[11px] font-semibold ${color.text} truncate w-full`}>
                                {member.roles[0] || member.element}
                              </div>
                            </button>

                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                aria-label={`Swap ${member.name} in Act ${act.actNumber}`}
                                onClick={() =>
                                  setSwapTarget({ actNumber: act.actNumber, oldChar: member })
                                }
                                className="flex-1 min-h-[34px] flex items-center justify-center gap-1 text-[11px] font-semibold bg-[#181c2d] hover:bg-[#252c46] text-zinc-200 hover:text-[#f3cf58] px-1.5 py-1 rounded-lg border border-[#323954] transition-colors cursor-pointer"
                                title="Replace this character"
                              >
                                <ArrowLeftRight className="w-3 h-3" aria-hidden="true" />
                                <span>Swap</span>
                              </button>

                              <button
                                type="button"
                                aria-label={`Remove ${member.name} from Act ${act.actNumber}`}
                                onClick={() => handleRemoveMember(act.actNumber, member.id)}
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center text-zinc-300 hover:text-rose-200 bg-[#181c2d] hover:bg-rose-950/60 border border-[#323954] rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Remove from act"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`empty-${slotIdx}`}
                          className="bg-[#0b0d15] border border-dashed border-[#2c334d] rounded-xl p-2.5 flex flex-col items-center justify-center gap-2 min-h-[144px] text-center"
                        >
                          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                            Slot {slotIdx + 1}
                          </span>
                          <span className="text-xs text-zinc-400">Empty</span>
                          <button
                            type="button"
                            aria-label={`Add character to Act ${act.actNumber} Slot ${slotIdx + 1}`}
                            onClick={() =>
                              setSwapTarget({ actNumber: act.actNumber, oldChar: null })
                            }
                            className="min-h-[36px] mt-1 flex items-center justify-center gap-1 text-xs font-bold bg-[#1a1e2e] hover:bg-[#d4af37] text-zinc-100 hover:text-[#0a0b0e] px-3 py-1 rounded-lg border border-[#323954] hover:border-[#d4af37] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Add</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Manual Swap / Add Modal (accessible dialog with focus trap & Escape) */}
      {swapTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="theater-swap-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={closeSwapModal}
        >
          <div
            ref={swapDialogRef}
            tabIndex={-1}
            className="bg-[#121420] border border-[#2c334d] rounded-2xl max-w-lg w-full max-h-[88vh] p-5 flex flex-col gap-4 shadow-2xl focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#24293d] pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                <h2 id="theater-swap-title" className="text-sm font-bold text-zinc-100 font-serif">
                  {swapTarget.oldChar
                    ? `Swap ${swapTarget.oldChar.name} (Act ${swapTarget.actNumber})`
                    : `Add Character to Act ${swapTarget.actNumber}`}
                </h2>
              </div>
              <button
                ref={swapCloseBtnRef}
                type="button"
                aria-label="Close character swap modal"
                onClick={closeSwapModal}
                className="min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#1f243b] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-950/60 border border-rose-400/50 text-xs text-rose-100"
              >
                {modalError}
              </div>
            )}

            <p className="text-xs text-zinc-300 leading-relaxed">
              Select an available character from your eligible roster with at least 1 remaining Vigor point who is not already deployed in Act {swapTarget.actNumber}:
            </p>

            {/* Candidate List */}
            <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pr-1">
              {swapCandidates.map((candidate) => {
                const vigor = vigorState[candidate.id] ?? 2;
                const color = ELEMENT_BADGES[candidate.element];
                const isBorrowed = candidate.id === borrowedCharId;

                return (
                  <div
                    key={candidate.id}
                    className={`flex items-center justify-between gap-2 border p-2.5 rounded-xl transition-colors ${
                      isBorrowed
                        ? 'bg-emerald-950/25 border-emerald-400/50'
                        : 'bg-[#161a29] border-[#282f48] hover:border-[#3c4566]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CharacterPortrait
                        src={candidate.icon}
                        name={candidate.name}
                        element={candidate.element}
                        rarity={candidate.rarity}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-100 flex flex-wrap items-center gap-1.5">
                          <span className="truncate">{candidate.name}</span>
                          {isBorrowed && (
                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/45 px-1.5 py-0.5 rounded">
                              Friend Borrow
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-300 flex flex-wrap items-center gap-1.5">
                          <span className={color.text}>{candidate.element}</span>
                          <span>•</span>
                          <span>{candidate.weapon}</span>
                          <span>•</span>
                          <span>{candidate.roles[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono font-bold bg-emerald-950/75 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                        {vigor} Vigor
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePerformSwap(candidate.id)}
                        className="min-h-[38px] text-xs font-bold bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })}

              {swapCandidates.length === 0 && (
                <div role="status" className="text-center py-6 text-xs text-zinc-300">
                  No other eligible characters with remaining vigor are available to swap into this act.
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
