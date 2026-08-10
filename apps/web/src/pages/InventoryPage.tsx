import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth.store";
import {
  fetchGenshinWeapons,
  fetchGenshinArtifacts,
  type InventoryWeapon,
  type InventoryArtifact,
  type ArtifactSubStat,
} from "../lib/api";

// -------------------------------------------------------
// Formatting utilities
// -------------------------------------------------------

/** PascalCase → spaced display name. "StaffOfHoma" → "Staff Of Homa" */
function formatName(key: string): string {
  return key.replace(/([A-Z])/g, " $1").trim();
}

const STAT_LABELS: Record<string, string> = {
  hp:            "HP",
  hp_:           "HP%",
  atk:           "ATK",
  atk_:          "ATK%",
  def:           "DEF",
  def_:          "DEF%",
  eleMas:        "EM",
  enerRech_:     "ER%",
  critRate_:     "CR",
  critDMG_:      "CD",
  heal_:         "Heal%",
  pyro_dmg_:     "Pyro%",
  hydro_dmg_:    "Hydro%",
  cryo_dmg_:     "Cryo%",
  electro_dmg_:  "Electro%",
  anemo_dmg_:    "Anemo%",
  geo_dmg_:      "Geo%",
  dendro_dmg_:   "Dendro%",
  physical_dmg_: "Phys%",
};

function formatStat(key: string): string {
  return STAT_LABELS[key] ?? key;
}

const SLOT_LABELS: Record<string, { label: string; letter: string }> = {
  flower:  { label: "Flower",  letter: "F" },
  plume:   { label: "Plume",   letter: "P" },
  sands:   { label: "Sands",   letter: "S" },
  goblet:  { label: "Goblet",  letter: "G" },
  circlet: { label: "Circlet", letter: "C" },
};

// -------------------------------------------------------
// Refinement color system
// -------------------------------------------------------
function refinementClasses(r: number): { border: string; text: string; glow: string } {
  if (r === 5) return { border: "border-amber-400", text: "text-amber-400", glow: "shadow-[0_0_12px_rgba(251,191,36,0.5)]" };
  if (r === 4) return { border: "border-amber-500/70", text: "text-amber-400", glow: "" };
  if (r === 3) return { border: "border-violet-500/70", text: "text-violet-400", glow: "" };
  if (r === 2) return { border: "border-accent-500/70", text: "text-accent-400", glow: "" };
  return { border: "border-zinc-600", text: "text-zinc-400", glow: "" };
}

// -------------------------------------------------------
// Artifact level tier color
// -------------------------------------------------------
function levelColor(level: number): string {
  if (level >= 17) return "text-amber-400";
  if (level >= 13) return "text-violet-400";
  if (level >= 9)  return "text-accent-400";
  return "text-zinc-400";
}

