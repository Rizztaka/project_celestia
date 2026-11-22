import React from 'react';
import type {
  SlotUpgradeProbability,
  StatKey,
  UniversalSlotMetrics,
} from '../types/genshin';
import { InfoTooltip } from './InfoTooltip';
import {
  MAIN_STAT_MAX_VALUES,
  MAX_SUBSTAT_VALUES,
} from '../data/artifact-weights';
import {
  decomposeSubstatRolls,
  validateArtifactPiece,
} from '../engines/artifact-validator';
import {
  Flower,
  Feather,
  Clock,
  Trophy,
  Crown,
  Sparkles,
  Edit2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface ArtifactSlotCardProps {
  analysis: SlotUpgradeProbability;
  isWeakest: boolean;
  onEdit?: () => void;
  activeSets?: string[];
  universalMetrics?: UniversalSlotMetrics;
}

export const ArtifactSlotCard: React.FC<ArtifactSlotCardProps> = ({
  analysis,
  isWeakest,
  onEdit,
  activeSets,
  universalMetrics,
}) => {
  const {
    slotKey,
    slotName,
    currentPiece,
    currentRollValue,
    currentUsefulRolls,
    status,
    expectedDaysForUpgrade,
    expectedRunsForUpgrade,
  } = analysis;

  const validation = currentPiece ? validateArtifactPiece(currentPiece) : null;
  const isInvalid = Boolean(validation && !validation.isValid);
  const isOffPiece = Boolean(
    activeSets &&
      activeSets.length > 0 &&
      currentPiece?.setKey &&
      !activeSets.includes(currentPiece.setKey),
  );

  const renderSlotIcon = () => {
    switch (slotKey) {
      case 'flower':
        return <Flower className="w-4 h-4 text-emerald-400" />;
      case 'plume':
        return <Feather className="w-4 h-4 text-sky-400" />;
      case 'sands':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'goblet':
        return <Trophy className="w-4 h-4 text-purple-400" />;
      case 'circlet':
        return <Crown className="w-4 h-4 text-rose-400" />;
    }
  };

  const formatStatLabel = (key: string, value: number) => {
    const isPercent = key.endsWith('_');
    const displayKey = key
      .replace('critRate_', 'CR')
      .replace('critDMG_', 'CD')
      .replace('enerRech_', 'ER')
      .replace('eleMas', 'EM')
      .replace('heal_', 'Healing Bonus')
      .replace('pyro_dmg_', 'Pyro DMG')
      .replace('hydro_dmg_', 'Hydro DMG')
      .replace('dendro_dmg_', 'Dendro DMG')
      .replace('electro_dmg_', 'Electro DMG')
      .replace('anemo_dmg_', 'Anemo DMG')
      .replace('cryo_dmg_', 'Cryo DMG')
      .replace('geo_dmg_', 'Geo DMG')
      .replace('physical_dmg_', 'Physical DMG')
      .replace('atk_', 'ATK')
      .replace('hp_', 'HP')
      .replace('def_', 'DEF')
      .replace('atk', 'ATK')
      .replace('hp', 'HP')
      .replace('def', 'DEF');

    const formattedVal = value >= 1000 ? value.toLocaleString() : value;
    return `${displayKey} ${isPercent ? `+${formattedVal}%` : `+${formattedVal}`}`;
  };

  const getMainStatDisplay = () => {
    if (!currentPiece) {
      if (slotKey === 'flower') return 'HP +4,780';
      if (slotKey === 'plume') return 'ATK +311';
      return 'Target Main Stat';
    }
    const maxVal =
      MAIN_STAT_MAX_VALUES[slotKey]?.[currentPiece.mainStatKey] ??
      (currentPiece.mainStatKey.endsWith('_') ? 46.6 : 311);
    const val = currentPiece.level === 20 ? maxVal : Math.round(maxVal * 0.7);
    return formatStatLabel(currentPiece.mainStatKey, val);
  };

  const getStatusBadge = () => {
    if (isWeakest && status === 'High ROI') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f3cf58] border border-[#d4af37]/40 animate-pulse motion-reduce:animate-none">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          Weakest Link (High ROI)
        </span>
      );
    }
    switch (status) {
      case 'Near Ceiling':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/65 text-purple-200 border border-purple-400/45">
            <CheckCircle className="w-3 h-3" aria-hidden="true" />
            Near Ceiling
          </span>
        );
      case 'Diminishing Returns':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/65 text-amber-200 border border-amber-400/45">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            Soft Stop
          </span>
        );
      case 'High ROI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/65 text-emerald-200 border border-emerald-400/45">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            High ROI
          </span>
        );
    }
  };

  const completionPct = universalMetrics?.completionPct;

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col justify-between transition-colors relative ${
        isWeakest
          ? 'bg-gradient-to-b from-[#181c2b] to-[#12141e] border-[#d4af37]/60 shadow-lg shadow-[#d4af37]/5'
          : 'bg-[#121420] border-[#24293d] hover:border-[#38405e]'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#1a1e2c] border border-[#2b3147]">
              {renderSlotIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-bold text-zinc-100 font-serif">
                  {slotName}
                </h4>
                {(isOffPiece || universalMetrics?.isOffPieceCandidate) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40">
                    {isOffPiece ? 'Off-Piece' : 'Best Flex Slot'}
                  </span>
                )}
                {isInvalid && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-950/70 text-rose-200 border border-rose-400/45"
                    title={validation?.errors.join('; ')}
                  >
                    <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />
                    Invalid ({validation?.errors.length})
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-300 capitalize">
                {currentPiece?.setKey || 'Standard 5★ Artifact'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Main Stat Pill */}
        <div
          className={`px-3 py-1.5 rounded-xl border mb-3 flex items-center justify-between ${
            universalMetrics && !universalMetrics.hasValidMainStat
              ? 'bg-rose-950/40 border-rose-400/45'
              : 'bg-[#181b28] border-[#262c40]'
          }`}
        >
          <span className="text-[11px] text-zinc-300 font-medium">
            Main Stat
          </span>
          <span
            className={`text-xs font-bold ${
              universalMetrics && !universalMetrics.hasValidMainStat
                ? 'text-rose-200'
                : 'text-[#f3cf58]'
            }`}
          >
            {getMainStatDisplay()}
            {universalMetrics && !universalMetrics.hasValidMainStat
              ? ' (Off-Meta)'
              : ''}
          </span>
        </div>

        {/* Substats List */}
        <div className="space-y-1 mb-3">
          {currentPiece?.substats && currentPiece.substats.length > 0 ? (
            currentPiece.substats.map((sub, idx) => {
              const maxVal = MAX_SUBSTAT_VALUES[sub.key as StatKey] ?? 0;
              const rv =
                sub.rollValue ??
                (maxVal > 0 ? Math.round((sub.value / maxVal) * 100) : 0);
              const decomp = decomposeSubstatRolls(
                sub.key as StatKey,
                sub.value,
              );
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] bg-[#141722]/80 px-2.5 py-1 rounded-lg border border-[#1e2334]"
                >
                  <span className="text-zinc-200 font-mono">
                    {formatStatLabel(sub.key, sub.value)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {decomp.isValid && decomp.rolls > 0 && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono border border-zinc-700/60"
                        title={
                          decomp.tierBreakdown &&
                          decomp.tierBreakdown.length > 0
                            ? `Roll tiers: ${decomp.tierBreakdown.join(', ')}`
                            : undefined
                        }
                      >
                        {decomp.rolls} roll{decomp.rolls > 1 ? 's' : ''} (
                        {Math.round(decomp.averageEfficiency)}%)
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-300 font-mono">
                      {rv > 0 ? `${rv}% RV` : ''}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-[11px] text-zinc-300 italic py-2 text-center bg-[#151722] rounded-lg border border-[#1e2334]">
              Estimated substats based on build sliders
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Completion, RV%, Marginal ROI & Upgrade Odds */}
      <div className="border-t border-[#1f2436] pt-3 mt-1 space-y-2">
        {completionPct !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">Build Ceiling Progress</span>
              <span className="font-mono font-bold text-zinc-100">
                {Math.round(completionPct)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#1a1f33] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completionPct >= 88
                    ? 'bg-purple-400'
                    : completionPct >= 65
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-medium">Weighted RV:</span>
          <span className="font-bold text-zinc-100 font-mono">
            {currentRollValue}%{' '}
            <span className="text-[10px] text-zinc-300">
              ({currentUsefulRolls} rolls)
            </span>
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {universalMetrics && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">Expected Gain / 1k Resin:</span>
              <span className="font-semibold text-[#f3cf58] font-mono">
                +{universalMetrics.expectedGainPctPer1kResin.toFixed(2)}%
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300 flex items-center gap-1">
              <span>50% Milestone:</span>
              <InfoTooltip
                title="Median Runs (50% Milestone)"
                content="Exact discrete PMF runs needed to reach >= 50% cumulative probability of beating this piece."
              />
            </span>
            <span className="font-semibold text-emerald-300 font-mono">
              ~{analysis.medianRunsForUpgrade ?? expectedRunsForUpgrade} runs{' '}
              <span className="text-zinc-300">({expectedDaysForUpgrade}d)</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300 flex items-center gap-1">
              <span>Average Expected (1/p):</span>
              <InfoTooltip
                title="Mean Expected Runs (1/p)"
                content="Mathematical expectation E[X] = 1/p. Because geometric trials are right-skewed, mean runs exceed the 50% median."
              />
            </span>
            <span className="font-semibold text-sky-300 font-mono">
              ~
              {analysis.meanExpectedRuns ??
                Math.ceil(1 / Math.max(0.00001, analysis.upgradeProbabilityPerRun))}{' '}
              runs
            </span>
          </div>

          {universalMetrics &&
            (universalMetrics.elixirExpectedURVGain >= 1.4 ||
              universalMetrics.reshapeExpectedURVGain >= 0.85) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {universalMetrics.elixirExpectedURVGain >= 1.4 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/60 text-sky-200 border border-sky-400/35 font-mono">
                    Elixir ({universalMetrics.elixirCost}): +
                    {universalMetrics.elixirExpectedURVGain} rolls EV
                  </span>
                )}
                {universalMetrics.reshapeExpectedURVGain >= 0.85 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-200 border border-purple-400/35 font-mono">
                    Dust ({universalMetrics.dustCost}): +
                    {universalMetrics.reshapeExpectedURVGain} rolls EV
                  </span>
                )}
              </div>
            )}
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${slotName} piece and substats`}
            className="w-full min-h-[38px] mt-2 py-1.5 px-3 rounded-xl bg-[#161a29] hover:bg-[#202538] text-zinc-200 hover:text-white border border-[#2c334d] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3 h-3 text-[#d4af37]" aria-hidden="true" />
            <span>Edit Substats</span>
          </button>
        )}
      </div>
    </div>
  );
};
