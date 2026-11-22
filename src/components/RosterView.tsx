import React, { useState, useMemo, useCallback, useRef, useEffect, useDeferredValue, Suspense } from 'react';
import { CHARACTERS } from '../data/characters';
import type { Character, Element, WeaponType, OwnedCharacterProfile, OwnedWeapon } from '../types/genshin';
import {
  Search,
  Trash2,
  RotateCcw,
  Layers,
  Swords,
  Globe,
  Compass,
  Sparkles,
  Database,
  X,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { LazyCharacterDetailModal, preloadCharacterDetailModal } from './LazyCharacterDetailModal';
import { CharacterCard } from './CharacterCard';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

const LazyGoodImportExportModal = React.lazy(() =>
  import('./GoodImportExportModal').then((m) => ({ default: m.GoodImportExportModal }))
);
const LazyAccountBackupModal = React.lazy(() =>
  import('./AccountBackupModal').then((m) => ({ default: m.AccountBackupModal }))
);

export type NationRegion =
  | 'All'
  | 'Mondstadt'
  | 'Liyue'
  | 'Inazuma'
  | 'Sumeru'
  | 'Fontaine'
  | 'Natlan'
  | 'Nod-Krai'
  | 'Snezhnaya';

type OwnershipFilter = 'all' | 'owned' | 'unowned';

const NATIONS: NationRegion[] = [
  'All',
  'Mondstadt',
  'Liyue',
  'Inazuma',
  'Sumeru',
  'Fontaine',
  'Natlan',
  'Nod-Krai',
  'Snezhnaya',
];

const WEAPON_TYPES: ('All' | WeaponType)[] = [
  'All',
  'Sword',
  'Claymore',
  'Polearm',
  'Bow',
  'Catalyst',
];

const TRAVELER_ELEMENTS: Element[] = [
  'Anemo',
  'Geo',
  'Electro',
  'Dendro',
  'Hydro',
  'Pyro',
];

const ELEMENTS: ('All' | Element)[] = [
  'All',
  'Pyro',
  'Hydro',
  'Dendro',
  'Electro',
  'Anemo',
  'Cryo',
  'Geo',
];

const CHARACTER_NATION_MAP: Record<string, NationRegion[]> = {
  // Mondstadt (23 + Nicole + Aloy)
  Albedo: ['Mondstadt'],
  Aloy: ['Mondstadt'],
  Diluc: ['Mondstadt'],
  Durin: ['Mondstadt'],
  Eula: ['Mondstadt'],
  Jean: ['Mondstadt'],
  Klee: ['Mondstadt'],
  Lohen: ['Mondstadt'],
  Mona: ['Mondstadt'],
  Varka: ['Mondstadt'],
  Venti: ['Mondstadt'],
  Amber: ['Mondstadt'],
  Barbara: ['Mondstadt'],
  Bennett: ['Mondstadt'],
  Dahlia: ['Mondstadt'],
  Diona: ['Mondstadt'],
  Fischl: ['Mondstadt'],
  Kaeya: ['Mondstadt'],
  Lisa: ['Mondstadt'],
  Mika: ['Mondstadt'],
  Noelle: ['Mondstadt'],
  Razor: ['Mondstadt'],
  Rosaria: ['Mondstadt'],
  Sucrose: ['Mondstadt'],
  Nicole: ['Mondstadt'],

  // Liyue (22)
  Baizhu: ['Liyue'],
  Ganyu: ['Liyue'],
  HuTao: ['Liyue'],
  Keqing: ['Liyue'],
  Qiqi: ['Liyue'],
  Shenhe: ['Liyue'],
  Xianyun: ['Liyue'],
  Xiao: ['Liyue'],
  Yelan: ['Liyue'],
  Zhongli: ['Liyue'],
  Zibai: ['Liyue'],
  Beidou: ['Liyue'],
  Chongyun: ['Liyue'],
  Gaming: ['Liyue'],
  LanYan: ['Liyue'],
  Ningguang: ['Liyue'],
  Xiangling: ['Liyue'],
  Xingqiu: ['Liyue'],
  Xinyan: ['Liyue'],
  Yanfei: ['Liyue'],
  Yaoyao: ['Liyue'],
  YunJin: ['Liyue'],

  // Inazuma (17)
  AratakiItto: ['Inazuma'],
  Chiori: ['Inazuma', 'Fontaine'],
  KaedeharaKazuha: ['Inazuma'],
  KamisatoAyaka: ['Inazuma'],
  KamisatoAyato: ['Inazuma'],
  RaidenShogun: ['Inazuma'],
  SangonomiyaKokomi: ['Inazuma'],
  YaeMiko: ['Inazuma'],
  Yoimiya: ['Inazuma'],
  YumemizukiMizuki: ['Inazuma'],
  Gorou: ['Inazuma'],
  Kirara: ['Inazuma'],
  KujouSara: ['Inazuma'],
  KukiShinobu: ['Inazuma'],
  Sayu: ['Inazuma'],
  ShikanoinHeizou: ['Inazuma'],
  Thoma: ['Inazuma'],

  // Sumeru (14)
  Alhaitham: ['Sumeru'],
  Cyno: ['Sumeru'],
  Dehya: ['Sumeru'],
  Nahida: ['Sumeru'],
  Nilou: ['Sumeru'],
  Tighnari: ['Sumeru'],
  Wanderer: ['Sumeru'],
  Candace: ['Sumeru'],
  Collei: ['Sumeru'],
  Dori: ['Sumeru'],
  Faruzan: ['Sumeru'],
  Kaveh: ['Sumeru'],
  Layla: ['Sumeru'],
  Sethos: ['Sumeru'],

  // Fontaine (16)
  Clorinde: ['Fontaine'],
  Emilie: ['Fontaine'],
  Escoffier: ['Fontaine'],
  Flins: ['Fontaine'],
  Furina: ['Fontaine'],
  Lyney: ['Fontaine'],
  Navia: ['Fontaine'],
  Neuvillette: ['Fontaine'],
  Odette: ['Fontaine'],
  Sigewinne: ['Fontaine'],
  Wriothesley: ['Fontaine'],
  Charlotte: ['Fontaine'],
  Chevreuse: ['Fontaine'],
  Freminet: ['Fontaine'],
  Lynette: ['Fontaine'],
  Prune: ['Fontaine'],

  // Natlan (14)
  Chasca: ['Natlan'],
  Citlali: ['Natlan'],
  Ineffa: ['Natlan'],
  Kinich: ['Natlan'],
  Mavuika: ['Natlan'],
  Mualani: ['Natlan'],
  Varesa: ['Natlan'],
  Xilonen: ['Natlan'],
  Iansan: ['Natlan'],
  Ifa: ['Natlan'],
  Illuga: ['Natlan'],
  Jahoda: ['Natlan'],
  Kachina: ['Natlan'],
  Ororon: ['Natlan'],

  // Nod-Krai (4 + Columbina)
  Lauma: ['Nod-Krai'],
  Linnea: ['Nod-Krai'],
  Nefer: ['Nod-Krai'],
  Aino: ['Nod-Krai'],
  Columbina: ['Nod-Krai', 'Snezhnaya'],

  // Snezhnaya (9 + Columbina)
  Arlecchino: ['Snezhnaya'],
  Mitya: ['Snezhnaya'],
  Sandrone: ['Snezhnaya'],
  Skirk: ['Snezhnaya'],
  Tartaglia: ['Snezhnaya'],
  Vesna: ['Snezhnaya'],
  Vodyanitsa: ['Snezhnaya'],
  Alyosha: ['Snezhnaya'],
  Valeriy: ['Snezhnaya'],

  // Outlander / Traveler
  TravelerAnemo: ['Mondstadt'],
  TravelerGeo: ['Liyue'],
  TravelerElectro: ['Inazuma'],
  TravelerDendro: ['Sumeru'],
  TravelerHydro: ['Fontaine'],
  TravelerPyro: ['Natlan'],
};

// Precomputed O(1) lookup table for snappy filtering on mobile devices
const NORMALIZED_NATION_MAP = new Map<string, NationRegion[]>(
  Object.entries(CHARACTER_NATION_MAP).map(([key, nations]) => [
    key.toLowerCase().replace(/[^a-z0-9]/g, ''),
    nations,
  ])
);

function getCharacterNations(char: Character): NationRegion[] {
  const normId = char.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byId = NORMALIZED_NATION_MAP.get(normId);
  if (byId) return byId;

  const normName = char.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byName = NORMALIZED_NATION_MAP.get(normName);
  if (byName) return byName;

  if (char.name.toLowerCase().includes('traveler')) {
    switch (char.element) {
      case 'Anemo':
        return ['Mondstadt'];
      case 'Geo':
        return ['Liyue'];
      case 'Electro':
        return ['Inazuma'];
      case 'Dendro':
        return ['Sumeru'];
      case 'Hydro':
        return ['Fontaine'];
      case 'Pyro':
        return ['Natlan'];
      default:
        return [];
    }
  }
  return [];
}

interface ResetConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  ownedCount: number;
  weaponCount: number;
}

