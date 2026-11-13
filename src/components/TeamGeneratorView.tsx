import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { generateBestTeams } from '../engines/team-generator';
import { Sparkles, Shield, Zap } from 'lucide-react';

interface TeamGeneratorViewProps {
  ownedIds: string[];
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pyro: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-500/30' },
  Hydro: { bg: 'bg-sky-950/40', text: 'text-sky-400', border: 'border-sky-500/30' },
  Dendro: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Electro: { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-500/30' },
  Anemo: { bg: 'bg-teal-950/40', text: 'text-teal-400', border: 'border-teal-500/30' },
  Cryo: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Geo: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-500/30' },
};

export const TeamGeneratorView: React.FC<TeamGeneratorViewProps> = ({ ownedIds }) => {
  const [focusId, setFocusId] = useState<string>('');

  const teams = generateBestTeams(ownedIds, focusId || undefined);
  const featuredCarries = ['Nefer', 'Mavuika', 'HuTao', 'Alhaitham', 'Clorinde', 'Neuvillette', 'Navia'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Instant Archetype Synergy Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              Best Team Recommendations
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Calculates optimal 4-slot compositions from your owned roster ({ownedIds.length} characters) balancing elemental resonance, reaction chains, buffer multipliers, and survivability.
            </p>
          </div>

          {/* Quick Focus Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-300">Focus on Main Carry:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFocusId('')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  focusId === ''
                    ? 'bg-[#d4af37] text-black font-bold'
                    : 'bg-[#1e2336] text-zinc-300 hover:bg-[#282f48]'
                }`}
              >
                All Teams
              </button>
              {featuredCarries.map((id) => {
                const char = CHARACTERS.find((c) => c.id === id);
                if (!char) return null;
                const isSelected = focusId === id;
                return (
                  <button
                    key={id}
                    onClick={() => setFocusId(id)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#d4af37] text-black font-bold'
                        : 'bg-[#1e2336] text-zinc-300 hover:bg-[#282f48]'
                    }`}
                  >
                    {char.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Teams Grid */}
      <div className="grid grid-cols-1 gap-6">
        {teams.map((team, idx) => (
          <div
            key={team.id}
            className="bg-[#12141d] border border-[#23273a] hover:border-[#d4af37]/50 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-md space-y-4"
          >
            {/* Team Title & Score Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2334] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                    Rank #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1e2336] text-zinc-300">
                    {team.archetype}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-100 font-serif mt-1">
                  {team.name}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#181b28] px-3 py-1.5 rounded-xl border border-[#252a3f]">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">Synergy</div>
                    <div className="text-sm font-bold text-amber-300">{team.synergyScore}/100</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#181b28] px-3 py-1.5 rounded-xl border border-[#252a3f]">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">Comfort</div>
                    <div className="text-sm font-bold text-emerald-300">{team.comfortScore}/100</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Characters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {team.members.map((member, mIdx) => {
                const color = ELEMENT_COLORS[member.element] || {
                  bg: 'bg-zinc-800',
                  text: 'text-zinc-200',
                  border: 'border-zinc-700',
                };
                return (
                  <div
                    key={member.id + mIdx}
                    className={`rounded-xl p-3 border ${color.border} ${color.bg} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`font-bold ${color.text}`}>{member.element}</span>
                        <span className="text-zinc-400 text-[10px]">{member.weapon}</span>
                      </div>
                      <div className="text-base font-bold text-zinc-100 leading-tight">
                        {member.name}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">
                        {member.roles[0]}
                      </span>
                      <span className="text-[10px] text-[#d4af37] font-semibold">
                        {'★'.repeat(member.rarity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resonances */}
            {team.resonance.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {team.resonance.map((res, rIdx) => (
                  <span
                    key={rIdx}
                    className="text-xs bg-[#191d2d] text-[#d4af37] px-2.5 py-1 rounded-lg border border-[#d4af37]/20 font-medium"
                  >
                    ⚡ {res}
                  </span>
                ))}
              </div>
            )}

            {/* Rotation Breakdown & Strategy */}
            <div className="bg-[#0e1017] p-3.5 rounded-xl border border-[#1b1f2e] text-xs space-y-2">
              <div>
                <span className="text-zinc-400 font-semibold uppercase tracking-wider block text-[10px] mb-0.5">
                  Recommended Execution Rotation:
                </span>
                <p className="text-zinc-200 font-mono text-[11px] leading-relaxed bg-[#141724] p-2 rounded border border-[#22273d]">
                  {team.rotation}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-300 pt-1">
                {team.reasons.map((reason, rIdx) => (
                  <div key={rIdx} className="flex items-start gap-1.5">
                    <span className="text-[#d4af37]">✓</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
