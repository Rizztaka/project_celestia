import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import type { Character, Element } from '../types/genshin';
import { Search, Check, Plus, Trash2, RotateCcw, Info } from 'lucide-react';
import { DEFAULT_ROSTER } from '../services/storage';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';

interface RosterViewProps {
  ownedIds: string[];
  onToggleOwned: (id: string) => void;
  onSetRoster: (ids: string[]) => void;
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
  onToggleOwned,
  onSetRoster,
}) => {
  const [filterElement, setFilterElement] = useState<'All' | Element>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const ownedSet = new Set(ownedIds);

  const filtered = CHARACTERS.filter((c) => {
    const matchesElem = filterElement === 'All' || c.element === filterElement;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesElem && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 font-serif">
            My Owned Roster
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Toggle your owned characters with the check button, or click any card to inspect talents, constellations, base stats, and recommended builds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSetRoster(CHARACTERS.map((c) => c.id))}
            className="px-3 py-1.5 rounded-xl bg-[#1e2336] text-zinc-200 text-xs font-semibold hover:bg-[#282f48] border border-[#2d344e] transition-colors cursor-pointer"
          >
            Select All ({CHARACTERS.length})
          </button>
          <button
            onClick={() => onSetRoster(DEFAULT_ROSTER)}
            className="px-3 py-1.5 rounded-xl bg-[#1e2336] text-zinc-200 text-xs font-semibold hover:bg-[#282f48] border border-[#2d344e] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            onClick={() => onSetRoster([])}
            className="px-3 py-1.5 rounded-xl bg-rose-950/30 text-rose-300 text-xs font-semibold hover:bg-rose-950/60 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Element Filter Pills */}
        <div className="flex flex-wrap gap-1 bg-[#12141e] p-1.5 rounded-xl border border-[#202538]">
          {ELEMENTS.map((elem) => (
            <button
              key={elem}
              onClick={() => setFilterElement(elem)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterElement === elem
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1c2030]'
              }`}
            >
              {elem}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141622] border border-[#262a3b] text-xs text-zinc-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filtered.map((char) => {
          const isOwned = ownedSet.has(char.id);
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
              {/* Top Row: Element badge & Owned Toggle */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-zinc-300 border border-white/5">
                  {char.element}
                </span>

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
                  {isOwned ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
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
              </div>

              {/* Bottom Row: Tags & Info Action */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 z-10">
                <span className="truncate max-w-[80px] text-zinc-400">{char.weapon}</span>
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
      />
    </div>
  );
};