const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  ownedCount,
  weaponCount,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useModalAccessibility({
    isOpen,
    onClose: onCancel,
    containerRef: dialogRef,
    initialFocusRef: cancelBtnRef,
  });

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
      aria-describedby="reset-confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-[#121420] border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/35 flex items-center justify-center text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 id="reset-confirm-title" className="text-base font-bold text-zinc-100 font-serif">
                Reset All Account Data?
              </h2>
              <p id="reset-confirm-desc" className="text-xs text-zinc-300 leading-relaxed">
                This will permanently clear your saved roster ({ownedCount} characters), armory ({weaponCount} weapons), custom profiles, UID, and wish planner settings. Export a backup first if you want a recovery copy.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onCancel}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#1a1e2e] hover:bg-[#242a40] text-zinc-200 border border-[#323954] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RosterViewProps {
  ownedIds: string[];
  profiles: Record<string, OwnedCharacterProfile>;
  onToggleOwned: (id: string) => void;
  onSetRoster: (ids: string[]) => void;
  onUpdateProfile?: (profile: OwnedCharacterProfile) => void;
  onUpdateProfiles?: (profiles: Record<string, OwnedCharacterProfile>) => void;
  onImportProfiles?: (
    newProfiles: Record<string, OwnedCharacterProfile>,
    message: string,
    importedWeapons?: OwnedWeapon[],
  ) => void;
  weapons?: OwnedWeapon[];
  onUpdateWeapons?: (weapons: OwnedWeapon[]) => void;
  onOpenArmory?: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
  onResetAccount?: () => void;
  onRestoreAccount?: () => void;
}

