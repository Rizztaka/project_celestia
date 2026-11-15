import React, { useState, useEffect, useRef, useMemo } from 'react';
import type {
  Character,
  Element,
  OwnedCharacterProfile,
  OwnedWeapon,
} from '../types/genshin';
import {
  X,
  Swords,
  Sparkles,
  Check,
  Plus,
  BookOpen,
  Award,
  Layers,
  Zap,
  Info,
  Sliders,
} from 'lucide-react';
import { CharacterPortrait } from './CharacterPortrait';
import { resolveCharacterRotationProfile } from '../engines/rotation-synthesizer';
import { RotationBadgeList } from './RotationBadgeList';
import { rankWeaponsForCharacter } from '../engines/weapon-solver';
import { getSavedWeapons, saveWeapons } from '../services/storage';
import { WEAPONS_BY_TYPE, getWeaponByKey } from '../data/weapons';

interface CharacterDetailModalProps {
  character: Character | null;
  onClose: () => void;
  isOwned?: boolean;
  onToggleOwned?: (id: string) => void;
  profile?: OwnedCharacterProfile;
  onUpdateProfile?: (profile: OwnedCharacterProfile) => void;
  weapons?: OwnedWeapon[];
  onUpdateWeapons?: (weapons: OwnedWeapon[]) => void;
}

const ELEMENT_THEMES: Record<
  Element,
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    glow: string;
  }
