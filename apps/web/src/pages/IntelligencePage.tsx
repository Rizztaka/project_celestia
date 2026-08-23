import { useQuery } from '@tanstack/react-query';
import { type ReactNode,useState } from 'react';
import { Link } from 'react-router-dom';

import {
  type ArtifactRecommendation,
  type ArtifactSkippedCharacter,
  type CharacterRecommendation,
  type EquippedArtifactOutput,
  fetchArtifactIntelligence,
  fetchCharacterIntelligence,
  fetchKnowledgeIntelligence,
  fetchPlannerIntelligence,
  fetchPullIntelligence,
  fetchTeamIntelligence,
  type KnowledgeInsight,
  type KnowledgeIntelligenceResponse,
  type KnowledgeInsightKey,
  type PlannerIntelligenceResponse,
  type PlannerRouteItem,
  type PullIntelligenceResponse,
  type PullRecommendation,
  type PullRecommendationLabel,
  type RecommendationLabel,
  type SkippedCharacter,
  type TeamRecommendation,
  type TeamRosterSlot,
} from '../lib/api';
import { ApiError } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function formatName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// -------------------------------------------------------
// Element colour system for roster slots
// -------------------------------------------------------

const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  Pyro:    { bg: 'bg-orange-500/15',  border: 'border-orange-500/40',  text: 'text-orange-400',  glow: 'shadow-[0_0_12px_rgba(249,115,22,0.25)]' },
  Hydro:   { bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    text: 'text-blue-400',    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.25)]' },
  Electro: { bg: 'bg-purple-500/15',  border: 'border-purple-500/40',  text: 'text-purple-400',  glow: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]' },
  Cryo:    { bg: 'bg-cyan-400/15',    border: 'border-cyan-400/40',    text: 'text-cyan-300',    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.25)]' },
  Dendro:  { bg: 'bg-green-500/15',   border: 'border-green-500/40',   text: 'text-green-400',   glow: 'shadow-[0_0_12px_rgba(34,197,94,0.25)]' },
  Anemo:   { bg: 'bg-teal-400/15',    border: 'border-teal-400/40',    text: 'text-teal-300',    glow: 'shadow-[0_0_12px_rgba(45,212,191,0.25)]' },
  Geo:     { bg: 'bg-yellow-600/15',  border: 'border-yellow-600/40',  text: 'text-yellow-500',  glow: 'shadow-[0_0_12px_rgba(202,138,4,0.25)]' },
};

function getElementStyle(element: string | null) {
  return element && ELEMENT_COLORS[element]
    ? ELEMENT_COLORS[element]
    : { bg: 'bg-white/5', border: 'border-white/20', text: 'text-zinc-400', glow: '' };
}

// -------------------------------------------------------
// Character Intelligence — label metadata
// -------------------------------------------------------

interface LabelMeta {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
  icon: ReactNode;
}

function getLabelMeta(recommendation: RecommendationLabel): LabelMeta {
  switch (recommendation) {
    case 'ASCEND_AND_LEVEL':
      return {
        label: 'Ascend & Level',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/30',
        glowClass: 'shadow-[0_0_24px_rgba(251,191,36,0.2)]',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ),
      };
    case 'LEVEL_TALENTS':
      return {
        label: 'Level Talents',
        colorClass: 'text-violet-400',
        bgClass: 'bg-violet-500/10',
        borderClass: 'border-violet-500/30',
        glowClass: 'shadow-[0_0_24px_rgba(167,139,250,0.2)]',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
      };
    case 'CLOSE_LEVEL_GAP':
      return {
        label: 'Close Level Gap',
        colorClass: 'text-cyan-400',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/30',
        glowClass: 'shadow-[0_0_24px_rgba(34,211,238,0.2)]',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      };
    case 'COMPLETE':
    default:
      return {
        label: 'Complete',
        colorClass: 'text-success-400',
        bgClass: 'bg-success-400/10',
        borderClass: 'border-success-400/30',
        glowClass: '',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
  }
}

function getScoreBarColor(score: number): string {
  if (score >= 70) return 'from-amber-500 to-red-500';
  if (score >= 40) return 'from-violet-500 to-amber-500';
  return 'from-accent-500 to-violet-500';
}

// -------------------------------------------------------
// Rank badge
// -------------------------------------------------------

