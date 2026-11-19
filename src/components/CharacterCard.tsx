import React from 'react';
import type { Character, OwnedCharacterProfile, Element } from '../types/genshin';
import { CharacterPortrait } from './CharacterPortrait';
import { ChevronLeft, ChevronRight, Check, Plus, Swords, Info } from 'lucide-react';
import { getWeaponByKey } from '../data/weapons';

const TRAVELER_ELEMENTS: Element[] = [
  'Anemo',
  'Geo',
  'Electro',
  'Dendro',
  'Hydro',
  'Pyro',
];

export interface CharacterCardProps {
  char: Character;
  isOwned: boolean;
  constellation: number;
  profile?: OwnedCharacterProfile;
  allCharacters?: Character[];
  onToggleOwned: (id: string) => void;
  onStepConstellation: (e: React.MouseEvent, id: string, delta: number) => void;
  onSelectCharacter: (char: Character) => void;
  onPrefetch?: () => void;
}

const CharacterCardBase: React.FC<CharacterCardProps> = ({
  char,
  isOwned,
  constellation,
  profile,
  allCharacters,
  onToggleOwned,
  onStepConstellation,
  onSelectCharacter,
  onPrefetch,
}) => {
  const equippedWeaponName = profile?.weapon
    ? (getWeaponByKey(profile.weapon.key) || getWeaponByKey(profile.weapon.name))?.name ||
      profile.weapon.name
    : undefined;

  return (
    <div
      data-testid={`character-card-${char.id}`}
      onClick={() => onSelectCharacter(char)}
      onMouseEnter={onPrefetch}
      onTouchStart={onPrefetch}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 220px',
      }}
      className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isOwned
          ? 'bg-[#141622]/90 border-[#2b324c] hover:border-[#d4af37]/60 hover:shadow-lg hover:shadow-[#d4af37]/5'
          : 'bg-[#0f111a]/60 border-[#1f2438]/60 opacity-60 hover:opacity-90 hover:border-zinc-700'
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
                onClick={(e) => onStepConstellation(e, char.id, -1)}
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
                onClick={(e) => onStepConstellation(e, char.id, 1)}
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
        {char.name.includes('Traveler') && allCharacters && (
          <div
            className="flex items-center justify-center gap-1 mt-2 z-20 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {TRAVELER_ELEMENTS.map((tElem) => {
              const isCurrent = char.element === tElem;
              const targetTraveler = allCharacters.find(
                (c) => c.name.includes('Traveler') && c.element === tElem
              );
              return (
                <button
                  key={tElem}
                  onClick={() => {
                    if (targetTraveler) onSelectCharacter(targetTraveler);
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
          {equippedWeaponName ? (
            <>
              <Swords className="w-2.5 h-2.5 text-[#d4af37]" />
              <span className="truncate text-zinc-300 font-medium" title={equippedWeaponName}>
                {equippedWeaponName}
              </span>
            </>
          ) : (
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
};

export const CharacterCard = React.memo<CharacterCardProps>(
  CharacterCardBase,
  (prev, next) =>
    prev.char.id === next.char.id &&
    prev.isOwned === next.isOwned &&
    prev.constellation === next.constellation &&
    prev.profile?.weapon?.key === next.profile?.weapon?.key &&
    prev.profile?.weapon?.refinement === next.profile?.weapon?.refinement &&
    prev.profile?.weapon?.level === next.profile?.weapon?.level &&
    prev.profile?.level === next.profile?.level
);