> = {
  Pyro: {
    bg: 'from-rose-950/40 to-[#12141d]',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    glow: 'shadow-rose-900/20',
  },
  Hydro: {
    bg: 'from-sky-950/40 to-[#12141d]',
    border: 'border-sky-500/40',
    text: 'text-sky-400',
    badgeBg: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
    glow: 'shadow-sky-900/20',
  },
  Dendro: {
    bg: 'from-emerald-950/40 to-[#12141d]',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    glow: 'shadow-emerald-900/20',
  },
  Electro: {
    bg: 'from-purple-950/40 to-[#12141d]',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    glow: 'shadow-purple-900/20',
  },
  Anemo: {
    bg: 'from-teal-950/40 to-[#12141d]',
    border: 'border-teal-500/40',
    text: 'text-teal-400',
    badgeBg: 'bg-teal-950/60 text-teal-300 border-teal-500/30',
    glow: 'shadow-teal-900/20',
  },
  Cryo: {
    bg: 'from-cyan-950/40 to-[#12141d]',
    border: 'border-cyan-500/40',
    text: 'text-cyan-300',
    badgeBg: 'bg-cyan-950/60 text-cyan-200 border-cyan-500/30',
    glow: 'shadow-cyan-900/20',
  },
  Geo: {
    bg: 'from-amber-950/40 to-[#12141d]',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    glow: 'shadow-amber-900/20',
  },
};

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  onClose,
  isOwned,
  onToggleOwned,
  profile,
  onUpdateProfile,
  weapons,
  onUpdateWeapons,
}) => {
  const [activeTab, setActiveTab] = useState<'build' | 'talents' | 'constellations'>('build');
  const [showAlternateRotation, setShowAlternateRotation] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeWeapons = useMemo(() => weapons || getSavedWeapons(), [weapons]);

  const rankedOwnedWeapons = useMemo(() => {
    if (!character) return [];
    return rankWeaponsForCharacter(character, activeWeapons);
  }, [character, activeWeapons]);

  const [showManualCustomizer, setShowManualCustomizer] = useState(false);
  const [customWeaponKey, setCustomWeaponKey] = useState<string>('');
  const [customLevel, setCustomLevel] = useState<number>(profile?.weapon?.level ?? 90);
  const [customRefinement, setCustomRefinement] = useState<number>(profile?.weapon?.refinement ?? 1);

  // Sync customizer defaults with character weapon type
  useEffect(() => {
    if (character) {
      const typeList = WEAPONS_BY_TYPE[character.weapon] || [];
      setCustomWeaponKey(profile?.weapon?.key || typeList[0]?.key || '');
      setCustomLevel(profile?.weapon?.level ?? 90);
      setCustomRefinement(profile?.weapon?.refinement ?? 1);
    }
  }, [character?.id, profile?.weapon?.key]);

  const handleEquipWeapon = (weaponToEquip: OwnedWeapon) => {
    if (!character) return;

    if (onUpdateProfile) {
      onUpdateProfile({
        id: character.id,
        level: profile?.level ?? 90,
        constellation: profile?.constellation ?? 0,
        talents: profile?.talents,
        weapon: {
          key: weaponToEquip.key,
          name: weaponToEquip.name,
          level: weaponToEquip.level,
          refinement: weaponToEquip.refinement,
          rarity: weaponToEquip.rarity,
          ascension: weaponToEquip.ascension,
        },
      });
    }

    const updatedWeapons = activeWeapons.map((w) => {
      if (w.id === weaponToEquip.id) {
        return { ...w, location: character.id };
      }
      if (w.location === character.id) {
        return { ...w, location: undefined };
      }
      return w;
    });

    if (onUpdateWeapons) {
      onUpdateWeapons(updatedWeapons);
    } else {
      saveWeapons(updatedWeapons);
    }
  };

  const handleSaveCustomWeapon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!character) return;
    const dbW = getWeaponByKey(customWeaponKey);
    if (!dbW) return;

    const newEquipped = {
      key: dbW.key,
      name: dbW.name,
      level: customLevel,
      refinement: customRefinement,
      rarity: dbW.rarity,
    };

    if (onUpdateProfile) {
      onUpdateProfile({
        id: character.id,
        level: profile?.level ?? 90,
        constellation: profile?.constellation ?? 0,
        talents: profile?.talents,
        weapon: newEquipped,
      });
    }

    // 1. Unequip any weapon currently on this character into bag (preserving it in inventory)
    const baseWeapons = activeWeapons.map((w) => {
      if (w.location === character.id) {
        return { ...w, location: undefined };
      }
      return w;
    });

    // 2. Look for an existing unequipped instance of this weapon in bag to reuse
    const unequippedIndex = baseWeapons.findIndex(
      (w) => w.key === dbW.key && (!w.location || !w.location.trim()),
    );

    let updatedWeapons: OwnedWeapon[];
    if (unequippedIndex >= 0) {
      updatedWeapons = baseWeapons.map((w, idx) => {
        if (idx === unequippedIndex) {
          return {
            ...w,
            level: customLevel,
            refinement: customRefinement,
            location: character.id,
          };
        }
        return w;
      });
    } else {
      const newOwned: OwnedWeapon = {
        id: `${dbW.key}_${Date.now()}`,
        key: dbW.key,
        name: dbW.name,
        level: customLevel,
        refinement: customRefinement,
        rarity: dbW.rarity,
        location: character.id,
        lock: true,
      };
      updatedWeapons = [newOwned, ...baseWeapons];
    }

    if (onUpdateWeapons) {
      onUpdateWeapons(updatedWeapons);
    } else {
      saveWeapons(updatedWeapons);
    }

    setShowManualCustomizer(false);
  };

  // Reset alternate rotation view on character switch
  useEffect(() => {
    setShowAlternateRotation(false);
  }, [character?.id]);

  const rotationProfile = character ? resolveCharacterRotationProfile(character) : null;

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!character) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [character]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset scroll position and tab when character changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [character?.id, activeTab]);

  if (!character) return null;

  const theme = ELEMENT_THEMES[character.element] || ELEMENT_THEMES.Pyro;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`bg-[#0e1017] border ${theme.border} w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl ${theme.glow} flex flex-col overflow-hidden text-zinc-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className={`bg-gradient-to-r ${theme.bg} p-5 border-b border-[#24293d] relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 hover:bg-black/70 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-10">
            {/* Avatar thumbnail */}
            <CharacterPortrait
              src={character.icon}
              name={character.name}
              element={character.element}
              rarity={character.rarity}
              size="xl"
              showRarity={true}
              className={`border-2 ${theme.border}`}
            />

            {/* Information */}
            <div className="space-y-1">
              {character.title && (
                <div className="text-xs font-serif italic text-zinc-400">{character.title}</div>
              )}
              <h2 className="text-2xl font-bold font-serif text-zinc-100 leading-tight">
                {character.name}
              </h2>
              {character.constellationName && (
                <div className="text-[11px] text-zinc-400 font-mono">
                  Constellation: {character.constellationName}
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${theme.badgeBg}`}>
                  {character.element}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#1e2336] text-zinc-300 border border-[#2d344e]">
                  {character.weapon}
                </span>
                {character.roles.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 rounded-lg text-xs font-medium bg-black/40 text-zinc-400 border border-white/5"
                  >
                    {role}
                  </span>
                ))}
              </div>

              {/* Interactive Constellation Selector when owned */}
              {isOwned && onUpdateProfile && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-400">Constellation:</span>
                  <div className="flex items-center gap-1 bg-[#10121d] p-0.5 rounded-lg border border-[#24293f]">
                    {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() =>
                          onUpdateProfile({
                            id: character.id,
                            level: profile?.level ?? 90,
                            constellation: lvl,
                            weapon: profile?.weapon,
                            talents: profile?.talents,
                          })
                        }
                        className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          (profile?.constellation ?? 0) === lvl
                            ? 'bg-[#d4af37] text-black font-extrabold shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1f243b]'
                        }`}
                      >
                        C{lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipped Weapon Preview */}
              {profile?.weapon && (
                <div className="pt-1 flex items-center gap-2 text-xs text-zinc-300">
                  <Swords className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>
                    Equipped: <strong className="text-zinc-100">{profile.weapon.name}</strong> (Lv. {profile.weapon.level}, R{profile.weapon.refinement})
                  </span>
                </div>
              )}
            </div>

            {/* Owned status button if handler provided */}
            {onToggleOwned && (
              <div className="sm:ml-auto shrink-0 mt-2 sm:mt-0">
                <button
                  onClick={() => onToggleOwned(character.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isOwned
                      ? 'bg-[#d4af37] border-[#d4af37] text-black hover:bg-[#e5c158]'
                      : 'bg-[#181d2e] border-[#2c334d] text-zinc-400 hover:text-zinc-200 hover:bg-[#20273d]'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>In Roster</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Roster</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation with horizontal scrolling for mobile */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#202538] bg-[#0c0d14] overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab('build')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'build'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Build & Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('talents')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'talents'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Talents ({character.talents?.length ?? 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('constellations')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'constellations'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Constellations ({character.constellations?.length ?? 0})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div
          ref={scrollContainerRef}
          className="p-5 overflow-y-auto space-y-6 max-h-[calc(92vh-180px)]"
        >
          {/* TAB 1: BUILD & STATS */}
          {activeTab === 'build' && (
            <div className="space-y-5">
              {/* Character Base Stats Card (Lv. 90) */}
              {character.stats && (
                <div className="bg-[#131622] border border-[#23273b] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                    <span className="flex items-center gap-1.5 text-[#d4af37]">
                      <Award className="w-3.5 h-3.5" />
                      <span>Base Attributes (Level 90 / Ascension 6)</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">Unbuffed</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-[#1a1e30] p-2.5 rounded-lg border border-[#29304a]">
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase">Base HP</div>
                      <div className="text-base font-extrabold text-zinc-100">
                        {character.stats.hp.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#1a1e30] p-2.5 rounded-lg border border-[#29304a]">
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase">Base ATK</div>
                      <div className="text-base font-extrabold text-zinc-100">
                        {character.stats.attack.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#1a1e30] p-2.5 rounded-lg border border-[#29304a]">
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase">Base DEF</div>
                      <div className="text-base font-extrabold text-zinc-100">
                        {character.stats.defense.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#1a1e30] p-2.5 rounded-lg border border-[#29304a]">
                      <div className="text-[10px] text-[#d4af37] font-semibold uppercase">
                        {character.stats.specializedStat}
                      </div>
                      <div className="text-base font-extrabold text-[#d4af37]">
                        {character.stats.specializedValue}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Combo & Rotation */}
              {rotationProfile && (
                <div className="bg-[#131622] border border-[#23273b] p-4 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202538] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#d4af37]">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Recommended Combo & Execution</span>
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          rotationProfile.stage === 'on-field-carry'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : rotationProfile.stage === 'buffer-shred'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : rotationProfile.stage === 'sustain-setup'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {rotationProfile.stage === 'on-field-carry'
                          ? 'On-Field Carry'
                          : rotationProfile.stage === 'buffer-shred'
                          ? 'Buffer & Shred'
                          : rotationProfile.stage === 'sustain-setup'
                          ? 'Sustain & Setup'
                          : 'Sub-DPS Deployer'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1 bg-[#1a1e30] px-2 py-0.5 rounded border border-[#29304a]">
                        <span>⏱️</span>
                        <span>~{rotationProfile.estimatedFieldTime}s Field Time</span>
                      </span>
                      {rotationProfile.alternateSequence && (
                        <button
                          type="button"
                          onClick={() => setShowAlternateRotation(!showAlternateRotation)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e2337] hover:bg-[#282e49] text-zinc-300 hover:text-zinc-100 border border-[#2e3552] transition-colors cursor-pointer"
                        >
                          {showAlternateRotation ? 'Standard Combo' : 'Variant / Battery'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="bg-[#0b0c14] p-3 rounded-lg border border-[#1d2133]">
                    <RotationBadgeList
                      actions={
                        showAlternateRotation && rotationProfile.alternateSequence
                          ? rotationProfile.alternateSequence
                          : rotationProfile.primarySequence
                      }
                      size="md"
                    />
                  </div>

                  {/* Strategy Notes */}
                  {rotationProfile.notes && (
                    <div className="text-[11px] text-zinc-300 leading-relaxed bg-[#171a2b]/70 p-2.5 rounded border border-[#262c45] flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                      <span>{rotationProfile.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Best Owned Weapons Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-[#d4af37]" />
                    <span>Best Owned Weapons ({rankedOwnedWeapons.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowManualCustomizer(!showManualCustomizer)}
                    className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{showManualCustomizer ? 'Close Editor' : 'Customise Weapon'}</span>
                  </button>
                </div>

                {/* Collapsible Manual Customizer */}
                {showManualCustomizer && (
                  <form
                    onSubmit={handleSaveCustomWeapon}
                    className="bg-[#10121d] border border-[#2b3149] p-4 rounded-xl space-y-3"
                  >
                    <div className="text-xs font-bold text-[#d4af37]">
                      Equip Custom {character.weapon}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400 font-semibold">Weapon Model</label>
                        <select
                          value={customWeaponKey}
                          onChange={(e) => setCustomWeaponKey(e.target.value)}
                          className="w-full bg-[#181c2c] border border-[#282f48] text-xs text-zinc-100 rounded-lg p-1.5 focus:outline-none focus:border-[#d4af37]"
                        >
                          {(WEAPONS_BY_TYPE[character.weapon] || []).map((w) => (
                            <option key={w.key} value={w.key}>
                              {'★'.repeat(w.rarity)} {w.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 font-semibold">Level</span>
                          <span className="text-[#d4af37] font-bold">Lv. {customLevel}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="90"
                          value={customLevel}
                          onChange={(e) => setCustomLevel(Number(e.target.value))}
                          className="w-full accent-[#d4af37] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400 font-semibold">Refinement</label>
                        <select
                          value={customRefinement}
                          onChange={(e) => setCustomRefinement(Number(e.target.value))}
                          className="w-full bg-[#181c2c] border border-[#282f48] text-xs text-zinc-100 rounded-lg p-1.5 focus:outline-none focus:border-[#d4af37]"
                        >
                          {[1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r}>
                              R{r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-[#1e2336]">
                      <button
                        type="button"
                        onClick={() => setShowManualCustomizer(false)}
                        className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#d4af37] text-black hover:bg-[#e5c158]"
                      >
                        Equip This Weapon
                      </button>
                    </div>
                  </form>
                )}

                {/* Ranked Owned Weapons Cards */}
                {rankedOwnedWeapons.length === 0 ? (
                  <div className="bg-[#131622] border border-[#23273a] p-3.5 rounded-xl text-center text-xs text-zinc-400">
                    No owned {character.weapon} found in armory. Use the Weapon Customizer above to add one!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {rankedOwnedWeapons.map((res) => {
                      const w = res.weapon as OwnedWeapon;
                      const isEquippedHere =
                        w.location === character.id ||
                        (profile?.weapon?.key === w.key && profile?.weapon?.level === w.level);

                      return (
                        <div
                          key={w.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                            isEquippedHere
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : 'bg-[#131622] border-[#23273a] hover:border-[#38405e]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-100">{w.name}</span>
                              <span className="text-xs text-[#d4af37] font-semibold">
                                {'★'.repeat(w.rarity || 4)}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                R{w.refinement}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400">
                                Lv. {w.level}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  res.tier === 'BiS'
                                    ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30'
                                    : res.tier === 'Optimal'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : res.tier === 'Great'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                {res.tier} ({res.relativePercentage}%)
                              </span>
                            </div>

                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                              {res.reason}
                            </p>

                            {res.equippedOn && res.equippedOn !== character.id && (
                              <span className="inline-block mt-1 text-[11px] text-amber-300/80">
                                Currently equipped on <strong>{res.equippedOn}</strong>
                              </span>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isEquippedHere ? (
                              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Equipped</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEquipWeapon(w)}
                                className="px-3 py-1.5 rounded-xl bg-[#1e2336] hover:bg-[#d4af37] text-zinc-200 hover:text-black border border-[#2d344e] text-xs font-bold transition-all cursor-pointer"
                              >
                                Equip
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recommended Weapons */}
              {character.build?.weapons && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-[#d4af37]" />
                    <span>Recommended Weapons</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {character.build.weapons.map((w, idx) => (
                      <div
                        key={w.name + idx}
                        className="bg-[#131622] border border-[#23273a] hover:border-[#38405e] p-3 rounded-xl flex items-start justify-between gap-3 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-100">{w.name}</span>
                            <span className="text-xs text-[#d4af37] font-semibold">
                              {'★'.repeat(w.rarity)}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                                Signature / BiS
                              </span>
                            )}
                          </div>
                          {w.reason && (
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{w.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Artifact Sets */}
              {character.build?.artifacts && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#d4af37]" />
                    <span>Recommended Artifact Sets</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {character.build.artifacts.map((a, idx) => (
                      <div
                        key={a.name + idx}
                        className="bg-[#131622] border border-[#23273a] p-3 rounded-xl flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-100">{a.name}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1e2336] text-[#d4af37] border border-[#2d344e]">
                              {a.pieces}pc Set
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                                Optimal
                              </span>
                            )}
                          </div>
                          {a.reason && (
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{a.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Main Stats & Substats */}
              {character.build?.mainStats && (
                <div className="bg-[#131622] border border-[#23273b] p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Artifact Main Stat Priorities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-[#181c2c] p-2.5 rounded-lg border border-[#262c44]">
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase">Sands</div>
                      <div className="text-xs font-bold text-zinc-100 mt-0.5">
                        {character.build.mainStats.sands.join(' / ')}
                      </div>
                    </div>
                    <div className="bg-[#181c2c] p-2.5 rounded-lg border border-[#262c44]">
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase">Goblet</div>
                      <div className="text-xs font-bold text-zinc-100 mt-0.5">
                        {character.build.mainStats.goblet.join(' / ')}
                      </div>
                    </div>
                    <div className="bg-[#181c2c] p-2.5 rounded-lg border border-[#262c44]">
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase">Circlet</div>
                      <div className="text-xs font-bold text-zinc-100 mt-0.5">
                        {character.build.mainStats.circlet.join(' / ')}
                      </div>
                    </div>
                  </div>

                  {character.build.subStats && (
                    <div className="pt-2 border-t border-[#202538]">
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase mb-1.5">
                        Substat Priority:
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {character.build.subStats.map((sub, idx) => (
                          <span
                            key={sub + idx}
                            className="px-2 py-0.5 rounded bg-[#1e2336] text-[11px] font-semibold text-zinc-200 border border-[#2e354f]"
                          >
                            {idx + 1}. {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TALENTS */}
          {activeTab === 'talents' && (
            <div className="space-y-3">
              {character.talents?.map((talent, idx) => {
                const typeLabel =
                  talent.type === 'normal'
                    ? 'Normal Attack'
                    : talent.type === 'skill'
                      ? 'Elemental Skill'
                      : talent.type === 'burst'
                        ? 'Elemental Burst'
                        : talent.type === 'sprint'
                          ? 'Alternate Sprint'
                          : 'Passive';

                const badgeColor =
                  talent.type === 'burst'
                    ? 'bg-rose-950/50 text-rose-300 border-rose-500/30'
                    : talent.type === 'skill'
                      ? 'bg-sky-950/50 text-sky-300 border-sky-500/30'
                      : talent.type === 'normal'
                        ? 'bg-amber-950/50 text-amber-300 border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700';

                return (
                  <div
                    key={talent.name + idx}
                    className="bg-[#131622] border border-[#23273a] p-4 rounded-xl space-y-2 hover:border-[#333a54] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {talent.icon ? (
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#2d344d] p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={talent.icon}
                            alt={talent.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) parent.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#2d344d] p-1 shrink-0 flex items-center justify-center text-[#d4af37]">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-100">{talent.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                            {typeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line pl-0.5 break-words">
                      {talent.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: CONSTELLATIONS */}
          {activeTab === 'constellations' && (
            <div className="space-y-3">
              {character.constellations?.map((c) => {
                const isUnlocked = isOwned && (profile?.constellation ?? 0) >= c.level;
                return (
                  <div
                    key={c.level}
                    className={`border p-4 rounded-xl space-y-2 transition-colors ${
                      isUnlocked
                        ? 'bg-[#151928] border-[#d4af37]/60 shadow-sm shadow-[#d4af37]/5'
                        : 'bg-[#131622] border-[#23273a] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {c.icon ? (
                          <div
                            className={`w-10 h-10 rounded-xl bg-black/60 border p-1 shrink-0 flex items-center justify-center ${
                              isUnlocked ? 'border-[#d4af37]/50' : 'border-[#2d344d]'
                            }`}
                          >
                            <img
                              src={c.icon}
                              alt={c.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) parent.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#2d344d] p-1 shrink-0 flex items-center justify-center text-[#d4af37]">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-extrabold px-2 py-0.5 rounded border ${
                                isUnlocked
                                  ? 'bg-[#d4af37] text-black border-[#d4af37]'
                                  : 'bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/40'
                              }`}
                            >
                              C{c.level}
                            </span>
                            <span className="text-sm font-bold text-zinc-100">{c.name}</span>
                          </div>
                        </div>
                      </div>
                      {isUnlocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line pl-0.5 break-words">
                      {c.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
