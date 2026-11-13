import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import type { Element } from '../types/genshin';
import { Search, Check, Plus, Trash2, RotateCcw } from 'lucide-react';
import { DEFAULT_ROSTER } from '../services/storage';

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

export const RosterView: React.FC<RosterViewProps> = ({
  ownedIds,
  onToggleOwned,
  onSetRoster,
}) => {
  const [filterElement, setFilterElement] = useState<'All' | Element>('All');
  const [search, setSearch] = useState<string>('');

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
            Toggle your owned characters below. Changes instantly update your team recommendations, pull advice, and endgame counter analysis.
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((char) => {
          const isOwned = ownedSet.has(char.id);
          return (
            <div
              key={char.id}
              onClick={() => onToggleOwned(char.id)}
              className={`rounded-2xl p-3.5 border transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-3 ${
                isOwned
                  ? 'bg-[#151926] border-[#d4af37]/60 shadow-md shadow-[#d4af37]/5'
                  : 'bg-[#0f1118] border-[#1d2130] opacity-50 hover:opacity-80 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400">{char.element}</span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border text-[11px] ${
                      isOwned
                        ? 'bg-[#d4af37] border-[#d4af37] text-black font-extrabold'
                        : 'border-zinc-700 text-zinc-600'
                    }`}
                  >
                    {isOwned ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="text-base font-bold text-zinc-100 mt-2 leading-tight">
                  {char.name}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{char.roles[0]}</div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="text-[#d4af37]">{'★'.repeat(char.rarity)}</span>
                <span className="truncate max-w-[80px]">{char.tags[0]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
