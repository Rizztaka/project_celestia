import React, { useState, useMemo } from 'react';
import { analyzeEndgameReadiness } from '../engines/endgame-helper';
import type { Character } from '../types/genshin';
import { ShieldAlert, ShieldCheck, AlertCircle, Swords } from 'lucide-react';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';

interface EndgameViewProps {
  ownedIds: string[];
}

export const EndgameView: React.FC<EndgameViewProps> = ({ ownedIds }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const analysis = useMemo(() => analyzeEndgameReadiness(ownedIds), [ownedIds]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg">
        <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
          <Swords className="w-4 h-4" />
          <span>Spiral Abyss Floor 12 & Boss Strategy</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 font-serif">
          Endgame Stage & Shield Counters
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Analyzes active Floor 12 chamber shield barriers, boss invulnerability mechanics, and maps your owned roster against required elemental counters. Click any counter to inspect details.
        </p>
      </div>

      {/* Chamber Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {analysis.map((item, idx) => {
          const isReady = item.verdict === 'Ready to Clear';
          return (
            <div
              key={idx}
              className="bg-[#12141d] border border-[#23273a] rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#1f2334] pb-3">
                  <div>
                    <span className="text-xs font-bold text-[#d4af37]">
                      12-{item.chamber.chamber} · {item.chamber.half}
                    </span>
                    <h3 className="text-base font-bold text-zinc-100 mt-0.5">
                      {item.chamber.enemies.join(' & ')}
                    </h3>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      isReady
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isReady ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                    <span>{item.verdict}</span>
                  </span>
                </div>

                {/* Shield types & recommended */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <div className="bg-[#181b28] px-2.5 py-1 rounded-lg border border-[#262c3f]">
                    <span className="text-zinc-400">Shield: </span>
                    <span className="text-rose-400 font-semibold">{item.chamber.shieldTypes.join(', ')}</span>
                  </div>
                  <div className="bg-[#181b28] px-2.5 py-1 rounded-lg border border-[#262c3f]">
                    <span className="text-zinc-400">Required: </span>
                    <span className="text-[#d4af37] font-semibold">{item.chamber.recommendedElements.join(', ')}</span>
                  </div>
                </div>

                {/* Tips */}
                <p className="mt-3 text-xs text-zinc-300 bg-[#0e1017] p-3 rounded-xl border border-[#1b1f2e] leading-relaxed">
                  💡 {item.chamber.tips}
                </p>

                {/* Counter units from your roster */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Your Usable Counter Characters:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.usableCounters.length > 0 ? (
                      item.usableCounters.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCharacter(c)}
                          className="flex items-center gap-1.5 text-xs bg-[#1a1e2f] hover:bg-[#252b42] text-zinc-200 px-2 py-1 rounded-lg border border-[#293047] hover:border-[#d4af37]/50 font-medium transition-colors cursor-pointer"
                          title="Click to view character details"
                        >
                          <CharacterPortrait
                            src={c.icon}
                            name={c.name}
                            element={c.element}
                            size="xs"
                          />
                          <span>{c.name}</span>
                          <span className="text-[10px] text-zinc-400">({c.element})</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-rose-400 italic">
                        No optimal counter found in your active roster!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Missing elements alert */}
              {item.missingElements.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/20 p-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Missing counter elements in owned roster: {item.missingElements.join(', ')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Character Details Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? ownedIds.includes(selectedCharacter.id) : false}
      />
    </div>
  );
};
