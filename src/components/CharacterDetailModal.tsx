import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
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
  Crown,
  Loader2,
  Compass,
  Clock,
} from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { CharacterPortrait } from './CharacterPortrait';
import { resolveCharacterRotationProfile } from '../engines/rotation-synthesizer';
import { RotationBadgeList } from './RotationBadgeList';
import { rankWeaponsForCharacter } from '../engines/weapon-solver';
import { InfoTooltip } from './InfoTooltip';
import { RecommendationReliabilityBadge } from './RecommendationReliabilityBadge';
import { RecommendationReliabilityBanner } from './RecommendationReliabilityBanner';
import { ReliabilityDetailsPanel } from './ReliabilityDetailsPanel';
import {
  getSavedWeapons,
  saveWeapons,
  getSavedProfiles,
  saveProfiles,
} from '../services/storage';
import {
  equipWeaponToCharacter,
  unequipWeaponFromCharacter,
  syncArmoryOnProfileUpdate,
} from '../services/armory-operations';
import { WEAPONS_BY_TYPE, getWeaponByKey } from '../data/weapons';
import { getTalentScaling, type TalentScalingData } from '../data/talent-scaling';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

function formatTalentValue(val: number, format: string): string {
  switch (format) {
    case 'F1P':
      return (val * 100).toFixed(1) + '%';
    case 'F2P':
      return (val * 100).toFixed(2) + '%';
    case 'P': {
      const pct = val * 100;
      return (pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)) + '%';
    }
    case 'F1':
      return val.toFixed(1);
    case 'F2':
      return val.toFixed(2);
    case 'I':
      return Math.round(val).toString();
    default:
      return String(val);
  }
}

function renderTalentLabel(
  label: string,
  parameters: Record<string, number[]>,
  level: number
): { name: string; value: string } {
  const parts = label.split('|');
  const name = parts[0];
  const template = parts[1] || '';
  const levelIdx = Math.max(0, Math.min(14, level - 1));

  const value = template.replace(/\{param(\d+):([A-Z0-9]+)\}/g, (_, num, fmt) => {
    const key = 'param' + num;
    const arr = parameters[key];
    if (!arr || arr[levelIdx] === undefined) return '?';
    return formatTalentValue(arr[levelIdx], fmt);
  });

  return { name, value };
}

const TALENT_MILESTONES = [
  { level: 1, label: 'Lv. 1', desc: 'Base' },
  { level: 6, label: 'Lv. 6', desc: 'Mid' },
  { level: 9, label: 'Lv. 9', desc: 'High' },
  { level: 10, label: 'Lv. 10', desc: 'Crown', isCrown: true },
  { level: 13, label: 'Lv. 13', desc: 'C3/C5', isConst: true },
];

const CHARACTER_LEVEL_PRESETS = [20, 50, 70, 80, 90];

const CHARACTER_NAME_BY_ID = new Map<string, string>(
  CHARACTERS.map((c) => [c.id, c.name])
);

function getDisplayCharacterName(id: string): string {
  return CHARACTER_NAME_BY_ID.get(id) ?? id;
}

