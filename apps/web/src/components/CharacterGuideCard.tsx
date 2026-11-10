import { useState } from 'react';

import { roleLabels } from '../lib/build-analysis/explainer';
import type { ReviewedCharacterProfile } from '../lib/build-analysis/identity';
import type { BuildRoleId } from '../lib/build-analysis/types';

interface CharacterGuideCardProps {
  profile: ReviewedCharacterProfile;
  currentRoleId?: BuildRoleId;
}

const RARITY_CONFIG: Record<
  number,
  { color: string; bg: string; border: string; stars: string; label: string }
> = {
  5: {
    color: '#e5a544',
    bg: 'rgba(229, 165, 68, 0.12)',
    border: 'rgba(229, 165, 68, 0.35)',
    stars: '★★★★★',
    label: '5-star',
  },
  4: {
    color: '#a370f7',
    bg: 'rgba(163, 112, 247, 0.12)',
    border: 'rgba(163, 112, 247, 0.35)',
    stars: '★★★★',
    label: '4-star',
  },
  3: {
    color: '#4aa3df',
    bg: 'rgba(74, 163, 223, 0.12)',
    border: 'rgba(74, 163, 223, 0.35)',
    stars: '★★★',
    label: '3-star',
  },
};

export function CharacterGuideCard({ profile, currentRoleId }: CharacterGuideCardProps) {
  const [previewRoleId, setPreviewRoleId] = useState<BuildRoleId | null>(null);
  const [combatTipsExpanded, setCombatTipsExpanded] = useState(false);
  const [collapsedTiers, setCollapsedTiers] = useState<Record<number, boolean>>({});

  const guide = profile.guide;
  if (!guide) return null;

  const activeRole =
    (previewRoleId && profile.roles.find((r) => r.id === previewRoleId)) ||
    profile.roles.find((r) => r.id === currentRoleId) ||
    profile.roles.find((r) => r.id === profile.defaultRoleId) ||
    profile.roles[0];

  const tier1Sets = activeRole?.sets.filter((s) => s.tier === 1) ?? [];
  const tier2Sets = activeRole?.sets.filter((s) => s.tier === 2) ?? [];
  const tier3Sets = activeRole?.sets.filter((s) => s.tier === 3) ?? [];

  const tier1Weapons = guide.weapons.filter((w) => w.tier === 1);
  const tier2Weapons = guide.weapons.filter((w) => w.tier === 2);
  const tier3Weapons = guide.weapons.filter((w) => w.tier === 3);

  const formatSetName = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2');

  const categoryBadgeClass = (category: string) => {
    switch (category) {
      case 'BiS':
        return 'bg-amber-400/15 text-amber-300 border-amber-400/40 shadow-xs';
      case 'F2P':
        return 'bg-sky-400/15 text-sky-300 border-sky-400/40 shadow-xs';
      case 'Utility':
        return 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40 shadow-xs';
      default:
        return 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40 shadow-xs';
    }
  };

  const toggleTier = (tierIndex: number) => {
    setCollapsedTiers((prev) => ({
      ...prev,
      [tierIndex]: !prev[tierIndex],
    }));
  };

  const weaponGroups = [
    {
      tierIndex: 1,
      tierName: 'Tier 1 · Best-in-Slot',
      items: tier1Weapons,
      badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      accentBorder: 'border-l-amber-400',
    },
    {
      tierIndex: 2,
      tierName: 'Tier 2 · Competitive Alternatives',
      items: tier2Weapons,
      badgeClass: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/50',
      accentBorder: 'border-l-zinc-400',
    },
    {
      tierIndex: 3,
      tierName: 'Tier 3 · F2P & Budget Options',
      items: tier3Weapons,
      badgeClass: 'bg-zinc-800/40 text-zinc-400 border-zinc-700/50',
      accentBorder: 'border-l-zinc-600',
    },
  ].filter((group) => group.items.length > 0);

  return (
    <section
      className="character-guide-card relative my-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-xl shadow-black/20 backdrop-blur-md transition-all sm:p-6"
      aria-labelledby={`guide-heading-${profile.avatarId}`}
    >
      {/* Ambient decorative background glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Header bar */}
      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              <svg
                className="h-3 w-3 text-amber-400"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l2.4 7.2h7.6l-6.2 4.5 2.4 7.3-6.2-4.5-6.2 4.5 2.4-7.3-6.2-4.5h7.6z" />
              </svg>
              KQM Theorycrafting
            </span>
            <span className="text-xs text-zinc-400">Verified Guide</span>
          </div>
          <h3
            id={`guide-heading-${profile.avatarId}`}
            className="font-display text-lg font-bold tracking-tight text-zinc-100 sm:text-xl"
          >
            {profile.displayName} Build Guide
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Verified KeqingMains (KQM) recommendations, ER thresholds & rotation mechanics
          </p>
        </div>

        <a
          href={guide.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-all hover:border-amber-400/60 hover:bg-amber-400/20 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-label={`View full ${profile.displayName} guide on KeqingMains (opens in a new tab)`}
        >
          <span>View Full KQM Guide</span>
          <svg
            className="h-3.5 w-3.5 text-amber-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {/* Role Switcher Pill Bar (if character has multiple reviewed roles) */}
      {profile.roles.length > 1 && (
        <div className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-zinc-400">
              Reviewed Build Roles ({profile.roles.length})
            </span>
            <span className="text-[11px] text-zinc-400">
              Active:{' '}
              <strong className="font-semibold text-amber-300">
                {activeRole?.id ? (roleLabels[activeRole.id] ?? activeRole.id) : 'Default'}
              </strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.roles.map((r) => {
              const isSelected = activeRole?.id === r.id;
              const isBuildAssumed = r.id === currentRoleId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPreviewRoleId(r.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isSelected
                      ? 'shadow-xs border border-amber-400/40 bg-amber-400/20 text-amber-200'
                      : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span>{roleLabels[r.id] ?? r.id.replace(/_/g, ' ')}</span>
                  {isBuildAssumed && (
                    <span className="py-0.2 rounded bg-amber-400/30 px-1 text-[9px] font-bold uppercase text-amber-200">
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Playstyle & Energy Requirements Context Cards */}
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/15">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/10 text-amber-400">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              Playstyle Overview
            </h4>
          </div>
          <p className="text-xs font-normal leading-relaxed text-zinc-300 sm:text-sm">
            {guide.playstyleSummary}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/15">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 text-sky-400">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-300/90">
              Energy Recharge Context
            </h4>
          </div>
          <p className="text-xs font-normal leading-relaxed text-zinc-300 sm:text-sm">
            {guide.energyRequirements}
          </p>
        </div>
      </div>

      {/* Artifact Sets Section */}
      <div className="mb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/10 text-amber-400">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              Ranked Artifact Sets
            </h4>
          </div>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300">
            Role:{' '}
            <strong className="font-medium text-zinc-100">
              {activeRole?.id
                ? (roleLabels[activeRole.id] ?? activeRole.id.replace(/_/g, ' '))
                : 'Primary'}
            </strong>
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Tier 1 Sets */}
          {tier1Sets.map((s, idx) => (
            <div
              key={`t1-${idx}`}
              className="sm:pl-4.5 shadow-xs relative flex flex-col gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-3 pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1.5 before:rounded-l-xl before:bg-amber-400 sm:p-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="shadow-xs inline-flex items-center rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-950">
                  Tier 1 · BiS
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-zinc-100">
                  {s.pieces}pc
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {formatSetName(s.referenceKey)}
                </span>
              </div>
              {s.label && (
                <p className="pl-0.5 text-xs leading-normal text-zinc-300/90 sm:text-sm">
                  {s.label}
                </p>
              )}
            </div>
          ))}

          {/* Tier 2 Sets */}
          {tier2Sets.map((s, idx) => (
            <div
              key={`t2-${idx}`}
              className="sm:pl-4.5 shadow-xs relative flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1.5 before:rounded-l-xl before:bg-zinc-400 sm:p-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="shadow-xs inline-flex items-center rounded border border-zinc-600/60 bg-zinc-700 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-100">
                  Tier 2 · Alternative
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-zinc-100">
                  {s.pieces}pc
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {formatSetName(s.referenceKey)}
                </span>
              </div>
              {s.label && (
                <p className="pl-0.5 text-xs leading-normal text-zinc-300/90 sm:text-sm">
                  {s.label}
                </p>
              )}
            </div>
          ))}

          {/* Tier 3 Sets */}
          {tier3Sets.map((s, idx) => (
            <div
              key={`t3-${idx}`}
              className="sm:pl-4.5 shadow-xs relative flex flex-col gap-1.5 rounded-xl border border-white/5 bg-white/[0.015] p-3 pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1.5 before:rounded-l-xl before:bg-zinc-600 sm:p-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="shadow-xs inline-flex items-center rounded border border-zinc-700/60 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-200">
                  Tier 3 · Transitional
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-zinc-100">
                  {s.pieces}pc
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {formatSetName(s.referenceKey)}
                </span>
              </div>
              {s.label && (
                <p className="pl-0.5 text-xs leading-normal text-zinc-300/90 sm:text-sm">
                  {s.label}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ranked Weapon Recommendations Section */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/10 text-amber-400">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                <path d="M13 19l6-6" />
                <path d="M16 16l4 4" />
                <path d="M19 21l2-2" />
              </svg>
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              Ranked Weapon Recommendations
            </h4>
          </div>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
            {guide.weapons.length} options reviewed
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {weaponGroups.map((group) => {
            const isCollapsed = !!collapsedTiers[group.tierIndex];
            return (
              <div
                key={group.tierIndex}
                className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all`}
              >
                {/* Collapsible Tier Header */}
                <button
                  type="button"
                  onClick={() => toggleTier(group.tierIndex)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:px-4"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase ${group.badgeClass}`}
                    >
                      {group.tierName}
                    </span>
                    <span className="text-xs text-zinc-400">({group.items.length})</span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Tier Weapon Items */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-2 p-3 pt-0 sm:p-4">
                    {group.items.map((w, wIdx) => {
                      const rarity = RARITY_CONFIG[w.rarity] ?? RARITY_CONFIG[4];
                      return (
                        <div
                          key={wIdx}
                          className="flex flex-col gap-1 rounded-lg border border-white/5 bg-black/25 p-3 transition-colors hover:border-white/10 hover:bg-black/35"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-100">{w.name}</span>
                            <span
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wider"
                              style={{
                                color: rarity.color,
                                backgroundColor: rarity.bg,
                                border: `1px solid ${rarity.border}`,
                              }}
                              aria-label={rarity.label}
                            >
                              {rarity.stars}
                            </span>
                            <span
                              className={`py-0.2 inline-flex items-center rounded-full border px-2 text-[11px] font-semibold ${categoryBadgeClass(
                                w.category,
                              )}`}
                            >
                              {w.category}
                            </span>
                          </div>
                          {w.notes && (
                            <p className="mt-0.5 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                              {w.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Combat & Rotation Tips Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/10 text-amber-400">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              Combat & Rotation Tips
            </h4>
          </div>
          {guide.combatTips.length > 3 && (
            <button
              type="button"
              onClick={() => setCombatTipsExpanded((prev) => !prev)}
              className="rounded px-1.5 py-0.5 text-xs font-medium text-amber-300 transition-colors hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {combatTipsExpanded ? 'Show Less' : `View All (${guide.combatTips.length})`}
            </button>
          )}
        </div>

        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {(combatTipsExpanded ? guide.combatTips : guide.combatTips.slice(0, 4)).map(
            (tip, idx) => {
              // Parse out title if tip has format "Concept Title: Description"
              const colonIndex = tip.indexOf(':');
              const hasTitle = colonIndex > 0 && colonIndex < 45;
              const title = hasTitle ? tip.slice(0, colonIndex) : null;
              const content = hasTitle ? tip.slice(colonIndex + 1).trim() : tip;

              return (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.015] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.025]"
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-[11px] font-bold text-amber-300"
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <div className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                    {title ? (
                      <>
                        <strong className="font-semibold text-zinc-100">{title}: </strong>
                        <span>{content}</span>
                      </>
                    ) : (
                      <span>{tip}</span>
                    )}
                  </div>
                </li>
              );
            },
          )}
        </ul>
      </div>
    </section>
  );
}
