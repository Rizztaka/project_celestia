import React from 'react';
import type { SlotUpgradeProbability, StatKey } from '../types/genshin';
import {
  MAIN_STAT_MAX_VALUES,
  MAX_SUBSTAT_VALUES,
} from '../data/artifact-weights';
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
}

export const ArtifactSlotCard: React.FC<ArtifactSlotCardProps> = ({
  analysis,
  isWeakest,
  onEdit,
}) => {
  const { slotKey, slotName, currentPiece, currentRollValue, currentUsefulRolls, status, expectedDaysForUpgrade, expectedRunsForUpgrade } = analysis;

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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 animate-pulse">
          <Sparkles className="w-3 h-3" />
          Weakest Link (High ROI)
        </span>
      );
    }
    switch (status) {
      case 'Near Ceiling':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-500/40">
            <CheckCircle className="w-3 h-3" />
            Near Ceiling
          </span>
        );
      case 'Diminishing Returns':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3" />
            Soft Stop
          </span>
        );
      case 'High ROI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
            <Sparkles className="w-3 h-3" />
            High ROI
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 relative ${
        isWeakest
          ? 'bg-gradient-to-b from-[#181c2b] to-[#12141e] border-[#d4af37]/60 shadow-lg shadow-[#d4af37]/5'
          : 'bg-[#12141d] border-[#23273a] hover:border-[#2d344d]'
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
              <h4 className="text-xs font-bold text-zinc-100">{slotName}</h4>
              <p className="text-[10px] text-zinc-400 capitalize">
                {currentPiece?.setKey || 'Standard 5★ Artifact'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Main Stat Pill */}
        <div className="bg-[#181b28] px-3 py-1.5 rounded-xl border border-[#262c40] mb-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-medium">Main Stat</span>
          <span className="text-xs font-bold text-[#d4af37]">
            {getMainStatDisplay()}
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
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] bg-[#141722]/80 px-2.5 py-1 rounded-lg border border-[#1e2334]"
                >
                  <span className="text-zinc-300 font-mono">
                    {formatStatLabel(sub.key, sub.value)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {rv > 0 ? `${rv}% RV` : ''}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-[11px] text-zinc-500 italic py-2 text-center bg-[#151722] rounded-lg border border-[#1e2334]">
              Estimated substats based on build sliders
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: RV% and Upgrade Odds */}
      <div className="border-t border-[#1f2436] pt-3 mt-1 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Weighted RV:</span>
          <span className="font-bold text-zinc-100 font-mono">
            {currentRollValue}% <span className="text-[10px] text-zinc-400">({currentUsefulRolls} rolls)</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">50% Upgrade Odds:</span>
          <span className="font-semibold text-emerald-400 font-mono">
            ~{expectedRunsForUpgrade} runs <span className="text-zinc-500">({expectedDaysForUpgrade}d)</span>
          </span>
        </div>

        {onEdit && (
          <button
            onClick={onEdit}
            className="w-full mt-2 py-1.5 px-3 rounded-xl bg-[#1a1e2c] hover:bg-[#22283a] text-zinc-300 hover:text-white border border-[#2c3349] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3 h-3 text-[#d4af37]" />
            <span>Edit Substats</span>
          </button>
        )}
      </div>
    </div>
  );
};
