import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { calculateArtifactStopPoint } from '../engines/artifact-stop';
import { PieChart, Clock, Zap } from 'lucide-react';

export const ArtifactStopView: React.FC = () => {
  const [selectedChar, setSelectedChar] = useState<string>('Nefer');
  const [critRate, setCritRate] = useState<number>(65);
  const [critDmg, setCritDmg] = useState<number>(140);
  const [isEmScaler, setIsEmScaler] = useState<boolean>(true);

  const char = CHARACTERS.find((c) => c.id === selectedChar) || CHARACTERS[0];
  const result = calculateArtifactStopPoint(char.name, critRate, critDmg, isEmScaler);

  const statusColors = {
    'High ROI': 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40',
    'Diminishing Returns': 'bg-amber-950/40 text-amber-400 border-amber-500/40',
    'Ready / Stop Farming': 'bg-purple-950/40 text-purple-300 border-purple-500/40',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg">
        <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
          <PieChart className="w-4 h-4" />
          <span>Resin ROI & Diminishing Returns Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 font-serif">
          When Is Artifact Farming No Longer Worth It?
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Calculates your character's Crit Value (CV) and exact statistical probability of finding an upgrade per domain run. Saves you weeks of wasted resin when talent or support upgrades offer guaranteed gains.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-[#12141d] border border-[#23273a] p-6 rounded-2xl space-y-5 shadow-md">
          <h2 className="text-base font-bold text-zinc-100 border-b border-[#202538] pb-3">
            Build Stats Input
          </h2>

          {/* Character selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Target Character:</label>
            <select
              value={selectedChar}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedChar(newId);
                if (newId === 'Nefer' || newId === 'Nilou' || newId === 'KukiShinobu') {
                  setIsEmScaler(true);
                } else {
                  setIsEmScaler(false);
                }
              }}
              className="w-full bg-[#181b28] border border-[#282e44] text-zinc-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d4af37]"
            >
              {CHARACTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.element} · {c.roles[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Crit Rate Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span>Artifact Crit Rate (%):</span>
              <span className="text-[#d4af37] font-bold text-sm">{critRate}%</span>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span>Artifact Crit DMG (%):</span>
              <span className="text-[#d4af37] font-bold text-sm">{critDmg}%</span>
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

          {/* Reaction Scaler Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="em-scaler"
              checked={isEmScaler}
              onChange={(e) => setIsEmScaler(e.target.checked)}
              className="w-4 h-4 rounded accent-[#d4af37] cursor-pointer"
            />
            <label htmlFor="em-scaler" className="text-xs text-zinc-300 cursor-pointer">
              Elemental Reaction / EM / HP Scaler (e.g. Nefer, Bloom, Transformative)
            </label>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 bg-[#12141d] border border-[#23273a] p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-md">
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202538] pb-3">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Analysis for {char.name}
                </span>
                <h3 className="text-xl font-bold text-zinc-100 font-serif mt-0.5">
                  Recommendation Outcome
                </h3>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  statusColors[result.status]
                }`}
              >
                {result.status}
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#181b28] p-3.5 rounded-xl border border-[#282e44] text-center">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                  Total Crit Value (CV)
                </span>
                <span className="text-2xl font-extrabold text-[#d4af37] mt-1 block">
                  {result.currentCv}
                </span>
                <span className="text-[10px] text-zinc-500">(2 × CR + CD)</span>
              </div>

              <div className="bg-[#181b28] p-3.5 rounded-xl border border-[#282e44] text-center">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                  Est. Days of Resin
                </span>
                <span className="text-2xl font-extrabold text-sky-400 mt-1 block flex items-center justify-center gap-1">
                  <Clock className="w-5 h-5" />
                  <span>~{result.estimatedDaysForUpgrade}d</span>
                </span>
                <span className="text-[10px] text-zinc-500">at 180 resin/day</span>
              </div>

              <div className="bg-[#181b28] p-3.5 rounded-xl border border-[#282e44] text-center">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                  Resin Efficiency
                </span>
                <span
                  className={`text-2xl font-extrabold mt-1 block flex items-center justify-center gap-1 ${
                    result.resinEfficiency < 30 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                  <span>{result.resinEfficiency}%</span>
                </span>
                <span className="text-[10px] text-zinc-500">upgrade likelihood</span>
              </div>
            </div>

            {/* Plain English Recommendation Callout */}
            <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2336] space-y-2">
              <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider block">
                Expert Guidance:
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                {result.advice}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <span>Standard Domain Cost: 20 Resin</span>
            <span className="text-[#d4af37]">Guaranteed Value &gt; RNG Rolls</span>
          </div>
        </div>
      </div>
    </div>
  );
};
