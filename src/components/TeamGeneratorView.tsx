import React, { useState, useMemo, useEffect, useTransition, useRef, useReducer, useId } from 'react';
import { CHARACTERS } from '../data/characters';
import {
  TEMPLATES,
  calculateCompatibilityScore,
  calculateInvestmentScore,
  determineBenchmarkTier,
  calculatePracticalPerformanceScore,
  calculateDamageOutputInfo,
} from '../engines/team-generator';
import {
  calculateComfortScore,
  evaluateEnergyBattery,
  detectBennettC6Conflict,
  detectDualCarryContention,
  detectFurinaHealerDeficit,
} from '../engines/team-rules';
import { generateTeamExplanation } from '../engines/team-explain';
import { synthesizeTeamRotation } from '../engines/rotation-synthesizer';
import { dispatchGenerateBestTeams } from '../services/solver-dispatcher';
import type {
  Character,
  OwnedCharacterProfile,
  OwnedWeapon,
  TeamWeaponAssignment,
  TeamRecommendation,
  RecommendationCollection,
  RecommendationReliability,
} from '../types/genshin';
import {
  Sparkles,
  Shield,
  Zap,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  Swords,
  X,
  Users,
  Compass,
  AlertTriangle,
  ArrowRightLeft,
  Layers,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { LazyCharacterDetailModal } from './LazyCharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';
import { RotationBadgeList } from './RotationBadgeList';
import { InfoTooltip } from './InfoTooltip';
import { RecommendationReliabilityBadge } from './RecommendationReliabilityBadge';
import { RecommendationReliabilityBanner } from './RecommendationReliabilityBanner';
import { ReliabilityDetailsPanel } from './ReliabilityDetailsPanel';
import {
  rankWeaponsForCharacter,
  scoreWeaponForCharacter,
  assignOptimalTeamWeapons,
} from '../engines/weapon-solver';
import { getSavedWeapons, getSavedProfiles } from '../services/storage';
import { equipWeaponToCharacter } from '../services/armory-operations';
import { getWeaponByKey } from '../data/weapons';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface TeamGeneratorViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
  weapons?: OwnedWeapon[];
  onUpdateWeapons?: (weapons: OwnedWeapon[]) => void;
  onUpdateProfile?: (profile: OwnedCharacterProfile) => void;
  onUpdateProfiles?: (profiles: Record<string, OwnedCharacterProfile>) => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pyro: { bg: 'bg-rose-950/35', text: 'text-rose-300', border: 'border-rose-400/35' },
  Hydro: { bg: 'bg-sky-950/35', text: 'text-sky-300', border: 'border-sky-400/35' },
  Dendro: { bg: 'bg-emerald-950/35', text: 'text-emerald-300', border: 'border-emerald-400/35' },
  Electro: { bg: 'bg-purple-950/35', text: 'text-purple-300', border: 'border-purple-400/35' },
  Anemo: { bg: 'bg-teal-950/35', text: 'text-teal-300', border: 'border-teal-400/35' },
  Cryo: { bg: 'bg-cyan-950/35', text: 'text-cyan-200', border: 'border-cyan-400/35' },
  Geo: { bg: 'bg-amber-950/35', text: 'text-amber-300', border: 'border-amber-400/35' },
};

const CHARACTER_NAME_BY_ID = new Map<string, string>(
  CHARACTERS.map((c) => [c.id, c.name])
);

function getCharacterName(id: string): string {
  return CHARACTER_NAME_BY_ID.get(id) ?? id;
}

export interface TeamGeneratorSolveState {
  teamResult: RecommendationCollection<TeamRecommendation> | null;
  resultInputKey: string | null;
  isSolving: boolean;
  solverError: string | null;
}

export type TeamGeneratorSolveAction =
  | { type: 'INSUFFICIENT_ROSTER' }
  | { type: 'SOLVE_STARTED' }
  | {
      type: 'SOLVE_SUCCEEDED';
      result: RecommendationCollection<TeamRecommendation>;
      inputKey: string;
    }
  | { type: 'SOLVE_FAILED'; error: string }
  | {
      type: 'SWAP_MEMBER_UPDATED';
      updater: (
        prev: RecommendationCollection<TeamRecommendation> | null,
      ) => RecommendationCollection<TeamRecommendation> | null;
    };

/** Canonicalizes nested plain values so equivalent objects produce identical snapshots. */
function canonicalizeSolveInputValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeSolveInputValue);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      const entry = record[key];
      if (entry !== undefined) {
        normalized[key] = canonicalizeSolveInputValue(entry);
      }
    }
    return normalized;
  }
  return value;
}

/** Builds a deterministic snapshot key covering all material solve inputs. */
export function buildTeamGenerationInputKey(params: TeamGenerationRequestParams): string {
  const normalizedOwnedIds = Array.from(new Set(params.ownedIds)).sort();
  const normalizedFocusId = params.focusId || '';
  const normalizedProfiles = canonicalizeSolveInputValue(params.profiles ?? {});
  const normalizedWeapons = canonicalizeSolveInputValue(params.weaponBag);

  return JSON.stringify({
    ownedIds: normalizedOwnedIds,
    focusId: normalizedFocusId,
    profiles: normalizedProfiles,
    weaponBag: normalizedWeapons,
    showCatalogFallback: Boolean(params.showCatalogFallback),
  });
}

/** Creates the initial solver state for TeamGeneratorView. */
export function createInitialTeamGeneratorSolveState(init: {
  ownedCount: number;
  showCatalogFallback: boolean;
}): TeamGeneratorSolveState {
  return {
    teamResult: null,
    resultInputKey: null,
    isSolving: init.ownedCount >= 4 || init.showCatalogFallback,
    solverError: null,
  };
}

/** Pure state reducer for async team generation and inline member swaps. */
export function teamGeneratorSolveReducer(
  state: TeamGeneratorSolveState,
  action: TeamGeneratorSolveAction,
): TeamGeneratorSolveState {
  switch (action.type) {
    case 'INSUFFICIENT_ROSTER':
      return { teamResult: null, resultInputKey: null, isSolving: false, solverError: null };
    case 'SOLVE_STARTED':
      return { teamResult: null, resultInputKey: null, isSolving: true, solverError: null };
    case 'SOLVE_SUCCEEDED':
      return {
        teamResult: action.result,
        resultInputKey: action.inputKey,
        isSolving: false,
        solverError: null,
      };
    case 'SOLVE_FAILED':
      return { teamResult: null, resultInputKey: null, isSolving: false, solverError: action.error };
    case 'SWAP_MEMBER_UPDATED':
      return { ...state, teamResult: action.updater(state.teamResult) };
  }
}

export interface TeamGenerationRequestParams {
  ownedIds: string[];
  focusId?: string;
  profiles?: Record<string, OwnedCharacterProfile>;
  weaponBag: OwnedWeapon[];
  showCatalogFallback: boolean;
}

export interface TeamGenerationLifecycleGuards {
  requestIdRef: { current: number };
  isMountedRef: { current: boolean };
  dispatch: (action: TeamGeneratorSolveAction) => void;
  dispatcher?: typeof dispatchGenerateBestTeams;
  scheduleTransition?: (fn: () => void) => void;
}

