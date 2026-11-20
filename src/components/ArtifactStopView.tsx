import React, { useState, useMemo } from 'react';
import { CHARACTERS } from '../data/characters';
import { ARTIFACTS_MASTER } from '../data/artifacts-master';
import type {
  Character,
  ArtifactSlot,
  ArtifactPiece,
  StatKey,
  TeamPresetKey,
  TeamContext,
} from '../types/genshin';
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
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { CharacterPortrait } from './CharacterPortrait';
import { LazyCharacterDetailModal } from './LazyCharacterDetailModal';
import { ArtifactDiminishingReturnsCurve } from './ArtifactDiminishingReturnsCurve';
import { ArtifactSlotCard } from './ArtifactSlotCard';
import { InfoTooltip } from './InfoTooltip';
import {
  analyzeArtifactBuild,
  estimateBuildFromSliders,
  extractEquippedArtifactsForCharacter,
  SLOT_NAMES,
} from '../engines/artifact-probability';
import {
  getSavedArtifacts,
  isDemoModeEnabled,
  DEFAULT_DEMO_ARTIFACTS,
} from '../services/storage';
import {
  getCharacterStatWeights,
  MAIN_STAT_ELIGIBILITY_TABLE,
} from '../data/artifact-weights';
import { COMBAT_SET_NAMES } from '../data/artifact-set-effects';
import { validateArtifactPiece } from '../engines/artifact-validator';

const ALL_SLOTS: ArtifactSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

const TEAM_PRESETS: Array<{ id: TeamPresetKey; label: string; desc: string }> = [
  { id: 'unbuffed', label: 'Solo (Unbuffed)', desc: 'Pure standalone scaling' },
  { id: 'hypercarry_bennett_furina', label: 'Bennett + Furina', desc: '+1.2k ATK & +75% DMG' },
  { id: 'vape_melt', label: 'Vaporize / Melt', desc: '1.5x / 2.0x Amplifying' },
  { id: 'quicken_spread', label: 'Quicken / Spread', desc: 'Catalyze Flat Scaling' },
  { id: 'hyperbloom', label: 'Hyperbloom', desc: 'Transformative Reaction' },
];