function RankBadge({ rank, top3 = false }: { rank: number; top3?: boolean }) {
  const charColors = [
    'from-amber-400 to-yellow-300 shadow-[0_0_16px_rgba(251,191,36,0.4)]',
    'from-zinc-400 to-zinc-300 shadow-[0_0_12px_rgba(161,161,170,0.3)]',
    'from-amber-700 to-amber-600 shadow-[0_0_12px_rgba(180,83,9,0.3)]',
    'from-accent-500 to-indigo-400',
    'from-accent-500 to-indigo-400',
  ];
  const teamColors = [
    'from-amber-400 to-yellow-300 shadow-[0_0_16px_rgba(251,191,36,0.4)]',
    'from-zinc-400 to-zinc-300 shadow-[0_0_12px_rgba(161,161,170,0.3)]',
    'from-amber-700 to-amber-600 shadow-[0_0_12px_rgba(180,83,9,0.3)]',
  ];
  const colors = top3 ? teamColors : charColors;
  const colorClass = colors[rank - 1] ?? colors[colors.length - 1];
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-sm font-bold text-white ${colorClass}`}>
      #{rank}
    </div>
  );
}

// -------------------------------------------------------
// Archetype reaction badge
// -------------------------------------------------------

const ARCHETYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  VAPORIZE:      { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' },
  FREEZE:        { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-300' },
  HYPERBLOOM:    { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-300' },
  QUICKEN:       { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
  BLOOM:         { bg: 'bg-green-600/10',  border: 'border-green-600/30',  text: 'text-green-400' },
  ELECTROCHARGED:{ bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300' },
  MONO_PYRO:     { bg: 'bg-orange-600/10', border: 'border-orange-600/30', text: 'text-orange-400' },
  SUPERCONDUCT:  { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300' },
};

function ArchetypeBadge({ archetype, reaction }: { archetype: string; reaction: string }) {
  const style = ARCHETYPE_COLORS[archetype] ?? { bg: 'bg-white/5', border: 'border-white/20', text: 'text-zinc-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.bg} ${style.border} ${style.text}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${style.text.replace('text-', 'bg-')}`} />
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.text.replace('text-', 'bg-')}`} />
      </span>
      {reaction}
    </span>
  );
}

// -------------------------------------------------------
// Team Roster Slot — single character position
// -------------------------------------------------------

function RosterSlotCard({ slot }: { slot: TeamRosterSlot }) {
  const elStyle = getElementStyle(slot.element);
  const isFilled = slot.characterKey !== null;
  const name = isFilled ? formatName(slot.characterKey!) : null;
  const initials = name ? getInitials(name) : null;

  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
        isFilled
          ? `${elStyle.bg} ${elStyle.border} ${elStyle.glow}`
          : 'border-dashed border-white/10 bg-white/2'
      }`}
    >
      {/* Flex badge */}
      {slot.flex && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-zinc-900 px-2 py-px text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Flex
        </span>
      )}

      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-display text-sm font-bold transition-all ${
          isFilled
            ? `${elStyle.bg} ${elStyle.border} ${elStyle.text}`
            : 'border-white/10 bg-white/5 text-zinc-600'
        }`}
      >
        {isFilled ? initials : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </div>

      {/* Name / empty placeholder */}
      <div className="w-full">
        <p className={`truncate text-xs font-semibold ${isFilled ? 'text-white' : 'text-zinc-600'}`}>
          {name ?? 'Empty'}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-zinc-600">{slot.label}</p>
      </div>

      {/* Investment bar */}
      {isFilled && (
        <div className="w-full">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full ${elStyle.text.replace('text-', 'bg-')} opacity-70 transition-all duration-700`}
              style={{ width: `${slot.investmentScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Required dot */}
      {slot.isRequired && !slot.flex && (
        <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-zinc-900 bg-amber-500" title="Required role" />
      )}
    </div>
  );
}

// -------------------------------------------------------
// TeamRecommendationCard
// -------------------------------------------------------

function TeamCard({ rec }: { rec: TeamRecommendation }) {
  const barColor = getScoreBarColor(rec.score);
  const archetypeStyle = ARCHETYPE_COLORS[rec.archetype] ?? { bg: 'bg-white/5', border: 'border-white/10', text: 'text-zinc-400' };

  return (
    <article
      id={`team-card-${rec.rank}`}
      className="glass-panel hover-lift group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/5 p-6 transition-all"
    >
      {/* Top accent line coloured by archetype */}
      <div className={`absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r ${archetypeStyle.text.replace('text-', 'from-')}/0 via-current to-${archetypeStyle.text.replace('text-', '')}/0 opacity-80`} />

      {/* Header: rank + team name + score */}
      <div className="flex items-center gap-4">
        <RankBadge rank={rec.rank} top3 />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-bold text-white">{rec.templateName}</p>
            <ArchetypeBadge archetype={rec.archetype} reaction={rec.reaction} />
          </div>

          {/* Score bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                style={{ width: `${rec.score}%` }}
              />
            </div>
            <span className="shrink-0 font-display text-sm font-bold text-white">
              {rec.score}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Roster slots — 4-column grid */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
          Team Composition
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {rec.roster.map((slot) => (
            <RosterSlotCard key={slot.roleId} slot={slot} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Explanations */}
      <ul className="space-y-2.5" role="list" aria-label={`Why ${rec.templateName} is recommended`}>
        {rec.explanations.map((explanation, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-400">
            <span className={`mt-0.5 shrink-0 ${archetypeStyle.text}`} aria-hidden="true">›</span>
            {explanation}
          </li>
        ))}
      </ul>
    </article>
  );
}

// -------------------------------------------------------
// Character card (unchanged from original)
// -------------------------------------------------------

function RecommendationCard({ rec }: { rec: CharacterRecommendation }) {
  const name = formatName(rec.characterKey);
  const initials = getInitials(name);
  const meta = getLabelMeta(rec.recommendation);
  const barColor = getScoreBarColor(rec.score);

  return (
    <article
      id={`intelligence-card-${rec.rank}`}
      className={`glass-panel hover-lift group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/5 p-6 transition-all ${meta.glowClass}`}
    >
      <div className={`absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r ${
        rec.recommendation === 'ASCEND_AND_LEVEL' ? 'from-amber-500/0 via-amber-400 to-amber-500/0' :
        rec.recommendation === 'LEVEL_TALENTS'    ? 'from-violet-500/0 via-violet-400 to-violet-500/0' :
        rec.recommendation === 'CLOSE_LEVEL_GAP'  ? 'from-cyan-500/0 via-cyan-400 to-cyan-500/0' :
                                                    'from-accent-500/0 via-accent-400 to-accent-500/0'
      }`} />

      <div className="flex items-center gap-4">
        <RankBadge rank={rec.rank} />

        <div className={`flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-xl border font-display text-sm font-bold transition-all ${meta.colorClass} ${meta.borderClass} ${meta.bgClass}`}>
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`font-display group-hover:${meta.colorClass} truncate text-base font-bold text-white transition-colors`}>
            {name}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                style={{ width: `${rec.score}%` }}
              />
            </div>
            <span className={`shrink-0 font-display text-sm font-bold ${meta.colorClass}`}>
              {rec.score}
            </span>
          </div>
        </div>

        <div className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:flex ${meta.colorClass} ${meta.bgClass} ${meta.borderClass}`}>
          {meta.icon}
          {meta.label}
        </div>
      </div>

      <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold sm:hidden ${meta.colorClass} ${meta.bgClass} ${meta.borderClass}`}>
        {meta.icon}
        {meta.label}
      </div>

      <div className="border-t border-white/5" />

      <ul className="space-y-2.5" role="list" aria-label={`Reasons to invest in ${name}`}>
        {rec.explanations.map((explanation, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-400">
            <span className={`mt-0.5 shrink-0 ${meta.colorClass}`} aria-hidden="true">›</span>
            {explanation}
          </li>
        ))}
      </ul>
    </article>
  );
}

// -------------------------------------------------------
// SkippedAccordion
// -------------------------------------------------------

function SkippedAccordion({ skipped }: { skipped: SkippedCharacter[] }) {
  const [open, setOpen] = useState(false);

  if (skipped.length === 0) return null;

  return (
    <section className="animate-fade-in" id="intelligence-skipped-section">
      <button
        id="intelligence-skipped-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="intelligence-skipped-list"
        className="glass-panel flex w-full items-center justify-between rounded-2xl border border-white/5 px-6 py-4 text-sm font-medium text-zinc-400 transition-all hover:border-white/10 hover:text-white"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>
            {skipped.length} character{skipped.length !== 1 ? 's' : ''} with no major investment gaps
          </span>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          id="intelligence-skipped-list"
          role="list"
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {skipped.map((s) => (
            <li
              key={s.characterKey}
              id={`intelligence-skipped-${s.characterKey}`}
              className="glass-panel flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-success-400/20 bg-success-400/10 font-display text-xs font-bold text-success-400">
                {getInitials(formatName(s.characterKey))}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{formatName(s.characterKey)}</p>
                <p className="truncate text-xs text-zinc-500">{s.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// -------------------------------------------------------
// Skeleton loaders
// -------------------------------------------------------

function CharacterSkeletonCard() {
  return (
    <div className="glass-panel flex animate-pulse flex-col gap-5 rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-white/5" />
        <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded-lg bg-white/5" />
          <div className="h-1.5 w-full rounded-full bg-white/5" />
        </div>
        <div className="hidden h-7 w-28 shrink-0 rounded-full bg-white/5 sm:block" />
      </div>
      <div className="border-t border-white/5" />
      <div className="space-y-2.5">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-5/6 rounded bg-white/5" />
        <div className="h-4 w-4/6 rounded bg-white/5" />
      </div>
    </div>
  );
}

function TeamSkeletonCard() {
  return (
    <div className="glass-panel flex animate-pulse flex-col gap-5 rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-32 rounded-lg bg-white/5" />
            <div className="h-5 w-20 rounded-full bg-white/5" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5" />
        </div>
      </div>
      <div className="border-t border-white/5" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="border-t border-white/5" />
      <div className="space-y-2.5">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-5/6 rounded bg-white/5" />
        <div className="h-4 w-3/4 rounded bg-white/5" />
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Nav
// -------------------------------------------------------

function Nav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between border-b-0 border-white/10 px-6 py-4">
      <Link
        to="/"
        className="font-display text-gradient text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
      >
        Project Celestia
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/roster" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
          Roster
        </Link>
        <Link to="/planner" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
          Planner
        </Link>
        <button
          onClick={onLogout}
          className="hover:text-danger-400 text-sm font-medium text-zinc-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

// -------------------------------------------------------
// Empty / error state
// -------------------------------------------------------

function EmptyState({ errorCode, tab }: { errorCode: string | null; tab: 'characters' | 'teams' | 'artifacts' | 'planner' | 'pulls' | 'knowledge' }) {
  const isNoAccount = errorCode === 'NOT_FOUND';
  const isUnprocessable = errorCode === 'UNPROCESSABLE_ENTITY';

  let title: string;
  let body: string;
  let cta: string;
  let ctaHref: string;

  if (isNoAccount) {
    title = 'No Genshin Account Found';
    body = 'Link your Genshin Impact account to start receiving personalised recommendations.';
    cta = 'Link Account';
    ctaHref = '/import';
  } else if (isUnprocessable && tab === 'teams') {
    title = 'Not Enough Characters';
    body = 'Your roster needs at least 4 characters to assemble a team. Import your character data to unlock team analysis.';
    cta = 'Import Data';
    ctaHref = '/import';
  } else if (isUnprocessable && tab === 'planner') {
    title = 'No Upgrade Goals';
    body = 'Add upgrade goals in the Planner to receive daily farming route recommendations.';
    cta = 'Open Planner';
    ctaHref = '/planner';
  } else if (isUnprocessable) {
    title = 'Your Roster is Empty';
    body = 'Import your Genshin account data to populate your roster and enable the Intelligence Engine.';
    cta = 'Import Data';
    ctaHref = '/import';
  } else {
    title = 'Could Not Load Analysis';
    body = 'Something went wrong while analysing your account. Please try again.';
    cta = 'Import Data';
    ctaHref = '/import';
  }

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
      <div className="bg-accent-500/10 border-accent-500/20 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border">
        <svg className="text-accent-400 h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={
              isNoAccount
                ? 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                : 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
            }
          />
        </svg>
      </div>
      <h2 className="font-display mb-3 text-2xl font-bold text-white">{title}</h2>
      <p className="mb-8 max-w-sm text-base leading-relaxed text-zinc-400">{body}</p>
      <Link
        to={ctaHref}
        className="from-accent-500 hover:from-accent-400 shadow-accent-glow/30 rounded-xl bg-gradient-to-r to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:to-indigo-500"
      >
        {cta}
      </Link>
    </div>
  );
}

// -------------------------------------------------------
// TanStack Query hooks
// -------------------------------------------------------

function useCharacterIntelligence() {
  return useQuery({
    queryKey: ['intelligence', 'characters'],
    queryFn: fetchCharacterIntelligence,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 422)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

function useTeamIntelligence() {
  return useQuery({
    queryKey: ['intelligence', 'teams'],
    queryFn: fetchTeamIntelligence,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 422)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// -------------------------------------------------------
// Artifact Intelligence — hook
// -------------------------------------------------------

function usePlannerIntelligence() {
  return useQuery({
    queryKey: ['intelligence', 'planner'],
    queryFn: fetchPlannerIntelligence,
    staleTime: 60 * 1000, // 1 minute — resin changes every 8 min so stay fresh
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 422)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

function useArtifactIntelligence() {
  return useQuery({
    queryKey: ['intelligence', 'artifacts'],
    queryFn: fetchArtifactIntelligence,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 422)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// -------------------------------------------------------
// Artifact Intelligence — stat key display names
// -------------------------------------------------------

const STAT_DISPLAY: Record<string, string> = {
  critRate_: 'Crit Rate',
  critDMG_: 'Crit DMG',
  enerRech_: 'Energy Recharge',
  eleMas: 'Elem. Mastery',
  hp_: 'HP%',
  atk_: 'ATK%',
  def_: 'DEF%',
  hp: 'Flat HP',
  atk: 'Flat ATK',
  def: 'Flat DEF',
  pyro_dmg_: 'Pyro DMG',
  hydro_dmg_: 'Hydro DMG',
  electro_dmg_: 'Electro DMG',
  cryo_dmg_: 'Cryo DMG',
  anemo_dmg_: 'Anemo DMG',
  geo_dmg_: 'Geo DMG',
  dendro_dmg_: 'Dendro DMG',
  phys_dmg_: 'Physical DMG',
  heal_: 'Healing Bonus',
};

function displayStat(key: string): string {
  return STAT_DISPLAY[key] ?? key;
}

// -------------------------------------------------------
// Artifact Intelligence — AES ring gauge
// -------------------------------------------------------

function AesGauge({ score }: { score: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  const color =
    score >= 60 ? '#4ade80' : // green
    score >= 35 ? '#fb923c' : // orange
    '#f87171'; // red

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80" viewBox="0 0 80 80">
        {/* Track */}
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="7"
        />
        {/* Fill */}
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className="font-display text-lg font-bold text-white leading-none">{score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">AES</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Artifact Intelligence — single slot card
// -------------------------------------------------------

const SLOT_ICONS: Record<string, string> = {
  flower: '❀', plume: '🪶', sands: '⌛', goblet: '🏆', circlet: '⭕',
};

function SlotBreakdown({ artifact }: { artifact: EquippedArtifactOutput }) {
  const slotLabel = artifact.slotKey.charAt(0).toUpperCase() + artifact.slotKey.slice(1);
  const icon = SLOT_ICONS[artifact.slotKey] ?? '◆';
  const slotScore = artifact.slotScore;
  const barColor =
    slotScore >= 60 ? 'from-green-500 to-emerald-400' :
    slotScore >= 35 ? 'from-orange-500 to-amber-400' :
    'from-red-500 to-rose-400';

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{slotLabel}</span>
        </div>
        <span className="font-display text-xs font-bold text-white">{slotScore}</span>
      </div>
      {/* Score bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
          style={{ width: `${slotScore}%` }}
        />
      </div>
      {/* Main stat */}
      <p className="text-[10px] text-zinc-600">
        <span className="text-zinc-500">Main:</span> {displayStat(artifact.mainStatKey)}
      </p>
      {/* Sub-stats */}
      <ul className="space-y-1">
        {artifact.subStats.map((sub, i) => {
          const weightClass =
            sub.weight >= 0.8 ? 'text-amber-400' :
            sub.weight >= 0.4 ? 'text-zinc-300' :
            'text-zinc-600';
          return (
            <li key={i} className={`flex items-center justify-between text-[10px] ${weightClass}`}>
              <span>{displayStat(sub.key)}</span>
              <span className="font-semibold">{Number.isInteger(sub.value) ? sub.value : sub.value.toFixed(1)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// -------------------------------------------------------
// Artifact Intelligence — explanation bullet classifier
// -------------------------------------------------------

function isWarning(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('missing') ||
    lower.includes('weakest') ||
    lower.includes('main stat') ||
    lower.includes('switching') ||
    lower.includes('replace')
  );
}

function isPraise(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('positive') || lower.includes('excellent');
}

// -------------------------------------------------------
// Artifact Intelligence — recommendation card
// -------------------------------------------------------

function ArtifactCard({ rec }: { rec: ArtifactRecommendation }) {
  const name = formatName(rec.characterKey);
  const initials = getInitials(name);
  const aes = rec.artifactEfficiencyScore;
  const urgency = aes < 30 ? 'CRITICAL' : aes < 50 ? 'NEEDS WORK' : 'IMPROVABLE';
  const urgencyColor =
    aes < 30 ? { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', bar: 'from-red-500/0 via-red-400 to-red-500/0' } :
    aes < 50 ? { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', bar: 'from-orange-500/0 via-orange-400 to-orange-500/0' } :
               { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', bar: 'from-amber-500/0 via-amber-400 to-amber-500/0' };

  return (
    <article
      id={`artifact-card-${rec.rank}`}
      className="glass-panel hover-lift group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/5 p-6 transition-all"
    >
      {/* Accent top line */}
      <div className={`absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r ${urgencyColor.bar}`} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <RankBadge rank={rec.rank} />
        <AesGauge score={aes} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-bold text-white">{name}</p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest
                ${urgencyColor.text} ${urgencyColor.bg} ${urgencyColor.border}`}
            >
              {urgency}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${
                  aes < 30 ? 'from-red-500 to-rose-400' :
                  aes < 50 ? 'from-orange-500 to-amber-400' :
                  'from-amber-500 to-yellow-400'
                } transition-all duration-700`}
                style={{ width: `${aes}%` }}
              />
            </div>
            <span className={`shrink-0 font-display text-sm font-bold ${urgencyColor.text}`}>
              {aes}/100
            </span>
          </div>
        </div>

        {/* Avatar initials */}
        <div className={`hidden h-12 w-12 shrink-0 select-none items-center justify-center rounded-xl border font-display text-sm font-bold sm:flex
          ${urgencyColor.text} ${urgencyColor.bg} ${urgencyColor.border}`}
        >
          {initials}
        </div>
      </div>

      <div className="border-t border-white/5" />

      {/* Slot breakdowns */}
      {rec.equippedArtifacts.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
            Artifact Breakdown
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {rec.equippedArtifacts.map((a) => (
              <SlotBreakdown key={a.slotKey} artifact={a} />
            ))}
          </div>
        </div>
      )}

      {rec.equippedArtifacts.length > 0 && <div className="border-t border-white/5" />}

      {/* Explanations */}
      <ul className="space-y-2.5" role="list" aria-label={`Artifact improvement suggestions for ${name}`}>
        {rec.explanations.map((explanation, i) => {
          const warn = isWarning(explanation);
          const praise = isPraise(explanation);
          const bulletColor =
            warn ? 'text-red-400' :
            praise ? 'text-green-400' :
            'text-zinc-500';
          const textColor =
            warn ? 'text-zinc-300' :
            praise ? 'text-zinc-400' :
            'text-zinc-400';
          return (
            <li key={i} className={`flex items-start gap-2.5 text-sm leading-relaxed ${textColor}`}>
              <span className={`mt-0.5 shrink-0 ${bulletColor}`} aria-hidden="true">›</span>
              {explanation}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

// -------------------------------------------------------
// Artifact Intelligence — skipped accordion
// -------------------------------------------------------

function ArtifactSkippedAccordion({ skipped }: { skipped: ArtifactSkippedCharacter[] }) {
  const [open, setOpen] = useState(false);
  if (skipped.length === 0) return null;

  return (
    <section className="animate-fade-in" id="artifact-skipped-section">
      <button
        id="artifact-skipped-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="artifact-skipped-list"
        className="glass-panel flex w-full items-center justify-between rounded-2xl border border-white/5 px-6 py-4 text-sm font-medium text-zinc-400 transition-all hover:border-white/10 hover:text-white"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>
            {skipped.length} character{skipped.length !== 1 ? 's' : ''} with well-optimised artifacts or no profile yet
          </span>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          id="artifact-skipped-list"
          role="list"
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {skipped.map((s) => (
            <li
              key={s.characterKey}
              id={`artifact-skipped-${s.characterKey}`}
              className="glass-panel flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green-400/20 bg-green-400/10 font-display text-xs font-bold text-green-400">
                {getInitials(formatName(s.characterKey))}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{formatName(s.characterKey)}</p>
                <p className="truncate text-xs text-zinc-500">{s.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// -------------------------------------------------------
// Artifact Intelligence — skeleton card
// -------------------------------------------------------

function ArtifactSkeletonCard() {
  return (
    <div className="glass-panel flex animate-pulse flex-col gap-5 rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-white/5" />
        <div className="h-20 w-20 shrink-0 rounded-full bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-28 rounded-lg bg-white/5" />
            <div className="h-5 w-20 rounded-full bg-white/5" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5" />
        </div>
        <div className="hidden h-12 w-12 shrink-0 rounded-xl bg-white/5 sm:block" />
      </div>
      <div className="border-t border-white/5" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="border-t border-white/5" />
      <div className="space-y-2.5">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-5/6 rounded bg-white/5" />
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Tab system
// -------------------------------------------------------

type Tab = 'characters' | 'teams' | 'artifacts' | 'planner' | 'pulls' | 'knowledge';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'characters',
    label: 'Character Focus',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'teams',
    label: 'Team Assembly',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'artifacts',
    label: 'Artifact Assembly',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: 'planner',
    label: 'Resin Planner',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'pulls',
    label: 'Pull Value',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: 'knowledge',
    label: 'Account Insights',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

// -------------------------------------------------------
// Tab: Character Focus panel
// -------------------------------------------------------

function CharacterTab() {
  const { data, isLoading, isError, error } = useCharacterIntelligence();
  const errorCode = isError && error instanceof ApiError ? error.code : null;
  const recommendations = data?.recommendations ?? [];
  const skipped = data?.skipped ?? [];

  return (
    <>
      {/* Stat strip */}
      {!isLoading && !isError && (
        <div className="animate-fade-in flex gap-6 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4">
          <div>
            <p className="font-display text-2xl font-bold text-white">{recommendations.length}</p>
            <p className="text-xs text-zinc-500">Priority recommendations</p>
          </div>
          <div className="border-l border-white/5 pl-6">
            <p className="font-display text-2xl font-bold text-white">{skipped.length}</p>
            <p className="text-xs text-zinc-500">Characters already optimised</p>
          </div>
          {recommendations.length > 0 && (
            <div className="border-l border-white/5 pl-6">
              <p className="font-display text-2xl font-bold text-white">{recommendations[0].score}</p>
              <p className="text-xs text-zinc-500">Top priority score</p>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => <CharacterSkeletonCard key={i} />)}
        </div>
      )}

      {isError && <EmptyState errorCode={errorCode} tab="characters" />}

      {!isLoading && !isError && recommendations.length === 0 && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-success-400/20 bg-success-400/10">
            <svg className="h-10 w-10 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="font-display mb-3 text-2xl font-bold text-white">Fully Optimised</h2>
          <p className="max-w-sm text-base leading-relaxed text-zinc-400">
            Every character in your roster is performing at an excellent level. Import fresh data after your next session to check again.
          </p>
        </div>
      )}

      {!isLoading && !isError && recommendations.length > 0 && (
        <div className="space-y-8">
          <section aria-label="Top character recommendations" className="animate-fade-in space-y-5">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.characterKey} rec={rec} />
            ))}
          </section>
          {skipped.length > 0 && <SkippedAccordion skipped={skipped} />}
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------
// Tab: Team Assembly panel
// -------------------------------------------------------

function TeamTab() {
  const { data, isLoading, isError, error } = useTeamIntelligence();
  const errorCode = isError && error instanceof ApiError ? error.code : null;
  const recommendations = data?.recommendations ?? [];

  return (
    <>
      {/* Stat strip */}
      {!isLoading && !isError && recommendations.length > 0 && (
        <div className="animate-fade-in flex gap-6 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4">
          <div>
            <p className="font-display text-2xl font-bold text-white">{recommendations.length}</p>
            <p className="text-xs text-zinc-500">Buildable compositions</p>
          </div>
          <div className="border-l border-white/5 pl-6">
            <p className="font-display text-2xl font-bold text-white">{recommendations[0].score}</p>
            <p className="text-xs text-zinc-500">Top synergy score</p>
          </div>
          <div className="border-l border-white/5 pl-6">
            <p className="font-display truncate text-2xl font-bold text-white">{recommendations[0].templateName}</p>
            <p className="text-xs text-zinc-500">Best composition</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => <TeamSkeletonCard key={i} />)}
        </div>
      )}

      {isError && <EmptyState errorCode={errorCode} tab="teams" />}

      {!isLoading && !isError && recommendations.length > 0 && (
        <section aria-label="Top team recommendations" className="animate-fade-in space-y-5">
          {recommendations.map((rec) => (
            <TeamCard key={rec.templateId} rec={rec} />
          ))}
        </section>
      )}
    </>
  );
}

// -------------------------------------------------------
// Tab: Artifact Assembly panel
// -------------------------------------------------------

function ArtifactTab() {
  const { data, isLoading, isError, error } = useArtifactIntelligence();
  const errorCode = isError && error instanceof ApiError ? error.code : null;
  const recommendations = data?.recommendations ?? [];
  const skipped = data?.skipped ?? [];

  return (
    <>
      {/* Stat strip */}
      {!isLoading && !isError && (
        <div className="animate-fade-in flex gap-6 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4">
          <div>
            <p className="font-display text-2xl font-bold text-white">{recommendations.length}</p>
            <p className="text-xs text-zinc-500">Characters needing artifact work</p>
          </div>
          <div className="border-l border-white/5 pl-6">
            <p className="font-display text-2xl font-bold text-white">{skipped.length}</p>
            <p className="text-xs text-zinc-500">Already well-equipped</p>
          </div>
          {recommendations.length > 0 && (
            <div className="border-l border-white/5 pl-6">
              <p className="font-display text-2xl font-bold text-red-400">
                {recommendations[0].artifactEfficiencyScore}
              </p>
              <p className="text-xs text-zinc-500">Lowest AES (most urgent)</p>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => <ArtifactSkeletonCard key={i} />)}
        </div>
      )}

      {isError && <EmptyState errorCode={errorCode} tab="artifacts" />}

      {!isLoading && !isError && recommendations.length === 0 && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10">
            <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="font-display mb-3 text-2xl font-bold text-white">Artifacts Fully Optimised</h2>
          <p className="max-w-sm text-base leading-relaxed text-zinc-400">
            All profiled characters in your roster have artifact efficiency above 60. Excellent gear management!
          </p>
        </div>
      )}

      {!isLoading && !isError && recommendations.length > 0 && (
        <div className="space-y-8">
          <section aria-label="Top artifact improvement recommendations" className="animate-fade-in space-y-5">
            {recommendations.map((rec) => (
              <ArtifactCard key={rec.characterKey} rec={rec} />
            ))}
          </section>
          {skipped.length > 0 && <ArtifactSkippedAccordion skipped={skipped} />}
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------
// Planner Intelligence — skeleton
// -------------------------------------------------------

function PlannerSkeletonCard() {
  return (
    <div className="glass-panel flex animate-pulse flex-col gap-5 rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-lg bg-white/5" />
          <div className="h-3 w-1/3 rounded bg-white/5" />
        </div>
        <div className="h-10 w-20 shrink-0 rounded-xl bg-white/5" />
      </div>
      <div className="border-t border-white/5" />
      <div className="space-y-2.5">
        <div className="h-3.5 w-full rounded bg-white/5" />
        <div className="h-3.5 w-5/6 rounded bg-white/5" />
        <div className="h-3.5 w-4/6 rounded bg-white/5" />
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Planner Intelligence — route card
// -------------------------------------------------------

const GOAL_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; pill: string }> = {
  CHARACTER_TALENT:    { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text: 'text-violet-300',  pill: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  WEAPON_ASCENSION:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-300',   pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  CHARACTER_ASCENSION: { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    text: 'text-cyan-300',    pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
};

const GOAL_TYPE_LABELS: Record<string, string> = {
  CHARACTER_TALENT:    'Talent Book',
  WEAPON_ASCENSION:    'Weapon Ascension',
  CHARACTER_ASCENSION: 'Ascension Material',
};

function PlannerRouteCard({ item, rank }: { item: PlannerRouteItem; rank: number }) {
  const style = GOAL_TYPE_COLORS[item.goalType] ?? {
    bg: 'bg-white/5', border: 'border-white/20', text: 'text-zinc-400', pill: 'bg-white/5 text-zinc-400 border-white/20',
  };
  const goalLabel = GOAL_TYPE_LABELS[item.goalType] ?? item.goalType;
  const targetName = item.targetKey.replace(/([A-Z])/g, ' $1').trim();

  return (
    <div
      className={`glass-panel group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:border-white/10 hover:shadow-lg ${
        style.bg
      } ${style.border}`}
    >
      {/* Rank indicator — subtle left accent bar */}
      <div
        className={`absolute left-0 top-4 h-10 w-1 rounded-r-full transition-all duration-300 group-hover:h-16 ${style.text.replace('text-', 'bg-')}`}
      />

      {/* Card header */}
      <div className="flex items-start justify-between gap-4 pl-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {/* Rank badge */}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white ${
                rank === 1
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                  : rank === 2
                    ? 'bg-gradient-to-br from-zinc-400 to-zinc-300'
                    : rank === 3
                      ? 'bg-gradient-to-br from-amber-700 to-amber-600'
                      : 'bg-accent-500/30 text-accent-300'
              }`}
            >
              #{rank}
            </div>
            <h3 className="truncate font-display text-lg font-bold text-white">{item.domainName}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.pill}`}>
              {goalLabel}
            </span>
            <span className="text-sm text-zinc-400">for <span className="font-semibold text-zinc-200">{targetName}</span></span>
          </div>
        </div>

        {/* Resin cost badge */}
        <div className="shrink-0 text-right">
          <div className="flex flex-col items-end gap-0.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            <p className="font-display text-xl font-bold text-white">{item.resinCost}</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Resin</p>
            <p className="text-xs text-zinc-400">{item.runs} run{item.runs !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Explanation bullets */}
      <ul className="space-y-2 pl-4">
        {item.explanations.map((explanation, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.text.replace('text-', 'bg-')}`} />
            {explanation}
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------------------------------------------
// Tab: Resin Planner panel
// -------------------------------------------------------

