import React, { useState, useMemo } from 'react';
import { evaluatePullRecommendations } from '../engines/pull-advisor';
import type { Character } from '../types/genshin';
import { Compass, CheckCircle2, AlertTriangle, Check, Info } from 'lucide-react';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';

interface PullAdvisorViewProps {
  ownedIds: string[];
}

export const PullAdvisorView: React.FC<PullAdvisorViewProps> = ({ ownedIds }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const recommendations = useMemo(
    () => evaluatePullRecommendations(ownedIds),
    [ownedIds],
  );

  const tierColors = {
    'Must Pull': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'High Value': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    'Situational': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'Skip / Redundant': 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg">
        <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
          <Compass className="w-4 h-4" />
          <span>Account-Aware Pull Advisor</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 font-serif">
          Who Should You Pull Next?
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Evaluates account holes, missing support archetypes (universal buffers, off-field Hydro/Dendro enablers), and direct character synergies against your {ownedIds.length} owned units. Click any candidate to view full kit and build.
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs bg-[#10121b] text-emerald-400 px-3 py-2 rounded-xl border border-emerald-500/20 w-fit">
          <CheckCircle2 className="w-4 h-4" />
          <span>Characters you already own are automatically excluded from C0 recommendations.</span>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {recommendations.slice(0, 10).map((item, idx) => (
          <div
            key={item.character.id}
            className="bg-[#12141d] border border-[#23273a] hover:border-[#d4af37]/40 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header row with Portrait */}
              <div className="flex items-center justify-between gap-2 border-b border-[#1f2334] pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <CharacterPortrait
                      src={item.character.icon}
                      name={item.character.name}
                      element={item.character.element}
                      size="md"
                      className="border-[#2e354e]"
                    />
                    <div className="absolute -bottom-1.5 -left-1 bg-black/90 px-1.5 py-0.2 rounded text-[10px] font-bold text-[#d4af37] border border-[#d4af37]/40">
                      #{idx + 1}
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-zinc-100 leading-tight">
                      {item.character.name}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {item.character.element} · {item.character.weapon} · {item.character.roles[0]}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      tierColors[item.tier]
                    }`}
                  >
                    {item.tier}
                  </span>
                  <span className="text-xs font-bold text-amber-400 mt-1">
                    Value: {item.score}/100
                  </span>
                </div>
              </div>

              {/* Unlocked Archetypes */}
              {item.unlockedArchetypes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.unlockedArchetypes.map((arch, aIdx) => (
                    <span
                      key={aIdx}
                      className="text-[11px] bg-[#1a1e30] text-sky-300 px-2 py-0.5 rounded border border-sky-500/20 font-medium"
                    >
                      ★ {arch}
                    </span>
                  ))}
                </div>
              )}

              {/* Benefits */}
              <div className="mt-3 space-y-1.5 text-xs text-zinc-300">
                {item.accountBenefits.map((b, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Caution if any */}
              {item.caution && (
                <div className="mt-3 flex items-start gap-2 bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs p-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{item.caution}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="text-[#d4af37]">{'★'.repeat(item.character.rarity)}</span>
              <button
                onClick={() => setSelectedCharacter(item.character)}
                className="flex items-center gap-1 text-[#d4af37] hover:underline font-semibold cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>View Talents & Build</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Character Details Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? ownedIds.includes(selectedCharacter.id) : false}
      />
    </div>
  );
};
