import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  ExternalLink,
  X,
} from 'lucide-react';
import type {
  FreshnessPolicyKind,
  RecommendationMode,
  RecommendationReliability,
  TemporalState,
  VerificationMethod,
  VerificationState,
} from '../types/genshin';
import {
  formatReliabilityPresentation,
  type FormattedDependencyRow,
  type ProvenanceMatchStatus,
} from '../services/reliability-presentation';

export interface ReliabilityDetailsPanelProps {
  id: string;
  reliability?: RecommendationReliability | null;
  isOpen: boolean;
  onClose?: () => void;
  contextLabel?: string;
  className?: string;
}

const MODE_LABELS: Record<RecommendationMode, string> = {
  current: 'Current (Live)',
  planning_preview: 'Planning Preview',
  archive_simulation: 'Archive Simulation',
  sandbox_simulation: 'Sandbox Simulation',
};

const VERIFICATION_LABELS: Record<VerificationState, string> = {
  verified: 'Verified',
  provisional: 'Provisional',
  stale: 'Stale',
  unregistered: 'Unregistered',
};

const TEMPORAL_LABELS: Record<TemporalState, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  expired: 'Expired',
  not_applicable: 'Not Applicable',
};

const POLICY_LABELS: Record<FreshnessPolicyKind, string> = {
  schedule_window: 'Schedule Window',
  version_bound: 'Version Bound',
  patch_cadence: 'Patch Cadence',
  sandbox: 'Sandbox',
};

const METHOD_LABELS: Record<VerificationMethod, string> = {
  official_notice: 'Official Notice',
  in_game_verification: 'In-Game Verified',
  theorycraft_consensus: 'Theorycraft Consensus',
};

function sanitizeHttpsUrl(rawUrl?: string): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

function getProvenanceMatchMeta(match: ProvenanceMatchStatus): {
  label: string;
  badgeClass: string;
  notice?: string;
  icon: React.ReactNode;
} {
  switch (match) {
    case 'matched':
      return {
        label: 'Provenance Matched',
        badgeClass: 'bg-emerald-950/85 text-emerald-100 border-emerald-500/55',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" aria-hidden="true" />,
      };
    case 'unregistered':
      return {
        label: 'Unregistered Provenance',
        badgeClass: 'bg-rose-950/90 text-rose-100 border-rose-500/60',
        notice:
          'No registered provenance record exists for this dataset. Verification metadata is withheld.',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-200 shrink-0" aria-hidden="true" />,
      };
    case 'unmatched':
      return {
        label: 'Unmatched Provenance',
        badgeClass: 'bg-amber-950/85 text-amber-100 border-amber-500/60',
        notice:
          'Dependency metadata did not match an attested registry record (version, verification date, attestation, or status mismatch). Auxiliary evidence is withheld.',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-200 shrink-0" aria-hidden="true" />,
      };
    case 'ambiguous':
      return {
        label: 'Ambiguous Provenance',
        badgeClass: 'bg-amber-950/85 text-amber-100 border-amber-500/60',
        notice:
          'Duplicate dataset entries were detected in this envelope, preventing unambiguous provenance matching. Auxiliary evidence is withheld.',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-200 shrink-0" aria-hidden="true" />,
      };
  }
}

function getVerificationPillClass(state: VerificationState): string {
  switch (state) {
    case 'verified':
      return 'bg-emerald-950/80 text-emerald-100 border-emerald-500/50';
    case 'provisional':
      return 'bg-sky-950/80 text-sky-100 border-sky-500/50';
    case 'stale':
      return 'bg-amber-950/80 text-amber-100 border-amber-500/50';
    case 'unregistered':
      return 'bg-rose-950/85 text-rose-100 border-rose-500/55';
  }
}

