import React from 'react';
import { evaluatePullRecommendations } from '../engines/pull-advisor';
import { Compass, CheckCircle2, AlertTriangle, Check } from 'lucide-react';

interface PullAdvisorViewProps {
  ownedIds: string[];
}

export const PullAdvisorView: React.FC<PullAdvisorViewProps> = ({ ownedIds }) => {
  const recommendations = evaluatePullRecommendations(ownedIds);

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
          Evaluates account holes, missing support archetypes (universal buffers, off-field Hydro/Dendro enablers), and direct character synergies against your {ownedIds.length} owned units.
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
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 border-b border-[#1f2334] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#202538] to-[#141724] border border-[#30364e] flex items-center justify-center text-sm font-bold text-[#d4af37]">
                    #{idx + 1}
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
              <span>Rarity: {'★'.repeat(item.character.rarity)}</span>
              <span>Tags: {item.character.tags.slice(0, 3).join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