interface CharacterDetailModalProps {
  character: Character | null;
  onClose: () => void;
  isOwned?: boolean;
  onToggleOwned?: (id: string) => void;
  profile?: OwnedCharacterProfile;
  onUpdateProfile?: (profile: OwnedCharacterProfile) => void;
  profiles?: Record<string, OwnedCharacterProfile>;
  onUpdateProfiles?: (profiles: Record<string, OwnedCharacterProfile>) => void;
  weapons?: OwnedWeapon[];
  onUpdateWeapons?: (weapons: OwnedWeapon[]) => void;
  onSelectCharacter?: (char: Character) => void;
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
    bg: 'from-rose-950/40 to-[#121420]',
    border: 'border-rose-500/45',
    text: 'text-rose-300',
    badgeBg: 'bg-rose-950/70 text-rose-200 border-rose-400/40',
    glow: 'shadow-rose-900/20',
  },
  Hydro: {
    bg: 'from-sky-950/40 to-[#121420]',
    border: 'border-sky-500/45',
    text: 'text-sky-300',
    badgeBg: 'bg-sky-950/70 text-sky-200 border-sky-400/40',
    glow: 'shadow-sky-900/20',
  },
  Dendro: {
    bg: 'from-emerald-950/40 to-[#121420]',
    border: 'border-emerald-500/45',
    text: 'text-emerald-300',
    badgeBg: 'bg-emerald-950/70 text-emerald-200 border-emerald-400/40',
    glow: 'shadow-emerald-900/20',
  },
  Electro: {
    bg: 'from-purple-950/40 to-[#121420]',
    border: 'border-purple-500/45',
    text: 'text-purple-300',
    badgeBg: 'bg-purple-950/70 text-purple-200 border-purple-400/40',
    glow: 'shadow-purple-900/20',
  },
  Anemo: {
    bg: 'from-teal-950/40 to-[#121420]',
    border: 'border-teal-500/45',
    text: 'text-teal-300',
    badgeBg: 'bg-teal-950/70 text-teal-200 border-teal-400/40',
    glow: 'shadow-teal-900/20',
  },
  Cryo: {
    bg: 'from-cyan-950/40 to-[#121420]',
    border: 'border-cyan-500/45',
    text: 'text-cyan-200',
    badgeBg: 'bg-cyan-950/70 text-cyan-100 border-cyan-400/40',
    glow: 'shadow-cyan-900/20',
  },
  Geo: {
    bg: 'from-amber-950/40 to-[#121420]',
    border: 'border-amber-500/45',
    text: 'text-amber-300',
    badgeBg: 'bg-amber-950/70 text-amber-200 border-amber-400/40',
    glow: 'shadow-amber-900/20',
  },
};

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character: propCharacter,
  onClose,
  isOwned,
  onToggleOwned,
  profile,
  onUpdateProfile,
  profiles,
  onUpdateProfiles,
  weapons,
  onUpdateWeapons,
  onSelectCharacter,
}) => {
  const [internalCharacter, setInternalCharacter] = useState<Character | null>(propCharacter);
  useEffect(() => {
    setInternalCharacter(propCharacter);
  }, [propCharacter]);

  const character = internalCharacter || propCharacter;

  const [activeTab, setActiveTab] = useState<'build' | 'talents' | 'constellations'>('build');
  const [showAlternateRotation, setShowAlternateRotation] = useState<boolean>(false);
  const [isReliabilityDetailsOpen, setIsReliabilityDetailsOpen] = useState<boolean>(false);
  const reliabilityDetailsId = useId();
  const [transferToast, setTransferToast] = useState<string | null>(null);
  const [talentsSaved, setTalentsSaved] = useState<boolean>(false);

  const handleToggleReliabilityDetails = () => {
    setIsReliabilityDetailsOpen((prev) => !prev);
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const talentsSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useModalAccessibility({
    isOpen: Boolean(character),
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
  });

  useEffect(() => {
    return () => {
      if (transferTimerRef.current) clearTimeout(transferTimerRef.current);
      if (talentsSavedTimerRef.current) clearTimeout(talentsSavedTimerRef.current);
    };
  }, []);

  const activeWeapons = useMemo(() => weapons || getSavedWeapons(), [weapons]);

  // Retain full RecommendationCollection envelope (items + reliability) at modal boundary
  const weaponRankingResult = useMemo(() => {
    if (!character) return null;
    return rankWeaponsForCharacter(character, activeWeapons);
  }, [character, activeWeapons]);
  const rankedOwnedWeapons = weaponRankingResult?.items ?? [];

  const [showManualCustomizer, setShowManualCustomizer] = useState(false);
  const [customWeaponKey, setCustomWeaponKey] = useState<string>('');
  const [customLevel, setCustomLevel] = useState<number>(profile?.weapon?.level ?? 90);
  const [customRefinement, setCustomRefinement] = useState<number>(profile?.weapon?.refinement ?? 1);

  // Dynamic talent scaling state (initialized from saved profile if available)
  const [talentLevels, setTalentLevels] = useState<{ normal: number; skill: number; burst: number }>({
    normal: profile?.talents?.auto || 10,
    skill: profile?.talents?.skill || 10,
    burst: profile?.talents?.burst || 10,
  });
  const [scalingData, setScalingData] = useState<TalentScalingData | null>(null);
  const [isLoadingScaling, setIsLoadingScaling] = useState(false);

  useEffect(() => {
    if (!character) {
      setScalingData(null);
      return;
    }
    let active = true;
    setIsLoadingScaling(true);
    setTalentsSaved(false);
    const initialNormal = profile?.talents?.auto || 10;
    const initialSkill = profile?.talents?.skill || 10;
    const initialBurst = profile?.talents?.burst || 10;
    setTalentLevels({ normal: initialNormal, skill: initialSkill, burst: initialBurst });
    const charKey = character.id || character.name;
    getTalentScaling(charKey)
      .then((data) => {
        if (active) {
          if (!data && character.name) {
            getTalentScaling(character.name).then((fb) => {
              if (active) {
                setScalingData(fb || null);
                setIsLoadingScaling(false);
              }
            });
          } else {
            setScalingData(data || null);
            setIsLoadingScaling(false);
          }
        }
      })
      .catch(() => {
        if (active) {
          setScalingData(null);
          setIsLoadingScaling(false);
        }
      });
    return () => {
      active = false;
    };
  }, [character?.id, character?.name, profile?.talents?.auto, profile?.talents?.skill, profile?.talents?.burst]);

  // Sync customizer defaults with character weapon type
  useEffect(() => {
    if (character) {
      const typeList = WEAPONS_BY_TYPE[character.weapon] || [];
      setCustomWeaponKey(profile?.weapon?.key || typeList[0]?.key || '');
      setCustomLevel(profile?.weapon?.level ?? 90);
      setCustomRefinement(profile?.weapon?.refinement ?? 1);
    }
  }, [character?.id, character?.weapon, profile?.weapon?.key, profile?.weapon?.level, profile?.weapon?.refinement]);

  const showTransferFeedback = (msg: string) => {
    setTransferToast(msg);
    if (transferTimerRef.current) clearTimeout(transferTimerRef.current);
    transferTimerRef.current = setTimeout(() => {
      setTransferToast(null);
      transferTimerRef.current = null;
    }, 4500);
  };

  const handleEquipWeapon = (weaponToEquip: OwnedWeapon) => {
    if (!character) return;

    const currentProfiles = profiles || getSavedProfiles();
    const { updatedWeapons, updatedProfiles, transferredFrom } = equipWeaponToCharacter(
      weaponToEquip.id,
      character.id,
      activeWeapons,
      currentProfiles,
    );

    if (transferredFrom) {
      showTransferFeedback(
        `Transferred ${weaponToEquip.name} from ${getDisplayCharacterName(transferredFrom)}`
      );
    }

    if (onUpdateProfiles) {
      onUpdateProfiles(updatedProfiles);
    } else {
      saveProfiles(updatedProfiles);
    }

    if (onUpdateProfile && updatedProfiles[character.id]) {
      onUpdateProfile(updatedProfiles[character.id]);
    }

    if (onUpdateWeapons) {
      onUpdateWeapons(updatedWeapons);
    } else {
      saveWeapons(updatedWeapons);
    }
  };

  const handleUnequipWeapon = () => {
    if (!character) return;
    const currentProfiles = profiles || getSavedProfiles();
    const { updatedWeapons, updatedProfiles } = unequipWeaponFromCharacter(
      character.id,
      activeWeapons,
      currentProfiles,
    );

    if (onUpdateProfiles) {
      onUpdateProfiles(updatedProfiles);
    } else {
      saveProfiles(updatedProfiles);
    }

    if (onUpdateProfile && updatedProfiles[character.id]) {
      onUpdateProfile(updatedProfiles[character.id]);
    }

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

    const clampedLevel = Math.max(1, Math.min(90, Math.round(customLevel) || 90));
    const newEquipped = {
      key: dbW.key,
      name: dbW.name,
      level: clampedLevel,
      refinement: customRefinement,
      rarity: dbW.rarity,
    };

    const nextProfile: OwnedCharacterProfile = {
      id: character.id,
      level: profile?.level ?? 90,
      constellation: profile?.constellation ?? 0,
      talents: profile?.talents,
      weapon: newEquipped,
    };

    const currentProfiles = profiles || getSavedProfiles();
    const updatedProfiles = {
      ...currentProfiles,
      [character.id]: nextProfile,
    };

    if (onUpdateProfiles) {
      onUpdateProfiles(updatedProfiles);
    } else {
      saveProfiles(updatedProfiles);
    }

    if (onUpdateProfile) {
      onUpdateProfile(nextProfile);
    }

    const updatedWeapons = syncArmoryOnProfileUpdate(activeWeapons, nextProfile);

    if (onUpdateWeapons) {
      onUpdateWeapons(updatedWeapons);
    } else {
      saveWeapons(updatedWeapons);
    }

    setShowManualCustomizer(false);
    showTransferFeedback(`Equipped ${dbW.name} (Lv. ${clampedLevel}, R${customRefinement})`);
  };

  const handleSaveTalents = () => {
    if (!character || !onUpdateProfile) return;
    onUpdateProfile({
      id: character.id,
      level: profile?.level ?? 90,
      constellation: profile?.constellation ?? 0,
      weapon: profile?.weapon,
      talents: {
        auto: talentLevels.normal,
        skill: talentLevels.skill,
        burst: talentLevels.burst,
      },
    });
    setTalentsSaved(true);
    if (talentsSavedTimerRef.current) clearTimeout(talentsSavedTimerRef.current);
    talentsSavedTimerRef.current = setTimeout(() => {
      setTalentsSaved(false);
      talentsSavedTimerRef.current = null;
    }, 2500);
  };

  // Reset alternate rotation view and reliability disclosure on character switch
  useEffect(() => {
    setShowAlternateRotation(false);
    setIsReliabilityDetailsOpen(false);
  }, [character?.id]);

  const rotationProfile = character ? resolveCharacterRotationProfile(character) : null;

  // Reset scroll position when character or tab changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [character?.id, activeTab]);

  if (!character) return null;

  const theme = ELEMENT_THEMES[character.element] || ELEMENT_THEMES.Pyro;
  const currentCharLevel = profile?.level ?? 90;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${character.name} Details`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`bg-[#121420] border ${theme.border} w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl ${theme.glow} flex flex-col overflow-hidden text-zinc-100 focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className={`bg-gradient-to-r ${theme.bg} p-4 sm:p-5 border-b border-[#24293d] relative shrink-0`}>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 min-w-[40px] min-h-[40px] rounded-xl bg-black/45 hover:bg-black/75 text-zinc-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-11">
            {/* Avatar thumbnail */}
            <CharacterPortrait
              src={character.icon}
              name={character.name}
              element={character.element}
              rarity={character.rarity}
              size="xl"
              showRarity={true}
              className={`border-2 ${theme.border} shrink-0`}
            />

            {/* Information */}
            <div className="space-y-1.5 min-w-0 flex-1">
              {character.title && (
                <div className="text-xs font-serif italic text-zinc-300">{character.title}</div>
              )}
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-zinc-100 leading-tight">
                {character.name}
              </h2>
              {character.constellationName && (
                <div className="text-xs text-zinc-300 font-mono">
                  Constellation: {character.constellationName}
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${theme.badgeBg}`}>
                  {character.element}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#1a1e2e] text-zinc-200 border border-[#323954]">
                  {character.weapon}
                </span>
                {character.roles.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 rounded-lg text-xs font-medium bg-black/45 text-zinc-200 border border-white/10"
                  >
                    {role}
                  </span>
                ))}
              </div>

              {/* Traveler Element Switcher */}
              {character.name.includes('Traveler') && (
                <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#f3cf58] flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Traveler Element:</span>
                  </span>
                  <div
                    role="group"
                    aria-label="Traveler Element"
                    className="flex flex-wrap items-center gap-1 bg-[#0e101a] p-1 rounded-lg border border-[#24293d]"
                  >
                    {(['Anemo', 'Geo', 'Electro', 'Dendro', 'Hydro', 'Pyro'] as Element[]).map((elem) => {
                      const isCurrent = character.element === elem;
                      const targetTraveler = CHARACTERS.find(
                        (c) => c.name.includes('Traveler') && c.element === elem
                      );
                      return (
                        <button
                          key={elem}
                          type="button"
                          aria-pressed={isCurrent}
                          onClick={() => {
                            if (targetTraveler) {
                              setInternalCharacter(targetTraveler);
                              onSelectCharacter?.(targetTraveler);
                            }
                          }}
                          className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer border ${
                            isCurrent
                              ? 'bg-[#d4af37] text-[#0a0b0e] border-[#d4af37] shadow-sm'
                              : 'text-zinc-300 hover:text-white border-transparent hover:bg-[#1f243b]'
                          }`}
                          title={`Switch to Traveler (${elem})`}
                        >
                          {elem}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interactive Character Level & Constellation Selectors when owned */}
              {isOwned && onUpdateProfile && (
                <div className="pt-1.5 flex flex-col gap-2">
                  {/* Character Level */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-300">Level:</span>
                    <div
                      role="group"
                      aria-label="Character level presets"
                      className="flex flex-wrap items-center gap-1 bg-[#0e101a] p-0.5 rounded-lg border border-[#24293d]"
                    >
                      {CHARACTER_LEVEL_PRESETS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          aria-pressed={currentCharLevel === lvl}
                          onClick={() =>
                            onUpdateProfile({
                              id: character.id,
                              level: lvl,
                              constellation: profile?.constellation ?? 0,
                              weapon: profile?.weapon,
                              talents: profile?.talents,
                            })
                          }
                          className={`min-w-[36px] min-h-[32px] sm:min-h-[28px] px-2 rounded-md text-xs font-bold transition-colors cursor-pointer tabular-nums ${
                            currentCharLevel === lvl
                              ? 'bg-[#d4af37] text-[#0a0b0e] font-extrabold shadow-sm'
                              : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={90}
                        aria-label="Exact character level"
                        value={currentCharLevel}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          if (Number.isNaN(raw)) return;
                          const clamped = Math.max(1, Math.min(90, raw));
                          onUpdateProfile({
                            id: character.id,
                            level: clamped,
                            constellation: profile?.constellation ?? 0,
                            weapon: profile?.weapon,
                            talents: profile?.talents,
                          });
                        }}
                        className="w-14 min-h-[32px] sm:min-h-[28px] bg-[#161928] border border-[#323954] rounded-md px-1.5 text-center text-xs font-mono font-bold text-[#f3cf58] tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Constellation */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-300">Constellation:</span>
                    <div
                      role="group"
                      aria-label="Character constellation"
                      className="flex flex-wrap items-center gap-1 bg-[#0e101a] p-0.5 rounded-lg border border-[#24293d]"
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          aria-pressed={(profile?.constellation ?? 0) === lvl}
                          onClick={() =>
                            onUpdateProfile({
                              id: character.id,
                              level: profile?.level ?? 90,
                              constellation: lvl,
                              weapon: profile?.weapon,
                              talents: profile?.talents,
                            })
                          }
                          className={`min-w-[34px] min-h-[34px] sm:min-w-[30px] sm:min-h-[28px] rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            (profile?.constellation ?? 0) === lvl
                              ? 'bg-[#d4af37] text-[#0a0b0e] font-extrabold shadow-sm'
                              : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
                          }`}
                        >
                          C{lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Equipped Weapon Preview */}
              {profile?.weapon && (() => {
                const canonical = getWeaponByKey(profile.weapon.key) || getWeaponByKey(profile.weapon.name);
                const displayRarity = canonical?.rarity || profile.weapon.rarity || 4;
                return (
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-200">
                    <Swords className="w-3.5 h-3.5 text-[#d4af37] shrink-0" aria-hidden="true" />
                    <span>
                      Equipped: <strong className="text-white">{canonical?.name || profile.weapon.name}</strong> (Lv. {profile.weapon.level}, R{profile.weapon.refinement})
                    </span>
                    <span className="text-xs text-[#f3cf58] font-semibold" aria-label={`${displayRarity} star weapon`}>
                      {'★'.repeat(Math.max(1, Math.min(5, Math.floor(displayRarity))))}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Owned status button if handler provided */}
            {onToggleOwned && (
              <div className="sm:ml-auto shrink-0 mt-1 sm:mt-0">
                <button
                  type="button"
                  aria-pressed={Boolean(isOwned)}
                  onClick={() => onToggleOwned(character.id)}
                  className={`min-h-[42px] sm:min-h-[36px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    isOwned
                      ? 'bg-[#d4af37] border-[#d4af37] text-[#0a0b0e] hover:bg-[#e5c14d]'
                      : 'bg-[#1a1e2e] border-[#323954] text-zinc-200 hover:text-white hover:bg-[#242a40]'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                      <span>In Roster</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add to Roster</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation with horizontal scrolling for mobile */}
        <div
          role="tablist"
          aria-label="Character sections"
          className="flex items-center gap-1 px-4 sm:px-5 border-b border-[#24293d] bg-[#0e1019] overflow-x-auto touch-pan-x whitespace-nowrap shrink-0"
        >
          <button
            id="char-tab-build"
            type="button"
            role="tab"
            aria-selected={activeTab === 'build'}
            aria-controls="char-panel-build"
            onClick={() => setActiveTab('build')}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'build'
                ? 'border-[#d4af37] text-[#f3cf58]'
                : 'border-transparent text-zinc-300 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Build &amp; Stats</span>
          </button>
          <button
            id="char-tab-talents"
            type="button"
            role="tab"
            aria-selected={activeTab === 'talents'}
            aria-controls="char-panel-talents"
            onClick={() => setActiveTab('talents')}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'talents'
                ? 'border-[#d4af37] text-[#f3cf58]'
                : 'border-transparent text-zinc-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Talents ({character.talents?.length ?? 0})</span>
          </button>
          <button
            id="char-tab-constellations"
            type="button"
            role="tab"
            aria-selected={activeTab === 'constellations'}
            aria-controls="char-panel-constellations"
            onClick={() => setActiveTab('constellations')}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'constellations'
                ? 'border-[#d4af37] text-[#f3cf58]'
                : 'border-transparent text-zinc-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Constellations ({character.constellations?.length ?? 0})</span>
          </button>
        </div>

        {/* Scrollable Tab Body (flex-1 min-h-0 guarantees reliable scrolling on all viewports) */}
        <div
          ref={scrollContainerRef}
          className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-6"
        >
          {/* TAB 1: BUILD & STATS */}
          {activeTab === 'build' && (
            <div
              id="char-panel-build"
              role="tabpanel"
              aria-labelledby="char-tab-build"
              className="space-y-5"
            >
              {/* Character Base Stats Card (Lv. 90) */}
              {character.stats && (
                <div className="bg-[#151826] border border-[#24293d] p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#f3cf58]">
                      <Award className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Base Attributes (Level 90 / Ascension 6)</span>
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">Unbuffed</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-[#1a1e2e] p-2.5 rounded-lg border border-[#2c334d]">
                      <div className="text-[11px] text-zinc-300 font-semibold uppercase">Base HP</div>
                      <div className="text-base font-extrabold text-zinc-100 tabular-nums">
                        {character.stats.hp.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#1a1e2e] p-2.5 rounded-lg border border-[#2c334d]">
                      <div className="text-[11px] text-zinc-300 font-semibold uppercase">Base ATK</div>
                      <div className="text-base font-extrabold text-zinc-100 tabular-nums">
                        {character.stats.attack.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#1a1e2e] p-2.5 rounded-lg border border-[#2c334d]">
                      <div className="text-[11px] text-zinc-300 font-semibold uppercase">Base DEF</div>
                      <div className="text-base font-extrabold text-zinc-100 tabular-nums">
                        {character.stats.defense.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#1a1e2e] p-2.5 rounded-lg border border-[#2c334d]">
                      <div className="text-[11px] text-[#f3cf58] font-semibold uppercase">
                        {character.stats.specializedStat}
                      </div>
                      <div className="text-base font-extrabold text-[#f3cf58] tabular-nums">
                        {character.stats.specializedValue}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Combo & Rotation */}
              {rotationProfile && (
                <div className="bg-[#151826] border border-[#24293d] p-4 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24293d] pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#f3cf58]">
                        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Recommended Combo &amp; Execution</span>
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          rotationProfile.stage === 'on-field-carry'
                            ? 'bg-purple-500/20 text-purple-200 border-purple-400/40'
                            : rotationProfile.stage === 'buffer-shred'
                              ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                              : rotationProfile.stage === 'sustain-setup'
                                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                                : 'bg-sky-500/20 text-sky-200 border-sky-400/40'
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

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-zinc-200 inline-flex items-center gap-1.5 bg-[#1a1e2e] px-2.5 py-1 rounded-lg border border-[#2c334d]">
                        <Clock className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                        <span>~{rotationProfile.estimatedFieldTime}s Field Time</span>
                      </span>
                      {rotationProfile.alternateSequence && (
                        <button
                          type="button"
                          aria-pressed={showAlternateRotation}
                          onClick={() => setShowAlternateRotation(!showAlternateRotation)}
                          className="min-h-[32px] text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#1e2337] hover:bg-[#282e49] text-zinc-200 hover:text-white border border-[#323954] transition-colors cursor-pointer"
                        >
                          {showAlternateRotation ? 'Standard Combo' : 'Variant / Battery'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="bg-[#0c0e17] p-3 rounded-lg border border-[#202538]">
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
                    <div className="text-xs text-zinc-200 leading-relaxed bg-[#181c2c] p-3 rounded-lg border border-[#282f48] flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{rotationProfile.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Best Owned Weapons Section */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                      <span>Estimated Weapon Suitability ({rankedOwnedWeapons.length})</span>
                      <InfoTooltip
                        title="Estimated Weapon Suitability"
                        content="Ranks weapons by class compatibility, base ATK, optimal substats, refinements, and team synergy."
                      />
                    </h3>
                    <RecommendationReliabilityBadge
                      reliability={weaponRankingResult?.reliability}
                      size="sm"
                      detailsControlsId={reliabilityDetailsId}
                      isDetailsOpen={isReliabilityDetailsOpen}
                      onToggleDetails={handleToggleReliabilityDetails}
                    />
                  </div>
                  <button
                    type="button"
                    aria-expanded={showManualCustomizer}
                    onClick={() => setShowManualCustomizer(!showManualCustomizer)}
                    className="min-h-[36px] px-2.5 rounded-lg text-xs text-[#f3cf58] hover:bg-[#d4af37]/10 flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{showManualCustomizer ? 'Close Editor' : 'Customise Weapon'}</span>
                  </button>
                </div>

                <RecommendationReliabilityBanner
                  reliability={weaponRankingResult?.reliability}
                  contextLabel="Weapon Suitability"
                  detailsControlsId={reliabilityDetailsId}
                  isDetailsOpen={isReliabilityDetailsOpen}
                  onToggleDetails={handleToggleReliabilityDetails}
                />

                <ReliabilityDetailsPanel
                  id={reliabilityDetailsId}
                  reliability={weaponRankingResult?.reliability}
                  isOpen={isReliabilityDetailsOpen}
                  onClose={() => setIsReliabilityDetailsOpen(false)}
                  contextLabel="Weapon Suitability"
                />

                {/* Collapsible Manual Customizer */}
                {showManualCustomizer && (
                  <form
                    onSubmit={handleSaveCustomWeapon}
                    className="bg-[#10121e] border border-[#323954] p-4 rounded-xl space-y-3.5"
                  >
                    <div className="text-xs font-bold text-[#f3cf58]">
                      Equip Custom {character.weapon}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="custom-weapon-model"
                          className="block text-xs text-zinc-300 font-semibold"
                        >
                          Weapon Model
                        </label>
                        <select
                          id="custom-weapon-model"
                          value={customWeaponKey}
                          onChange={(e) => setCustomWeaponKey(e.target.value)}
                          className="w-full min-h-[40px] sm:min-h-[36px] bg-[#181c2c] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-1.5 focus:border-[#d4af37]"
                        >
                          {(WEAPONS_BY_TYPE[character.weapon] || []).map((w) => (
                            <option key={w.key} value={w.key}>
                              {'★'.repeat(Math.max(1, Math.min(5, Math.floor(w.rarity))))} {w.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="custom-weapon-level" className="text-zinc-300 font-semibold">
                            Level
                          </label>
                          <span className="text-[#f3cf58] font-bold font-mono">Lv. {customLevel}</span>
                        </div>
                        <input
                          id="custom-weapon-level"
                          type="range"
                          min="1"
                          max="90"
                          aria-valuetext={`Level ${customLevel}`}
                          value={customLevel}
                          onChange={(e) => setCustomLevel(Number(e.target.value))}
                          className="w-full accent-[#d4af37] cursor-pointer h-2"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="custom-weapon-refinement"
                          className="block text-xs text-zinc-300 font-semibold"
                        >
                          Refinement
                        </label>
                        <select
                          id="custom-weapon-refinement"
                          value={customRefinement}
                          onChange={(e) => setCustomRefinement(Number(e.target.value))}
                          className="w-full min-h-[40px] sm:min-h-[36px] bg-[#181c2c] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-1.5 focus:border-[#d4af37]"
                        >
                          {[1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r}>
                              R{r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#24293d]">
                      <button
                        type="button"
                        onClick={() => setShowManualCustomizer(false)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#1a1e2e] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold bg-[#d4af37] text-[#0a0b0e] hover:bg-[#e5c14d] cursor-pointer"
                      >
                        Equip This Weapon
                      </button>
                    </div>
                  </form>
                )}

                {/* Transfer Notification Toast */}
                {transferToast && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="bg-amber-950/60 border border-amber-400/50 text-amber-100 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                      <span>{transferToast}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTransferToast(null)}
                      aria-label="Dismiss weapon update"
                      className="min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center text-amber-200 hover:text-white hover:bg-amber-500/20 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* Ranked Owned Weapons Cards */}
                {rankedOwnedWeapons.length === 0 ? (
                  <div className="bg-[#151826] border border-[#24293d] p-4 rounded-xl text-center text-xs text-zinc-300">
                    No owned {character.weapon} found in your armory. Use{' '}
                    <strong className="text-[#f3cf58]">Customise Weapon</strong> above to equip one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {rankedOwnedWeapons.map((res) => {
                      const w = res.weapon as OwnedWeapon;
                      const canonicalWeapon = getWeaponByKey(w.key) || getWeaponByKey(w.name);
                      const displayRarity = canonicalWeapon?.rarity || w.rarity || 4;
                      const displayName = canonicalWeapon?.name || w.name;
                      const profileWeapon = profile?.weapon;
                      const profileWeaponCanonical = profileWeapon
                        ? getWeaponByKey(profileWeapon.key) || getWeaponByKey(profileWeapon.name)
                        : undefined;
                      const isEquippedHere =
                        w.location === character.id ||
                        (Boolean(profileWeapon) &&
                          (canonicalWeapon?.key && profileWeaponCanonical?.key
                            ? canonicalWeapon.key === profileWeaponCanonical.key
                            : w.key === profileWeapon?.key) &&
                          profileWeapon?.level === w.level);

                      return (
                        <div
                          key={w.id}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isEquippedHere
                              ? 'bg-emerald-950/25 border-emerald-400/50'
                              : 'bg-[#151826] border-[#24293d] hover:border-[#38405e]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-zinc-100">{displayName}</span>
                              <span className="text-xs text-[#f3cf58] font-semibold">
                                {'★'.repeat(Math.max(1, Math.min(5, Math.floor(displayRarity))))}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-amber-300">
                                R{w.refinement}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-300">
                                Lv. {w.level}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                  res.tier === 'BiS'
                                    ? 'bg-[#d4af37]/20 text-[#f3cf58] border-[#d4af37]/40'
                                    : res.tier === 'Optimal'
                                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                                      : res.tier === 'Great'
                                        ? 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                                        : 'bg-[#1f2438] text-zinc-200 border-[#323954]'
                                }`}
                                title="Estimated Weapon Suitability"
                              >
                                {res.tier} ({res.suitabilityScore ?? res.relativePercentage}% Suitability)
                              </span>
                            </div>

                            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                              {res.reason}
                            </p>

                            {res.equippedOn && res.equippedOn !== character.id && (
                              <span className="inline-block mt-1 text-xs text-amber-200">
                                Currently equipped on{' '}
                                <strong className="font-semibold">
                                  {getDisplayCharacterName(res.equippedOn)}
                                </strong>
                              </span>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center justify-end gap-2">
                            {isEquippedHere ? (
                              <>
                                <div className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Equipped</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleUnequipWeapon}
                                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#1a1e2e] hover:bg-rose-950/70 text-zinc-200 hover:text-rose-100 border border-[#323954] hover:border-rose-400/50 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Unequip to inventory bag"
                                >
                                  Unequip
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEquipWeapon(w)}
                                className="min-h-[40px] sm:min-h-[36px] px-4 py-1.5 rounded-xl bg-[#1e2336] hover:bg-[#d4af37] text-zinc-100 hover:text-[#0a0b0e] border border-[#323954] hover:border-[#d4af37] text-xs font-bold transition-colors cursor-pointer"
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
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                    <span>Recommended Weapons</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {character.build.weapons.map((w, idx) => {
                      const canonical = getWeaponByKey(w.name);
                      const displayRarity = canonical?.rarity || w.rarity || 4;
                      const displayName = canonical?.name || w.name;
                      return (
                        <div
                          key={w.name + idx}
                          className="bg-[#151826] border border-[#24293d] hover:border-[#38405e] p-3.5 rounded-xl flex items-start justify-between gap-3 transition-colors"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-zinc-100">{displayName}</span>
                              <span className="text-xs text-[#f3cf58] font-semibold">
                                {'★'.repeat(Math.max(1, Math.min(5, Math.floor(displayRarity))))}
                              </span>
                              {idx === 0 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3cf58] border border-[#d4af37]/40">
                                  Signature / BiS
                                </span>
                              )}
                            </div>
                            {w.reason && (
                              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{w.reason}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Artifact Sets */}
              {character.build?.artifacts && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                    <span>Recommended Artifact Sets</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {character.build.artifacts.map((a, idx) => (
                      <div
                        key={a.name + idx}
                        className="bg-[#151826] border border-[#24293d] p-3.5 rounded-xl flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-zinc-100">{a.name}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1e2336] text-[#f3cf58] border border-[#323954]">
                              {a.pieces}pc Set
                            </span>
                            {idx === 0 && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-200 border border-emerald-400/40">
                                Optimal
                              </span>
                            )}
                          </div>
                          {a.reason && (
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{a.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Main Stats & Substats */}
              {character.build?.mainStats && (
                <div className="bg-[#151826] border border-[#24293d] p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Artifact Main Stat Priorities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-[#1a1e2e] p-3 rounded-lg border border-[#2c334d]">
                      <div className="text-[11px] text-zinc-300 font-semibold uppercase">Sands</div>
                      <div className="text-xs font-bold text-zinc-100 mt-0.5">
                        {character.build.mainStats.sands.join(' / ')}
                      </div>
                    </div>
                    <div className="bg-[#1a1e2e] p-3 rounded-lg border border-[#2c334d]">
                      <div className="text-[11px] text-zinc-300 font-semibold uppercase">Goblet</div>
                      <div className="text-xs font-bold text-zinc-100 mt-0.5">
                        {character.build.mainStats.goblet.join(' / ')}
                      </div>
                    </div>
                    <div className="bg-[#1a1e2e] p-3 rounded-lg border border-[#2c334d]">
                      <div className="text-[11px] text-zinc-300 font-semibold uppercase">Circlet</div>
                      <div className="text-xs font-bold text-zinc-100 mt-0.5">
                        {character.build.mainStats.circlet.join(' / ')}
                      </div>
                    </div>
                  </div>

                  {character.build.subStats && (
                    <div className="pt-2.5 border-t border-[#24293d]">
                      <div className="text-[11px] text-zinc-300 font-semibold uppercase mb-1.5">
                        Substat Priority:
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {character.build.subStats.map((sub, idx) => (
                          <span
                            key={sub + idx}
                            className="px-2.5 py-1 rounded-lg bg-[#1e2336] text-xs font-semibold text-zinc-100 border border-[#323954]"
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
            <div
              id="char-panel-talents"
              role="tabpanel"
              aria-labelledby="char-tab-talents"
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap bg-[#151826] p-3.5 rounded-xl border border-[#24293d]">
                <span className="text-xs text-zinc-200 font-medium">
                  Dynamic Level 1–15 Attribute Multipliers
                </span>
                {isOwned && onUpdateProfile && (
                  <button
                    type="button"
                    onClick={handleSaveTalents}
                    className={`min-h-[38px] text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      talentsSaved
                        ? 'bg-emerald-600/25 border-emerald-400/60 text-emerald-200'
                        : 'bg-[#d4af37]/15 hover:bg-[#d4af37]/30 text-[#f3cf58] border-[#d4af37]/45'
                    }`}
                    title="Save current talent levels (Lv 1–15) to owned profile"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {talentsSaved
                        ? `Saved Lv. ${talentLevels.normal} / ${talentLevels.skill} / ${talentLevels.burst}`
                        : `Save (Lv. ${talentLevels.normal} / ${talentLevels.skill} / ${talentLevels.burst}) to Profile`}
                    </span>
                  </button>
                )}
              </div>

              {isLoadingScaling && (
                <div
                  role="status"
                  className="bg-[#151826] border border-[#24293d] p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs text-zinc-300"
                >
                  <Loader2
                    className="w-4 h-4 animate-spin motion-reduce:animate-none text-[#d4af37]"
                    aria-hidden="true"
                  />
                  <span>Loading dynamic Level 1–15 talent scaling curves…</span>
                </div>
              )}

              {character.talents?.map((talent, idx) => {
                const isCombatTalent =
                  talent.type === 'normal' || talent.type === 'skill' || talent.type === 'burst';
                const combatType = isCombatTalent
                  ? (talent.type as 'normal' | 'skill' | 'burst')
                  : null;
                const currentLevel = combatType ? talentLevels[combatType] : 1;
                const combatSkill = combatType && scalingData ? scalingData[combatType] : undefined;

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
                    ? 'bg-rose-950/60 text-rose-200 border-rose-400/40'
                    : talent.type === 'skill'
                      ? 'bg-sky-950/60 text-sky-200 border-sky-400/40'
                      : talent.type === 'normal'
                        ? 'bg-amber-950/60 text-amber-200 border-amber-400/40'
                        : 'bg-[#1e2336] text-zinc-200 border-[#323954]';

                return (
                  <div
                    key={talent.name + idx}
                    className="bg-[#151826] border border-[#24293d] p-4 rounded-xl space-y-3 hover:border-[#323954] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        {talent.icon ? (
                          <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#323954] p-1 shrink-0 flex items-center justify-center">
                            <img
                              src={talent.icon}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) parent.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#323954] p-1 shrink-0 flex items-center justify-center text-[#d4af37]">
                            <BookOpen className="w-5 h-5" aria-hidden="true" />
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-zinc-100">{talent.name}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                            {typeLabel}
                          </span>
                        </div>
                      </div>

                      {/* Level Indicator for combat talents */}
                      {combatType && (
                        <div className="flex items-center gap-1.5 bg-[#0c0e17] px-2.5 py-1 rounded-lg border border-[#282f48]">
                          <span className="text-xs text-zinc-300 font-medium">Talent Level:</span>
                          <span className="text-xs font-extrabold text-[#f3cf58] tabular-nums">
                            Lv. {currentLevel}
                          </span>
                          {currentLevel === 10 && (
                            <Crown className="w-3.5 h-3.5 text-[#f3cf58]" aria-label="Crowned" />
                          )}
                          {currentLevel > 10 && (
                            <span className="text-[11px] px-1.5 py-0.5 bg-[#d4af37]/20 text-[#f3cf58] rounded font-bold">
                              C{currentLevel >= 13 ? '3/5' : '+'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line pl-0.5 break-words">
                      {talent.description}
                    </p>

                    {/* Interactive Level Slider & Parameter Table for Combat Talents */}
                    {combatType && (
                      <div className="pt-2.5 border-t border-[#24293d] space-y-3">
                        <div className="bg-[#0e101a] p-3.5 rounded-xl border border-[#24293d] space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                              <span>Dynamic Level Slider (1–15):</span>
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {TALENT_MILESTONES.map((m) => (
                                <button
                                  key={m.level}
                                  type="button"
                                  aria-pressed={currentLevel === m.level}
                                  onClick={() => {
                                    setTalentsSaved(false);
                                    setTalentLevels((prev) => ({
                                      ...prev,
                                      [combatType]: m.level,
                                    }));
                                  }}
                                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                                    currentLevel === m.level
                                      ? 'bg-[#d4af37] text-[#0a0b0e] border-[#d4af37] shadow-sm'
                                      : 'bg-[#181d2f] text-zinc-200 hover:text-white border-[#323954] hover:bg-[#222942]'
                                  }`}
                                  title={`Set to ${m.label} (${m.desc})`}
                                >
                                  {m.label}
                                  {m.isCrown ? ' 👑' : m.isConst ? ' ⚡' : ''}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-zinc-300 shrink-0">Lv.1</span>
                            <input
                              type="range"
                              min={1}
                              max={15}
                              step={1}
                              aria-label={`${talent.name} level`}
                              aria-valuetext={`Level ${currentLevel}`}
                              value={currentLevel}
                              onChange={(e) => {
                                setTalentsSaved(false);
                                setTalentLevels((prev) => ({
                                  ...prev,
                                  [combatType]: parseInt(e.target.value, 10),
                                }));
                              }}
                              className="w-full accent-[#d4af37] cursor-pointer h-2 bg-[#1f243b] rounded-lg"
                            />
                            <span className="text-xs font-mono text-[#f3cf58] font-bold shrink-0">
                              Lv.15
                            </span>
                          </div>
                        </div>

                        {/* Scaling Parameters Table */}
                        {combatSkill && combatSkill.labels && combatSkill.labels.length > 0 ? (
                          <div className="bg-[#0b0d15] rounded-xl border border-[#24293d] overflow-hidden">
                            <div className="px-3.5 py-2 bg-[#141726] border-b border-[#24293d] flex items-center justify-between text-xs font-bold text-zinc-300">
                              <span>Skill Attribute Scaling</span>
                              <span className="text-[#f3cf58]">Level {currentLevel} Multiplier</span>
                            </div>
                            <div className="divide-y divide-[#1a1f33] max-h-64 overflow-y-auto">
                              {combatSkill.labels.map((lbl, lIdx) => {
                                const { name, value } = renderTalentLabel(
                                  lbl,
                                  combatSkill.parameters,
                                  currentLevel
                                );
                                return (
                                  <div
                                    key={lIdx}
                                    className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs hover:bg-[#131625] transition-colors"
                                  >
                                    <span className="text-zinc-200 font-medium">{name}</span>
                                    <span className="text-[#f3cf58] font-mono font-bold shrink-0 tabular-nums">
                                      {value}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-400 italic px-2 py-1">
                            {isLoadingScaling
                              ? 'Loading attribute scaling curve…'
                              : 'No parameter curve available for this talent level.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: CONSTELLATIONS */}
          {activeTab === 'constellations' && (
            <div
              id="char-panel-constellations"
              role="tabpanel"
              aria-labelledby="char-tab-constellations"
              className="space-y-3"
            >
              {character.constellations?.map((c) => {
                const isUnlocked = isOwned && (profile?.constellation ?? 0) >= c.level;
                return (
                  <div
                    key={c.level}
                    className={`border p-4 rounded-xl space-y-2.5 transition-colors ${
                      isUnlocked
                        ? 'bg-[#171b2b] border-[#d4af37]/65 shadow-sm shadow-[#d4af37]/5'
                        : 'bg-[#131622] border-[#24293d]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        {c.icon ? (
                          <div
                            className={`w-10 h-10 rounded-xl bg-black/60 border p-1 shrink-0 flex items-center justify-center ${
                              isUnlocked ? 'border-[#d4af37]/60' : 'border-[#323954]'
                            }`}
                          >
                            <img
                              src={c.icon}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) parent.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#323954] p-1 shrink-0 flex items-center justify-center text-[#d4af37]">
                            <Sparkles className="w-5 h-5" aria-hidden="true" />
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded border ${
                              isUnlocked
                                ? 'bg-[#d4af37] text-[#0a0b0e] border-[#d4af37]'
                                : 'bg-[#d4af37]/15 text-[#f3cf58] border-[#d4af37]/40'
                            }`}
                          >
                            C{c.level}
                          </span>
                          <span className="text-sm font-bold text-zinc-100">{c.name}</span>
                        </div>
                      </div>
                      {isUnlocked && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-200 border border-emerald-400/45">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line pl-0.5 break-words">
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