function formatTeamGenerationError(err: unknown): string {
  return err instanceof Error && err.message.trim().length > 0
    ? err.message
    : 'Failed to generate team recommendations.';
}

/**
 * Starts a sequenced team-generation request and returns a cleanup callback
 * that invalidates this request on unmount or superseded re-runs.
 */
export function startTeamGenerationRequest(
  params: TeamGenerationRequestParams,
  guards: TeamGenerationLifecycleGuards,
): () => void {
  const requestId = ++guards.requestIdRef.current;
  let isEffectActive = true;

  const isCurrentAndActive = () =>
    isEffectActive && guards.isMountedRef.current && requestId === guards.requestIdRef.current;

  const cleanup = () => {
    isEffectActive = false;
    guards.requestIdRef.current += 1;
  };

  if (params.ownedIds.length < 4 && !params.showCatalogFallback) {
    guards.dispatch({ type: 'INSUFFICIENT_ROSTER' });
    return cleanup;
  }

  guards.dispatch({ type: 'SOLVE_STARTED' });

  const inputKey = buildTeamGenerationInputKey(params);
  const runDispatch = guards.dispatcher ?? dispatchGenerateBestTeams;
  let dispatchPromise: Promise<RecommendationCollection<TeamRecommendation>>;
  try {
    dispatchPromise = Promise.resolve(
      runDispatch(
        params.ownedIds,
        params.focusId || undefined,
        params.profiles,
        params.weaponBag,
        params.showCatalogFallback,
      ),
    );
  } catch (err: unknown) {
    if (isCurrentAndActive()) {
      guards.dispatch({ type: 'SOLVE_FAILED', error: formatTeamGenerationError(err) });
    }
    return cleanup;
  }

  dispatchPromise
    .then((result) => {
      if (!isCurrentAndActive()) return;
      const applyResult = () => {
        if (!isCurrentAndActive()) return;
        guards.dispatch({ type: 'SOLVE_SUCCEEDED', result, inputKey });
      };
      if (guards.scheduleTransition) {
        guards.scheduleTransition(applyResult);
      } else {
        applyResult();
      }
    })
    .catch((err: unknown) => {
      if (!isCurrentAndActive()) return;
      guards.dispatch({ type: 'SOLVE_FAILED', error: formatTeamGenerationError(err) });
    });

  return cleanup;
}

export interface QuickSwapTarget {
  teamId: string;
  character: Character;
  teamMembers: Character[];
  currentAssignment?: TeamWeaponAssignment;
}

export interface QuickSwapModalState {
  target: QuickSwapTarget | null;
  isDetailsOpen: boolean;
}

export type QuickSwapModalAction =
  | { type: 'OPEN_TARGET'; target: QuickSwapTarget }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE_DETAILS' }
  | { type: 'CLOSE_DETAILS' };

export const initialQuickSwapModalState: QuickSwapModalState = {
  target: null,
  isDetailsOpen: false,
};

/** Pure state reducer ensuring Quick Swap disclosure resets on close or target change. */
export function quickSwapModalReducer(
  state: QuickSwapModalState,
  action: QuickSwapModalAction,
): QuickSwapModalState {
  switch (action.type) {
    case 'OPEN_TARGET':
      return { target: action.target, isDetailsOpen: false };
    case 'CLOSE':
      return { target: null, isDetailsOpen: false };
    case 'TOGGLE_DETAILS':
      return state.target ? { ...state, isDetailsOpen: !state.isDetailsOpen } : state;
    case 'CLOSE_DETAILS':
      return state.isDetailsOpen ? { ...state, isDetailsOpen: false } : state;
  }
}

export interface TeamGeneratorReliabilitySectionProps {
  reliability?: RecommendationReliability | null;
  detailsControlsId: string;
  isDetailsOpen: boolean;
  onToggleDetails: () => void;
  onCloseDetails: () => void;
  solverError?: string | null;
  onRetry?: () => void;
}