// -------------------------------------------------------
// WeaponCard
// -------------------------------------------------------
function WeaponCard({ weapon }: { weapon: InventoryWeapon }) {
  const displayName = formatName(weapon.weaponKey);
  const initials = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const ref = refinementClasses(weapon.refinement);
  const isEquipped = weapon.equippedCharacterId !== null;

  return (
    <div className={`glass-panel hover-lift rounded-2xl p-5 flex flex-col gap-3 border border-white/5 group transition-all ${ref.glow}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 shrink-0 rounded-xl border-2 flex items-center justify-center font-display font-bold text-sm select-none ${ref.border} ${ref.text}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-white text-sm truncate group-hover:text-accent-400 transition-colors">
            {displayName}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">Lv.{weapon.level} · A{weapon.ascension}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border bg-black/30 shrink-0 ${ref.border} ${ref.text}`}>
          R{weapon.refinement}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Equipped status */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEquipped ? "bg-emerald-400" : "bg-zinc-600"}`} />
        <span className={isEquipped ? "text-emerald-400" : "text-zinc-600"}>
          {isEquipped ? "Equipped" : "Unequipped"}
        </span>
        {weapon.locked && (
          <svg className="w-3 h-3 ml-auto text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" />
          </svg>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// ArtifactRow
// -------------------------------------------------------
function ArtifactRow({ artifact }: { artifact: InventoryArtifact }) {
  const slot = SLOT_LABELS[artifact.slotKey] ?? { label: artifact.slotKey, letter: "?" };
  const setName = formatName(artifact.setKey);
  const mainStat = formatStat(artifact.mainStatKey);

  // Safely parse subStats — stored as JSON (Prisma `Json` column)
  const subStats: ArtifactSubStat[] = Array.isArray(artifact.subStats)
    ? (artifact.subStats as ArtifactSubStat[])
    : [];

  const rarityColor = artifact.rarity >= 5 ? "text-amber-400" : "text-violet-400";
  const stars = "★".repeat(artifact.rarity);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
      {/* Slot badge */}
      <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">
        {slot.letter}
      </div>

      {/* Set + slot */}
      <div className="w-44 shrink-0 min-w-0">
        <p className="text-white text-sm font-medium truncate group-hover:text-accent-400 transition-colors">
          {setName}
        </p>
        <p className="text-zinc-500 text-xs">{slot.label}</p>
      </div>

      {/* Rarity + level */}
      <div className="w-20 shrink-0 flex flex-col">
        <span className={`text-xs font-bold tracking-tight ${rarityColor}`}>{stars}</span>
        <span className={`text-sm font-bold font-display ${levelColor(artifact.level)}`}>+{artifact.level}</span>
      </div>

      {/* Main stat */}
      <div className="w-20 shrink-0">
        <span className="text-white text-sm font-semibold">{mainStat}</span>
      </div>

      {/* Sub-stats */}
      <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0">
        {subStats.map((sub, i) => (
          <span
            key={i}
            className="text-xs bg-white/5 text-zinc-300 rounded-md px-1.5 py-0.5 shrink-0 whitespace-nowrap"
          >
            {formatStat(sub.key)}{" "}
            <span className="text-zinc-400">
              {Number.isInteger(sub.value) ? sub.value : sub.value.toFixed(1)}
            </span>
          </span>
        ))}
      </div>

      {/* Lock icon */}
      {artifact.locked ? (
        <svg className="w-3.5 h-3.5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      ) : (
        <div className="w-3.5 shrink-0" />
      )}
    </div>
  );
}

// -------------------------------------------------------
// Skeleton components
// -------------------------------------------------------
function WeaponSkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3 border border-white/5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded-lg w-3/4" />
          <div className="h-3 bg-white/5 rounded-lg w-1/2" />
        </div>
        <div className="w-8 h-5 bg-white/5 rounded-full shrink-0" />
      </div>
      <div className="border-t border-white/5" />
      <div className="h-3 bg-white/5 rounded w-1/3" />
    </div>
  );
}

function ArtifactSkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
      <div className="w-44 shrink-0 space-y-1.5">
        <div className="h-4 bg-white/5 rounded w-5/6" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
      <div className="w-20 shrink-0 space-y-1">
        <div className="h-3 bg-white/5 rounded w-12" />
        <div className="h-4 bg-white/5 rounded w-8" />
      </div>
      <div className="w-20 shrink-0">
        <div className="h-4 bg-white/5 rounded w-14" />
      </div>
      <div className="flex-1 flex gap-1.5">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-5 bg-white/5 rounded-md w-14" />)}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Empty state
// -------------------------------------------------------
function EmptyState({ type }: { type: "weapons" | "artifacts" }) {
  const label = type === "weapons" ? "weapons" : "artifacts";
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h2 className="text-2xl font-display font-bold text-white mb-3">No {label} found</h2>
      <p className="text-zinc-400 text-base max-w-sm mb-8 leading-relaxed">
        Import your Genshin account data to see your {label} here.
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
// Tab bar
// -------------------------------------------------------
type Tab = "weapons" | "artifacts";

function TabBar({
  active,
  weaponsTotal,
  artifactsTotal,
  onChange,
}: {
  active: Tab;
  weaponsTotal: number;
  artifactsTotal: number;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "weapons",   label: "Weapons",   count: weaponsTotal },
    { id: "artifacts", label: "Artifacts", count: artifactsTotal },
  ];

  return (
    <div className="flex items-center gap-1 glass-panel rounded-xl p-1 w-fit mb-8">
      {tabs.map(({ id, label, count }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            active === id
              ? "bg-accent-500/20 text-accent-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {label}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active === id ? "bg-accent-500/30 text-accent-300" : "bg-white/5 text-zinc-600"}`}>
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

