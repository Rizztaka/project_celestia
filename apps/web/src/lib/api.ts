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
