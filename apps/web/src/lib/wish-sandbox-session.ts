import {
  WISH_SANDBOX_RULES_VERSION,
  type WishBanner,
  type WishResult,
  type WishResultItem,
  type WishSandboxRequest,
} from '@celestia/api-contracts';

export const WISH_SANDBOX_STORAGE_KEY = 'celestia_wish_sandbox_session_v1';
export const MAX_RECENT_PULLS_RETAINED = 200;

export interface WishPityGroupState {
  pity5: number;
  pity4: number;
  guaranteed5: boolean;
  guaranteed4: boolean;
}

export interface WishHistoryRecord5Star {
  id: string;
  itemKey: string;
  itemKind: 'character' | 'weapon';
  isFeatured: boolean;
  pity: number;
  bannerId: string;
  pulledAt: string;
}

export interface WishSandboxStats {
  totalPulls: number;
  total5Stars: number;
  total4Stars: number;
  total3Stars: number;
  records5Star: WishHistoryRecord5Star[];
}

export interface WishSandboxSession {
  version: 1;
  rulesVersion: string;
  characterPity: WishPityGroupState;
  weaponPity: WishPityGroupState & { fatePoints: 0 | 1 };
  chronicledPity: { pity5: number; pity4: number; fatePoints: 0 | 1 };
  currentScenarioId: string;
  pathTargetKey?: string;
  recentPulls: WishResultItem[];
  stats: WishSandboxStats;
}

export function createInitialWishSandboxSession(
  defaultScenarioId = 'banner_mavuika_phase1',
): WishSandboxSession {
  return {
    version: 1,
    rulesVersion: WISH_SANDBOX_RULES_VERSION,
    characterPity: {
      pity5: 0,
      pity4: 0,
      guaranteed5: false,
      guaranteed4: false,
    },
    weaponPity: {
      pity5: 0,
      pity4: 0,
      guaranteed5: false,
      guaranteed4: false,
      fatePoints: 0,
    },
    chronicledPity: {
      pity5: 0,
      pity4: 0,
      fatePoints: 0,
    },
    currentScenarioId: defaultScenarioId,
    pathTargetKey: undefined,
    recentPulls: [],
    stats: {
      totalPulls: 0,
      total5Stars: 0,
      total4Stars: 0,
      total3Stars: 0,
      records5Star: [],
    },
  };
}

/**
 * Returns the relevant active pity and guarantee state for a given banner.
 */
export function getActivePityForBanner(
  session: WishSandboxSession,
  banner: WishBanner,
): {
  pity5: number;
  pity4: number;
  guaranteed5: boolean;
  guaranteed4: boolean;
  fatePoints?: 0 | 1;
} {
  if (banner.type === 'CHARACTER') {
    return {
      pity5: session.characterPity.pity5,
      pity4: session.characterPity.pity4,
      guaranteed5: session.characterPity.guaranteed5,
      guaranteed4: session.characterPity.guaranteed4,
    };
  }
  if (banner.type === 'WEAPON') {
    return {
      pity5: session.weaponPity.pity5,
      pity4: session.weaponPity.pity4,
      guaranteed5: session.weaponPity.guaranteed5,
      guaranteed4: session.weaponPity.guaranteed4,
      fatePoints: session.weaponPity.fatePoints,
    };
  }
  return {
    pity5: session.chronicledPity.pity5,
    pity4: session.chronicledPity.pity4,
    guaranteed5: false,
    guaranteed4: false,
    fatePoints: session.chronicledPity.fatePoints,
  };
}

/**
 * Builds a validated WishSandboxRequest payload from the active session state.
 */
export function buildSandboxPullRequest(
  session: WishSandboxSession,
  banner: WishBanner,
  count: number,
): WishSandboxRequest {
  const activePity = getActivePityForBanner(session, banner);
  const pathTargetKey =
    banner.fatePointCap > 0
      ? session.pathTargetKey || banner.fiveStarKey || banner.fiveStarKeys[0]
      : undefined;

  return {
    bannerId: banner.bannerId,
    count,
    rulesVersion: session.rulesVersion,
    currentPity5: Math.min(activePity.pity5, banner.hardPity - 1),
    currentPity4: activePity.pity4,
    guaranteed5: activePity.guaranteed5,
    guaranteed4: activePity.guaranteed4,
    pathTargetKey,
    fatePoints: banner.fatePointCap > 0 ? (activePity.fatePoints ?? 0) : undefined,
  };
}