function PlannerTab() {
  const { data, isLoading, isError, error } = usePlannerIntelligence();
  const errorCode = isError && error instanceof ApiError ? error.code : null;
  const route = (data as PlannerIntelligenceResponse | undefined)?.route ?? [];

  // Resin bar: clamp to 0–200
  const resinPct = data ? Math.min((data.currentResin / 200) * 100, 100) : 0;
  const resinColorClass =
    resinPct >= 90
      ? 'from-red-500 to-orange-400'
      : resinPct >= 60
        ? 'from-amber-500 to-yellow-400'
        : 'from-accent-500 to-indigo-400';

  return (
    <>
      {/* Stat strip */}
      {!isLoading && !isError && data && (
        <div className="animate-fade-in rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          {/* Resin bar */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Resin orb icon */}
                <svg className="h-4 w-4 text-accent-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 2a8 8 0 110 16A8 8 0 0112 4zm0 2a6 6 0 100 12A6 6 0 0112 6zm0 2a4 4 0 110 8 4 4 0 010-8z" />
                </svg>
                <span className="text-sm font-semibold text-zinc-300">Original Resin</span>
              </div>
              <span className="font-display text-sm font-bold text-white">
                {data.currentResin}<span className="text-zinc-500">/200</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${resinColorClass}`}
                style={{ width: `${resinPct}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6">
            <div>
              <p className="font-display text-2xl font-bold text-white">{data.timeUntilCapped}</p>
              <p className="text-xs text-zinc-500">Until capped</p>
            </div>
            <div className="border-l border-white/5 pl-6">
              <p className="font-display text-2xl font-bold text-white">{route.length}</p>
              <p className="text-xs text-zinc-500">Domains to farm</p>
            </div>
            {data.unallocatedResin > 0 && (
              <div className="border-l border-white/5 pl-6">
                <p className="font-display text-2xl font-bold text-amber-400">{data.unallocatedResin}</p>
                <p className="text-xs text-zinc-500">Unallocated resin</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => <PlannerSkeletonCard key={i} />)}
        </div>
      )}

      {/* Error state */}
      {isError && <EmptyState errorCode={errorCode} tab="planner" />}

      {/* Empty — all goals cleared for today */}
      {!isLoading && !isError && route.length === 0 && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10">
            <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="font-display mb-3 text-2xl font-bold text-white">Nothing Left to Farm Today</h2>
          <p className="max-w-sm text-base leading-relaxed text-zinc-400">
            All priority domains have been allocated. Either you've run them already, or today's resin can't cover any more runs. Check back after reset!
          </p>
        </div>
      )}

      {/* Route cards */}
      {!isLoading && !isError && route.length > 0 && (
        <section aria-label="Daily farming route recommendations" className="animate-fade-in space-y-5">
          {route.map((item, i) => (
            <PlannerRouteCard key={item.goalId} item={item} rank={i + 1} />
          ))}
        </section>
      )}
    </>
  );
}

