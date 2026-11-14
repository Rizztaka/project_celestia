import React, { useState, useMemo } from 'react';
import { CHARACTERS } from '../data/characters';
import type { Character, ArtifactSlot, ArtifactPiece, StatKey } from '../types/genshin';
import {
  PieChart,
  Clock,
  Info,
  Sparkles,
  Sliders,
  Award,
  Layers,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { CharacterPortrait } from './CharacterPortrait';
import { CharacterDetailModal } from './CharacterDetailModal';
import { ArtifactDiminishingReturnsCurve } from './ArtifactDiminishingReturnsCurve';
import { ArtifactSlotCard } from './ArtifactSlotCard';
import {
  analyzeArtifactBuild,
  estimateBuildFromSliders,
  extractEquippedArtifactsForCharacter,
  SLOT_NAMES,
} from '../engines/artifact-probability';
import { getSavedArtifacts } from '../services/storage';
import { getCharacterStatWeights } from '../data/artifact-weights';

const ALL_SLOTS: ArtifactSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

export const ArtifactStopView: React.FC = () => {
  const [selectedCharId, setSelectedCharId] = useState<string>('Nefer');
  const [viewMode, setViewMode] = useState<'equipped' | 'builder' | 'slider'>('equipped');

  // Slider State (Quick Estimator)
  const [critRate, setCritRate] = useState<number>(65);
  const [critDmg, setCritDmg] = useState<number>(140);
  const [secondaryStat, setSecondaryStat] = useState<number>(180); // EM or HP%
  const [isReactionScaler, setIsReactionScaler] = useState<boolean>(true);

  // Manual 5-slot overrides state
  const [customSlots, setCustomSlots] = useState<Partial<Record<ArtifactSlot, ArtifactPiece>>>({});
  const [editingSlot, setEditingSlot] = useState<ArtifactSlot | null>(null);

  // Character detail modal state
  const [modalCharacter, setModalCharacter] = useState<Character | null>(null);

  const char = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];
  const charConfig = getCharacterStatWeights(char.id);

  // Retrieve raw artifacts stored from GOOD JSON / Enka
  const savedRawArtifacts = useMemo(() => getSavedArtifacts(), []);

  // Extract equipped pieces for selected character
  const equippedFromRoster = useMemo(() => {
    return extractEquippedArtifactsForCharacter(savedRawArtifacts, char.id);
  }, [savedRawArtifacts, char.id]);

  const equippedCount = Object.keys(equippedFromRoster).length;

  // Active slots depending on view mode
  const activeSlots = useMemo(() => {
    if (viewMode === 'equipped' && equippedCount > 0) {
      return { ...equippedFromRoster, ...customSlots };
    }
    if (viewMode === 'builder') {
      return customSlots;
    }
    return null; // slider mode will use estimateBuildFromSliders
  }, [viewMode, equippedCount, equippedFromRoster, customSlots]);

  // Compute analysis result
  const analysis = useMemo(() => {
    if (viewMode === 'slider' || (!activeSlots && viewMode !== 'builder')) {
      return estimateBuildFromSliders(
        char.name,
        critRate,
        critDmg,
        secondaryStat,
        isReactionScaler,
      );
    }
    return analyzeArtifactBuild(char.id, activeSlots || {});
  }, [viewMode, char.id, char.name, activeSlots, critRate, critDmg, secondaryStat, isReactionScaler]);

  const statusColors = {
    'High ROI': 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
    'Diminishing Returns': 'bg-amber-950/60 text-amber-400 border-amber-500/40',
    'Ready / Stop Farming': 'bg-purple-950/60 text-purple-300 border-purple-500/40',
  };

  // Handler to update a single piece in the editor modal
  const handleSavePiece = (piece: ArtifactPiece) => {
    setCustomSlots((prev) => ({
      ...prev,
      [piece.slotKey]: piece,
    }));
    setEditingSlot(null);
  };

  const handleResetCustomSlots = () => {
    setCustomSlots({});
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg">
        <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
          <PieChart className="w-4 h-4" />
          <span>Resin ROI & Roll Value Diminishing Returns Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 font-serif">
          When Is Artifact Farming No Longer Worth Your Resin?
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
          Evaluates your build using true <strong>Roll Value (RV)</strong> tailored to each character's stat scalings.
          Calculates the exact binomial probability of finding an upgrade across each slot and charts the diminishing returns curve.
        </p>
      </div>

      {/* Top Controls & Navigation Bar */}
      <div className="bg-[#12141d] border border-[#23273a] p-4 sm:p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Character Selector with Portrait */}
        <div className="flex items-center gap-3">
          <CharacterPortrait
            src={char.icon}
            name={char.name}
            element={char.element}
            rarity={char.rarity}
            size="md"
          />
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Active Character:
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedCharId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedCharId(newId);
                  setCustomSlots({});
                  if (newId === 'Nefer' || newId === 'Nilou' || newId === 'KukiShinobu') {
                    setIsReactionScaler(true);
                  } else {
                    setIsReactionScaler(false);
                  }
                }}
                className="bg-[#181b28] text-zinc-100 font-bold text-sm px-3 py-1.5 rounded-xl border border-[#282e44] focus:outline-none cursor-pointer"
              >
                {CHARACTERS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#181b28] text-zinc-200">
                    {c.name} ({c.element} · {c.roles[0]})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setModalCharacter(char)}
                className="text-[#d4af37] hover:underline flex items-center gap-1 text-xs cursor-pointer font-semibold ml-1"
              >
                <Info className="w-3 h-3" />
                <span>Kit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-[#0d0e14] p-1 rounded-xl border border-[#202538] text-xs font-semibold">
          <button
            onClick={() => setViewMode('equipped')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'equipped'
                ? 'bg-[#1e2335] text-[#d4af37] shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Equipped Build</span>
            {equippedCount > 0 && (
              <span className="bg-[#d4af37]/20 text-[#d4af37] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {equippedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode('builder')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'builder'
                ? 'bg-[#1e2335] text-[#d4af37] shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>5-Slot Editor</span>
          </button>

          <button
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'slider'
                ? 'bg-[#1e2335] text-[#d4af37] shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Quick Estimator</span>
          </button>
        </div>
      </div>

      {/* Main Results Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Summary Metrics & Weakest Link Banner */}
        <div className="lg:col-span-5 space-y-5">
          {/* Verdict Card */}
          <div className="bg-[#12141d] border border-[#23273a] p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#202538] pb-3">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Analysis Outcome
                </span>
                <h3 className="text-lg font-bold text-zinc-100 font-serif">
                  {char.name} Recommendation
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  statusColors[analysis.overallStatus]
                }`}
              >
                {analysis.overallStatus}
              </span>
            </div>

            {/* Metrics Triad */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#181b28] p-3 rounded-xl border border-[#282e44] text-center">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                  Total Roll Value
                </span>
                <span className="text-xl font-extrabold text-[#d4af37] mt-0.5 block font-mono">
                  {analysis.totalRollValue}%
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {analysis.totalUsefulRolls} Useful Rolls
                </span>
              </div>

              <div className="bg-[#181b28] p-3 rounded-xl border border-[#282e44] text-center">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                  Average / Slot
                </span>
                <span className="text-xl font-extrabold text-sky-400 mt-0.5 block font-mono">
                  {analysis.averageSlotRollValue}%
                </span>
                <span className="text-[10px] text-zinc-500">{(analysis.totalUsefulRolls / 5).toFixed(1)} rolls/pc</span>
              </div>

              <div className="bg-[#181b28] p-3 rounded-xl border border-[#282e44] text-center">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                  Upgrade Odds
                </span>
                <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block font-mono flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~{analysis.daysToNextUpgrade}d</span>
                </span>
                <span className="text-[10px] text-zinc-500">at 180 resin/day</span>
              </div>
            </div>

            {/* Expert Advice Text */}
            <div className="bg-[#0e1017] p-3.5 rounded-xl border border-[#1e2336] space-y-1.5">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider block">
                Theorycrafting Guidance:
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {analysis.advice}
              </p>
            </div>
          </div>

          {/* Weakest Link Alert Banner */}
          {analysis.weakestSlot && (
            <div className="bg-gradient-to-r from-[#181b28] to-[#12141e] border border-[#d4af37]/40 p-4 rounded-2xl shadow-md space-y-2">
              <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Highest ROI Target: {analysis.weakestSlot.slotName}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {analysis.weakestSlot.recommendation}
              </p>
            </div>
          )}

          {/* Guaranteed Alternative Resin Path */}
          <div className="bg-[#12141d] border border-[#23273a] p-4 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Zero-RNG Guaranteed Upgrade Alternative</span>
            </div>
            <div className="bg-[#181b28] p-3.5 rounded-xl border border-[#262c40] space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-100 font-serif">
                  {analysis.guaranteedAlternative.title}
                </h4>
                <span className="text-xs font-extrabold text-emerald-400">
                  {analysis.guaranteedAlternative.guaranteedGain}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {analysis.guaranteedAlternative.description}
              </p>
              <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>Cost: {analysis.guaranteedAlternative.costResin} Resin</span>
                <span>~{analysis.guaranteedAlternative.daysResin} Days Farming</span>
              </div>
            </div>
          </div>

          {/* Slider Controls (Only visible in Quick Estimator Mode) */}
          {viewMode === 'slider' && (
            <div className="bg-[#12141d] border border-[#23273a] p-5 rounded-2xl shadow-md space-y-4">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider border-b border-[#202538] pb-2">
                Quick Stat Estimator Sliders
              </h3>

              {/* Crit Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Artifact Crit Rate (%):</span>
                  <span className="text-[#d4af37] font-bold font-mono">{critRate}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={critRate}
                  onChange={(e) => setCritRate(Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>

              {/* Crit DMG Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Artifact Crit DMG (%):</span>
                  <span className="text-[#d4af37] font-bold font-mono">{critDmg}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="2"
                  value={critDmg}
                  onChange={(e) => setCritDmg(Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>

              {/* Secondary Stat Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Secondary Stat ({isReactionScaler ? 'Elemental Mastery' : 'HP% / ATK% / ER'}):</span>
                  <span className="text-sky-400 font-bold font-mono">{secondaryStat}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  step="10"
                  value={secondaryStat}
                  onChange={(e) => setSecondaryStat(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Reaction Scaler Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reaction-toggle"
                  checked={isReactionScaler}
                  onChange={(e) => setIsReactionScaler(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#d4af37] cursor-pointer"
                />
                <label htmlFor="reaction-toggle" className="text-xs text-zinc-300 cursor-pointer">
                  Prioritize Reaction / Transformative Scalers (Nefer, Nilou, Bloom)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Diminishing Returns Curve & 5 Slot Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Diminishing Returns SVG Curve */}
          <ArtifactDiminishingReturnsCurve
            curve={analysis.curve}
            characterName={char.name}
            totalRollValue={analysis.totalRollValue}
          />

          {/* Roster Auto-Load Notice if in Equipped Mode */}
          {viewMode === 'equipped' && (
            <div className="bg-[#161926] border border-[#2b3248] p-3.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-200">
                  {equippedCount > 0
                    ? `Loaded ${equippedCount} equipped artifact pieces from your imported roster.`
                    : `No equipped artifacts found for ${char.name} in imported roster. Showing baseline 5-piece estimation.`}
                </span>
              </div>
              {Object.keys(customSlots).length > 0 && (
                <button
                  onClick={handleResetCustomSlots}
                  className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer font-semibold ml-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Overrides</span>
                </button>
              )}
            </div>
          )}

          {/* 5-Slot Cards Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                5-Piece Artifact Slot Breakdown
              </h3>
              <span className="text-xs text-zinc-400">
                Stat Weights: {charConfig.characterName} (Akasha / KQM standard)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {ALL_SLOTS.map((slot) => {
                const slotAnalysis = analysis.slotBreakdown[slot];
                const isWeakest = analysis.weakestSlot?.slotKey === slot;
                return (
                  <ArtifactSlotCard
                    key={slot}
                    analysis={slotAnalysis}
                    isWeakest={isWeakest}
                    onEdit={() => setEditingSlot(slot)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Piece Modal */}
      {editingSlot && (
        <EditSlotModal
          slot={editingSlot}
          characterName={char.name}
          initialPiece={analysis.slotBreakdown[editingSlot].currentPiece}
          onSave={handleSavePiece}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {/* Character Details Modal */}
      <CharacterDetailModal
        character={modalCharacter}
        onClose={() => setModalCharacter(null)}
      />
    </div>
  );
};

interface EditSlotModalProps {
  slot: ArtifactSlot;
  characterName: string;
  initialPiece: ArtifactPiece | null;
  onSave: (piece: ArtifactPiece) => void;
  onClose: () => void;
}

const EditSlotModal: React.FC<EditSlotModalProps> = ({
  slot,
  characterName,
  initialPiece,
  onSave,
  onClose,
}) => {
  const defaultMainStat: StatKey =
    slot === 'flower'
      ? 'hp'
      : slot === 'plume'
      ? 'atk'
      : slot === 'sands'
      ? 'atk_'
      : slot === 'goblet'
      ? 'pyro_dmg_'
      : 'critRate_';

  const [mainStatKey, setMainStatKey] = useState<StatKey>(
    initialPiece?.mainStatKey || defaultMainStat,
  );
  const [substats, setSubstats] = useState<Array<{ key: StatKey; value: number }>>([
    { key: initialPiece?.substats[0]?.key || 'critRate_', value: initialPiece?.substats[0]?.value || 3.9 },
    { key: initialPiece?.substats[1]?.key || 'critDMG_', value: initialPiece?.substats[1]?.value || 14.8 },
    { key: initialPiece?.substats[2]?.key || 'enerRech_', value: initialPiece?.substats[2]?.value || 5.8 },
    { key: initialPiece?.substats[3]?.key || 'atk_', value: initialPiece?.substats[3]?.value || 5.3 },
  ]);

  const statOptions: Array<{ key: StatKey; label: string }> = [
    { key: 'critRate_', label: 'Crit Rate (%)' },
    { key: 'critDMG_', label: 'Crit DMG (%)' },
    { key: 'atk_', label: 'ATK (%)' },
    { key: 'atk', label: 'Flat ATK' },
    { key: 'hp_', label: 'HP (%)' },
    { key: 'hp', label: 'Flat HP' },
    { key: 'def_', label: 'DEF (%)' },
    { key: 'def', label: 'Flat DEF' },
    { key: 'eleMas', label: 'Elemental Mastery' },
    { key: 'enerRech_', label: 'Energy Recharge (%)' },
  ];

  const handleUpdateSubstat = (index: number, key: StatKey, value: number) => {
    setSubstats((prev) => {
      const next = [...prev];
      next[index] = { key, value };
      return next;
    });
  };

  const handleSave = () => {
    onSave({
      slotKey: slot,
      rarity: 5,
      level: 20,
      mainStatKey,
      substats,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#141724] border border-[#2b3248] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-zinc-100 font-serif">
          Edit {SLOT_NAMES[slot]} ({characterName})
        </h3>
        <p className="text-xs text-zinc-400">
          Adjust the main stat and substat values to preview exact Roll Value (RV) and upgrade odds.
        </p>

        {/* Main Stat Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Main Stat:</label>
          <select
            value={mainStatKey}
            onChange={(e) => setMainStatKey(e.target.value as StatKey)}
            disabled={slot === 'flower' || slot === 'plume'}
            className="w-full bg-[#1a1e2d] text-zinc-100 text-xs px-3 py-2 rounded-xl border border-[#2a3045] focus:outline-none cursor-pointer"
          >
            {slot === 'flower' && <option value="hp">HP (Flat)</option>}
            {slot === 'plume' && <option value="atk">ATK (Flat)</option>}
            {slot !== 'flower' &&
              slot !== 'plume' &&
              statOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
          </select>
        </div>

        {/* 4 Substat Rows */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-zinc-300">Substats (4 Lines):</label>
          {substats.map((sub, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={sub.key}
                onChange={(e) =>
                  handleUpdateSubstat(idx, e.target.value as StatKey, sub.value)
                }
                className="flex-1 bg-[#1a1e2d] text-zinc-100 text-xs px-2.5 py-1.5 rounded-xl border border-[#2a3045] focus:outline-none cursor-pointer"
              >
                {statOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.1"
                value={sub.value}
                onChange={(e) =>
                  handleUpdateSubstat(idx, sub.key, Number(e.target.value) || 0)
                }
                className="w-24 bg-[#1a1e2d] text-zinc-100 text-xs px-2.5 py-1.5 rounded-xl border border-[#2a3045] focus:outline-none font-mono text-right"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23283c]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#d4af37] text-zinc-950 hover:bg-[#e2c158] cursor-pointer"
          >
            Apply & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
};