/**
 * Pure transition applying gacha simulation results to the session state.
 */
export function applyWishResultToSession(
  session: WishSandboxSession,
  banner: WishBanner,
  result: WishResult,
  timestamp = new Date().toISOString(),
): WishSandboxSession {
  const pulls = result.pulls;
  const new5Stars = pulls.filter((p) => p.type === '5_STAR');
  const new4Stars = pulls.filter((p) => p.type === '4_STAR');
  const new3Stars = pulls.filter((p) => p.type === '3_STAR');

  // Calculate pity offset for 5-star history logging
  let runningPity = getActivePityForBanner(session, banner).pity5;
  const new5StarRecords: WishHistoryRecord5Star[] = [];

  for (const pull of pulls) {
    runningPity++;
    if (pull.type === '5_STAR') {
      new5StarRecords.push({
        id: pull.id,
        itemKey: pull.itemKey,
        itemKind: pull.itemKind,
        isFeatured: pull.isFeatured,
        pity: runningPity,
        bannerId: banner.bannerId,
        pulledAt: timestamp,
      });
      runningPity = 0;
    }
  }

  // Update appropriate pity pool immutably
  let characterPity = session.characterPity;
  let weaponPity = session.weaponPity;
  let chronicledPity = session.chronicledPity;

  if (banner.type === 'CHARACTER') {
    characterPity = {
      pity5: result.endPity5,
      pity4: result.endPity4,
      guaranteed5: result.endGuaranteed5,
      guaranteed4: result.endGuaranteed4,
    };
  } else if (banner.type === 'WEAPON') {
    weaponPity = {
      pity5: result.endPity5,
      pity4: result.endPity4,
      guaranteed5: result.endGuaranteed5,
      guaranteed4: result.endGuaranteed4,
      fatePoints: result.endFatePoints,
    };
  } else {
    chronicledPity = {
      pity5: result.endPity5,
      pity4: result.endPity4,
      fatePoints: result.endFatePoints,
    };
  }

  // Prepend recent pulls and cap at MAX_RECENT_PULLS_RETAINED
  const recentPulls = [...pulls, ...session.recentPulls].slice(0, MAX_RECENT_PULLS_RETAINED);

  return {
    ...session,
    characterPity,
    weaponPity,
    chronicledPity,
    recentPulls,
    stats: {
      totalPulls: session.stats.totalPulls + pulls.length,
      total5Stars: session.stats.total5Stars + new5Stars.length,
      total4Stars: session.stats.total4Stars + new4Stars.length,
      total3Stars: session.stats.total3Stars + new3Stars.length,
      records5Star: [...new5StarRecords, ...session.stats.records5Star],
    },
  };
}

/**
 * Pure transition for switching banner scenarios.
 * Resets Fate Points and target path when moving to or between weapon/chronicled scenarios.
 */
export function setBannerScenario(
  session: WishSandboxSession,
  newBanner: WishBanner,
): WishSandboxSession {
  if (session.currentScenarioId === newBanner.bannerId) {
    return session;
  }

  const isSwitchingTargetPool =
    newBanner.type !== 'CHARACTER' || session.currentScenarioId !== newBanner.bannerId;

  return {
    ...session,
    currentScenarioId: newBanner.bannerId,
    pathTargetKey:
      newBanner.fatePointCap > 0 ? newBanner.fiveStarKey || newBanner.fiveStarKeys[0] : undefined,
    weaponPity:
      isSwitchingTargetPool && newBanner.type === 'WEAPON'
        ? { ...session.weaponPity, fatePoints: 0 }
        : session.weaponPity,
    chronicledPity:
      isSwitchingTargetPool && newBanner.type === 'CHRONICLED'
        ? { ...session.chronicledPity, fatePoints: 0 }
        : session.chronicledPity,
  };
}

/**
 * Pure transition for setting or changing a path target on weapon/chronicled banners.
 * Changing target path resets Fate Points to 0.
 */