export const RosterView: React.FC<RosterViewProps> = ({
  ownedIds,
  profiles,
  onToggleOwned,
  onSetRoster,
  onUpdateProfile,
  onUpdateProfiles,
  onImportProfiles,
  weapons,
  onUpdateWeapons,
  onOpenArmory,
  isDemoMode = false,
  onToggleDemoMode,
  onResetAccount,
  onRestoreAccount,
}) => {
  const [filterOwnership, setFilterOwnership] = useState<OwnershipFilter>('all');
  const [filterElement, setFilterElement] = useState<'All' | Element>('All');
  const [filterRegion, setFilterRegion] = useState<NationRegion>('All');
  const [filterWeapon, setFilterWeapon] = useState<'All' | WeaponType>('All');
  const [filterTravelerElement, setFilterTravelerElement] = useState<'All' | Element>('All');
  const [search, setSearch] = useState<string>('');
  const deferredSearch = useDeferredValue(search);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isGoodModalOpen, setIsGoodModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds]);

  const hasActiveFilters =
    filterOwnership !== 'all' ||
    filterElement !== 'All' ||
    filterRegion !== 'All' ||
    filterWeapon !== 'All' ||
    filterTravelerElement !== 'All' ||
    search.trim().length > 0;

  const resetAllFilters = useCallback(() => {
    setFilterOwnership('all');
    setFilterElement('All');
    setFilterRegion('All');
    setFilterWeapon('All');
    setFilterTravelerElement('All');
    setSearch('');
  }, []);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return CHARACTERS.filter((c) => {
      const isOwned = ownedSet.has(c.id);
      if (filterOwnership === 'owned' && !isOwned) return false;
      if (filterOwnership === 'unowned' && isOwned) return false;

      const matchesElem = filterElement === 'All' || c.element === filterElement;
      const matchesWeapon = filterWeapon === 'All' || c.weapon === filterWeapon;
      const nations = getCharacterNations(c);
      const matchesRegion = filterRegion === 'All' || nations.includes(filterRegion);
      const matchesSearch = !q || c.name.toLowerCase().includes(q);
      const matchesTraveler =
        filterTravelerElement === 'All' ||
        (c.name.includes('Traveler') && c.element === filterTravelerElement);

      return matchesElem && matchesWeapon && matchesRegion && matchesSearch && matchesTraveler;
    });
  }, [
    ownedSet,
    filterOwnership,
    filterElement,
    filterWeapon,
    filterRegion,
    filterTravelerElement,
    deferredSearch,
  ]);

  const profilesRef = useRef(profiles);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const handleStepConstellation = useCallback(
    (e: React.MouseEvent, charId: string, delta: number) => {
      e.stopPropagation();
      if (!onUpdateProfile) return;

      const currentProfile = profilesRef.current[charId] || {
        id: charId,
        level: 90,
        constellation: 0,
      };

      const nextConst = Math.max(0, Math.min(6, currentProfile.constellation + delta));
      const nextProfile = {
        ...currentProfile,
        constellation: nextConst,
      };
      profilesRef.current = {
        ...profilesRef.current,
        [charId]: nextProfile,
      };
      onUpdateProfile(nextProfile);
    },
    [onUpdateProfile],
  );

  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    if (onResetAccount) onResetAccount();
    else onSetRoster([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121420] via-[#191d30] to-[#121420] p-5 sm:p-6 rounded-2xl border border-[#24293d] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              My Owned Roster
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#1a1e2e] border border-[#323954] text-zinc-200">
              {ownedIds.length} / {CHARACTERS.length} Owned
            </span>
          </div>
          <p className="text-sm text-zinc-300 mt-1">
            Toggle owned characters, adjust constellations (C0–C6), or import and back up your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenArmory && (
            <button
              type="button"
              onClick={onOpenArmory}
              className="min-h-[40px] sm:min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#1a1e2e] text-zinc-100 text-xs font-semibold hover:bg-[#252b42] border border-[#323954] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Armory & Weapon Manager"
            >
              <Swords className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
              <span>Armory ({weapons?.length || 0})</span>
            </button>
          )}

          {/* GOOD Format Import/Export Trigger */}
          <button
            type="button"
            onClick={() => setIsGoodModalOpen(true)}
            className="min-h-[40px] sm:min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#d4af37]/15 text-[#f3cf58] text-xs font-semibold hover:bg-[#d4af37]/25 border border-[#d4af37]/45 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Import / Export (GOOD)</span>
          </button>

          {/* Native Celestia Account Backup & Restore Trigger */}
          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="min-h-[40px] sm:min-h-[36px] px-3.5 py-1.5 rounded-xl bg-purple-500/15 text-purple-200 text-xs font-semibold hover:bg-purple-500/25 border border-purple-400/40 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Account Backup</span>
          </button>

          <button
            type="button"
            onClick={() => onSetRoster(CHARACTERS.map((c) => c.id))}
            className="min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-xl bg-[#1a1e2e] text-zinc-200 text-xs font-semibold hover:bg-[#252b42] border border-[#323954] transition-colors cursor-pointer"
          >
            Select All ({CHARACTERS.length})
          </button>

          {onToggleDemoMode && (
            <button
              type="button"
              onClick={() => onToggleDemoMode(!isDemoMode)}
              aria-pressed={isDemoMode}
              className={`min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDemoMode
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 hover:bg-amber-500/30'
                  : 'bg-[#1a1e2e] text-zinc-200 border-[#323954] hover:bg-[#252b42]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
              <span>{isDemoMode ? 'Demo Mode Active' : 'Load Demo Roster'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="min-h-[40px] sm:min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-200 text-xs font-semibold hover:bg-rose-950/70 border border-rose-400/35 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset account to empty roster and bag"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Account</span>
          </button>
        </div>
      </div>

      {/* Onboarding Empty Roster Banner */}
      {ownedIds.length === 0 && !isDemoMode && (
        <section
          aria-label="Getting Started"
          className="bg-gradient-to-r from-amber-950/35 via-[#151826] to-amber-950/25 p-5 rounded-2xl border border-amber-400/35 shadow-md space-y-4"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f3cf58] shrink-0" aria-hidden="true" />
              <h2 className="text-base font-bold text-amber-100 font-serif">
                Welcome to Project Celestia!
              </h2>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed max-w-3xl">
              Your roster is currently empty (0/{CHARACTERS.length} characters). Pick the fastest way to populate your account—or tap <strong className="text-zinc-100">+</strong> on any character below or sync your public showcase UID in the top bar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onToggleDemoMode && (
              <button
                type="button"
                onClick={() => onToggleDemoMode(true)}
                className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] font-bold text-xs transition-colors shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Turn on Demo Mode</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsGoodModalOpen(true)}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 border border-[#323954] font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
              <span>Import GOOD JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-400/40 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Database className="w-4 h-4" aria-hidden="true" />
              <span>Restore Backup</span>
            </button>
          </div>
        </section>
      )}

      {/* Filter and Search Controls */}
      <section
        aria-label="Roster Filters"
        className="bg-[#121420] p-4 rounded-2xl border border-[#24293d] space-y-3.5 shadow-sm"
      >
        {/* Search, Ownership Filter & Results Count */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                aria-label="Search by character name"
                placeholder="Search by character name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#161928] border border-[#2c324a] text-xs text-zinc-100 placeholder:text-zinc-400 rounded-xl pl-9 pr-9 min-h-[42px] sm:min-h-[38px] focus:border-[#d4af37] transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#242a40] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Ownership segmented filter */}
            <div
              role="group"
              aria-label="Filter by ownership"
              className="inline-flex items-center gap-1 bg-[#161928] p-1 rounded-xl border border-[#24293d] shrink-0"
            >
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'owned', label: `Owned (${ownedIds.length})` },
                  { id: 'unowned', label: 'Unowned' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={filterOwnership === opt.id}
                  onClick={() => setFilterOwnership(opt.id)}
                  className={`px-3 py-1.5 min-h-[36px] sm:min-h-[32px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterOwnership === opt.id
                      ? 'bg-[#d4af37] text-[#0a0b0e] font-bold shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            aria-live="polite"
            className="flex items-center justify-between lg:justify-end gap-3 text-xs text-zinc-300"
          >
            <span>
              Showing <strong className="text-zinc-100">{filtered.length}</strong> of{' '}
              <strong className="text-zinc-100">{CHARACTERS.length}</strong> Characters
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="min-h-[36px] px-2.5 rounded-lg text-xs font-semibold text-[#f3cf58] hover:bg-[#d4af37]/10 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Region Filter Bar (8 Nations + All) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
            <span>Region / Nation (8 Nations):</span>
          </div>
          <div
            role="group"
            aria-label="Filter by region"
            className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#161928] p-1.5 rounded-xl border border-[#24293d] touch-pan-x [-webkit-overflow-scrolling:touch]"
          >
            {NATIONS.map((nation) => (
              <button
                key={nation}
                type="button"
                aria-pressed={filterRegion === nation}
                onClick={() => setFilterRegion(nation)}
                className={`px-3 py-1.5 min-h-[44px] sm:min-h-[34px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  filterRegion === nation
                    ? 'bg-[#d4af37] text-[#0a0b0e] font-bold shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
                }`}
              >
                {nation}
              </button>
            ))}
          </div>
        </div>

        {/* Element & Weapon Filter Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Element Filter Pills */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              Element:
            </div>
            <div
              role="group"
              aria-label="Filter by element"
              className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#161928] p-1.5 rounded-xl border border-[#24293d] touch-pan-x [-webkit-overflow-scrolling:touch]"
            >
              {ELEMENTS.map((elem) => (
                <button
                  key={elem}
                  type="button"
                  aria-pressed={filterElement === elem}
                  onClick={() => setFilterElement(elem)}
                  className={`px-2.5 py-1.5 min-h-[44px] sm:min-h-[34px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    filterElement === elem
                      ? 'bg-[#d4af37] text-[#0a0b0e] font-bold shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
                  }`}
                >
                  {elem}
                </button>
              ))}
            </div>
          </div>

          {/* Weapon Filter Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              <Swords className="w-3 h-3 text-[#d4af37]" aria-hidden="true" />
              <span>Weapon Type:</span>
            </div>
            <div
              role="group"
              aria-label="Filter by weapon type"
              className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#161928] p-1.5 rounded-xl border border-[#24293d] touch-pan-x [-webkit-overflow-scrolling:touch]"
            >
              {WEAPON_TYPES.map((wType) => (
                <button
                  key={wType}
                  type="button"
                  aria-pressed={filterWeapon === wType}
                  onClick={() => setFilterWeapon(wType)}
                  className={`px-2.5 py-1.5 min-h-[44px] sm:min-h-[34px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    filterWeapon === wType
                      ? 'bg-[#d4af37] text-[#0a0b0e] font-bold shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
                  }`}
                >
                  {wType}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick-Switch Tags for Element-Specific Traveler Portraits */}
        <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-semibold text-[#f3cf58] flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Traveler Quick-Switch:</span>
          </span>
          <div
            role="group"
            aria-label="Filter by Traveler element"
            className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#161928] p-1 rounded-xl border border-[#24293d] touch-pan-x [-webkit-overflow-scrolling:touch]"
          >
            {(['All', ...TRAVELER_ELEMENTS] as ('All' | Element)[]).map((tElem) => (
              <button
                key={tElem}
                type="button"
                aria-pressed={filterTravelerElement === tElem}
                onClick={() =>
                  setFilterTravelerElement(filterTravelerElement === tElem ? 'All' : tElem)
                }
                className={`px-2.5 py-1 min-h-[44px] sm:min-h-[32px] flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  filterTravelerElement === tElem
                    ? 'bg-[#d4af37] text-[#0a0b0e] font-extrabold shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
                }`}
              >
                {tElem === 'All' ? 'All Travelers' : tElem}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Characters Grid or Empty Filter Result State */}
      {filtered.length === 0 ? (
        <div
          role="status"
          className="bg-[#121420] border border-[#24293d] rounded-2xl p-8 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#1a1e2e] border border-[#323954] flex items-center justify-center mx-auto text-[#d4af37]">
            <Filter className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-100 font-serif">
              No Characters Match Your Filters
            </h2>
            <p className="text-xs text-zinc-300 max-w-md mx-auto">
              Try clearing your search query or resetting one of the active region, element, weapon, or ownership filters.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filtered.map((char) => {
            const isOwned = ownedSet.has(char.id);
            const profile = profiles[char.id];
            const constellation = profile?.constellation ?? 0;

            return (
              <CharacterCard
                key={char.id}
                char={char}
                isOwned={isOwned}
                constellation={constellation}
                profile={profile}
                allCharacters={CHARACTERS}
                onToggleOwned={onToggleOwned}
                onStepConstellation={handleStepConstellation}
                onSelectCharacter={setSelectedCharacter}
                onPrefetch={preloadCharacterDetailModal}
              />
            );
          })}
        </div>
      )}

      {/* Character Details Modal */}
      <LazyCharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? ownedSet.has(selectedCharacter.id) : false}
        onToggleOwned={onToggleOwned}
        profile={selectedCharacter ? profiles[selectedCharacter.id] : undefined}
        onUpdateProfile={onUpdateProfile}
        profiles={profiles}
        onUpdateProfiles={onUpdateProfiles}
        weapons={weapons}
        onUpdateWeapons={onUpdateWeapons}
        onSelectCharacter={setSelectedCharacter}
      />

      {/* Universal GOOD Format Import/Export Modal */}
      {isGoodModalOpen && (
        <Suspense fallback={null}>
          <LazyGoodImportExportModal
            isOpen={isGoodModalOpen}
            onClose={() => setIsGoodModalOpen(false)}
            profiles={profiles}
            weapons={weapons}
            onImportSuccess={(newProfiles, msg, importedWeapons) => {
              if (onImportProfiles) {
                onImportProfiles(newProfiles, msg, importedWeapons);
              }
            }}
          />
        </Suspense>
      )}

      {/* Celestia Native Account Backup & Restore Modal */}
      {isBackupModalOpen && (
        <Suspense fallback={null}>
          <LazyAccountBackupModal
            isOpen={isBackupModalOpen}
            onClose={() => setIsBackupModalOpen(false)}
            onRestoreSuccess={() => {
              if (onRestoreAccount) {
                onRestoreAccount();
              } else if (
                typeof window !== 'undefined' &&
                window.location &&
                typeof window.location.reload === 'function'
              ) {
                try {
                  window.location.reload();
                } catch {
                  // Ignore in environments where reload is unavailable
                }
              }
            }}
          />
        </Suspense>
      )}

      {/* Accessible Account Reset Confirmation Dialog */}
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        ownedCount={ownedIds.length}
        weaponCount={weapons?.length || 0}
      />
    </div>
  );
};
