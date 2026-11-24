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
  Compass,
  Sparkles,
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

  // Retain full RecommendationCollection envelope (items + reliability) at view boundary
  const readinessResult = useMemo(
    () => analyzeEndgameReadiness(ownedIds, activeCycle),
    [ownedIds, activeCycle],
  );
  const analysis = readinessResult.items;

  return (
    <div className="space-y-6">
      {/* Top Endgame Navigation Switcher */}
      <div
        role="tablist"
        aria-label="Endgame Modes"
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#121420] p-1.5 rounded-2xl border border-[#24293d] shadow-md"
      >
        <button
          id="endgame-tab-theater"
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'theater'}
          aria-controls="endgame-panel-theater"
          onClick={() => setActiveSubTab('theater')}
          className={`min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'theater'
              ? 'bg-[#d4af37] text-[#0a0b0e] shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-[#1a1e2e]'
          }`}
        >
          <Crown className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Imaginarium Theater (Visionary)</span>
        </button>

        <button
          id="endgame-tab-abyss"
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'abyss'}
          aria-controls="endgame-panel-abyss"
          onClick={() => setActiveSubTab('abyss')}
          className={`min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'abyss'
              ? 'bg-[#d4af37] text-[#0a0b0e] shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-[#1a1e2e]'
          }`}
        >
          <Swords className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Spiral Abyss Floor 12 (Dual Half)</span>
        </button>
      </div>

      {/* Sub-tab 1: Imaginarium Theater */}
      {activeSubTab === 'theater' && (
        <div
          id="endgame-panel-theater"
          role="tabpanel"
          aria-labelledby="endgame-tab-theater"
        >
          <ImaginariumTheaterView ownedIds={ownedIds} profiles={profiles} />
        </div>
      )}

      {/* Sub-tab 2: Spiral Abyss Floor 12 */}
      {activeSubTab === 'abyss' && (
        <div
          id="endgame-panel-abyss"
          role="tabpanel"
          aria-labelledby="endgame-tab-abyss"
          className="space-y-6"
        >
          <AbyssDualTeamView
            ownedIds={ownedIds}
            profiles={profiles}
            selectedCycleId={selectedCycleId}
            onSelectCycleId={handleSelectCycleId}
          />

          {/* Collapsible Chamber & Enemy Deep Dive */}
          <div className="bg-[#121420] border border-[#24293d] rounded-2xl overflow-hidden">
            <button
              type="button"
              aria-expanded={showDetailedChamberGuide}
              aria-controls="abyss-chamber-reference"
              onClick={() => setShowDetailedChamberGuide(!showDetailedChamberGuide)}
              className="w-full min-h-[48px] p-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-zinc-100 hover:bg-[#1a1e2e] transition-colors cursor-pointer bg-[#151826]"
            >
              <div className="flex flex-wrap items-center gap-2 text-left">
                <Target className="w-4 h-4 text-[#d4af37] shrink-0" aria-hidden="true" />
                <span>Enemy Lineup, Resistances &amp; Positioning Reference Guide</span>
                <span className="text-xs font-normal text-[#f3cf58]">· {activeCycle.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300 ml-auto">
                <span>{showDetailedChamberGuide ? 'Hide Reference' : 'View Reference'}</span>
                {showDetailedChamberGuide ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </div>
            </button>

            {showDetailedChamberGuide && (
              <div id="abyss-chamber-reference" className="p-4 sm:p-5 border-t border-[#24293d]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.map((item, idx) => {
                    const isReady = item.verdict === 'Ready to Clear';
                    return (
                      <div
                        key={idx}
                        className="bg-[#0e1019] border border-[#24293d] rounded-xl p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#202538] pb-2.5">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-[#f3cf58]">
                                  12-{item.chamber.chamber} · {item.chamber.half}
                                </span>
                                {item.chamber.targetProfile && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1a1e2e] text-sky-200 border border-sky-400/30">
                                    {item.chamber.targetProfile}
                                  </span>
                                )}
                                {(item.chamber.waveCount ?? 1) > 1 && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1a1e2e] text-zinc-200 border border-[#323954]">
                                    {item.chamber.waveCount} Waves
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-zinc-100 mt-1">
                                {item.chamber.enemies.join(' & ')}
                              </h3>
                            </div>

                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 shrink-0 ${
                                isReady
                                  ? 'bg-emerald-950/60 text-emerald-200 border-emerald-400/45'
                                  : 'bg-rose-950/60 text-rose-200 border-rose-400/45'
                              }`}
                            >
                              {isReady ? (
                                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                              <span>{item.verdict}</span>
                            </span>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                            <div className="bg-[#151826] px-2.5 py-1 rounded-lg border border-[#24293d]">
                              <span className="text-zinc-300">Shield: </span>
                              <span className="text-rose-200 font-semibold">
                                {item.chamber.shieldTypes.length > 0
                                  ? item.chamber.shieldTypes.join(', ')
                                  : 'None'}
                              </span>
                            </div>
                            <div className="bg-[#151826] px-2.5 py-1 rounded-lg border border-[#24293d]">
                              <span className="text-zinc-300">Recommended: </span>
                              <span className="text-[#f3cf58] font-semibold">
                                {item.chamber.recommendedElements.length > 0
                                  ? item.chamber.recommendedElements.join(', ')
                                  : 'Flexible'}
                              </span>
                            </div>
                          </div>

                          {/* Movement Traits & High RES Warnings */}
                          {((item.chamber.movementTraits && item.chamber.movementTraits.length > 0) ||
                            (item.chamber.highResWarnings && item.chamber.highResWarnings.length > 0)) && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.chamber.movementTraits?.map((trait) => (
                                <span
                                  key={trait}
                                  className="text-[11px] px-2 py-0.5 rounded bg-purple-950/50 text-purple-200 border border-purple-400/35 font-medium"
                                >
                                  {trait}
                                </span>
                              ))}
                              {item.chamber.highResWarnings?.map((warn) => (
                                <span
                                  key={warn}
                                  className="text-[11px] px-2 py-0.5 rounded bg-rose-950/50 text-rose-200 border border-rose-400/35 font-medium"
                                >
                                  {warn}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="mt-2.5 text-xs text-zinc-200 bg-[#0b0d14] p-3 rounded-lg border border-[#1d2236] leading-relaxed">
                            💡 {item.chamber.tips}
                          </p>

                          {item.chamber.positioningTip && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-sky-200 bg-sky-950/25 border border-sky-400/30 p-2.5 rounded-lg">
                              <Compass className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-300" aria-hidden="true" />
                              <span>{item.chamber.positioningTip}</span>
                            </div>
                          )}

                          {item.chamber.chamberBuff && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-200 bg-amber-950/25 border border-amber-400/30 p-2.5 rounded-lg">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
                              <span>{item.chamber.chamberBuff}</span>
                            </div>
                          )}

                          <div className="mt-3">
                            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
                              Your Usable Counter Characters:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.usableCounters.length > 0 ? (
                                item.usableCounters.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedCharacter(c)}
                                    className="min-h-[34px] flex items-center gap-1.5 text-xs bg-[#161a29] hover:bg-[#22283f] text-zinc-100 px-2.5 py-1 rounded-lg border border-[#2c334d] hover:border-[#d4af37]/60 font-medium transition-colors cursor-pointer"
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
                                <span className="text-xs text-rose-200 italic">
                                  No optimal counter found in your active roster.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {item.missingElements.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-200 bg-rose-950/35 border border-rose-400/35 p-2.5 rounded-lg mt-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" aria-hidden="true" />
                            <span>Missing counters: {item.missingElements.join(', ')}</span>
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