export const ArtifactStopView: React.FC = () => {
  const [selectedCharId, setSelectedCharId] = useState<string>('Nefer');
  const [viewMode, setViewMode] = useState<'equipped' | 'builder' | 'slider'>('equipped');
  const [selectedTeamPreset, setSelectedTeamPreset] = useState<TeamPresetKey>('unbuffed');

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

  // Sub-tab Navigation: Optimizer vs Master Encyclopedia
  const [mainTab, setMainTab] = useState<'optimizer' | 'encyclopedia'>('optimizer');
  const [encyclopediaSearch, setEncyclopediaSearch] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<'All' | '5' | '4' | '3' | '1-2'>('All');
  const [combatFilter, setCombatFilter] = useState<'All' | 'combat' | 'non-combat'>('All');
  const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(new Set());

  const teamContext = useMemo<TeamContext>(() => {
    switch (selectedTeamPreset) {
      case 'hypercarry_bennett_furina':
        return {
          preset: 'hypercarry_bennett_furina',
          hasBennett: true,
          hasFurina: true,
          customFlatAtkBuff: 1200,
          customDmgBonus: 75,
        };
      case 'vape_melt':
        return { preset: 'vape_melt', hasAmplifyingReaction: true };
      case 'quicken_spread':
        return { preset: 'quicken_spread', hasQuickenReaction: true };
      case 'hyperbloom':
        return { preset: 'hyperbloom' };
      case 'unbuffed':
      default:
        return { preset: 'unbuffed' };
    }
  }, [selectedTeamPreset]);

  const toggleExpandSet = (id: string) => {
    setExpandedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setRecommenders = useMemo(() => {
    const map: Record<string, Character[]> = {};
    for (const c of CHARACTERS) {
      for (const a of c.build?.artifacts || []) {
        if (!map[a.name]) map[a.name] = [];
        if (!map[a.name].some((existing) => existing.id === c.id)) {
          map[a.name].push(c);
        }
      }
    }
    return map;
  }, []);

  const filteredArtifactSets = useMemo(() => {
    const q = encyclopediaSearch.trim().toLowerCase();
    return ARTIFACTS_MASTER.filter((set) => {
      const matchesSearch =
        !q ||
        set.name.toLowerCase().includes(q) ||
        (set.effect2Pc && set.effect2Pc.toLowerCase().includes(q)) ||
        (set.effect4Pc && set.effect4Pc.toLowerCase().includes(q)) ||
        Object.values(set.pieces || {}).some(
          (p) =>
            p &&
            (p.name.toLowerCase().includes(q) ||
              (p.description && p.description.toLowerCase().includes(q)))
        );

      const matchesRarity =
        rarityFilter === 'All' ||
        (rarityFilter === '5' && set.maxRarity === 5) ||
        (rarityFilter === '4' && set.maxRarity === 4) ||
        (rarityFilter === '3' && set.maxRarity === 3) ||
        (rarityFilter === '1-2' && set.maxRarity <= 2);

      const matchesCombat =
        combatFilter === 'All' ||
        (combatFilter === 'combat' && set.isCombatSet) ||
        (combatFilter === 'non-combat' && !set.isCombatSet);

      return matchesSearch && matchesRarity && matchesCombat;
    });
  }, [encyclopediaSearch, rarityFilter, combatFilter]);

  const char = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];
  const charConfig = getCharacterStatWeights(char.id);

  // Retrieve raw artifacts stored from GOOD JSON / Enka or demo preset
  const savedRawArtifacts = useMemo(() => {
    const saved = getSavedArtifacts();
    if (saved && saved.length > 0) return saved;
    if (isDemoModeEnabled()) {
      return DEFAULT_DEMO_ARTIFACTS;
    }
    return [];
  }, []);

  // Extract equipped pieces for selected character
  const equippedFromRoster = useMemo(() => {
    return extractEquippedArtifactsForCharacter(savedRawArtifacts, char.id);
  }, [savedRawArtifacts, char.id]);

  const equippedCount = Object.keys(equippedFromRoster).length;

  // Active slots depending on view mode
  const activeSlots = useMemo(() => {
    if (viewMode === 'equipped') {
      if (equippedCount > 0 || Object.keys(customSlots).length > 0) {
        return { ...equippedFromRoster, ...customSlots };
      }
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
        teamContext,
      );
    }
    return analyzeArtifactBuild(char.id, activeSlots || {}, teamContext);
  }, [viewMode, char.id, char.name, activeSlots, critRate, critDmg, secondaryStat, isReactionScaler, teamContext]);

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
      {/* Sub-Tab Navigation Header */}
      <div className="flex items-center gap-2 p-1.5 bg-[#10121d] border border-[#23273c] rounded-2xl max-w-2xl shadow-sm">
        <button
          onClick={() => setMainTab('optimizer')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'optimizer'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181d2f]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Resin & Roll Optimizer (37 Combat Sets)</span>
        </button>
        <button
          onClick={() => setMainTab('encyclopedia')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'encyclopedia'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181d2f]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Master Artifact Encyclopedia (All 64 Sets)</span>
        </button>
      </div>

      {mainTab === 'optimizer' && (
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
                  const newConfig = getCharacterStatWeights(newId);
                  setIsReactionScaler((newConfig.statWeights.eleMas ?? 0) >= 0.8);
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

      {/* Team Context Selector Bar */}
      <div className="bg-[#12141d] border border-[#23273a] p-3.5 sm:p-4 rounded-2xl shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#d4af37]" />
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Team Buff & Reaction Context
            </span>
            <InfoTooltip
              title="Buff Dilution & Reaction Scaling"
              content="Models external flat ATK (Bennett, Noblesse), massive DMG% buffs (Furina Fanfare), and amplifying/transformative reaction scaling to recalibrate stat roll values and diminishing return curves."
            />
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Active: <strong className="text-[#d4af37]">{TEAM_PRESETS.find(p => p.id === selectedTeamPreset)?.label}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {TEAM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelectedTeamPreset(preset.id)}
              className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                selectedTeamPreset === preset.id
                  ? 'bg-[#1e2335] border-[#d4af37] text-zinc-100 shadow-md shadow-[#d4af37]/10'
                  : 'bg-[#161824] border-[#252a3d] text-zinc-400 hover:text-zinc-200 hover:border-[#353c57]'
              }`}
            >
              <div className="text-xs font-bold leading-tight truncate">
                {preset.label}
              </div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                {preset.desc}
              </div>
            </button>
          ))}
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
                <span className="text-[10px] text-zinc-400 font-semibold uppercase flex items-center justify-center gap-1">
                  <span>Approx. Upgrade Odds</span>
                  <InfoTooltip
                    title="Approximate Upgrade Probability"
                    content="Continuous logistic model evaluating substat roll distributions. Days to upgrade represent the 50% milestone at 180 resin/day."
                  />
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

          {/* Whole-Build ER Indicator Card */}
          {analysis.erEvaluation && (
            <div className="bg-[#12141d] border border-[#23273a] p-4.5 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Whole-Build ER Requirement
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    analysis.erEvaluation.status === 'Target'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : analysis.erEvaluation.status === 'Deficit'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {analysis.erEvaluation.status === 'Target'
                    ? 'Target Window'
                    : analysis.erEvaluation.status === 'Deficit'
                    ? 'Deficit (<0.7x Penalty)'
                    : 'Surplus / Overcap'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#181b28] p-3 rounded-xl border border-[#262c40] text-center">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Build ER</span>
                  <span className="text-base font-extrabold text-sky-400 font-mono mt-0.5 block">
                    {analysis.erEvaluation.totalEr.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Target ER</span>
                  <span className="text-base font-extrabold text-zinc-200 font-mono mt-0.5 block">
                    ~{analysis.erEvaluation.targetEr}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Scaling Factor</span>
                  <span className={`text-base font-extrabold font-mono mt-0.5 block ${analysis.erEvaluation.penaltyFactor < 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {analysis.erEvaluation.penaltyFactor.toFixed(2)}x
                  </span>
                </div>
              </div>

              {analysis.erEvaluation.message && (
                <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                  analysis.erEvaluation.status === 'Deficit'
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span className="leading-relaxed text-[11px]">{analysis.erEvaluation.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Set Bonus ESR Comparison Card */}
          {analysis.setComparison && (
            <div className="bg-[#12141d] border border-[#23273a] p-4.5 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Set Bonus Equivalent Substats (ESR)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                  4pc vs 2pc/2pc
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#181b28] p-2.5 rounded-xl border border-[#262c40]">
                  <span className="text-[10px] text-zinc-400 font-semibold block truncate">
                    BiS: {analysis.setComparison.options[0]?.name || '4pc BiS'}
                  </span>
                  <span className="text-base font-extrabold text-[#d4af37] font-mono mt-0.5 block">
                    ~{analysis.setComparison.options[0]?.esr ?? analysis.setComparison.currentSetEsr} rolls
                  </span>
                </div>
                <div className="bg-[#181b28] p-2.5 rounded-xl border border-[#262c40]">
                  <span className="text-[10px] text-zinc-400 font-semibold block truncate">
                    {analysis.setComparison.options[1]?.name || '2pc + 2pc'}
                  </span>
                  <span className="text-base font-extrabold text-sky-400 font-mono mt-0.5 block">
                    ~{analysis.setComparison.options[1]?.esr ?? 0} rolls
                  </span>
                </div>
              </div>

              <div className="bg-[#161926] p-3 rounded-xl border border-[#272e44] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <span className="text-[#d4af37]">Break-even Delta:</span>
                  <span>+{analysis.setComparison.breakEvenRollDelta} substat rolls</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {analysis.setComparison.verdict}
                </p>
              </div>
            </div>
          )}

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

          {/* Actionable Stop-Farming ROI & Guaranteed Upgrade Card */}
          {analysis.roiComparison ? (
            <div className="bg-[#12141d] border border-[#23273a] p-4.5 rounded-2xl shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Resin ROI vs Guaranteed Gains
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    analysis.roiComparison.decision === 'Stop Farming'
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {analysis.roiComparison.decision}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#181b28] p-3 rounded-xl border border-[#262c40]">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Marginal Gain / Roll</span>
                  <span className="text-base font-extrabold text-[#d4af37] font-mono mt-0.5 block">
                    +{analysis.roiComparison.artifactMarginalDpsGainPerRoll}% DPS
                  </span>
                </div>
                <div className="bg-[#181b28] p-3 rounded-xl border border-[#262c40]">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Resin / 1% DPS</span>
                  <span className="text-base font-extrabold text-sky-400 font-mono mt-0.5 block">
                    ~{analysis.roiComparison.resinPerOnePctArtifactDps} Resin
                  </span>
                </div>
              </div>

              {/* Guaranteed Alternatives Benchmarks */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Guaranteed Benchmarks (Zero RNG):
                </span>
                <div className="space-y-1">
                  {analysis.roiComparison.milestones.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-[#161824] px-3 py-1.5 rounded-lg border border-[#22273a]"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-zinc-200 font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right font-mono">
                        <span className="text-emerald-400 font-bold">+{item.expectedDpsGainPct}%</span>
                        <span className="text-[11px] text-zinc-400">~{item.resinPerOnePctDps} res/%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Domain & Strongbox Routing Recommendation */}
              {analysis.domainRoute && (
                <div className="bg-[#161926] p-3 rounded-xl border border-[#272e44] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#d4af37] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Recommended Route: {analysis.domainRoute.recommendedAction}</span>
                    </span>
                    {analysis.domainRoute.companionValue && (
                      <span className="text-[10px] font-semibold text-zinc-400">
                        Companion Value: {analysis.domainRoute.companionValue}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    {analysis.domainRoute.guidance}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Fallback Guaranteed Alternative Path */
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
          )}

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

          {/* Builder Notice if in Builder Mode */}
          {viewMode === 'builder' && Object.keys(customSlots).length > 0 && (
            <div className="bg-[#161926] border border-[#2b3248] p-3.5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-zinc-300">
                Customizing {Object.keys(customSlots).length} of 5 artifact slots.
              </span>
              <button
                onClick={handleResetCustomSlots}
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer font-semibold ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Clear All Pieces</span>
              </button>
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
                    activeSets={analysis.setComparison?.activeSets}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* SUB-TAB 2: MASTER ARTIFACT ENCYCLOPEDIA (ALL 64 SETS) */}
      {mainTab === 'encyclopedia' && (
        <div className="space-y-5">
          {/* Encyclopedia Filter Bar */}
          <div className="bg-[#10121c] p-4 rounded-2xl border border-[#202538] space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search artifact sets, 2pc/4pc effects, or piece lore..."
                  value={encyclopediaSearch}
                  onChange={(e) => setEncyclopediaSearch(e.target.value)}
                  className="w-full bg-[#141624] border border-[#262c44] text-xs text-zinc-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="text-xs text-zinc-400 flex items-center justify-between sm:justify-end gap-3">
                <span>
                  Showing <strong className="text-zinc-100">{filteredArtifactSets.length}</strong> of{' '}
                  <strong>{ARTIFACTS_MASTER.length}</strong> Master Sets
                </span>
                {(encyclopediaSearch || rarityFilter !== 'All' || combatFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setEncyclopediaSearch('');
                      setRarityFilter('All');
                      setCombatFilter('All');
                    }}
                    className="text-[11px] font-semibold text-[#d4af37] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-[#1d2235]">
              {/* Rarity Filter */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Rarity Filter:
                </span>
                <div className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#141624] p-1 rounded-xl border border-[#22273c] touch-pan-x [-webkit-overflow-scrolling:touch]">
                  {[
                    { id: 'All', label: 'All Rarities' },
                    { id: '5', label: '5★ Sets' },
                    { id: '4', label: '4★ Sets' },
                    { id: '3', label: '3★ Sets' },
                    { id: '1-2', label: '1★–2★ Sets' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRarityFilter(r.id as any)}
                      className={`px-3 py-1.5 min-h-[44px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        rarityFilter === r.id
                          ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1f243b]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Category Filter */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Set Archetype:
                </span>
                <div className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#141624] p-1 rounded-xl border border-[#22273c] touch-pan-x [-webkit-overflow-scrolling:touch]">
                  {[
                    { id: 'All', label: 'All 64 Sets' },
                    { id: 'combat', label: 'Combat Sets (37)' },
                    { id: 'non-combat', label: 'Leveling / Legacy (27)' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCombatFilter(c.id as any)}
                      className={`px-3 py-1.5 min-h-[44px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        combatFilter === c.id
                          ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1f243b]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Master Artifacts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredArtifactSets.map((set) => {
              const isExpanded = expandedSetIds.has(set.id);
              const recommenders = setRecommenders[set.name] || [];
              const stars = '★'.repeat(Math.max(1, Math.min(5, Math.floor(set.maxRarity || 5))));
              const hasPieces = set.pieces && Object.keys(set.pieces).length > 0;

              return (
                <div
                  key={set.id}
                  style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 240px' }}
                  className="bg-[#121420] border border-[#23283c] hover:border-[#38405e] rounded-2xl p-4.5 space-y-3.5 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Icon, Name, Rarity & Category */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-black/60 border border-[#2d344d] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          {set.icon ? (
                            <img
                              src={set.icon}
                              alt={set.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) parent.innerHTML = '<span class="text-zinc-500 text-xs">Artifact</span>';
                              }}
                            />
                          ) : (
                            <Layers className="w-6 h-6 text-[#d4af37]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-zinc-100">{set.name}</h3>
                            <span className="text-xs text-[#d4af37] font-extrabold">{stars}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                set.isCombatSet
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {set.isCombatSet ? 'Combat Set (37 Baseline)' : 'Leveling / Non-Combat'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {set.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Set Effects Cards */}
                    <div className="space-y-2">
                      {set.effect2Pc && (
                        <div className="bg-[#161928] p-2.5 rounded-xl border border-[#283049] text-xs">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 mr-2">
                            2-Piece Set
                          </span>
                          <span className="text-zinc-200 leading-relaxed">{set.effect2Pc}</span>
                        </div>
                      )}

                      {set.effect4Pc && (
                        <div className="bg-[#161928] p-2.5 rounded-xl border border-[#283049] text-xs">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 mr-2">
                            4-Piece Set
                          </span>
                          <span className="text-zinc-300 leading-relaxed whitespace-pre-line">{set.effect4Pc}</span>
                        </div>
                      )}

                      {set.effect1Pc && (
                        <div className="bg-[#161928] p-2.5 rounded-xl border border-[#283049] text-xs">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-950/50 text-sky-300 border border-sky-500/30 mr-2">
                            1-Piece Set
                          </span>
                          <span className="text-zinc-300 leading-relaxed">{set.effect1Pc}</span>
                        </div>
                      )}
                    </div>

                    {/* Recommended Characters Section */}
                    {recommenders.length > 0 && (
                      <div className="pt-2 border-t border-[#1e2338] space-y-1.5">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Recommended For ({recommenders.length} Characters):
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {recommenders.map((charObj) => (
                            <button
                              key={charObj.id}
                              onClick={() => setModalCharacter(charObj)}
                              className="bg-[#181c2d] hover:bg-[#22273e] border border-[#293048] hover:border-[#d4af37]/50 rounded-lg px-2 py-1 flex items-center gap-1.5 transition-all cursor-pointer group"
                              title={`View ${charObj.name} build & kit`}
                            >
                              <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-white/10">
                                <img src={charObj.icon} alt={charObj.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-[#d4af37]">
                                {charObj.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expandable 5-Piece Lore & Names */}
                  {hasPieces && (
                    <div className="pt-2 border-t border-[#1e2338]">
                      <button
                        onClick={() => toggleExpandSet(set.id)}
                        className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-1 font-semibold">
                          <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Artifact Pieces & In-Game Lore ({Object.keys(set.pieces || {}).length})</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 space-y-2 border-t border-[#1f2439] pt-2">
                          {(['flower', 'plume', 'sands', 'goblet', 'circlet'] as ArtifactSlot[]).map((slotKey) => {
                            const piece = set.pieces?.[slotKey];
                            if (!piece) return null;
                            const slotLabel = SLOT_NAMES[slotKey] || slotKey;
                            return (
                              <div
                                key={slotKey}
                                className="bg-[#0e1019] p-2.5 rounded-xl border border-[#202538] flex items-start gap-3"
                              >
                                {piece.icon && (
                                  <div className="w-9 h-9 rounded-lg bg-black/60 border border-[#2b3147] p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                                    <img
                                      src={piece.icon}
                                      alt={piece.name}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        const parent = (e.target as HTMLElement).parentElement;
                                        if (parent) parent.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs font-bold text-zinc-200 truncate">{piece.name}</h4>
                                    <span className="text-[10px] font-semibold text-zinc-400 shrink-0">
                                      {slotLabel}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                                    "{piece.description}"
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
      <LazyCharacterDetailModal
        character={modalCharacter}
        onClose={() => setModalCharacter(null)}
        onSelectCharacter={setModalCharacter}
        isOwned={false}
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
  const allowedMainStats = MAIN_STAT_ELIGIBILITY_TABLE[slot] || ['hp'];
  const defaultMainStat: StatKey = allowedMainStats[0];

  const [setKey, setSetKey] = useState<string>(
    initialPiece?.setKey || 'Emblem of Severed Fate',
  );
  const [mainStatKey, setMainStatKey] = useState<StatKey>(
    initialPiece && allowedMainStats.includes(initialPiece.mainStatKey)
      ? initialPiece.mainStatKey
      : defaultMainStat,
  );

  const ALL_SUBSTAT_KEYS: StatKey[] = [
    'critRate_',
    'critDMG_',
    'atk_',
    'atk',
    'hp_',
    'hp',
    'def_',
    'def',
    'eleMas',
    'enerRech_',
  ];

  const getInitialSubstats = () => {
    if (initialPiece?.substats && initialPiece.substats.length === 4) {
      return initialPiece.substats.map((s) => ({ key: s.key, value: s.value }));
    }
    const chosen: Array<{ key: StatKey; value: number }> = [];
    for (const key of ALL_SUBSTAT_KEYS) {
      if (key !== mainStatKey && chosen.length < 4) {
        const val =
          key === 'critRate_' ? 3.9 : key === 'critDMG_' ? 7.8 : key === 'enerRech_' ? 5.8 : 5.3;
        chosen.push({ key, value: val });
      }
    }
    return chosen;
  };

  const [substats, setSubstats] = useState<Array<{ key: StatKey; value: number }>>(getInitialSubstats);

  const STAT_LABELS: Record<string, string> = {
    hp: 'Flat HP (+299)',
    atk: 'Flat ATK (+19)',
    def: 'Flat DEF (+23)',
    hp_: 'HP (+5.8%)',
    atk_: 'ATK (+5.8%)',
    def_: 'DEF (+7.3%)',
    eleMas: 'Elemental Mastery (+23)',
    enerRech_: 'Energy Recharge (+6.5%)',
    critRate_: 'Crit Rate (+3.9%)',
    critDMG_: 'Crit DMG (+7.8%)',
    heal_: 'Healing Bonus (+35.9%)',
    physical_dmg_: 'Physical DMG (+58.3%)',
    pyro_dmg_: 'Pyro DMG (+46.6%)',
    hydro_dmg_: 'Hydro DMG (+46.6%)',
    dendro_dmg_: 'Dendro DMG (+46.6%)',
    electro_dmg_: 'Electro DMG (+46.6%)',
    anemo_dmg_: 'Anemo DMG (+46.6%)',
    cryo_dmg_: 'Cryo DMG (+46.6%)',
    geo_dmg_: 'Geo DMG (+46.6%)',
  };

  const handleMainStatChange = (newMain: StatKey) => {
    setMainStatKey(newMain);
    setSubstats((prev) => {
      const usedKeys = new Set<StatKey>([newMain]);
      return prev.map((s) => {
        if (s.key === newMain || usedKeys.has(s.key)) {
          const replacement =
            ALL_SUBSTAT_KEYS.find((k) => k !== newMain && !usedKeys.has(k)) || 'critDMG_';
          usedKeys.add(replacement);
          return { key: replacement, value: s.value };
        }
        usedKeys.add(s.key);
        return s;
      });
    });
  };

  const handleUpdateSubstat = (index: number, key: StatKey, value: number) => {
    setSubstats((prev) => {
      const next = [...prev];
      next[index] = { key, value };
      return next;
    });
  };

  const currentPiecePreview: ArtifactPiece = {
    slotKey: slot,
    setKey,
    rarity: 5,
    level: 20,
    mainStatKey,
    substats,
  };

  const validation = validateArtifactPiece(currentPiecePreview);

  const handleSave = () => {
    onSave(currentPiecePreview);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#141724] border border-[#2b3248] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-base font-bold text-zinc-100 font-serif">
            Edit {SLOT_NAMES[slot]} ({characterName})
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Preserves set identity, filters authentic slot main stats, and validates discrete roll tiers.
          </p>
        </div>

        {/* Set Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Artifact Set (37 Combat Sets):</label>
          <select
            value={setKey}
            onChange={(e) => setSetKey(e.target.value)}
            className="w-full bg-[#1a1e2d] text-zinc-100 text-xs px-3 py-2 rounded-xl border border-[#2a3045] focus:outline-none cursor-pointer"
          >
            {COMBAT_SET_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Main Stat Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Main Stat:</label>
          <select
            value={mainStatKey}
            onChange={(e) => handleMainStatChange(e.target.value as StatKey)}
            disabled={slot === 'flower' || slot === 'plume'}
            className="w-full bg-[#1a1e2d] text-zinc-100 text-xs px-3 py-2 rounded-xl border border-[#2a3045] focus:outline-none cursor-pointer"
          >
            {allowedMainStats.map((k) => (
              <option key={k} value={k}>
                {STAT_LABELS[k] || k}
              </option>
            ))}
          </select>
        </div>

        {/* 4 Substat Rows */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">Substats (4 Discrete Lines):</label>
            <span className="text-[10px] text-zinc-400">Total Rolls: {validation.totalRolls} (8–9 for +20 5★)</span>
          </div>
          {substats.map((sub, idx) => {
            const otherKeys = substats.filter((_, i) => i !== idx).map((s) => s.key);
            const availableSubstats = ALL_SUBSTAT_KEYS.filter(
              (k) => k === sub.key || (k !== mainStatKey && !otherKeys.includes(k)),
            );

            return (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={sub.key}
                  onChange={(e) =>
                    handleUpdateSubstat(idx, e.target.value as StatKey, sub.value)
                  }
                  className="flex-1 bg-[#1a1e2d] text-zinc-100 text-xs px-2.5 py-1.5 rounded-xl border border-[#2a3045] focus:outline-none cursor-pointer"
                >
                  {availableSubstats.map((optKey) => (
                    <option key={optKey} value={optKey}>
                      {STAT_LABELS[optKey] || optKey}
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
            );
          })}
        </div>

        {/* Validation Notice Banner */}
        {!validation.isValid && (
          <div className="bg-rose-950/40 border border-rose-500/40 p-2.5 rounded-xl text-xs text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Artifact Roll Validation Notice:</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-300/90">
              {validation.errors.map((err, errIdx) => (
                <li key={errIdx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

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
