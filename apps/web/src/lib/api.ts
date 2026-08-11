/**
 * api.ts — Centralized API client for @celestia/web
 *
 * All server communication goes through fetchApi. This ensures:
 *   - Every request includes the Authorization header when a token exists
 *   - JSON parsing is handled in one place
 *   - API errors follow the standard { success, error } shape from the server
 *
 * Usage:
 *   const data = await fetchApi<MeResponse>("/auth/me");
 */

const API_BASE = "http://localhost:4000/api/v1";

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

import { useAuthStore } from "../stores/auth.store";

/**
 * fetchApi — typed wrapper around the browser Fetch API.
 *
 * Reads the JWT from the Zustand auth store via getState() — the
 * correct pattern for reading Zustand state outside of React components.
 * Do NOT use localStorage.getItem() directly: the persist middleware
 * stores data in a nested structure under its own key, not the raw token.
 *
 * Throws ApiError for non-2xx responses, parsed from the standard
 * { success: false, error: { code, message } } response shape.
 */
export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An unexpected error occurred",
      response.status,
    );
  }

  return json.data as T;
}

// ============================================================
// Genshin Impact API Functions
// ============================================================

export interface ImportResult {
  charactersImported: number;
  weaponsImported: number;
  artifactsImported: number;
}

/**
 * importGenshinAccount — POST /games/genshin/import
 *
 * Sends a parsed GOOD-format payload to the backend importer.
 * The caller is responsible for JSON.parse()-ing the raw textarea string
 * before passing it here. If JSON.parse() throws, catch it in the UI and
 * show an inline error — do NOT call this function with invalid JSON.
 */
export async function importGenshinAccount(
  goodPayload: unknown,
): Promise<ImportResult> {
  return fetchApi<ImportResult>("/games/genshin/import", {
    method: "POST",
    body: JSON.stringify(goodPayload),
  });
}

// ============================================================
// Genshin Roster Types & Functions (Milestone 2D)
// ============================================================

export interface RosterWeapon {
  id: string;
  weaponKey: string;
  level: number;
  refinement: number;
}

export interface RosterCharacter {
  id: string;
  characterKey: string;
  level: number;
  ascension: number;
  constellation: number;
  talentNormal: number;
  talentSkill: number;
  talentBurst: number;
  equippedWeaponId: string | null;
  equippedWeapon: RosterWeapon | null;
}

export interface RosterResponse {
  characters: RosterCharacter[];
  total: number;
}

/**
 * fetchGenshinRoster — GET /games/genshin/characters
 *
 * Returns the authenticated user's full character roster.
 * Always returns a RosterResponse, even if the user has no data yet
 * (server returns an empty array, not a 404).
 */
export async function fetchGenshinRoster(): Promise<RosterResponse> {
  return fetchApi<RosterResponse>("/games/genshin/characters");
}

// ============================================================
// Genshin Inventory Types & Functions (Milestone 2E)
// ============================================================

export interface InventoryWeapon {
  id: string;
  weaponKey: string;
  level: number;
  ascension: number;
  refinement: number;
  locked: boolean;
  equippedCharacterId: string | null;
}

export interface ArtifactSubStat {
  key: string;
  value: number;
}

export interface InventoryArtifact {
  id: string;
  setKey: string;
  slotKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  subStats: ArtifactSubStat[];
  locked: boolean;
}

export interface WeaponsResponse {
  weapons: InventoryWeapon[];
  total: number;
}

export interface ArtifactsResponse {
  artifacts: InventoryArtifact[];
  total: number;
}

/**
 * fetchGenshinWeapons — GET /games/genshin/weapons
 *
 * Returns the authenticated user's full weapon inventory, ordered level desc.
 * Always returns a WeaponsResponse, even if the user has no data yet.
 */
export async function fetchGenshinWeapons(): Promise<WeaponsResponse> {
  return fetchApi<WeaponsResponse>("/games/genshin/weapons");
}

/**
 * fetchGenshinArtifacts — GET /games/genshin/artifacts
 *
 * Returns the authenticated user's full artifact inventory, ordered by
 * level desc then rarity desc.
 * Always returns an ArtifactsResponse, even if the user has no data yet.
 */
export async function fetchGenshinArtifacts(): Promise<ArtifactsResponse> {
  return fetchApi<ArtifactsResponse>("/games/genshin/artifacts");
}

// ============================================================
// Daily Companion Types & Functions (Milestone 3A)
// ============================================================

/**
 * Mirrors the DailyCompanion Prisma model returned by the backend.
 *
 * NOTE: `resinAmount` is the checkpoint value at `resinUpdatedAt`.
 * Use computeCurrentResin() from lib/resin.ts to get the effective current amount.
 */
export interface DailyState {
  id:                 string;
  userId:             string;
  resinAmount:        number;   // checkpoint value — project forward with resin.ts
  resinUpdatedAt:     string;   // ISO 8601 UTC timestamp
  commissionsDone:    boolean;
  teapotClaimed:      boolean;
  transformerClaimed: boolean;
  dailyResetAt:       string;   // ISO 8601 UTC timestamp of last reset
  createdAt:          string;
  updatedAt:          string;
}

/**
 * fetchDailyState — GET /companion/daily
 *
 * Returns the authenticated user's daily companion state.
 * Creates the record with safe defaults on the user's first call.
 */
export async function fetchDailyState(): Promise<DailyState> {
  return fetchApi<DailyState>("/companion/daily");
}

/**
 * patchResin — PATCH /companion/resin
 *
 * Updates the user's resin checkpoint. The backend stores the given amount
 * and refreshes resinUpdatedAt to now(). The frontend then projects forward
 * from this new checkpoint.
 *
 * @param amount Integer in [0, 200].
 */
export async function patchResin(amount: number): Promise<DailyState> {
  return fetchApi<DailyState>("/companion/resin", {
    method: "PATCH",
    body:   JSON.stringify({ amount }),
  });
}

/**
 * patchChecklist — PATCH /companion/checklist
 *
 * Updates one or more daily checklist flags. At least one field is required.
 */
export async function patchChecklist(
  input: Partial<Pick<DailyState, "commissionsDone" | "teapotClaimed" | "transformerClaimed">>,
): Promise<DailyState> {
  return fetchApi<DailyState>("/companion/checklist", {
    method: "PATCH",
    body:   JSON.stringify(input),
  });
}
