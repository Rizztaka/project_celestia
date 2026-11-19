import React, { useState, useMemo } from 'react';
import { analyzeEndgameReadiness } from '../engines/endgame-helper';
import type { Character, OwnedCharacterProfile } from '../types/genshin';
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Swords,
  Crown,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import { LazyCharacterDetailModal } from './LazyCharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';
import { ImaginariumTheaterView } from './ImaginariumTheaterView';
import { AbyssDualTeamView } from './AbyssDualTeamView';
import { ABYSS_CYCLES, type AbyssCycleConfig } from '../data/abyss-schedules';
import { getSavedAbyssCycleId, saveAbyssCycleId, getSavedCustomAbyss } from '../services/storage';

interface EndgameViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
}

export const EndgameView: React.FC<EndgameViewProps> = ({
  ownedIds,
  profiles,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'theater' | 'abyss'>('theater');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showDetailedChamberGuide, setShowDetailedChamberGuide] = useState<boolean>(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => getSavedAbyssCycleId());

  const activeCycle: AbyssCycleConfig = useMemo(() => {
    if (selectedCycleId === 'custom-sandbox') {
      return getSavedCustomAbyss();
    }
    const found = ABYSS_CYCLES.find((c) => c.id === selectedCycleId);
    return found || ABYSS_CYCLES[0];
  }, [selectedCycleId]);

  const handleSelectCycleId = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    saveAbyssCycleId(cycleId);
  };

  const analysis = useMemo(
    () => analyzeEndgameReadiness(ownedIds, activeCycle),
    [ownedIds, activeCycle],
  );

  return (
    <div className="space-y-6">
      {/* Top Endgame Navigation Switcher */}
      <div className="flex items-center justify-between bg-[#121422] p-1.5 rounded-2xl border border-[#232943] shadow-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('theater')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeSubTab === 'theater'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-[#0d0f17] shadow-lg scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181c2e]'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Imaginarium Theater (Visionary)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('abyss')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeSubTab === 'abyss'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-[#0d0f17] shadow-lg scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181c2e]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Spiral Abyss Floor 12 (Dual Half)</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Imaginarium Theater */}
      {activeSubTab === 'theater' && (
        <ImaginariumTheaterView ownedIds={ownedIds} profiles={profiles} />
      )}

      {/* Sub-tab 2: Spiral Abyss Floor 12 */}
      {activeSubTab === 'abyss' && (
        <div className="space-y-6">
          <AbyssDualTeamView
            ownedIds={ownedIds}
            profiles={profiles}
            selectedCycleId={selectedCycleId}
            onSelectCycleId={handleSelectCycleId}
          />

          {/* Collapsible Chamber & Enemy Deep Dive */}
          <div className="bg-[#12141f] border border-[#22273e] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetailedChamberGuide(!showDetailedChamberGuide)}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer bg-[#151828]"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#d4af37]" />
                <span>Enemy Lineup & Chamber Shield Reference Guide</span>
                <span className="text-[11px] font-normal text-[#d4af37]/80">· {activeCycle.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span>{showDetailedChamberGuide ? 'Hide Reference' : 'View Reference'}</span>
                {showDetailedChamberGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showDetailedChamberGuide && (
              <div className="p-5 border-t border-[#1f243a]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.map((item, idx) => {
                    const isReady = item.verdict === 'Ready to Clear';
                    return (
                      <div
                        key={idx}
                        className="bg-[#0e1018] border border-[#20253a] rounded-xl p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#1b1f32] pb-2.5">
                            <div>
                              <span className="text-xs font-bold text-[#d4af37]">
                                12-{item.chamber.chamber} · {item.chamber.half}
                              </span>
                              <h4 className="text-sm font-bold text-zinc-100 mt-0.5">
                                {item.chamber.enemies.join(' & ')}
                              </h4>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                isReady
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {isReady ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <ShieldAlert className="w-3 h-3" />
                              )}
                              <span>{item.verdict}</span>
                            </span>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                            <div className="bg-[#141724] px-2 py-0.5 rounded border border-[#22273c]">
                              <span className="text-zinc-400 text-[11px]">Shield: </span>
                              <span className="text-rose-400 font-semibold text-[11px]">
                                {item.chamber.shieldTypes.join(', ')}
                              </span>
                            </div>
                            <div className="bg-[#141724] px-2 py-0.5 rounded border border-[#22273c]">
                              <span className="text-zinc-400 text-[11px]">Required: </span>
                              <span className="text-[#d4af37] font-semibold text-[11px]">
                                {item.chamber.recommendedElements.join(', ')}
                              </span>
                            </div>
                          </div>

                          <p className="mt-2.5 text-xs text-zinc-300 bg-[#0a0c13] p-2.5 rounded-lg border border-[#171a28] leading-relaxed">
                            💡 {item.chamber.tips}
                          </p>

                          <div className="mt-2.5">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                              Your Usable Counter Characters:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.usableCounters.length > 0 ? (
                                item.usableCounters.map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => setSelectedCharacter(c)}
                                    className="flex items-center gap-1 text-[11px] bg-[#161928] hover:bg-[#20253a] text-zinc-200 px-2 py-0.5 rounded-lg border border-[#242b42] hover:border-[#d4af37]/50 font-medium transition-colors cursor-pointer"
                                  >
                                    <CharacterPortrait
                                      src={c.icon}
                                      name={c.name}
                                      element={c.element}
                                      size="xs"
                                    />
                                    <span>{c.name}</span>
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

                        {item.missingElements.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/20 p-2 rounded-lg mt-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Missing elements: {item.missingElements.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Character Details Modal */}
      {selectedCharacter && (
        <LazyCharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          isOwned={ownedIds.includes(selectedCharacter.id)}
          profile={profiles ? profiles[selectedCharacter.id] : undefined}
        />
      )}
    </div>
  );
};