const DependencyCard: React.FC<{ row: FormattedDependencyRow }> = ({ row }) => {
  const matchMeta = getProvenanceMatchMeta(row.provenanceMatch);
  const isMatched = row.provenanceMatch === 'matched';
  const safeSourceUrl = isMatched ? sanitizeHttpsUrl(row.sourceUrl) : undefined;

  return (
    <div
      data-provenance-match={row.provenanceMatch}
      className="min-w-0 p-3 rounded-lg bg-[#141827] border border-[#2b3353] space-y-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-mono font-semibold text-zinc-100 break-all">
            {row.datasetId || '(empty datasetId)'}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#1d2236] border border-[#323a5c] text-zinc-200">
              {row.roleLabel}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border ${getVerificationPillClass(row.verification)}`}
            >
              {VERIFICATION_LABELS[row.verification]}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${matchMeta.badgeClass}`}
        >
          {matchMeta.icon}
          <span>{matchMeta.label}</span>
        </span>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-200">
        <div className="min-w-0">
          <dt className="inline text-zinc-300 font-medium">Policy: </dt>
          <dd className="inline break-words">{POLICY_LABELS[row.policy]}</dd>
        </div>
        <div className="min-w-0">
          <dt className="inline text-zinc-300 font-medium">Risk Tier: </dt>
          <dd className="inline capitalize break-words">{row.riskTier}</dd>
        </div>
        {row.version !== undefined && (
          <div className="min-w-0">
            <dt className="inline text-zinc-300 font-medium">Version: </dt>
            <dd className="inline font-mono break-words">{row.version}</dd>
          </div>
        )}
        {row.verifiedAt !== undefined && (
          <div className="min-w-0">
            <dt className="inline text-zinc-300 font-medium">Verified (UTC): </dt>
            <dd className="inline font-mono break-words">{row.verifiedAt}</dd>
          </div>
        )}
        {row.reason !== undefined && (
          <div className="min-w-0 sm:col-span-2">
            <dt className="inline text-zinc-300 font-medium">Reason: </dt>
            <dd className="inline font-mono break-words">{row.reason}</dd>
          </div>
        )}
      </dl>

      {isMatched ? (
        <div className="pt-2 border-t border-[#242b47] space-y-1.5 text-[11px] text-zinc-200 min-w-0">
          {row.verificationMethod !== undefined && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-[#1b2136] border border-[#30385a] text-zinc-100 font-semibold">
                {METHOD_LABELS[row.verificationMethod]}
              </span>
            </div>
          )}
          {row.evidence !== undefined && (
            <p className="leading-relaxed text-zinc-200 break-words">{row.evidence}</p>
          )}
          {row.verifiedFields !== undefined && row.verifiedFields.length > 0 && (
            <p className="text-zinc-300 break-words">
              <span className="font-semibold text-zinc-100">Verified fields: </span>
              {row.verifiedFields.join(', ')}
            </p>
          )}
          {safeSourceUrl && (
            <a
              href={safeSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#f3cf58] hover:underline font-medium break-all"
            >
              <span>Reference Source</span>
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      ) : (
        matchMeta.notice && (
          <p className="pt-2 border-t border-[#242b47] text-[11px] leading-relaxed text-zinc-200 break-words">
            {matchMeta.notice}
          </p>
        )
      )}
    </div>
  );
};

export const ReliabilityDetailsPanel: React.FC<ReliabilityDetailsPanelProps> = ({
  id,
  reliability,
  isOpen,
  onClose,
  contextLabel,
  className = '',
}) => {
  if (!reliability) {
    return null;
  }

  const model = formatReliabilityPresentation(reliability);
  const allRows = [...model.requiredDependencies, ...model.optionalDependencies];
  const unmatchedRows = allRows.filter((row) => row.provenanceMatch === 'unmatched');
  const ambiguousRows = allRows.filter((row) => row.provenanceMatch === 'ambiguous');

  return (
    <div
      id={id}
      hidden={!isOpen}
      aria-hidden={isOpen ? undefined : true}
      className={
        isOpen
          ? `w-full max-w-full min-w-0 p-4 rounded-xl bg-[#0f121d] border border-[#2b3353] text-zinc-100 space-y-4 ${className}`
          : 'hidden'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#232944]">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-bold text-zinc-100 break-words">
            {contextLabel ? `${contextLabel} — Reliability Details` : 'Reliability Details'}
          </h3>
          <p className="text-xs text-zinc-200 break-words">
            {model.contextTag}
            {model.evaluatedAt !== undefined ? ` · Evaluated UTC: ${model.evaluatedAt}` : ''}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#181d30] text-zinc-100 border border-[#323a5c] hover:border-[#f3cf58] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Close</span>
          </button>
        )}
      </div>

      {/* Five Reliability Axes */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="min-w-0 p-2.5 rounded-lg bg-[#141827] border border-[#262d49]">
          <dt className="text-[11px] font-medium text-zinc-300">Status</dt>
          <dd className="text-xs font-semibold text-zinc-100 break-words mt-0.5">
            {model.badgeLabel}
          </dd>
        </div>
        <div className="min-w-0 p-2.5 rounded-lg bg-[#141827] border border-[#262d49]">
          <dt className="text-[11px] font-medium text-zinc-300">Mode</dt>
          <dd className="text-xs font-semibold text-zinc-100 break-words mt-0.5">
            {MODE_LABELS[model.mode]}
          </dd>
        </div>
        <div className="min-w-0 p-2.5 rounded-lg bg-[#141827] border border-[#262d49]">
          <dt className="text-[11px] font-medium text-zinc-300">Verification</dt>
          <dd className="text-xs font-semibold text-zinc-100 break-words mt-0.5">
            {VERIFICATION_LABELS[model.verification]}
          </dd>
        </div>
        <div className="min-w-0 p-2.5 rounded-lg bg-[#141827] border border-[#262d49]">
          <dt className="text-[11px] font-medium text-zinc-300">Temporal State</dt>
          <dd className="text-xs font-semibold text-zinc-100 break-words mt-0.5">
            {TEMPORAL_LABELS[model.temporalState]}
          </dd>
        </div>
        <div className="min-w-0 p-2.5 rounded-lg bg-[#141827] border border-[#262d49]">
          <dt className="text-[11px] font-medium text-zinc-300">Actionability</dt>
          <dd className="text-xs font-semibold text-zinc-100 break-words mt-0.5">
            {model.actionabilityLabel}
          </dd>
        </div>
      </dl>

      {/* Warnings */}
      {model.warnings.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-500/45 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-100">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-200 shrink-0" aria-hidden="true" />
            <span>Warnings ({model.warnings.length})</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-xs text-amber-100 break-words">
            {model.warnings.map((warning, index) => (
              <li key={`${index}-${warning}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Unmatched & Ambiguous Provenance Notices */}
      {unmatchedRows.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-950/70 border border-amber-500/55 text-xs text-amber-100 flex items-start gap-2">
          <AlertTriangle
            className="w-4 h-4 text-amber-200 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="min-w-0 break-words leading-relaxed">
            <span className="font-semibold">Unmatched Provenance Notice: </span>
            Auxiliary registry metadata was withheld for{' '}
            {unmatchedRows.map((row) => row.datasetId || '(empty datasetId)').join(', ')} because
            strict provenance matching did not pass.
          </p>
        </div>
      )}

      {ambiguousRows.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-950/70 border border-amber-500/55 text-xs text-amber-100 flex items-start gap-2">
          <AlertTriangle
            className="w-4 h-4 text-amber-200 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="min-w-0 break-words leading-relaxed">
            <span className="font-semibold">Ambiguous Provenance Notice: </span>
            Duplicate dependency entries were found for{' '}
            {Array.from(new Set(ambiguousRows.map((row) => row.datasetId))).join(', ')}. Auxiliary
            provenance evidence is withheld until the ambiguity is resolved.
          </p>
        </div>
      )}

      {/* Dependencies */}
      {!model.dependencyEvidenceAvailable ? (
        <div className="p-3 rounded-lg bg-[#141827] border border-[#262d49] text-xs text-zinc-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-200 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="min-w-0 break-words leading-relaxed">
            No per-dependency breakdown was supplied in this reliability envelope.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {model.requiredDependencies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-200">
                Required Dependencies ({model.requiredDependencies.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {model.requiredDependencies.map((row, index) => (
                  <DependencyCard
                    key={`req-${row.datasetId}-${index}`}
                    row={row}
                  />
                ))}
              </div>
            </div>
          )}

          {model.optionalDependencies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-200">
                Optional (Non-Blocking) Dependencies ({model.optionalDependencies.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {model.optionalDependencies.map((row, index) => (
                  <DependencyCard
                    key={`opt-${row.datasetId}-${index}`}
                    row={row}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
