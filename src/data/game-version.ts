/**
 * Single Source of Truth (SSOT) for Game Version and Patch Cadence in Project Celestia.
 *
 * Current Baseline: Version 7.2 (Nod-Krai / Snezhnaya / Celestia era)
 * Standard Patch Cadence: 42 days (6 weeks)
 */

export const CURRENT_GAME_VERSION = '7.2' as const;
export const PATCH_CYCLE_DAYS = 42 as const;

export interface GameVersionInfo {
  version: string;
  name: string;
  releaseDate: string; // ISO date YYYY-MM-DD
  phase1EndDate: string; // ISO date YYYY-MM-DD
  phase2EndDate: string; // ISO date YYYY-MM-DD
  regionFocus: string;
}

export const CURRENT_VERSION_INFO: GameVersionInfo = {
  version: CURRENT_GAME_VERSION,
  name: 'Nod-Krai / Snezhnaya / Celestia',
  releaseDate: '2026-11-04',
  phase1EndDate: '2026-11-24',
  phase2EndDate: '2026-12-15',
  regionFocus: 'Snezhnaya & Nod-Krai',
};

export interface ParsedVersion {
  major: number;
  minor: number;
  patch?: number;
}

/**
 * Parses a semver-like version string into numeric major, minor, and patch components.
 * e.g. "7.2" -> { major: 7, minor: 2 }, "7.2.1" -> { major: 7, minor: 2, patch: 1 }
 */
export function parseGameVersion(versionStr: string): ParsedVersion {
  const clean = versionStr.trim().replace(/^v/i, '');
  const parts = clean.split('.').map((p) => parseInt(p, 10));
  return {
    major: Number.isNaN(parts[0]) ? 0 : parts[0],
    minor: Number.isNaN(parts[1]) ? 0 : parts[1],
    patch: parts[2] !== undefined && !Number.isNaN(parts[2]) ? parts[2] : undefined,
  };
}

/**
 * Compares two game version strings.
 * Returns:
 *   positive number if v1 > v2
 *   negative number if v1 < v2
 *   0 if v1 === v2
 */
export function compareGameVersions(v1: string, v2: string): number {
  const p1 = parseGameVersion(v1);
  const p2 = parseGameVersion(v2);

  if (p1.major !== p2.major) {
    return p1.major - p2.major;
  }
  if (p1.minor !== p2.minor) {
    return p1.minor - p2.minor;
  }
  const patch1 = p1.patch ?? 0;
  const patch2 = p2.patch ?? 0;
  return patch1 - patch2;
}

/**
 * Checks whether the given version is at least the target version (defaulting to CURRENT_GAME_VERSION).
 */
export function isVersionAtLeast(version: string, targetVersion: string = CURRENT_GAME_VERSION): boolean {
  return compareGameVersions(version, targetVersion) >= 0;
}

/**
 * Formats a version string cleanly with 'v' prefix, e.g. "v7.2".
 */
export function formatGameVersion(version: string = CURRENT_GAME_VERSION): string {
  const clean = version.trim().replace(/^v/i, '');
  return `v${clean}`;
}
