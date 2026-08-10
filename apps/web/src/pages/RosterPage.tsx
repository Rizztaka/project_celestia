import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { fetchGenshinRoster } from "../lib/api";
import type { RosterCharacter, RosterWeapon } from "../lib/api";

// -------------------------------------------------------
// Utility: format a GOOD PascalCase character key into a
// readable display name.
// Examples:
//   "HuTao"            → "Hu Tao"
//   "RaidenShogun"     → "Raiden Shogun"
//   "KaedeharaKazuha"  → "Kaedehara Kazuha"
// A full static lookup table is planned for Phase 4.
// -------------------------------------------------------
function formatName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim();
}

// -------------------------------------------------------
// Constellation-tier color mapping
// -------------------------------------------------------
function constellationColor(c: number): string {
  if (c === 0) return "text-zinc-400 border-zinc-700";
  if (c <= 2)  return "text-accent-400 border-accent-500/50";
  if (c <= 4)  return "text-violet-400 border-violet-500/50";
  return "text-amber-400 border-amber-500/50";
}

function constellationGlow(c: number): string {
  if (c === 0) return "";
  if (c <= 2)  return "shadow-[0_0_16px_rgba(99,102,241,0.4)]";
  if (c <= 4)  return "shadow-[0_0_16px_rgba(167,139,250,0.4)]";
  return "shadow-[0_0_16px_rgba(251,191,36,0.4)]";
}

// -------------------------------------------------------
// CharacterCard
// -------------------------------------------------------
function CharacterCard({ character }: { character: RosterCharacter }) {
  const displayName = formatName(character.characterKey);
  // Generate initials from the display name
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const c = character.constellation;
  const colorClass = constellationColor(c);
  const glowClass = constellationGlow(c);

  return (
    <div className="glass-panel hover-lift rounded-2xl p-5 flex flex-col gap-4 border border-white/5 group">
      {/* Header: avatar + name + constellation */}
      <div className="flex items-center gap-4">
        {/* Avatar circle */}
        <div
          className={`w-12 h-12 shrink-0 rounded-xl border-2 flex items-center justify-center font-display font-bold text-sm select-none transition-all ${colorClass} ${glowClass}`}
        >
          {initials}
        </div>

        {/* Name + level */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-white text-base truncate group-hover:text-accent-400 transition-colors">
            {displayName}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">
            Lv.{character.level} · A{character.ascension}
          </p>
        </div>

        {/* Constellation badge */}
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border bg-black/30 shrink-0 ${colorClass}`}
        >
          C{character.constellation}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Talents */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500 uppercase tracking-wider mr-auto">
          Talents
        </span>
        {(
          [
            { label: "N", value: character.talentNormal },
            { label: "S", value: character.talentSkill },
            { label: "B", value: character.talentBurst },
          ] as const
        ).map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center w-10"
          >
            <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest">
              {label}
            </span>
            <span
              className={`font-display font-bold text-base ${
                value >= 10 ? "text-accent-400" : "text-white"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Equipped weapon */}
      <WeaponChip weapon={character.equippedWeapon} />
    </div>
  );
}

// -------------------------------------------------------
// WeaponChip
// -------------------------------------------------------
function WeaponChip({ weapon }: { weapon: RosterWeapon | null }) {
  if (!weapon) {
    return (
      <div className="flex items-center gap-2 text-zinc-600 text-xs">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <span>No weapon equipped</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm2.122-8.485l4.243-4.242a3 3 0 014.242 4.242l-4.242 4.243" />
      </svg>
      <span className="text-white text-xs font-medium truncate flex-1">
        {formatName(weapon.weaponKey)}
      </span>
      <span className="text-amber-400 text-xs font-bold shrink-0">
        R{weapon.refinement}
      </span>
      <span className="text-zinc-500 text-xs shrink-0">
        · {weapon.level}
      </span>
    </div>
  );
}

// -------------------------------------------------------
// Skeleton card — pulsing placeholder
// -------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 animate-pulse border border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded-lg w-3/4" />
          <div className="h-3 bg-white/5 rounded-lg w-1/2" />
        </div>
        <div className="w-8 h-5 bg-white/5 rounded-full shrink-0" />
      </div>
      <div className="border-t border-white/5" />
      <div className="flex items-center gap-2">
        <div className="h-3 bg-white/5 rounded w-16 mr-auto" />
        <div className="h-8 bg-white/5 rounded w-9" />
        <div className="h-8 bg-white/5 rounded w-9" />
        <div className="h-8 bg-white/5 rounded w-9" />
      </div>
      <div className="border-t border-white/5" />
      <div className="h-4 bg-white/5 rounded w-2/3" />
    </div>
  );
}

// -------------------------------------------------------
// Empty state
// -------------------------------------------------------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-display font-bold text-white mb-3">
        Your roster is empty
      </h2>
      <p className="text-zinc-400 text-base max-w-sm mb-8 leading-relaxed">
        Import your Genshin account data to populate your roster with your characters, weapons, and artifacts.
      </p>
      <Link
        to="/import"
        className="bg-gradient-to-r from-accent-500 to-indigo-600 hover:from-accent-400 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-accent-glow/30"
      >
        Import Account
      </Link>
    </div>
  );
}

// -------------------------------------------------------
// Nav bar (same pattern as ImportPage)
// -------------------------------------------------------
function Nav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="glass-panel border-b-0 border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link
        to="/"
        className="font-display font-bold text-gradient text-lg tracking-tight hover:opacity-80 transition-opacity"
      >
        Project Celestia
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/import" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          Import
        </Link>
        <button
          onClick={onLogout}
          className="text-sm font-medium text-zinc-500 hover:text-danger-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

// -------------------------------------------------------
// RosterPage — main export
// -------------------------------------------------------
export default function RosterPage() {
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["genshin", "characters"],
    queryFn: fetchGenshinRoster,
    retry: false,
  });

  const characters = data?.characters ?? [];

  return (
    <div className="min-h-screen relative overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-accent-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Page heading */}
        <div className="flex items-end justify-between mb-10 animate-fade-in">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-white">
              Your Roster
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              {isLoading
                ? "Loading your characters…"
                : `${data?.total ?? 0} character${(data?.total ?? 0) === 1 ? "" : "s"} in your roster`}
            </p>
          </div>
          {!isLoading && characters.length > 0 && (
            <Link
              to="/import"
              className="text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Re-import
            </Link>
          )}
        </div>

        {/* Error state */}
        {isError && (
          <div
            role="alert"
            className="bg-danger-950/20 border border-danger-500/30 text-danger-400 text-sm px-4 py-3 rounded-xl animate-fade-in flex items-start gap-2 mb-8"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error instanceof Error ? error.message : "Failed to load your roster. Please try again."}
          </div>
        )}

        {/* Loading state: 6 skeleton cards */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && characters.length === 0 && <EmptyState />}

        {/* Populated state: character grid */}
        {!isLoading && !isError && characters.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