// -------------------------------------------------------
// Nav bar
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
        <Link to="/roster"  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Roster</Link>
        <Link to="/import"  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Import</Link>
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
// InventoryPage — main export
// -------------------------------------------------------
export default function InventoryPage() {
  const logout = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<Tab>("weapons");

  const weaponsQuery = useQuery({
    queryKey: ["genshin", "weapons"],
    queryFn: fetchGenshinWeapons,
    retry: false,
  });

  const artifactsQuery = useQuery({
    queryKey: ["genshin", "artifacts"],
    queryFn: fetchGenshinArtifacts,
    retry: false,
  });

  const weapons   = weaponsQuery.data?.weapons     ?? [];
  const artifacts = artifactsQuery.data?.artifacts ?? [];

  const isWeaponsLoading   = weaponsQuery.isLoading;
  const isArtifactsLoading = artifactsQuery.isLoading;
  const activeError        = activeTab === "weapons" ? weaponsQuery.error : artifactsQuery.error;

  return (
    <div className="min-h-screen relative overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-violet-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Page heading */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-display font-bold tracking-tight text-white">
            Inventory
          </h1>
          <p className="text-zinc-400 mt-2 text-base">
            {(isWeaponsLoading || isArtifactsLoading)
              ? "Loading your inventory…"
              : `${weaponsQuery.data?.total ?? 0} weapon${(weaponsQuery.data?.total ?? 0) === 1 ? "" : "s"} · ${artifactsQuery.data?.total ?? 0} artifact${(artifactsQuery.data?.total ?? 0) === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Tab bar — rendered with live counts once data arrives */}
        <TabBar
          active={activeTab}
          weaponsTotal={weaponsQuery.data?.total ?? 0}
          artifactsTotal={artifactsQuery.data?.total ?? 0}
          onChange={setActiveTab}
        />

        {/* Error */}
        {activeError && (
          <div
            role="alert"
            className="bg-danger-950/20 border border-danger-500/30 text-danger-400 text-sm px-4 py-3 rounded-xl animate-fade-in flex items-start gap-2 mb-8"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {activeError instanceof Error ? activeError.message : "Failed to load inventory. Please try again."}
          </div>
        )}

        {/* ── Weapons Tab ─────────────────────────────────────── */}
        {activeTab === "weapons" && (
          <>
            {isWeaponsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <WeaponSkeletonCard key={i} />)}
              </div>
            )}
            {!isWeaponsLoading && !weaponsQuery.isError && weapons.length === 0 && (
              <EmptyState type="weapons" />
            )}
            {!isWeaponsLoading && !weaponsQuery.isError && weapons.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
                {weapons.map((w) => <WeaponCard key={w.id} weapon={w} />)}
              </div>
            )}
          </>
        )}

        {/* ── Artifacts Tab ────────────────────────────────────── */}
        {activeTab === "artifacts" && (
          <>
            {isArtifactsLoading && (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 10 }).map((_, i) => <ArtifactSkeletonRow key={i} />)}
              </div>
            )}
            {!isArtifactsLoading && !artifactsQuery.isError && artifacts.length === 0 && (
              <EmptyState type="artifacts" />
            )}
            {!isArtifactsLoading && !artifactsQuery.isError && artifacts.length > 0 && (
              <div className="flex flex-col gap-2 animate-fade-in">
                {/* Artifact list header */}
                <div className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  <div className="w-8 shrink-0" />
                  <div className="w-44 shrink-0">Set · Slot</div>
                  <div className="w-20 shrink-0">Rarity · Lv</div>
                  <div className="w-20 shrink-0">Main Stat</div>
                  <div className="flex-1">Sub-stats</div>
                </div>
                {artifacts.map((a) => <ArtifactRow key={a.id} artifact={a} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
