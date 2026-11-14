import React, { useState, useMemo } from 'react';
import type { Character, AbyssDualTeamPlan } from '../types/genshin';
import { solveAbyssDualTeams } from '../engines/abyss-solver';
import { CharacterPortrait } from './CharacterPortrait';
import { CharacterDetailModal } from './CharacterDetailModal';
import { RotationBadgeList } from './RotationBadgeList';
import {
  Swords,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  AlertTriangle,
} from 'lucide-react';

interface AbyssDualTeamViewProps {
  ownedIds: string[];
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pyro: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Hydro: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  Anemo: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Electro: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Dendro: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Cryo: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Geo: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

export const AbyssDualTeamView: React.FC<AbyssDualTeamViewProps> = ({ ownedIds }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [expandedRotationA, setExpandedRotationA] = useState<boolean>(true);
  const [expandedRotationB, setExpandedRotationB] = useState<boolean>(true);

  // Compute dual team plan
  const plan: AbyssDualTeamPlan = useMemo(() => {
    return solveAbyssDualTeams(ownedIds);
  }, [ownedIds]);

  const teamA = plan.firstHalfTeam;
  const teamB = plan.secondHalfTeam;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
              <Swords className="w-4 h-4" />
              <span>Unified Floor 12 Solver · 0-Overlap Dual Half Matcher</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              Spiral Abyss Floor 12 Deployment
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Generates two completely disjoint teams with 0 shared characters, simultaneously conquering the Aeonblight Drake Bow requirement, Pyro Lector shield-shredding, and Natlan Nightspirit resonance.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#121422] px-3.5 py-2 rounded-xl border border-[#2b3353]">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <div className="text-xs">
              <span className="text-zinc-400">Match Rating: </span>
              <span className="font-bold text-[#d4af37]">{plan.overallScore} Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shortfall or Notice Banner */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-300">
              Floor 12 Deployment Notice
            </div>
            {plan.warnings.map((w, idx) => (
              <div key={idx} className="text-zinc-300">
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chamber Clearance Matrix */}
      <div className="bg-[#12141e] border border-[#22273d] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1c2134] pb-2.5">
          <Target className="w-4 h-4 text-[#d4af37]" />
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            Floor 12 Chamber Mechanic Clearance Matrix
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plan.chamberCoverage.map((cov) => {
            return (
              <div
                key={cov.chamber}
                className="bg-[#161928] border border-[#252c46] rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#21273e] pb-2">
                  <span className="text-xs font-bold text-[#d4af37]">
                    Chamber 12-{cov.chamber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        cov.firstHalfSatisfied && cov.secondHalfSatisfied
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {cov.firstHalfSatisfied && cov.secondHalfSatisfied
                        ? '100% Cleared'
                        : 'Partial Coverage'}
                    </span>
                  </div>
                </div>

                {/* First Half Status */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                    {cov.firstHalfSatisfied ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span>First Half:</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 pl-4 leading-snug">
                    {cov.firstHalfStatus}
                  </p>
                </div>

                {/* Second Half Status */}
                <div className="text-xs space-y-1 pt-1 border-t border-[#1d2236]">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                    {cov.secondHalfSatisfied ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>Second Half:</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 pl-4 leading-snug">
                    {cov.secondHalfStatus}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Side-by-Side Team Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team 1: First Half */}
        <div className="bg-[#12141f] border border-[#232942] rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#21273e] pb-3">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                  First Half Vanguard (12-1-A · 12-2-A · 12-3-A)
                </span>
                <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                  {teamA.name}
                </h3>
                <span className="text-xs bg-[#191d2d] text-[#d4af37] px-2 py-0.5 rounded-md border border-[#d4af37]/20 font-medium inline-block mt-1">
                  {teamA.archetype}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Synergy</div>
                  <div className="text-xs font-bold text-amber-300">{teamA.synergyScore}/100</div>
                </div>
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Comfort</div>
                  <div className="text-xs font-bold text-emerald-300">{teamA.comfortScore}/100</div>
                </div>
              </div>
            </div>

            {/* 4 Character Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((slotIdx) => {
                const member = teamA.members[slotIdx];
                if (member) {
                  const color = ELEMENT_COLORS[member.element] || {
                    bg: 'bg-zinc-800',
                    text: 'text-zinc-200',
                    border: 'border-zinc-700',
                  };
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedCharacter(member)}
                      className={`bg-[#161928] border ${color.border} hover:border-[#d4af37] rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 group`}
                      title="Click to view details"
                    >
                      <CharacterPortrait
                        src={member.icon}
                        name={member.name}
                        element={member.element}
                        rarity={member.rarity}
                        size="sm"
                      />
                      <div className="text-xs font-bold text-zinc-100 truncate w-full text-center">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {member.weapon} · {member.roles[0]}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={`empty-a-${slotIdx}`}
                    className="bg-[#0f111c] border border-dashed border-[#232943] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
                  >
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Slot {slotIdx + 1}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Unassigned</span>
                  </div>
                );
              })}
            </div>

            {/* Stepped Rotation Accordion */}
            {teamA.steppedRotation && (
              <div className="bg-[#0e1018] rounded-xl border border-[#1b2032] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedRotationA(!expandedRotationA)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Stepped Combat Rotation</span>
                    <span className="text-[10px] font-mono text-[#d4af37] bg-[#16192b] px-2 py-0.5 rounded border border-[#d4af37]/20">
                      ~{teamA.steppedRotation.totalCycleTime}s Cycle
                    </span>
                  </div>
                  {expandedRotationA ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedRotationA && (
                  <div className="p-3 border-t border-[#1b2032] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teamA.steppedRotation.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="bg-[#131624] border border-[#22283e] p-2 rounded-lg flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CharacterPortrait
                                src={step.icon}
                                name={step.characterName}
                                element={step.element}
                                size="xs"
                              />
                              <span className="text-xs font-bold text-zinc-200 truncate">
                                {step.characterName}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400 bg-[#191d2d] px-1 py-0.5 rounded">
                              ~{step.fieldTime}s
                            </span>
                          </div>
                          <div className="bg-[#0a0c14] p-1 rounded border border-[#171a2b]">
                            <RotationBadgeList actions={step.actions} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Team 2: Second Half */}
        <div className="bg-[#12141f] border border-[#232942] rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#21273e] pb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Second Half Rearguard (12-1-B · 12-2-B · 12-3-B)
                </span>
                <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                  {teamB.name}
                </h3>
                <span className="text-xs bg-[#191d2d] text-[#d4af37] px-2 py-0.5 rounded-md border border-[#d4af37]/20 font-medium inline-block mt-1">
                  {teamB.archetype}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Synergy</div>
                  <div className="text-xs font-bold text-amber-300">{teamB.synergyScore}/100</div>
                </div>
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Comfort</div>
                  <div className="text-xs font-bold text-emerald-300">{teamB.comfortScore}/100</div>
                </div>
              </div>
            </div>

            {/* 4 Character Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((slotIdx) => {
                const member = teamB.members[slotIdx];
                if (member) {
                  const color = ELEMENT_COLORS[member.element] || {
                    bg: 'bg-zinc-800',
                    text: 'text-zinc-200',
                    border: 'border-zinc-700',
                  };
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedCharacter(member)}
                      className={`bg-[#161928] border ${color.border} hover:border-[#d4af37] rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 group`}
                      title="Click to view details"
                    >
                      <CharacterPortrait
                        src={member.icon}
                        name={member.name}
                        element={member.element}
                        rarity={member.rarity}
                        size="sm"
                      />
                      <div className="text-xs font-bold text-zinc-100 truncate w-full text-center">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {member.weapon} · {member.roles[0]}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={`empty-b-${slotIdx}`}
                    className="bg-[#0f111c] border border-dashed border-[#232943] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
                  >
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Slot {slotIdx + 1}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Unassigned</span>
                  </div>
                );
              })}
            </div>

            {/* Stepped Rotation Accordion */}
            {teamB.steppedRotation && (
              <div className="bg-[#0e1018] rounded-xl border border-[#1b2032] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedRotationB(!expandedRotationB)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Stepped Combat Rotation</span>
                    <span className="text-[10px] font-mono text-[#d4af37] bg-[#16192b] px-2 py-0.5 rounded border border-[#d4af37]/20">
                      ~{teamB.steppedRotation.totalCycleTime}s Cycle
                    </span>
                  </div>
                  {expandedRotationB ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedRotationB && (
                  <div className="p-3 border-t border-[#1b2032] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teamB.steppedRotation.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="bg-[#131624] border border-[#22283e] p-2 rounded-lg flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CharacterPortrait
                                src={step.icon}
                                name={step.characterName}
                                element={step.element}
                                size="xs"
                              />
                              <span className="text-xs font-bold text-zinc-200 truncate">
                                {step.characterName}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400 bg-[#191d2d] px-1 py-0.5 rounded">
                              ~{step.fieldTime}s
                            </span>
                          </div>
                          <div className="bg-[#0a0c14] p-1 rounded border border-[#171a2b]">
                            <RotationBadgeList actions={step.actions} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
};