// -------------------------------------------------------
// Pull Intelligence — hook
// -------------------------------------------------------

function usePullIntelligence() {
  return useQuery({
    queryKey: ['intelligence', 'pulls'],
    queryFn: fetchPullIntelligence,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 422)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// -------------------------------------------------------
// Pull Intelligence — skeleton
// -------------------------------------------------------

function PullSkeletonCard() {
  return (
    <div className="glass-panel flex animate-pulse flex-col gap-5 rounded-2xl border border-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded-lg bg-white/5" />
          <div className="h-3.5 w-1/3 rounded bg-white/5" />
        </div>
        <div className="h-10 w-28 shrink-0 rounded-xl bg-white/5" />
      </div>
      <div className="border-t border-white/5" />
      <div className="space-y-2.5">
        <div className="h-3.5 w-full rounded bg-white/5" />
        <div className="h-3.5 w-5/6 rounded bg-white/5" />
        <div className="h-3.5 w-4/6 rounded bg-white/5" />
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Pull Intelligence — recommendation card
// -------------------------------------------------------

const PULL_LABEL_CONFIG: Record<
  PullRecommendationLabel,
  { bg: string; border: string; text: string; badge: string; label: string }
> = {
  MUST_PULL: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    badge: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-zinc-900 shadow-[0_0_18px_rgba(251,191,36,0.45)]',
    label: 'MUST PULL',
  },
  GOOD_VALUE: {
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/30',
    text: 'text-accent-400',
    badge: 'bg-accent-500/20 text-accent-300 border border-accent-500/40',
    label: 'GOOD VALUE',
  },
  SKIP: {
    bg: 'bg-white/[0.02]',
    border: 'border-white/5',
    text: 'text-zinc-500',
    badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
    label: 'SKIP',
  },
};

function PullRecommendationCard({ rec }: { rec: PullRecommendation }) {
  const cfg = PULL_LABEL_CONFIG[rec.recommendation];
  const fiveStarName = formatName(rec.fiveStarKey);

  // Score arc: 0-100 mapped to stroke-dashoffset on a circle
  const CIRCUMFERENCE = 2 * Math.PI * 20; // r=20
  const filled = Math.min(rec.pullValueScore, 100);
  const offset = CIRCUMFERENCE * (1 - filled / 100);

  return (
    <div
      className={`glass-panel group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:border-white/10 hover:shadow-lg ${
        cfg.bg
      } ${cfg.border}`}
    >
      {/* Top accent bar */}
      <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r opacity-60 ${
        rec.recommendation === 'MUST_PULL'
          ? 'from-amber-400 to-yellow-300'
          : rec.recommendation === 'GOOD_VALUE'
            ? 'from-accent-500 to-indigo-400'
            : 'from-zinc-700 to-zinc-600'
      }`} />

      {/* Card header */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div className="min-w-0 flex-1">
          {/* Recommendation badge */}
          <div className="mb-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wider ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <h3 className="truncate font-display text-xl font-bold text-white">{rec.bannerName}</h3>
          <p className={`mt-0.5 text-sm font-semibold ${cfg.text}`}>{fiveStarName}</p>
        </div>

        {/* Score gauge */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="relative">
            <svg width="52" height="52" viewBox="0 0 48 48" className="-rotate-90">
              {/* Track */}
              <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" className="stroke-white/10" />
              {/* Fill */}
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                className={`transition-all duration-700 ${
                  rec.recommendation === 'MUST_PULL'
                    ? 'stroke-amber-400'
                    : rec.recommendation === 'GOOD_VALUE'
                      ? 'stroke-accent-400'
                      : 'stroke-zinc-600'
                }`}
              />
            </svg>
            {/* Score number in center */}
            <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-sm font-bold ${
              rec.recommendation === 'MUST_PULL' ? 'text-amber-300' : rec.recommendation === 'GOOD_VALUE' ? 'text-accent-300' : 'text-zinc-500'
            }`}>
              {rec.pullValueScore}
            </span>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Score</p>
        </div>
      </div>

      {/* 4-star rate-ups */}
      {rec.fourStarKeys.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-600">4★ Rate-ups:</span>
          {rec.fourStarKeys.map((key) => (
            <span
              key={key}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
            >
              {formatName(key)}
            </span>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Explanation bullets */}
      <ul className="space-y-2">
        {rec.explanations.map((explanation, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
              rec.recommendation === 'MUST_PULL'
                ? 'bg-amber-400'
                : rec.recommendation === 'GOOD_VALUE'
                  ? 'bg-accent-400'
                  : 'bg-zinc-600'
            }`} />
            {explanation}
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------------------------------------------
// Tab: Pull Value panel
// -------------------------------------------------------

function PullTab() {
  const { data, isLoading, isError, error } = usePullIntelligence();
  const errorCode = isError && error instanceof ApiError ? error.code : null;
  const recommendations = (data as PullIntelligenceResponse | undefined)?.recommendations ?? [];

  // Stat strip counts
  const mustPullCount = recommendations.filter((r) => r.recommendation === 'MUST_PULL').length;
  const goodValueCount = recommendations.filter((r) => r.recommendation === 'GOOD_VALUE').length;

  return (
    <>
      {/* Stat strip */}
      {!isLoading && !isError && data && recommendations.length > 0 && (
        <div className="animate-fade-in flex gap-6 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4">
          <div>
            <p className="font-display text-2xl font-bold text-white">{recommendations.length}</p>
            <p className="text-xs text-zinc-500">Active banners</p>
          </div>
          <div className="border-l border-white/5 pl-6">
            <p className="font-display text-2xl font-bold text-amber-400">{mustPullCount}</p>
            <p className="text-xs text-zinc-500">Must Pull</p>
          </div>
          {goodValueCount > 0 && (
            <div className="border-l border-white/5 pl-6">
              <p className="font-display text-2xl font-bold text-accent-400">{goodValueCount}</p>
              <p className="text-xs text-zinc-500">Good Value</p>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => <PullSkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {isError && <EmptyState errorCode={errorCode} tab="pulls" />}

      {/* Empty — no active banners */}
      {!isLoading && !isError && recommendations.length === 0 && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-accent-500/20 bg-accent-500/10">
            <svg className="h-10 w-10 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="font-display mb-3 text-2xl font-bold text-white">No Active Banners</h2>
          <p className="max-w-sm text-base leading-relaxed text-zinc-400">
            There are no active banners to evaluate right now. Check back when a new patch launches!
          </p>
        </div>
      )}

      {/* Banner cards */}
      {!isLoading && !isError && recommendations.length > 0 && (
        <section aria-label="Banner pull value recommendations" className="animate-fade-in space-y-5">
          {recommendations.map((rec) => (
            <PullRecommendationCard key={rec.bannerId} rec={rec} />
          ))}
        </section>
      )}
    </>
  );
}

// -------------------------------------------------------
// Knowledge Intelligence - hook & Tab
// -------------------------------------------------------

function useKnowledgeIntelligence() {
  return useQuery({
    queryKey: ['intelligence', 'knowledge'],
    queryFn: fetchKnowledgeIntelligence,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

function KnowledgeInsightIcon({ iconKey }: { iconKey: KnowledgeInsightKey }) {
  switch (iconKey) {
    case 'DIVERSE_ROSTER':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'ELEMENTAL_SPECIALIST':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'ARTIFACT_HOARDER':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'MAX_CONSTELLATION':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'TALENT_NEGLECTOR':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function KnowledgeTab() {
  const { data, isLoading, isError, error } = useKnowledgeIntelligence();
  const errorCode = isError && error instanceof ApiError ? error.code : null;
  const insights = (data as KnowledgeIntelligenceResponse | undefined)?.insights ?? [];

  return (
    <>
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <div className="h-6 w-48 animate-pulse rounded bg-white/5" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && <EmptyState errorCode={errorCode} tab="knowledge" />}

      {!isLoading && !isError && insights.length === 0 && (
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display mb-3 text-2xl font-bold text-white">No Insights Available</h2>
          <p className="max-w-sm text-base leading-relaxed text-zinc-400">
            We couldn't generate insights for your account yet. Make sure you have imported data!
          </p>
        </div>
      )}

      {!isLoading && !isError && insights.length > 0 && (
        <div className="animate-fade-in grid gap-6 md:grid-cols-2">
          {insights.map((insight) => (
            <div key={insight.key} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.03]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 transition-transform group-hover:scale-110">
                <KnowledgeInsightIcon iconKey={insight.iconKey} />
              </div>
              <h3 className="mb-2 font-display text-xl font-bold text-white transition-colors group-hover:text-blue-400">
                {insight.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {insight.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------
// IntelligencePage — main export
// -------------------------------------------------------

export default function IntelligencePage() {
  const logout = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<Tab>('characters');

  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Background ambient glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[700px] rounded-full bg-violet-600/5 mix-blend-screen blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-[400px] w-[600px] rounded-full bg-accent-500/5 mix-blend-screen blur-[120px]" />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        {/* Page heading */}
        <header className="animate-fade-in mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-400">
            Phase 4 · Intelligence Core
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Intelligence Engine
          </h1>
          <p className="mt-2 max-w-xl text-base text-zinc-400">
            Your personal analyst — surfaces the highest-ROI character investments and the best team compositions your roster can assemble right now.
          </p>
        </header>

        {/* Tab bar */}
        <div
          className="animate-fade-in mb-8 flex gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-1"
          role="tablist"
          aria-label="Intelligence views"
          id="intelligence-tablist"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`intelligence-tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`intelligence-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        <div
          id={`intelligence-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`intelligence-tab-${activeTab}`}
          className="space-y-6"
        >
          {activeTab === 'characters' && <CharacterTab />}
          {activeTab === 'teams' && <TeamTab />}
          {activeTab === 'artifacts' && <ArtifactTab />}
          {activeTab === 'planner' && <PlannerTab />}
          {activeTab === 'pulls' && <PullTab />}
          {activeTab === 'knowledge' && <KnowledgeTab />}
        </div>
      </main>
    </div>
  );
}
