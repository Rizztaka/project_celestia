import React, { useState, useMemo, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { LazyCharacterDetailModal, preloadCharacterDetailModal } from './LazyCharacterDetailModal';
import { CharacterCard } from './CharacterCard';
import { GoodImportExportModal } from './GoodImportExportModal';
import { AccountBackupModal } from './AccountBackupModal';

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

function getCharacterNations(char: Character): NationRegion[] {
  const normId = char.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normName = char.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, nations] of Object.entries(CHARACTER_NATION_MAP)) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normKey === normId || normKey === normName) {
      return nations;
    }
  }

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
  const [filterElement, setFilterElement] = useState<'All' | Element>('All');
  const [filterRegion, setFilterRegion] = useState<NationRegion>('All');
  const [filterWeapon, setFilterWeapon] = useState<'All' | WeaponType>('All');
  const [filterTravelerElement, setFilterTravelerElement] = useState<'All' | Element>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isGoodModalOpen, setIsGoodModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHARACTERS.filter((c) => {
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
  }, [filterElement, filterWeapon, filterRegion, filterTravelerElement, search]);

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
      onUpdateProfile({
        ...currentProfile,
        constellation: nextConst,
      });
    },
    [onUpdateProfile],
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 font-serif">
            My Owned Roster
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Toggle owned characters, step constellations (C0–C6), or import/export via universal GOOD format.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenArmory && (
            <button
              onClick={onOpenArmory}
              className="px-3.5 py-1.5 rounded-xl bg-[#1e2336] text-zinc-200 text-xs font-semibold hover:bg-[#282f48] border border-[#2d344e] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Armory & Weapon Manager"
            >
              <Swords className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Armory ({weapons?.length || 0})</span>
            </button>
          )}

          {/* GOOD Format Import/Export Trigger */}
          <button
            onClick={() => setIsGoodModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#d4af37]/15 text-[#d4af37] text-xs font-semibold hover:bg-[#d4af37]/25 border border-[#d4af37]/40 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Import / Export (GOOD)</span>
          </button>

          {/* Native Celestia Account Backup & Restore Trigger */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 border border-purple-500/40 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Account Backup</span>
          </button>

          <button
            onClick={() => onSetRoster(CHARACTERS.map((c) => c.id))}
            className="px-3 py-1.5 rounded-xl bg-[#1e2336] text-zinc-200 text-xs font-semibold hover:bg-[#282f48] border border-[#2d344e] transition-colors cursor-pointer"
          >
            Select All ({CHARACTERS.length})
          </button>
          {onToggleDemoMode && (
            <button
              onClick={() => onToggleDemoMode(!isDemoMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDemoMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-[#1e2336] text-zinc-200 border-[#2d344e] hover:bg-[#282f48]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isDemoMode ? 'Demo Mode Active' : 'Load Demo Roster'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (
                typeof window !== 'undefined' &&
                window.confirm('Are you sure you want to reset all account data (characters, profiles, and weapons)? This cannot be undone.')
              ) {
                if (onResetAccount) onResetAccount();
                else onSetRoster([]);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-950/30 text-rose-300 text-xs font-semibold hover:bg-rose-950/60 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset account to empty roster and bag"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Account</span>
          </button>
        </div>
      </div>

      {/* Onboarding Empty Roster Banner */}
      {ownedIds.length === 0 && !isDemoMode && (
        <div className="bg-gradient-to-r from-amber-950/40 via-[#181a26] to-amber-950/30 p-5 rounded-2xl border border-amber-500/30 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="text-sm font-bold text-amber-200">
                  Welcome to Project Celestia!
                </h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                Your roster is currently empty (0/128 characters). Start exploring immediately by activating <strong>Demo Mode</strong> (11 calibrated characters & armory), syncing your in-game showcase via UID, or clicking characters below to mark ownership.
              </p>
            </div>
            {onToggleDemoMode && (
              <button
                onClick={() => onToggleDemoMode(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-[#0d0f17] font-bold text-xs hover:brightness-110 transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Turn on Demo Mode</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-[#10121c] p-4 rounded-2xl border border-[#202538] space-y-3.5 shadow-sm">
        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search by character name"
              placeholder="Search by character name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141624] border border-[#262c44] text-xs text-zinc-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-zinc-400">
            <span>
              Showing <strong className="text-zinc-100">{filtered.length}</strong> of{' '}
              <strong>{CHARACTERS.length}</strong> Characters
            </span>
            {(filterElement !== 'All' ||
              filterRegion !== 'All' ||
              filterWeapon !== 'All' ||
              filterTravelerElement !== 'All' ||
              search) && (
              <button
                onClick={() => {
                  setFilterElement('All');
                  setFilterRegion('All');
                  setFilterWeapon('All');
                  setFilterTravelerElement('All');
                  setSearch('');
                }}
                className="text-[11px] font-semibold text-[#d4af37] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Region Filter Bar (8 Nations + All) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Region / Nation (8 Nations):</span>
          </div>
          <div className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#141624] p-1.5 rounded-xl border border-[#23283c] touch-pan-x [-webkit-overflow-scrolling:touch]">
            {NATIONS.map((nation) => (
              <button
                key={nation}
                onClick={() => setFilterRegion(nation)}
                className={`px-3 py-1.5 min-h-[44px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  filterRegion === nation
                    ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1f243b]'
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
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Element:
            </div>
            <div className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#141624] p-1.5 rounded-xl border border-[#23283c] touch-pan-x [-webkit-overflow-scrolling:touch]">
              {ELEMENTS.map((elem) => (
                <button
                  key={elem}
                  onClick={() => setFilterElement(elem)}
                  className={`px-2.5 py-1.5 min-h-[44px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    filterElement === elem
                      ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1f243b]'
                  }`}
                >
                  {elem}
                </button>
              ))}
            </div>
          </div>

          {/* Weapon Filter Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <Swords className="w-3 h-3 text-[#d4af37]" />
              <span>Weapon Type:</span>
            </div>
            <div className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#141624] p-1.5 rounded-xl border border-[#23283c] touch-pan-x [-webkit-overflow-scrolling:touch]">
              {WEAPON_TYPES.map((wType) => (
                <button
                  key={wType}
                  onClick={() => setFilterWeapon(wType)}
                  className={`px-2.5 py-1.5 min-h-[44px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    filterWeapon === wType
                      ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1f243b]'
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
          <span className="text-[11px] font-semibold text-[#d4af37] flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Traveler Quick-Switch:</span>
          </span>
          <div className="flex items-center overflow-x-auto sm:flex-wrap gap-1 bg-[#141624] p-1 rounded-xl border border-[#23283c] touch-pan-x [-webkit-overflow-scrolling:touch]">
            {(['All', ...TRAVELER_ELEMENTS] as ('All' | Element)[]).map((tElem) => (
              <button
                key={tElem}
                onClick={() =>
                  setFilterTravelerElement(filterTravelerElement === tElem ? 'All' : tElem)
                }
                className={`px-2 py-1 min-h-[44px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                  filterTravelerElement === tElem
                    ? 'bg-[#d4af37] text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1f243b]'
                }`}
              >
                {tElem === 'All' ? 'All Travelers' : tElem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Characters Grid */}
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
      <GoodImportExportModal
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

      {/* Celestia Native Account Backup & Restore Modal */}
      <AccountBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreSuccess={() => {
          if (onRestoreAccount) {
            onRestoreAccount();
          } else if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
            try {
              window.location.reload();
            } catch {
              // Ignore in environments where reload is unavailable
            }
          }
        }}
      />
    </div>
  );
};