export function setPathTarget(
  session: WishSandboxSession,
  banner: WishBanner,
  targetKey: string | undefined,
): WishSandboxSession {
  if (session.pathTargetKey === targetKey) {
    return session;
  }

  let weaponPity = session.weaponPity;
  let chronicledPity = session.chronicledPity;

  if (banner.type === 'WEAPON') {
    weaponPity = { ...weaponPity, fatePoints: 0 };
  } else if (banner.type === 'CHRONICLED') {
    chronicledPity = { ...chronicledPity, fatePoints: 0 };
  }

  return {
    ...session,
    pathTargetKey: targetKey,
    weaponPity,
    chronicledPity,
  };
}

/**
 * Pure transition for manually updating starting pity or guarantee flags (e.g. testing starting states).
 */
export function updatePityOverrides(
  session: WishSandboxSession,
  banner: WishBanner,
  overrides: {
    pity5?: number;
    pity4?: number;
    guaranteed5?: boolean;
    guaranteed4?: boolean;
    fatePoints?: 0 | 1;
  },
): WishSandboxSession {
  if (banner.type === 'CHARACTER') {
    return {
      ...session,
      characterPity: {
        pity5: Math.max(
          0,
          Math.min(banner.hardPity - 1, overrides.pity5 ?? session.characterPity.pity5),
        ),
        pity4: Math.max(0, overrides.pity4 ?? session.characterPity.pity4),
        guaranteed5: overrides.guaranteed5 ?? session.characterPity.guaranteed5,
        guaranteed4: overrides.guaranteed4 ?? session.characterPity.guaranteed4,
      },
    };
  }

  if (banner.type === 'WEAPON') {
    return {
      ...session,
      weaponPity: {
        pity5: Math.max(
          0,
          Math.min(banner.hardPity - 1, overrides.pity5 ?? session.weaponPity.pity5),
        ),
        pity4: Math.max(0, overrides.pity4 ?? session.weaponPity.pity4),
        guaranteed5: overrides.guaranteed5 ?? session.weaponPity.guaranteed5,
        guaranteed4: overrides.guaranteed4 ?? session.weaponPity.guaranteed4,
        fatePoints: overrides.fatePoints ?? session.weaponPity.fatePoints,
      },
    };
  }

  return {
    ...session,
    chronicledPity: {
      pity5: Math.max(
        0,
        Math.min(banner.hardPity - 1, overrides.pity5 ?? session.chronicledPity.pity5),
      ),
      pity4: Math.max(0, overrides.pity4 ?? session.chronicledPity.pity4),
      fatePoints: overrides.fatePoints ?? session.chronicledPity.fatePoints,
    },
  };
}

/**
 * Resets the entire sandbox session to clean state.
 */
export function resetSandboxSession(
  defaultScenarioId = 'banner_mavuika_phase1',
): WishSandboxSession {
  return createInitialWishSandboxSession(defaultScenarioId);
}

/**
 * Safe LocalStorage loader with corrupt-data recovery.
 */
export function loadWishSandboxSession(storage?: Storage): WishSandboxSession {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) {
    return createInitialWishSandboxSession();
  }

  try {
    const raw = store.getItem(WISH_SANDBOX_STORAGE_KEY);
    if (!raw) return createInitialWishSandboxSession();

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.version === 1 &&
      parsed.rulesVersion === WISH_SANDBOX_RULES_VERSION &&
      parsed.characterPity &&
      parsed.weaponPity &&
      parsed.chronicledPity &&
      Array.isArray(parsed.recentPulls) &&
      parsed.stats
    ) {
      return parsed as WishSandboxSession;
    }
    return createInitialWishSandboxSession();
  } catch {
    return createInitialWishSandboxSession();
  }
}

/**
 * Safe LocalStorage saver.
 */
export function saveWishSandboxSession(session: WishSandboxSession, storage?: Storage): boolean {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return false;

  try {
    store.setItem(WISH_SANDBOX_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe LocalStorage clearer.
 */
export function clearWishSandboxSession(storage?: Storage): void {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;

  try {
    store.removeItem(WISH_SANDBOX_STORAGE_KEY);
  } catch {
    // no-op
  }
}