/** Reliability banner, details panel, and split worker-error alert for Main Best Teams. */
export const TeamGeneratorReliabilitySection: React.FC<TeamGeneratorReliabilitySectionProps> = ({
  reliability,
  detailsControlsId,
  isDetailsOpen,
  onToggleDetails,
  onCloseDetails,
  solverError,
  onRetry,
}) => {
  if (!reliability && !solverError) {
    return null;
  }

  return (
    <div className="space-y-3">
      {solverError && (
        <div
          data-reliability-container="alert"
          className="w-full max-w-full min-w-0 p-3.5 rounded-xl border bg-rose-950/85 border-rose-500/65 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div role="alert" aria-live="assertive" className="min-w-0 flex-1">
            <div className="flex items-start gap-2.5 min-w-0">
              <ShieldAlert className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-0.5 text-xs leading-relaxed">
                <p className="font-bold text-rose-100">Team Synergy Solver Error</p>
                <p className="text-rose-200 break-words">{solverError}</p>
              </div>
            </div>
          </div>
          {onRetry && (
            <div className="shrink-0 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-rose-200 text-rose-950 border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {reliability && (
        <>
          <RecommendationReliabilityBanner
            reliability={reliability}
            contextLabel="Team Synergy Solver"
            detailsControlsId={detailsControlsId}
            isDetailsOpen={isDetailsOpen}
            onToggleDetails={onToggleDetails}
          />
          <ReliabilityDetailsPanel
            id={detailsControlsId}
            reliability={reliability}
            isOpen={isDetailsOpen}
            onClose={onCloseDetails}
            contextLabel="Team Synergy Solver"
          />
        </>
      )}
    </div>
  );
};

export interface QuickSwapReliabilitySectionProps {
  reliability?: RecommendationReliability | null;
  detailsControlsId: string;
  isDetailsOpen: boolean;
  onToggleDetails: () => void;
  onCloseDetails: () => void;
}

/** Reliability badge, banner, and details panel for the Quick Swap Weapon Modal. */
export const QuickSwapReliabilitySection: React.FC<QuickSwapReliabilitySectionProps> = ({
  reliability,
  detailsControlsId,
  isDetailsOpen,
  onToggleDetails,
  onCloseDetails,
}) => {
  if (!reliability) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RecommendationReliabilityBadge
          size="sm"
          reliability={reliability}
          detailsControlsId={detailsControlsId}
          isDetailsOpen={isDetailsOpen}
          onToggleDetails={onToggleDetails}
        />
      </div>
      <RecommendationReliabilityBanner
        reliability={reliability}
        contextLabel="Quick Swap Weapon Ranking"
        detailsControlsId={detailsControlsId}
        isDetailsOpen={isDetailsOpen}
        onToggleDetails={onToggleDetails}
      />
      <ReliabilityDetailsPanel
        id={detailsControlsId}
        reliability={reliability}
        isOpen={isDetailsOpen}
        onClose={onCloseDetails}
        contextLabel="Quick Swap Weapon Ranking"
      />
    </div>
  );
};

export const TeamGeneratorView: React.FC<TeamGeneratorViewProps> = ({
  ownedIds,
  profiles,
  weapons,
  onUpdateWeapons,
  onUpdateProfile,
  onUpdateProfiles,
  isDemoMode: _isDemoMode,
  onToggleDemoMode,
}) => {
  const [focusId, setFocusId] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedDrawerTeamId, setExpandedDrawerTeamId] = useState<string | null>(null);
  const [showCatalogFallback, setShowCatalogFallback] = useState<boolean>(false);
  const [quickSwapState, dispatchQuickSwap] = useReducer(
    quickSwapModalReducer,
    initialQuickSwapModalState,
  );
  const quickSwapTarget = quickSwapState.target;
  const [customAssignments, setCustomAssignments] = useState<
    Record<string, Record<string, TeamWeaponAssignment>>
  >({});
  const [isTeamDetailsOpen, setIsTeamDetailsOpen] = useState<boolean>(false);
  const teamDetailsId = useId();
  const swapDetailsId = useId();

  const swapModalRef = useRef<HTMLDivElement>(null);
  const swapCloseBtnRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useModalAccessibility({
    isOpen: Boolean(quickSwapTarget),
    onClose: () => dispatchQuickSwap({ type: 'CLOSE' }),
    containerRef: swapModalRef,
    initialFocusRef: swapCloseBtnRef,
  });

  const weaponBag = useMemo(() => weapons || getSavedWeapons(), [weapons]);
  const solveParams = useMemo<TeamGenerationRequestParams>(
    () => ({
      ownedIds,
      focusId: focusId || undefined,
      profiles,
      weaponBag,
      showCatalogFallback,
    }),
    [ownedIds, focusId, profiles, weaponBag, showCatalogFallback],
  );
  const currentSolveInputKey = useMemo(
    () => buildTeamGenerationInputKey(solveParams),
    [solveParams],
  );

  // Retain full RecommendationCollection envelope (items + reliability) in state for Phase 4
  const [solveState, dispatchSolve] = useReducer(
    teamGeneratorSolveReducer,
    { ownedCount: ownedIds.length, showCatalogFallback },
    createInitialTeamGeneratorSolveState,
  );
  const { teamResult, resultInputKey, isSolving, solverError } = solveState;
  const hasMatchingResult = teamResult !== null && resultInputKey === currentSolveInputKey;
  const visibleTeamResult = hasMatchingResult ? teamResult : null;
  const teams = useMemo(() => visibleTeamResult?.items ?? [], [visibleTeamResult]);
  const [retryNonce, setRetryNonce] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return startTeamGenerationRequest(solveParams, {
      requestIdRef,
      isMountedRef,
      dispatch: dispatchSolve,
      scheduleTransition: startTransition,
    });
  }, [solveParams, retryNonce]);

  const handleRetrySolve = () => {
    setRetryNonce((prev) => prev + 1);
  };

  // Retain full weapon-ranking collection envelope (items + reliability) for the active swap modal
  const quickSwapWeaponRanking = useMemo(() => {
    if (!quickSwapTarget) return null;
    return rankWeaponsForCharacter(
      quickSwapTarget.character,
      weaponBag,
      quickSwapTarget.teamMembers,
    );
  }, [quickSwapTarget, weaponBag]);

  const handleSwapMember = (
    teamId: string,
    originalId: string,
    newMember: Character,
  ) => {
    dispatchSolve({
      type: 'SWAP_MEMBER_UPDATED',
      updater: (prevResult) => {
        if (!prevResult) return prevResult;
        return {
        ...prevResult,
        items: prevResult.items.map((t) => {
        if (t.id !== teamId) return t;
        const newMembers = t.members.map((m) => (m.id === originalId ? newMember : m));
        const template = TEMPLATES.find((tpl) => tpl.archetype === t.archetype) || {
          name: t.archetype,
          archetype: t.archetype,
          leadTags: [],
          supportTags: [],
          rotation: t.rotation,
          baseSynergy: 90,
        };
        const updatedWeaponAssignments = assignOptimalTeamWeapons(newMembers, weaponBag, profiles);
        const compatibilityScore = calculateCompatibilityScore(
          newMembers,
          template,
          profiles,
          updatedWeaponAssignments,
        );
        const investmentScore = calculateInvestmentScore(newMembers, profiles, updatedWeaponAssignments);
        const benchmarkTier = determineBenchmarkTier(
          template.archetype,
          compatibilityScore,
          newMembers,
        );
        const pool = CHARACTERS.filter((c) => ownedIds.includes(c.id));
        const explanation = generateTeamExplanation(
          newMembers,
          template,
          pool,
          profiles,
          updatedWeaponAssignments,
          (mList) => calculateCompatibilityScore(mList, template, profiles, updatedWeaponAssignments),
        );
        const comfortScore = calculateComfortScore(newMembers, profiles);
        const energyBattery = evaluateEnergyBattery(newMembers, updatedWeaponAssignments);
        const bennettConflict = detectBennettC6Conflict(newMembers, profiles);
        const dualCarry = detectDualCarryContention(newMembers);
        const furinaDeficit = detectFurinaHealerDeficit(newMembers);
        const hasCriticalConflict =
          bennettConflict.hasConflict ||
          dualCarry.hasContention ||
          furinaDeficit.severity === 'severe';

        const practicalPerformanceScore = calculatePracticalPerformanceScore(
          compatibilityScore,
          comfortScore,
          investmentScore,
          energyBattery.status,
          hasCriticalConflict,
        );

        const damageOutput = calculateDamageOutputInfo(
          template.archetype,
          benchmarkTier,
          compatibilityScore,
          investmentScore,
        );

        const stepped = synthesizeTeamRotation(newMembers);

        return {
          ...t,
          members: newMembers,
          synergyScore: compatibilityScore,
          compositionCompatibilityScore: compatibilityScore,
          comfortScore,
          rotation: stepped.summaryString || t.rotation,
          steppedRotation: stepped,
          weaponAssignments: updatedWeaponAssignments,
          scores: {
            compatibilityScore,
            investmentScore,
            benchmarkTier,
            practicalPerformanceScore,
            damageOutput,
          },
          explanation,
        };
        }),
        };
      },
    });
  };

  const featuredCarries = ['Nefer', 'Mavuika', 'HuTao', 'Alhaitham', 'Clorinde', 'Neuvillette', 'Navia'];
  const isInsufficientRoster = ownedIds.length < 4 && !showCatalogFallback;
  const isPendingInputReevaluation =
    !isInsufficientRoster && teamResult !== null && resultInputKey !== currentSolveInputKey;
  const effectiveIsSolving = isSolving || isPendingInputReevaluation;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121420] via-[#191d30] to-[#121420] p-5 sm:p-6 rounded-2xl border border-[#24293d] shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[#f3cf58] text-xs font-bold tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Instant Archetype Synergy Engine</span>
              <RecommendationReliabilityBadge
                reliability={visibleTeamResult?.reliability}
                isLoading={effectiveIsSolving}
                emptyLabel={isInsufficientRoster ? 'Awaiting 4+ Roster' : undefined}
                size="sm"
                detailsControlsId={teamDetailsId}
                isDetailsOpen={isTeamDetailsOpen}
                onToggleDetails={() => setIsTeamDetailsOpen((v) => !v)}
              />
              {(isPending || effectiveIsSolving) && (
                <span
                  role="status"
                  className="text-xs text-amber-300 animate-pulse motion-reduce:animate-none font-normal lowercase tracking-normal"
                >
                  (updating…)
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              Best Team Recommendations
            </h1>
            <p className="text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Calculates optimal 4-slot compositions from your owned roster ({ownedIds.length} characters) balancing elemental resonance, reaction chains, buffer multipliers, and survivability. Select any character to inspect builds and talents.
            </p>
          </div>

          {/* Quick Focus Selector */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-zinc-200">Focus on Main Carry:</span>
            <div
              role="group"
              aria-label="Focus on main carry"
              className="flex items-center overflow-x-auto sm:flex-wrap gap-1.5 pb-1 sm:pb-0 touch-pan-x"
            >
              <button
                type="button"
                aria-pressed={focusId === ''}
                onClick={() => setFocusId('')}
                className={`min-h-[38px] sm:min-h-[32px] px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                  focusId === ''
                    ? 'bg-[#d4af37] text-[#0a0b0e] font-bold shadow-sm'
                    : 'bg-[#1a1e2e] text-zinc-200 border border-[#2c334d] hover:bg-[#252b42]'
                }`}
              >
                All Teams
              </button>
              {featuredCarries.map((id) => {
                const char = CHARACTERS.find((c) => c.id === id);
                if (!char) return null;
                const isSelected = focusId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setFocusId(id)}
                    className={`min-h-[38px] sm:min-h-[32px] px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#d4af37] text-[#0a0b0e] font-bold shadow-sm'
                        : 'bg-[#1a1e2e] text-zinc-200 border border-[#2c334d] hover:bg-[#252b42]'
                    }`}
                  >
                    {char.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <TeamGeneratorReliabilitySection
        reliability={visibleTeamResult?.reliability}
        detailsControlsId={teamDetailsId}
        isDetailsOpen={isTeamDetailsOpen}
        onToggleDetails={() => setIsTeamDetailsOpen((v) => !v)}
        onCloseDetails={() => setIsTeamDetailsOpen(false)}
        solverError={solverError}
        onRetry={handleRetrySolve}
      />

      {/* Insufficient Roster Banner */}
      {isInsufficientRoster && (
        <section
          aria-label="Insufficient Roster Notice"
          className="bg-gradient-to-r from-amber-950/35 via-[#151826] to-amber-950/25 p-6 sm:p-8 rounded-2xl border border-amber-400/35 shadow-lg text-center space-y-4"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-amber-300">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-base font-bold text-zinc-100 font-serif">
              Insufficient Roster ({ownedIds.length}/4 Characters Owned)
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Celestia enforces strict ownership and requires at least 4 owned characters to generate personalized team compositions.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {onToggleDemoMode && (
              <button
                type="button"
                onClick={() => onToggleDemoMode(true)}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] font-bold text-xs transition-colors shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Turn on Demo Mode</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCatalogFallback(true)}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 border border-[#323954] text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
              <span>Show Theoretical Catalog Teams</span>
            </button>
          </div>
        </section>
      )}

      {/* Notice when viewing Catalog Fallback */}
      {ownedIds.length < 4 && showCatalogFallback && (
        <section
          aria-label="Theoretical catalog fallback notice"
          className="bg-[#141624] border border-[#323954] p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div role="status" className="flex items-start sm:items-center gap-2 text-zinc-200">
            <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
            <span>
              Viewing <strong className="text-white">Theoretical Catalog Teams</strong> across all 128 characters. Characters not currently owned by you are marked with an <strong className="text-rose-200">Unowned</strong> badge.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCatalogFallback(false)}
            className="min-h-[36px] px-2.5 rounded-lg text-xs text-[#f3cf58] hover:bg-[#d4af37]/10 font-semibold cursor-pointer shrink-0"
          >
            Hide Catalog Teams
          </button>
        </section>
      )}

      {/* Recommended Teams Grid */}
      <div className="grid grid-cols-1 gap-6">
        {teams.map((team, idx) => {
          const isTipsExpanded = expandedTeamId === team.id;
          const isDrawerExpanded = expandedDrawerTeamId === team.id;
          const tipsPanelId = `team-tips-${team.id}`;
          const drawerPanelId = `team-drawer-${team.id}`;

          return (
            <article
              key={team.id}
              className="bg-[#121420] border border-[#24293d] hover:border-[#d4af37]/50 rounded-2xl p-4 sm:p-6 transition-colors shadow-md space-y-4"
            >
              {/* Team Title & Score Badges */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#202538] pb-3.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3cf58] border border-[#d4af37]/40">
                      Rank #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1a1e2e] text-zinc-200 border border-[#2c334d]">
                      {team.archetype}
                    </span>
                    {team.isTheoretical && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-200 border border-amber-400/45">
                        Theoretical (Catalog)
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-zinc-100 font-serif mt-1.5">
                    {team.name}
                  </h2>
                </div>

                {/* 5-Metric Score Strip (all metrics visible across desktop & mobile) */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                  {/* 1. Practical Performance Score */}
                  <div className="flex items-center gap-2 bg-[#161a29] px-3 py-2 rounded-xl border border-[#282f48]">
                    <Activity className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-zinc-300 uppercase font-semibold flex items-center gap-1">
                        <span>Performance</span>
                        <InfoTooltip
                          title="Practical Performance Score"
                          content="Composite score (0-100%) synthesizing mechanical compatibility (55%), defensive comfort (25%), and account investment (20%) while factoring in particle battery flow and rotation hazards."
                        />
                      </div>
                      <div className="text-sm font-bold text-emerald-200 tabular-nums">
                        {team.scores?.practicalPerformanceScore ?? team.synergyScore}%
                      </div>
                    </div>
                  </div>

                  {/* 2. Compatibility Score */}
                  <div className="flex items-center gap-2 bg-[#161a29] px-3 py-2 rounded-xl border border-[#282f48]">
                    <Zap className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-zinc-300 uppercase font-semibold flex items-center gap-1">
                        <span>Compatibility</span>
                        <InfoTooltip
                          title="Mechanical Compatibility Score"
                          content="Pure mechanical synergy (0-100%) synthesizing reaction chain validity, elemental resonance matching, role distribution, and energy battery flow minus anti-synergy penalties."
                        />
                      </div>
                      <div className="text-sm font-bold text-amber-200 tabular-nums">
                        {team.scores?.compatibilityScore ?? team.compositionCompatibilityScore ?? team.synergyScore}%
                      </div>
                    </div>
                  </div>

                  {/* 3. Account Investment Score */}
                  <div className="flex items-center gap-2 bg-[#161a29] px-3 py-2 rounded-xl border border-[#282f48]">
                    <Layers className="w-4 h-4 text-indigo-300 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-zinc-300 uppercase font-semibold flex items-center gap-1">
                        <span>Investment</span>
                        <InfoTooltip
                          title="Account Investment Readiness Score"
                          content="Account-specific readiness (0-100) based on owned character ascension levels, constellation power milestones, and equipped armory weapon matches."
                        />
                      </div>
                      <div className="text-sm font-bold text-indigo-200 tabular-nums">
                        {team.scores?.investmentScore ?? 0}/100
                      </div>
                    </div>
                  </div>

                  {/* 4. Comfort Score */}
                  <div className="flex items-center gap-2 bg-[#161a29] px-3 py-2 rounded-xl border border-[#282f48]">
                    <Shield className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-zinc-300 uppercase font-semibold flex items-center gap-1">
                        <span>Comfort</span>
                        <InfoTooltip
                          title="Defensive Comfort Score"
                          content="Defensive reliability (0-100) evaluating shield thickness, team-wide vs single-target healing, stagger resistance, and penalty for unmitigated HP drain."
                        />
                      </div>
                      <div className="text-sm font-bold text-sky-200 tabular-nums">
                        {team.comfortScore}/100
                      </div>
                    </div>
                  </div>

                  {/* 5. Theorycrafting Benchmark & Unsimulated DPS */}
                  {(() => {
                    const tier = team.scores?.benchmarkTier ?? 'S';
                    const tierBadgeStyles: Record<string, string> = {
                      'S+': 'bg-gradient-to-r from-amber-500/25 to-rose-500/25 text-amber-200 border-amber-400/50',
                      S: 'bg-amber-500/20 text-amber-200 border-amber-400/45',
                      A: 'bg-sky-500/20 text-sky-200 border-sky-400/45',
                      B: 'bg-[#1f2438] text-zinc-200 border-[#323954]',
                    };
                    return (
                      <div className="flex items-center gap-2 bg-[#161a29] px-3 py-2 rounded-xl border border-[#282f48]">
                        <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="text-[11px] text-zinc-300 uppercase font-semibold flex items-center gap-1">
                            <span>Benchmark</span>
                            <InfoTooltip
                              title="Meta Benchmark Tier (Unsimulated DPS)"
                              content={
                                team.scores?.damageOutput?.disclaimer ||
                                "Theoretical combat damage is not simulated with a frame-by-frame engine. Rating and percentile are derived from archetype theorycrafting ceilings and account investment."
                              }
                            />
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                tierBadgeStyles[tier] || tierBadgeStyles.S
                              }`}
                            >
                              Tier {tier}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono" title="Combat engine status">
                              Unsimulated
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 4 Characters Row (separate keyboard buttons for build details vs weapon swap) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {team.members.map((member, mIdx) => {
                  const color = ELEMENT_COLORS[member.element] || {
                    bg: 'bg-[#181c2b]',
                    text: 'text-zinc-200',
                    border: 'border-[#323954]',
                  };
                  const assignment =
                    customAssignments[team.id]?.[member.id] ||
                    team.weaponAssignments?.find((wa) => wa.characterId === member.id);

                  return (
                    <div
                      key={member.id + mIdx}
                      className={`group rounded-xl p-3 border ${color.border} ${color.bg} hover:border-[#d4af37]/75 transition-colors flex flex-col justify-between shadow-sm`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCharacter(member)}
                        aria-label={`View ${member.name} build and talents`}
                        className="w-full text-left bg-transparent border-0 p-0 cursor-pointer flex flex-col justify-between flex-1"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-2 gap-1">
                            <span className={`font-bold ${color.text}`}>{member.element}</span>
                            {member.isOwned === false ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-200 border border-rose-400/45">
                                Unowned
                              </span>
                            ) : (
                              <span className="text-zinc-300 text-[11px]">{member.weapon}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5">
                            <CharacterPortrait
                              src={member.icon}
                              name={member.name}
                              element={member.element}
                              size="md"
                              className="group-hover:border-[#d4af37]/60 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-zinc-100 group-hover:text-[#f3cf58] transition-colors leading-tight truncate">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-zinc-300 truncate mt-0.5">
                                {member.roles[0]}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs text-[#f3cf58] font-semibold">
                            {'★'.repeat(Math.max(1, Math.min(5, Math.floor(member.rarity))))}
                          </span>
                          <span className="text-[11px] text-zinc-200 group-hover:text-[#f3cf58] flex items-center gap-1 font-medium">
                            <Info className="w-3 h-3" aria-hidden="true" />
                            <span>Build</span>
                          </span>
                        </div>
                      </button>

                      {/* Sibling Quick Swap Weapon Button */}
                      {assignment && (
                        <button
                          type="button"
                          onClick={() =>
                            dispatchQuickSwap({
                              type: 'OPEN_TARGET',
                              target: {
                                teamId: team.id,
                                character: member,
                                teamMembers: team.members,
                                currentAssignment: assignment,
                              },
                            })
                          }
                          aria-label={`Swap weapon for ${member.name}: currently ${
                            getWeaponByKey(assignment.assignedWeapon.key)?.name ||
                            assignment.assignedWeapon.name
                          }`}
                          className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1 text-left text-xs hover:bg-black/30 -mx-1 px-1.5 py-1.5 rounded-lg transition-colors cursor-pointer w-[calc(100%+0.5rem)]"
                          title="View owned weapon options & quick-swap"
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="font-semibold text-zinc-100 truncate flex items-center gap-1 text-[11px]">
                              <Swords className="w-3 h-3 text-[#d4af37] shrink-0" aria-hidden="true" />
                              <span className="truncate">
                                {getWeaponByKey(assignment.assignedWeapon.key)?.name ||
                                  assignment.assignedWeapon.name}
                              </span>
                            </span>
                            <span className="font-mono font-bold text-amber-300 text-[11px] shrink-0">
                              R{assignment.assignedWeapon.refinement}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[11px] w-full">
                            <span className="text-zinc-300 font-mono">
                              Lv. {assignment.assignedWeapon.level}
                            </span>
                            <div className="flex items-center gap-1">
                              {assignment.isBorrowed && (
                                <span
                                  className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40 text-[10px] font-bold"
                                  title={`Borrowed from ${
                                    assignment.borrowedFrom
                                      ? getCharacterName(assignment.borrowedFrom)
                                      : 'another character'
                                  }`}
                                >
                                  Borrowed
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  assignment.scoreResult.tier === 'BiS'
                                    ? 'bg-[#d4af37]/20 text-[#f3cf58] border-[#d4af37]/40'
                                    : assignment.scoreResult.tier === 'Optimal'
                                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                                      : assignment.scoreResult.tier === 'Great'
                                        ? 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                                        : 'bg-[#1f2438] text-zinc-200 border-[#323954]'
                                }`}
                              >
                                {assignment.scoreResult.tier}
                              </span>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resonances */}
              {team.resonance.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {team.resonance.map((res, rIdx) => (
                    <span
                      key={rIdx}
                      className="text-xs bg-[#191d2d] text-[#f3cf58] px-2.5 py-1 rounded-lg border border-[#d4af37]/30 font-medium"
                    >
                      ⚡ {res}
                    </span>
                  ))}
                </div>
              )}

              {/* Stepped Rotation Breakdown & Strategy */}
              <div className="bg-[#0e1019] p-4 rounded-xl border border-[#202538] text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202538] pb-2.5">
                  <span className="text-zinc-200 font-bold uppercase tracking-wider text-xs flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                      <span>Strategic Execution Rotation</span>
                    </span>
                    {team.steppedRotation &&
                      (team.steppedRotation.isCurated ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/65 text-emerald-200 border border-emerald-400/45 inline-flex items-center gap-1">
                          ✦ Curated Rotation
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1c2032] text-zinc-200 border border-[#323954] inline-flex items-center gap-1">
                          ⚡ Role Fallback Rotation
                        </span>
                      ))}
                  </span>
                  {team.steppedRotation && (
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded bg-[#181c2c] text-[#f3cf58] border border-[#d4af37]/35 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>~{team.steppedRotation.totalCycleTime}s Cycle</span>
                    </span>
                  )}
                </div>

                {team.steppedRotation && team.steppedRotation.steps.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {team.steppedRotation.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="bg-[#131624] border border-[#24293d] p-2.5 rounded-lg flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <CharacterPortrait
                                src={step.icon}
                                name={step.characterName}
                                element={step.element}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-zinc-100 truncate">
                                  {step.characterName}
                                </div>
                                <div className="text-[11px] text-zinc-300 font-semibold uppercase">
                                  Step {step.stepNumber}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-200 bg-[#1a1e2e] px-1.5 py-0.5 rounded border border-[#2c334d] shrink-0">
                              ~{step.fieldTime}s
                            </span>
                          </div>

                          <div className="bg-[#0b0d16] p-1.5 rounded border border-[#1d2236]">
                            <RotationBadgeList actions={step.actions} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Collapsible Strategy Tips */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        aria-expanded={isTipsExpanded}
                        aria-controls={tipsPanelId}
                        onClick={() => setExpandedTeamId(isTipsExpanded ? null : team.id)}
                        className="min-h-[36px] px-2 -ml-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-[#f3cf58] hover:bg-[#181c2c] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>
                          {isTipsExpanded ? 'Hide Strategy Tips' : 'Show Tactical Strategy & Tips'}
                        </span>
                        {isTipsExpanded ? (
                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>

                      <div
                        id={tipsPanelId}
                        hidden={!isTipsExpanded}
                        aria-hidden={!isTipsExpanded}
                        className={
                          isTipsExpanded
                            ? 'mt-2 space-y-2 bg-[#131624] p-3 rounded-lg border border-[#24293d] text-xs'
                            : 'hidden'
                        }
                      >
                        {isTipsExpanded &&
                          team.steppedRotation.steps.map((step) => (
                            <div key={step.stepNumber} className="flex items-start gap-2 text-zinc-200">
                              <span className="text-[#f3cf58] font-bold shrink-0 font-mono">
                                [Step {step.stepNumber} · {step.characterName}]:
                              </span>
                              <span className="leading-relaxed">
                                {step.tip || 'Execute standard action sequence.'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-100 font-mono text-xs leading-relaxed bg-[#141724] p-2.5 rounded border border-[#24293d]">
                    {team.rotation}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-200 pt-2 border-t border-[#202538]">
                  {team.reasons.map((reason, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-1.5">
                      <span className="text-[#f3cf58] font-bold" aria-hidden="true">
                        ✓
                      </span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expandable Mechanics & Swap Alternatives Drawer */}
              <div className="pt-0.5">
                <button
                  type="button"
                  aria-expanded={isDrawerExpanded}
                  aria-controls={team.explanation ? drawerPanelId : undefined}
                  onClick={() => setExpandedDrawerTeamId(isDrawerExpanded ? null : team.id)}
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#0e1019] hover:bg-[#161a29] border border-[#24293d] hover:border-[#d4af37]/50 text-xs font-bold text-zinc-100 flex flex-wrap items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <span className="flex flex-wrap items-center gap-2 text-zinc-100 group-hover:text-[#f3cf58] transition-colors">
                    <Compass className="w-4 h-4 text-[#d4af37] shrink-0" aria-hidden="true" />
                    <span>Team Mechanics, Energy Diagnosis &amp; Swap Alternatives</span>
                    {team.explanation?.antiSynergyWarnings &&
                      team.explanation.antiSynergyWarnings.length > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/45 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-300" aria-hidden="true" />
                          <span>
                            {team.explanation.antiSynergyWarnings.length} Alert
                            {team.explanation.antiSynergyWarnings.length > 1 ? 's' : ''}
                          </span>
                        </span>
                      )}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-300 group-hover:text-white ml-auto">
                    <span>{isDrawerExpanded ? 'Collapse' : 'Explore Mechanics'}</span>
                    {isDrawerExpanded ? (
                      <ChevronUp className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    )}
                  </span>
                </button>

                {team.explanation && (
                  <div
                    id={drawerPanelId}
                    hidden={!isDrawerExpanded}
                    aria-hidden={!isDrawerExpanded}
                    className={
                      isDrawerExpanded
                        ? 'mt-3 p-4 bg-[#0b0d15] rounded-xl border border-[#24293d] space-y-4 text-xs'
                        : 'hidden'
                    }
                  >
                    {isDrawerExpanded && (
                      <>
                        {/* 1. Reaction Execution Workflow */}
                        <div className="bg-[#121524] p-3.5 rounded-lg border border-[#202538]">
                          <div className="text-[11px] font-bold text-[#f3cf58] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Reaction Execution Chain</span>
                      </div>
                      <p className="text-zinc-100 font-mono text-xs leading-relaxed">
                        {team.explanation.reactionWorkflow}
                      </p>
                    </div>

                    {/* 2. Energy & Battery Status */}
                    <div className="bg-[#121524] p-3.5 rounded-lg border border-[#202538] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
                          <span>Energy &amp; Battery Status</span>
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            team.explanation.energyAssessment.status === 'optimal'
                              ? 'bg-emerald-950/65 text-emerald-200 border-emerald-400/45'
                              : team.explanation.energyAssessment.status === 'adequate'
                                ? 'bg-amber-950/65 text-amber-200 border-amber-400/45'
                                : 'bg-rose-950/65 text-rose-200 border-rose-400/45'
                          }`}
                        >
                          {team.explanation.energyAssessment.status === 'optimal'
                            ? '✓ Optimal Energy Battery Flow'
                            : team.explanation.energyAssessment.status === 'adequate'
                              ? '⚠ Adequate Battery (Minor ER Focus)'
                              : '✕ Energy Deficit (High Burst Starvation)'}
                        </span>
                      </div>
                      {team.explanation.energyAssessment.warnings.length > 0 && (
                        <div className="space-y-1 pt-1 text-xs">
                          {team.explanation.energyAssessment.warnings.map((warn, wIdx) => (
                            <div key={wIdx} className="text-amber-200 flex items-start gap-1.5">
                              <span className="text-amber-300 font-bold shrink-0">!</span>
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. Anti-Synergy Warnings */}
                    {team.explanation.antiSynergyWarnings &&
                      team.explanation.antiSynergyWarnings.length > 0 && (
                        <div className="bg-amber-950/30 border border-amber-400/45 p-3.5 rounded-lg space-y-1.5 text-amber-100 text-xs">
                          <div className="font-bold flex items-center gap-1.5 text-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-300" aria-hidden="true" />
                            <span>Synergy &amp; Infusion Considerations</span>
                          </div>
                          <ul className="space-y-1 pl-5 list-disc text-zinc-200">
                            {team.explanation.antiSynergyWarnings.map((warn, aIdx) => (
                              <li key={aIdx}>{warn}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* 4. Slot Role Rationales */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                        Slot Role Rationales
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {team.members.map((member) => (
                          <div
                            key={member.id}
                            className="bg-[#121524] p-3 rounded-lg border border-[#202538] flex items-start gap-2.5"
                          >
                            <CharacterPortrait
                              src={member.icon}
                              name={member.name}
                              element={member.element}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-zinc-100 flex flex-wrap items-center gap-1.5">
                                <span>{member.name}</span>
                                <span className="text-[11px] text-zinc-300 font-normal">
                                  ({member.roles[0]})
                                </span>
                              </div>
                              <div className="text-xs text-zinc-200 mt-0.5 leading-snug">
                                {team.explanation?.roleRationale[member.id] || 'Key party member.'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 5. Accessible Swap Alternatives */}
                    {team.explanation.alternatives && team.explanation.alternatives.length > 0 && (
                      <div className="space-y-2.5 pt-2.5 border-t border-[#202538]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                            <span>Accessible Swap Alternatives &amp; Trade-Offs</span>
                          </div>
                          <span className="text-[11px] text-zinc-300">
                            Strict exclusivity verified
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {team.explanation.alternatives.map((alt, altIdx) => {
                            const origChar = team.members.find((m) => m.id === alt.originalCharacterId);
                            const origName = origChar?.name || getCharacterName(alt.originalCharacterId);
                            return (
                              <div
                                key={altIdx}
                                className="bg-[#121524] p-3 rounded-lg border border-[#24293d] hover:border-[#323954] flex flex-col justify-between gap-2.5"
                              >
                                <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <CharacterPortrait
                                      src={alt.alternativeCharacter.icon}
                                      name={alt.alternativeCharacter.name}
                                      element={alt.alternativeCharacter.element}
                                      size="sm"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-zinc-100 truncate">
                                        {alt.alternativeCharacter.name}
                                      </div>
                                      <div className="text-[11px] text-zinc-300 truncate">
                                        Sub for {origName}
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                      alt.compatibilityImpact >= 0
                                        ? 'bg-emerald-950/65 text-emerald-200 border-emerald-400/45'
                                        : 'bg-[#1c2032] text-zinc-200 border-[#323954]'
                                    }`}
                                  >
                                    {alt.compatibilityImpact >= 0
                                      ? `+${alt.compatibilityImpact}%`
                                      : `${alt.compatibilityImpact}%`}
                                  </span>
                                </div>

                                <div className="space-y-1 text-[11px]">
                                  {alt.tradeOffPros.map((pro, pIdx) => (
                                    <div key={pIdx} className="text-emerald-200 leading-snug">
                                      {pro}
                                    </div>
                                  ))}
                                  {alt.tradeOffCons.map((con, cIdx) => (
                                    <div key={cIdx} className="text-amber-200 leading-snug">
                                      {con}
                                    </div>
                                  ))}
                                  {alt.whyLowerScore && (
                                    <div className="text-[11px] text-zinc-300 italic pt-1 border-t border-white/10 leading-snug">
                                      <span className="text-[#f3cf58] font-semibold not-italic">
                                        Why alternative scores lower:{' '}
                                      </span>
                                      {alt.whyLowerScore}
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSwapMember(team.id, alt.originalCharacterId, alt.alternativeCharacter)
                                  }
                                  className="w-full min-h-[38px] py-1.5 px-2.5 rounded-lg bg-[#1a1e2e] hover:bg-[#d4af37]/20 border border-[#323954] hover:border-[#d4af37]/60 text-xs font-semibold text-zinc-100 hover:text-[#f3cf58] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title={`Replace ${origName} with ${alt.alternativeCharacter.name} in this recommendation`}
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                                  <span>Swap Into Team</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 6. Ideal Missing Supports (Wish / Roster Targets) */}
                    {team.explanation.idealMissingSupports &&
                      team.explanation.idealMissingSupports.length > 0 && (
                        <div className="space-y-2.5 pt-3 border-t border-[#202538]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                              <span>Roster Targets: Premier Missing Supports</span>
                            </div>
                            <span className="text-[11px] text-zinc-400">
                              High-priority pull targets for {team.archetype}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {team.explanation.idealMissingSupports.map((gap, gIdx) => (
                              <div
                                key={gIdx}
                                className="bg-gradient-to-br from-[#121628] to-[#0f1220] p-3 rounded-lg border border-amber-400/30 flex flex-col justify-between gap-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <CharacterPortrait
                                      src={CHARACTERS.find((c) => c.id === gap.characterId)?.icon}
                                      name={gap.characterName}
                                      element={gap.element}
                                      size="sm"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-amber-100 truncate">
                                        {gap.characterName}
                                      </div>
                                      <div className="text-[11px] text-zinc-400 truncate">
                                        Ideal upgrade for {gap.replacementForRole}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40 shrink-0">
                                    Target
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-relaxed">
                                  {gap.impactSummary}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Empty State when no teams match (suppressed when Insufficient Roster banner or error alert is shown) */}
      {teams.length === 0 && !isInsufficientRoster && !solverError && (
        <section
          aria-label="Empty team recommendations status"
          className="bg-[#121420] border border-[#24293d] rounded-2xl p-8 text-center space-y-3 shadow-md"
        >
          {effectiveIsSolving ? (
            <p role="status" className="text-xs text-zinc-300">
              Calculating optimal team recommendations…
            </p>
          ) : (
            <>
              <div role="status" className="space-y-3">
                <Users className="w-8 h-8 mx-auto text-zinc-400" aria-hidden="true" />
                <h2 className="text-base font-bold text-zinc-100 font-serif">No Matching Teams Found</h2>
                <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                  {focusId && !ownedIds.includes(focusId)
                    ? `You do not currently own ${getCharacterName(focusId)}. Enable theoretical catalog teams to explore compositions with them.`
                    : 'Could not generate full 4-character compositions with the current filters and roster.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {focusId && (
                  <button
                    type="button"
                    onClick={() => setFocusId('')}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 border border-[#323954] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Show All Teams
                  </button>
                )}
                {focusId && !ownedIds.includes(focusId) && !showCatalogFallback && (
                  <button
                    type="button"
                    onClick={() => setShowCatalogFallback(true)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4" aria-hidden="true" />
                    <span>Show Theoretical Catalog Teams for {getCharacterName(focusId)}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Interactive Character Detail Modal */}
      <LazyCharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? ownedIds.includes(selectedCharacter.id) : false}
        profile={selectedCharacter && profiles ? profiles[selectedCharacter.id] : undefined}
        onUpdateProfile={onUpdateProfile}
        profiles={profiles}
        onUpdateProfiles={onUpdateProfiles}
        weapons={weapons}
        onUpdateWeapons={onUpdateWeapons}
      />

      {/* Quick Swap Weapon Modal (accessible dialog with focus trap & Escape support) */}
      {quickSwapTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-swap-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => dispatchQuickSwap({ type: 'CLOSE' })}
        >
          <div
            ref={swapModalRef}
            tabIndex={-1}
            className="bg-[#121420] border border-[#2c334d] w-full max-w-lg max-h-[88vh] rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-100 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#24293d] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                <h2 id="quick-swap-title" className="text-sm font-bold text-zinc-100 font-serif">
                  Swap Weapon: {quickSwapTarget.character.name}
                </h2>
              </div>
              <button
                ref={swapCloseBtnRef}
                type="button"
                aria-label="Close weapon swap modal"
                onClick={() => dispatchQuickSwap({ type: 'CLOSE' })}
                className="min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#22283d] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-1">
              <p className="text-xs text-zinc-300">
                Select an owned {quickSwapTarget.character.weapon} from your armory to assign to{' '}
                <strong className="text-white">{quickSwapTarget.character.name}</strong> for this team composition.
              </p>

              <QuickSwapReliabilitySection
                reliability={quickSwapWeaponRanking?.reliability}
                detailsControlsId={swapDetailsId}
                isDetailsOpen={quickSwapState.isDetailsOpen}
                onToggleDetails={() => dispatchQuickSwap({ type: 'TOGGLE_DETAILS' })}
                onCloseDetails={() => dispatchQuickSwap({ type: 'CLOSE_DETAILS' })}
              />

              <div className="space-y-2">
              {(quickSwapWeaponRanking?.items ?? []).map((scoreRes) => {
                const w = scoreRes.weapon as OwnedWeapon;
                const isCurrent = quickSwapTarget.currentAssignment?.assignedWeapon.id === w.id;
                const canonicalW = getWeaponByKey(w.key) || getWeaponByKey(w.name);
                const displayRarity = canonicalW?.rarity || w.rarity || 4;
                const displayName = canonicalW?.name || w.name;
                return (
                  <div
                    key={w.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-[#d4af37]/12 border-[#d4af37]/50'
                        : 'bg-[#161a29] border-[#282f48] hover:border-[#3c4566]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{displayName}</span>
                        <span className="text-xs text-[#f3cf58]">
                          {'★'.repeat(Math.max(1, Math.min(5, Math.floor(displayRarity))))}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-200">
                          R{w.refinement}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-300">Lv. {w.level}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded font-bold border ${
                            scoreRes.tier === 'BiS'
                              ? 'bg-[#d4af37]/20 text-[#f3cf58] border-[#d4af37]/40'
                              : scoreRes.tier === 'Optimal'
                                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                                : 'bg-[#1f2438] text-zinc-200 border-[#323954]'
                          }`}
                          title="Estimated Weapon Suitability"
                        >
                          {scoreRes.tier} ({scoreRes.suitabilityScore ?? scoreRes.relativePercentage}% Suitability)
                        </span>
                        {scoreRes.equippedOn && scoreRes.equippedOn !== quickSwapTarget.character.id && (
                          <span className="text-[11px] text-amber-200">
                            Equipped on {getCharacterName(scoreRes.equippedOn)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newAssignment: TeamWeaponAssignment = {
                          characterId: quickSwapTarget.character.id,
                          characterName: quickSwapTarget.character.name,
                          assignedWeapon: w,
                          scoreResult: scoreRes,
                          isBorrowed: Boolean(
                            w.location &&
                              w.location !== quickSwapTarget.character.id &&
                              w.location !== quickSwapTarget.character.name,
                          ),
                          borrowedFrom: w.location,
                        };

                        const prevWeapon = quickSwapTarget.currentAssignment?.assignedWeapon;
                        const otherMemberUsingW = quickSwapTarget.teamMembers.find((m) => {
                          if (m.id === quickSwapTarget.character.id) return false;
                          const mAssign =
                            customAssignments[quickSwapTarget.teamId]?.[m.id] ||
                            teams
                              .find((t) => t.id === quickSwapTarget.teamId)
                              ?.weaponAssignments?.find((wa) => wa.characterId === m.id);
                          return mAssign?.assignedWeapon.id === w.id;
                        });

                        const updatedTeamCustoms: Record<string, TeamWeaponAssignment> = {
                          ...(customAssignments[quickSwapTarget.teamId] || {}),
                          [quickSwapTarget.character.id]: newAssignment,
                        };

                        if (otherMemberUsingW) {
                          const dbPrev = prevWeapon ? getWeaponByKey(prevWeapon.key) : undefined;
                          if (dbPrev && dbPrev.weaponType === otherMemberUsingW.weapon && prevWeapon) {
                            const swappedScore = scoreWeaponForCharacter(
                              otherMemberUsingW,
                              prevWeapon,
                              quickSwapTarget.teamMembers,
                            );
                            updatedTeamCustoms[otherMemberUsingW.id] = {
                              characterId: otherMemberUsingW.id,
                              characterName: otherMemberUsingW.name,
                              assignedWeapon: prevWeapon,
                              scoreResult: swappedScore,
                              isBorrowed: Boolean(
                                prevWeapon.location &&
                                  prevWeapon.location !== otherMemberUsingW.id &&
                                  prevWeapon.location !== otherMemberUsingW.name,
                              ),
                              borrowedFrom: prevWeapon.location,
                            };
                          } else {
                            const otherWeaponRanking = rankWeaponsForCharacter(
                              otherMemberUsingW,
                              weaponBag.filter((wb) => wb.id !== w.id),
                              quickSwapTarget.teamMembers,
                            );
                            const availableForOther = otherWeaponRanking.items;
                            if (availableForOther.length > 0) {
                              const bestNext = availableForOther[0];
                              const nextW = bestNext.weapon as OwnedWeapon;
                              updatedTeamCustoms[otherMemberUsingW.id] = {
                                characterId: otherMemberUsingW.id,
                                characterName: otherMemberUsingW.name,
                                assignedWeapon: nextW,
                                scoreResult: bestNext,
                                isBorrowed: Boolean(
                                  nextW.location &&
                                    nextW.location !== otherMemberUsingW.id &&
                                    nextW.location !== otherMemberUsingW.name,
                                ),
                                borrowedFrom: nextW.location,
                              };
                            }
                          }
                        }

                        setCustomAssignments((prev) => ({
                          ...prev,
                          [quickSwapTarget.teamId]: updatedTeamCustoms,
                        }));

                        const currentProfiles = profiles || getSavedProfiles();
                        const { updatedWeapons, updatedProfiles } = equipWeaponToCharacter(
                          w.id,
                          quickSwapTarget.character.id,
                          weaponBag,
                          currentProfiles,
                        );

                        if (onUpdateProfiles) {
                          onUpdateProfiles(updatedProfiles);
                        } else if (onUpdateProfile && updatedProfiles[quickSwapTarget.character.id]) {
                          onUpdateProfile(updatedProfiles[quickSwapTarget.character.id]);
                        }

                        if (onUpdateWeapons) {
                          onUpdateWeapons(updatedWeapons);
                        }

                        dispatchQuickSwap({ type: 'CLOSE' });
                      }}
                      className={`min-h-[40px] sm:min-h-[36px] px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-[#d4af37] text-[#0a0b0e]'
                          : 'bg-[#22283d] text-zinc-100 hover:bg-[#2f3754] border border-[#323954]'
                      }`}
                    >
                      {isCurrent ? 'Current' : 'Select'}
                    </button>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
