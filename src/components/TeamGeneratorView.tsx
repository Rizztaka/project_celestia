import React, { useState, useMemo } from 'react';
import { CHARACTERS } from '../data/characters';
import { generateBestTeams } from '../engines/team-generator';
import type {
  Character,
  OwnedCharacterProfile,
  OwnedWeapon,
  TeamWeaponAssignment,
} from '../types/genshin';
import {
  Sparkles,
  Shield,
  Zap,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  Swords,
  X,
  Users,
  Compass,
} from 'lucide-react';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';
import { RotationBadgeList } from './RotationBadgeList';
import { rankWeaponsForCharacter, scoreWeaponForCharacter } from '../engines/weapon-solver';
import { getSavedWeapons, getSavedProfiles, equipWeaponToCharacter } from '../services/storage';
import { getWeaponByKey } from '../data/weapons';

interface TeamGeneratorViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
  weapons?: OwnedWeapon[];
  onUpdateWeapons?: (weapons: OwnedWeapon[]) => void;
  onUpdateProfile?: (profile: OwnedCharacterProfile) => void;
  onUpdateProfiles?: (profiles: Record<string, OwnedCharacterProfile>) => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
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

export const TeamGeneratorView: React.FC<TeamGeneratorViewProps> = ({
  ownedIds,
  profiles,
  weapons,
  onUpdateWeapons,
  onUpdateProfile,
  onUpdateProfiles,
  isDemoMode: _isDemoMode,
  onToggleDemoMode,
}) => {
  const [focusId, setFocusId] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [showCatalogFallback, setShowCatalogFallback] = useState<boolean>(false);
  const [quickSwapTarget, setQuickSwapTarget] = useState<{
    teamId: string;
    character: Character;
    teamMembers: Character[];
    currentAssignment?: TeamWeaponAssignment;
  } | null>(null);
  const [customAssignments, setCustomAssignments] = useState<
    Record<string, Record<string, TeamWeaponAssignment>>
  >({});

  const weaponBag = useMemo(() => weapons || getSavedWeapons(), [weapons]);

  const teams = useMemo(
    () => generateBestTeams(ownedIds, focusId || undefined, profiles, weaponBag, showCatalogFallback),
    [ownedIds, focusId, profiles, weaponBag, showCatalogFallback],
  );
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
              Calculates optimal 4-slot compositions from your owned roster ({ownedIds.length} characters) balancing elemental resonance, reaction chains, buffer multipliers, and survivability. Click any character to view build and talents.
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

      {/* Insufficient Roster Banner */}
      {ownedIds.length < 4 && !showCatalogFallback && (
        <div className="bg-gradient-to-r from-amber-950/30 via-[#161824] to-amber-950/20 p-8 rounded-2xl border border-amber-500/30 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-base font-bold text-zinc-100 font-serif">
              Insufficient Roster ({ownedIds.length}/4 Characters Owned)
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Celestia enforces strict ownership and requires at least 4 owned characters to generate personalized team compositions.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onToggleDemoMode && (
              <button
                onClick={() => onToggleDemoMode(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-[#0d0f17] font-bold text-xs hover:brightness-110 transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Turn on Demo Mode</span>
              </button>
            )}
            <button
              onClick={() => setShowCatalogFallback(true)}
              className="px-4 py-2 rounded-xl bg-[#1e2336] hover:bg-[#282f48] text-zinc-200 border border-[#2d344e] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#d4af37]" />
              <span>Show Theoretical Catalog Teams</span>
            </button>
          </div>
        </div>
      )}

      {/* Notice when viewing Catalog Fallback */}
      {ownedIds.length < 4 && showCatalogFallback && (
        <div className="bg-[#141624] border border-[#2d344e] p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Info className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>
              Viewing <strong>Theoretical Catalog Teams</strong> across all 128 characters. Characters not currently owned by you are marked with an <strong>Unowned</strong> badge.
            </span>
          </div>
          <button
            onClick={() => setShowCatalogFallback(false)}
            className="text-xs text-zinc-400 hover:text-white underline cursor-pointer shrink-0"
          >
            Hide Catalog Teams
          </button>
        </div>
      )}

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
                  {team.isTheoretical && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40">
                      Theoretical (Catalog)
                    </span>
                  )}
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

            {/* 4 Characters Row with Portraits */}
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
                    onClick={() => setSelectedCharacter(member)}
                    className={`group rounded-xl p-3 border ${color.border} ${color.bg} hover:border-[#d4af37] hover:scale-[1.02] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-sm`}
                    title="Click to view full build and talents"
                  >
                    <div>
                      {/* Element & Weapon */}
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <span className={`font-bold ${color.text}`}>{member.element}</span>
                        {member.isOwned === false ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-950/70 text-rose-300 border border-rose-500/40">
                            Unowned
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">{member.weapon}</span>
                        )}
                      </div>

                      {/* Character Portrait & Name */}
                      <div className="flex items-center gap-2.5">
                        <CharacterPortrait
                          src={member.icon}
                          name={member.name}
                          element={member.element}
                          size="md"
                          className="group-hover:border-[#d4af37]/60"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-zinc-100 group-hover:text-[#d4af37] transition-colors leading-tight truncate">
                            {member.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {member.roles[0]}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-[#d4af37] font-semibold">
                        {'★'.repeat(Math.max(1, Math.min(5, Math.floor(member.rarity))))}
                      </span>
                      <span className="text-[9px] text-zinc-400 group-hover:text-zinc-200 flex items-center gap-0.5">
                        <Info className="w-2.5 h-2.5" />
                        <span>Build</span>
                      </span>
                    </div>

                    {/* Weapon Badge & Quick Swap */}
                    {(() => {
                      const assignment =
                        customAssignments[team.id]?.[member.id] ||
                        team.weaponAssignments?.find((wa) => wa.characterId === member.id);
                      if (!assignment) return null;
                      return (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickSwapTarget({
                              teamId: team.id,
                              character: member,
                              teamMembers: team.members,
                              currentAssignment: assignment,
                            });
                          }}
                          className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1 text-[11px] hover:bg-black/25 -mx-1 px-1.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Click to view owned weapon options & quick-swap"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-zinc-200 truncate flex items-center gap-1 text-[11px]">
                              <Swords className="w-3 h-3 text-[#d4af37] shrink-0" />
                              <span className="truncate">{getWeaponByKey(assignment.assignedWeapon.key)?.name || assignment.assignedWeapon.name}</span>
                            </span>
                            <span className="font-mono font-bold text-amber-400 text-[10px] shrink-0">
                              R{assignment.assignedWeapon.refinement}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400 font-mono text-[10px]">
                              Lv. {assignment.assignedWeapon.level}
                            </span>
                            <div className="flex items-center gap-1">
                              {assignment.isBorrowed && (
                                <span
                                  className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold"
                                  title={`Borrowed from ${CHARACTERS.find((c) => c.id === assignment.borrowedFrom)?.name || assignment.borrowedFrom}`}
                                >
                                  Borrowed
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                  assignment.scoreResult.tier === 'BiS'
                                    ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30'
                                    : assignment.scoreResult.tier === 'Optimal'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : assignment.scoreResult.tier === 'Great'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                {assignment.scoreResult.tier}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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

            {/* Stepped Rotation Breakdown & Strategy */}
            <div className="bg-[#0e1017] p-3.5 rounded-xl border border-[#1b1f2e] text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b1f2e] pb-2">
                <span className="text-zinc-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Strategic Execution Rotation</span>
                </span>
                {team.steppedRotation && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#181c2c] text-[#d4af37] border border-[#d4af37]/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>~{team.steppedRotation.totalCycleTime}s Cycle</span>
                  </span>
                )}
              </div>

              {team.steppedRotation && team.steppedRotation.steps.length > 0 ? (
                <div className="space-y-2">
                  {/* Step Cards Flow */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {team.steppedRotation.steps.map((step) => {
                      return (
                        <div
                          key={step.stepNumber}
                          className="bg-[#121522] border border-[#202538] hover:border-[#2f3652] p-2.5 rounded-lg flex flex-col justify-between gap-2 transition-colors relative group"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <CharacterPortrait
                                src={step.icon}
                                name={step.characterName}
                                element={step.element}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-zinc-100 truncate">
                                  {step.characterName}
                                </div>
                                <div className="text-[9px] text-zinc-400 font-semibold uppercase truncate">
                                  Step {step.stepNumber}
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400 bg-[#191d2d] px-1.5 py-0.5 rounded border border-[#272e48] shrink-0">
                              ~{step.fieldTime}s
                            </span>
                          </div>

                          <div className="bg-[#0b0d16] p-1.5 rounded border border-[#1a1e30]">
                            <RotationBadgeList actions={step.actions} size="sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Collapsible Strategy Tips */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                      className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{expandedTeamId === team.id ? 'Hide Strategy Tips' : 'Show Tactical Strategy & Tips'}</span>
                      {expandedTeamId === team.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedTeamId === team.id && (
                      <div className="mt-2 space-y-1.5 bg-[#121522] p-2.5 rounded-lg border border-[#202538] text-[11px]">
                        {team.steppedRotation.steps.map((step) => (
                          <div key={step.stepNumber} className="flex items-start gap-2 text-zinc-300">
                            <span className="text-[#d4af37] font-bold shrink-0 font-mono">
                              [Step {step.stepNumber} · {step.characterName}]:
                            </span>
                            <span className="leading-relaxed">
                              {step.tip || 'Execute standard action sequence.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-zinc-200 font-mono text-[11px] leading-relaxed bg-[#141724] p-2 rounded border border-[#22273d]">
                  {team.rotation}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-300 pt-1 border-t border-[#1b1f2e]/60">
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

      {/* Empty State when no teams match */}
      {teams.length === 0 && (
        <div className="bg-[#12141d] border border-[#23273a] rounded-2xl p-8 text-center space-y-3 shadow-md">
          <Users className="w-8 h-8 mx-auto text-zinc-500" />
          <h3 className="text-base font-bold text-zinc-200">No Matching Teams Found</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {focusId && !ownedIds.includes(focusId)
              ? `You do not currently own ${CHARACTERS.find((c) => c.id === focusId)?.name || focusId}. Enable theoretical catalog teams to explore theoretical compositions.`
              : 'Could not generate full 4-character compositions with the current filters and roster.'}
          </p>
          {focusId && !ownedIds.includes(focusId) && !showCatalogFallback && (
            <button
              onClick={() => setShowCatalogFallback(true)}
              className="px-4 py-2 rounded-xl bg-[#1e2336] hover:bg-[#282f48] text-[#d4af37] border border-[#2d344e] text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Show Theoretical Catalog Teams for {CHARACTERS.find((c) => c.id === focusId)?.name || focusId}</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive Character Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? ownedIds.includes(selectedCharacter.id) : false}
        profile={selectedCharacter && profiles ? profiles[selectedCharacter.id] : undefined}
        onUpdateProfile={onUpdateProfile}
        profiles={profiles}
        onUpdateProfiles={onUpdateProfiles}
        weapons={weapons}
        onUpdateWeapons={onUpdateWeapons}
      />

      {/* Quick Swap Weapon Popover/Modal */}
      {quickSwapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#12141e] border border-[#262c44] w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-[#202538] pb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-bold text-zinc-100">
                  Swap Weapon: {quickSwapTarget.character.name}
                </h3>
              </div>
              <button
                onClick={() => setQuickSwapTarget(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select an owned {quickSwapTarget.character.weapon} from your armory to assign to {quickSwapTarget.character.name} for this team composition.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {rankWeaponsForCharacter(
                quickSwapTarget.character,
                weaponBag,
                quickSwapTarget.teamMembers,
              ).map((scoreRes) => {
                const w = scoreRes.weapon as OwnedWeapon;
                const isCurrent =
                  quickSwapTarget.currentAssignment?.assignedWeapon.id === w.id;
                const canonicalW = getWeaponByKey(w.key) || getWeaponByKey(w.name);
                const displayRarity = canonicalW?.rarity || w.rarity || 4;
                const displayName = canonicalW?.name || w.name;
                return (
                  <div
                    key={w.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-[#d4af37]/10 border-[#d4af37]/40'
                        : 'bg-[#181b28] border-[#252a3f] hover:border-[#384060]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{displayName}</span>
                        <span className="text-xs text-[#d4af37]">{'★'.repeat(Math.max(1, Math.min(5, Math.floor(displayRarity))))}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-300">
                          R{w.refinement}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          Lv. {w.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                            scoreRes.tier === 'BiS'
                              ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30'
                              : scoreRes.tier === 'Optimal'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {scoreRes.tier} ({scoreRes.relativePercentage}%)
                        </span>
                        {scoreRes.equippedOn && scoreRes.equippedOn !== quickSwapTarget.character.id && (
                          <span className="text-[10px] text-zinc-400">
                            Equipped on {scoreRes.equippedOn}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const newAssignment: TeamWeaponAssignment = {
                          characterId: quickSwapTarget.character.id,
                          characterName: quickSwapTarget.character.name,
                          assignedWeapon: w,
                          scoreResult: scoreRes,
                          isBorrowed: Boolean(
                            w.location &&
                              w.location !== quickSwapTarget.character.id &&
                              w.location !== quickSwapTarget.character.name,
                          ),
                          borrowedFrom: w.location,
                        };

                        const prevWeapon = quickSwapTarget.currentAssignment?.assignedWeapon;
                        const otherMemberUsingW = quickSwapTarget.teamMembers.find((m) => {
                          if (m.id === quickSwapTarget.character.id) return false;
                          const mAssign =
                            customAssignments[quickSwapTarget.teamId]?.[m.id] ||
                            teams
                              .find((t) => t.id === quickSwapTarget.teamId)
                              ?.weaponAssignments?.find((wa) => wa.characterId === m.id);
                          return mAssign?.assignedWeapon.id === w.id;
                        });

                        const updatedTeamCustoms: Record<string, TeamWeaponAssignment> = {
                          ...(customAssignments[quickSwapTarget.teamId] || {}),
                          [quickSwapTarget.character.id]: newAssignment,
                        };

                        // If another member on this team already used this weapon instance, resolve the conflict
                        if (otherMemberUsingW) {
                          const dbPrev = prevWeapon ? getWeaponByKey(prevWeapon.key) : undefined;
                          if (dbPrev && dbPrev.weaponType === otherMemberUsingW.weapon && prevWeapon) {
                            const swappedScore = scoreWeaponForCharacter(
                              otherMemberUsingW,
                              prevWeapon,
                              quickSwapTarget.teamMembers,
                            );
                            updatedTeamCustoms[otherMemberUsingW.id] = {
                              characterId: otherMemberUsingW.id,
                              characterName: otherMemberUsingW.name,
                              assignedWeapon: prevWeapon,
                              scoreResult: swappedScore,
                              isBorrowed: Boolean(
                                prevWeapon.location &&
                                  prevWeapon.location !== otherMemberUsingW.id &&
                                  prevWeapon.location !== otherMemberUsingW.name,
                              ),
                              borrowedFrom: prevWeapon.location,
                            };
                          } else {
                            const availableForOther = rankWeaponsForCharacter(
                              otherMemberUsingW,
                              weaponBag.filter((wb) => wb.id !== w.id),
                              quickSwapTarget.teamMembers,
                            );
                            if (availableForOther.length > 0) {
                              const bestNext = availableForOther[0];
                              const nextW = bestNext.weapon as OwnedWeapon;
                              updatedTeamCustoms[otherMemberUsingW.id] = {
                                characterId: otherMemberUsingW.id,
                                characterName: otherMemberUsingW.name,
                                assignedWeapon: nextW,
                                scoreResult: bestNext,
                                isBorrowed: Boolean(
                                  nextW.location &&
                                    nextW.location !== otherMemberUsingW.id &&
                                    nextW.location !== otherMemberUsingW.name,
                                ),
                                borrowedFrom: nextW.location,
                              };
                            }
                          }
                        }

                        setCustomAssignments((prev) => ({
                          ...prev,
                          [quickSwapTarget.teamId]: updatedTeamCustoms,
                        }));

                        // If equipped permanently, update global profile/weapons atomically
                        const currentProfiles = profiles || getSavedProfiles();
                        const { updatedWeapons, updatedProfiles } = equipWeaponToCharacter(
                          w.id,
                          quickSwapTarget.character.id,
                          weaponBag,
                          currentProfiles,
                        );

                        if (onUpdateProfiles) {
                          onUpdateProfiles(updatedProfiles);
                        } else if (onUpdateProfile && updatedProfiles[quickSwapTarget.character.id]) {
                          onUpdateProfile(updatedProfiles[quickSwapTarget.character.id]);
                        }

                        if (onUpdateWeapons) {
                          onUpdateWeapons(updatedWeapons);
                        }

                        setQuickSwapTarget(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#d4af37] text-black'
                          : 'bg-[#22273c] text-zinc-200 hover:bg-[#2e3552]'
                      }`}
                    >
                      {isCurrent ? 'Current' : 'Select'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
