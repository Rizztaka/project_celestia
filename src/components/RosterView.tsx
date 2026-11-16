import React, { useState, useMemo } from 'react';
import { CHARACTERS } from '../data/characters';
import { getWeaponByKey } from '../data/weapons';
import type { Character, Element, WeaponType, OwnedCharacterProfile, OwnedWeapon } from '../types/genshin';
import {
  Search,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  Info,
  Layers,
  Swords,
  ChevronLeft,
  ChevronRight,
  Globe,
  Compass,
  Sparkles,
} from 'lucide-react';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';
import { GoodImportExportModal } from './GoodImportExportModal';

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

const ELEMENT_BORDER_COLORS: Record<Element, string> = {
  Pyro: 'border-rose-500/30 group-hover:border-rose-500/60',
  Hydro: 'border-sky-500/30 group-hover:border-sky-500/60',
  Dendro: 'border-emerald-500/30 group-hover:border-emerald-500/60',
  Electro: 'border-purple-500/30 group-hover:border-purple-500/60',
  Anemo: 'border-teal-500/30 group-hover:border-teal-500/60',
  Cryo: 'border-cyan-500/30 group-hover:border-cyan-500/60',
  Geo: 'border-amber-500/30 group-hover:border-amber-500/60',
};

export const RosterView: React.FC<RosterViewProps> = ({
  ownedIds,
  profiles,
  onToggleOwned,
  onSetRoster,
  onUpdateProfile,
  onImportProfiles,
  weapons,
  onUpdateWeapons,
  onOpenArmory,
  isDemoMode = false,
  onToggleDemoMode,
  onResetAccount,
}) => {
  const [filterElement, setFilterElement] = useState<'All' | Element>('All');
  const [filterRegion, setFilterRegion] = useState<NationRegion>('All');
  const [filterWeapon, setFilterWeapon] = useState<'All' | WeaponType>('All');
  const [filterTravelerElement, setFilterTravelerElement] = useState<'All' | Element>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isGoodModalOpen, setIsGoodModalOpen] = useState<boolean>(false);

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

  const handleStepConstellation = (
    e: React.MouseEvent,
    charId: string,
    delta: number,
  ) => {
    e.stopPropagation();
    if (!onUpdateProfile) return;

    const currentProfile = profiles[charId] || {
      id: charId,
      level: 90,
      constellation: 0,
    };

    const nextConst = Math.max(0, Math.min(6, currentProfile.constellation + delta));
    onUpdateProfile({
      ...currentProfile,
      constellation: nextConst,
    });
  };

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
            onClick={() => (onResetAccount ? onResetAccount() : onSetRoster([]))}
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
          <div className="flex flex-wrap gap-1 bg-[#141624] p-1.5 rounded-xl border border-[#23283c]">
            {NATIONS.map((nation) => (
              <button
                key={nation}
                onClick={() => setFilterRegion(nation)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
            <div className="flex flex-wrap gap-1 bg-[#141624] p-1.5 rounded-xl border border-[#23283c]">
              {ELEMENTS.map((elem) => (
                <button
                  key={elem}
                  onClick={() => setFilterElement(elem)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
            <div className="flex flex-wrap gap-1 bg-[#141624] p-1.5 rounded-xl border border-[#23283c]">
              {WEAPON_TYPES.map((wType) => (
                <button
                  key={wType}
                  onClick={() => setFilterWeapon(wType)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
          <div className="flex flex-wrap gap-1 bg-[#141624] p-1 rounded-xl border border-[#23283c]">
            {(['All', ...TRAVELER_ELEMENTS] as ('All' | Element)[]).map((tElem) => (
              <button
                key={tElem}
                onClick={() =>
                  setFilterTravelerElement(filterTravelerElement === tElem ? 'All' : tElem)
                }
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
          const borderColor = ELEMENT_BORDER_COLORS[char.element] || 'border-[#1d2130]';

          return (
            <div
              key={char.id}
              onClick={() => setSelectedCharacter(char)}
              className={`group rounded-2xl p-3 border transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                isOwned
                  ? 'bg-[#151926] border-[#d4af37]/60 shadow-md shadow-[#d4af37]/5 hover:border-[#d4af37]'
                  : `bg-[#0f1118] ${borderColor} opacity-60 hover:opacity-100 hover:bg-[#131622]`
              }`}
            >
              {/* Top Row: Element badge, Constellation Stepper & Owned Toggle */}
              <div className="flex items-center justify-between z-10 gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-zinc-300 border border-white/5">
                  {char.element}
                </span>

                <div className="flex items-center gap-1.5">
                  {isOwned && (
                    <div
                      className="flex items-center bg-[#0d0f17] rounded-lg border border-[#23283c] p-0.5 shadow-inner"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleStepConstellation(e, char.id, -1)}
                        disabled={constellation <= 0}
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] transition-colors cursor-pointer ${
                          constellation > 0
                            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1e2338]'
                            : 'text-zinc-700 cursor-not-allowed'
                        }`}
                        title="Decrease constellation"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>

                      <span
                        className={`text-[10px] font-extrabold px-1.5 rounded ${
                          constellation === 6
                            ? 'bg-[#d4af37] text-black shadow-sm'
                            : constellation > 0
                              ? 'text-[#d4af37]'
                              : 'text-zinc-400'
                        }`}
                      >
                        C{constellation}
                      </span>

                      <button
                        onClick={(e) => handleStepConstellation(e, char.id, 1)}
                        disabled={constellation >= 6}
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] transition-colors cursor-pointer ${
                          constellation < 6
                            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1e2338]'
                            : 'text-zinc-700 cursor-not-allowed'
                        }`}
                        title="Increase constellation"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleOwned(char.id);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] transition-transform hover:scale-110 cursor-pointer ${
                      isOwned
                        ? 'bg-[#d4af37] border-[#d4af37] text-black font-extrabold shadow-sm'
                        : 'border-zinc-700 bg-black/40 text-zinc-500 hover:text-zinc-200 hover:border-zinc-500'
                    }`}
                    title={isOwned ? 'Mark as unowned' : 'Mark as owned'}
                  >
                    {isOwned ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Character Portrait & Identity */}
              <div className="flex flex-col items-center text-center pt-1 z-10">
                <div className="mb-2.5 transition-transform group-hover:scale-105">
                  <CharacterPortrait
                    src={char.icon}
                    name={char.name}
                    element={char.element}
                    rarity={char.rarity}
                    size="lg"
                    showRarity={true}
                    className="group-hover:border-[#d4af37]/50"
                  />
                </div>

                <div className="text-sm font-bold text-zinc-100 group-hover:text-[#d4af37] transition-colors leading-tight line-clamp-1">
                  {char.name}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{char.roles[0]}</div>

                {/* Quick-Switch Tags for Element-Specific Traveler Portraits */}
                {char.name.includes('Traveler') && (
                  <div
                    className="flex items-center justify-center gap-1 mt-2 z-20 flex-wrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {TRAVELER_ELEMENTS.map((tElem) => {
                      const isCurrent = char.element === tElem;
                      const targetTraveler = CHARACTERS.find(
                        (c) => c.name.includes('Traveler') && c.element === tElem
                      );
                      return (
                        <button
                          key={tElem}
                          onClick={() => {
                            if (targetTraveler) setSelectedCharacter(targetTraveler);
                          }}
                          className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center transition-transform hover:scale-125 cursor-pointer border ${
                            isCurrent
                              ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-sm'
                              : 'bg-black/60 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:border-zinc-400'
                          }`}
                          title={`Quick-switch to Traveler (${tElem})`}
                        >
                          {tElem[0]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Row: Tags & Info Action */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 z-10">
                <span className="truncate max-w-[100px] text-zinc-400 flex items-center gap-1">
                  {profile?.weapon ? (() => {
                    const canonical = getWeaponByKey(profile.weapon.key) || getWeaponByKey(profile.weapon.name);
                    const displayName = canonical?.name || profile.weapon.name;
                    return (
                      <>
                        <Swords className="w-2.5 h-2.5 text-[#d4af37]" />
                        <span className="truncate text-zinc-300 font-medium" title={displayName}>{displayName}</span>
                      </>
                    );
                  })() : (
                    <span>{char.weapon}</span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-[#d4af37] hover:underline font-semibold text-[10px]">
                  <Info className="w-3 h-3" />
                  <span>Build</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Character Details Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? ownedSet.has(selectedCharacter.id) : false}
        onToggleOwned={onToggleOwned}
        profile={selectedCharacter ? profiles[selectedCharacter.id] : undefined}
        onUpdateProfile={onUpdateProfile}
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
    </div>
  );
};
