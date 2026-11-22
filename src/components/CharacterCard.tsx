import React from 'react';
import type { Character, OwnedCharacterProfile, Element } from '../types/genshin';
import { CharacterPortrait } from './CharacterPortrait';
import { ChevronLeft, ChevronRight, Check, Plus, Swords, Info } from 'lucide-react';
import { resolveWeaponAlias } from '../data/weapon-aliases';

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
    ? profile.weapon.name ||
      resolveWeaponAlias(profile.weapon.key)?.name ||
      resolveWeaponAlias(profile.weapon.name)?.name ||
      profile.weapon.key
    : undefined;

  return (
    <article
      data-testid={`character-card-${char.id}`}
      onClick={() => onSelectCharacter(char)}
      onMouseEnter={onPrefetch}
      onTouchStart={onPrefetch}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 236px',
      }}
      className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-colors duration-150 cursor-pointer overflow-hidden ${
        isOwned
          ? 'bg-[#141624] border-[#2d3552] hover:border-[#d4af37]/65 shadow-sm'
          : 'bg-[#0e1019] border-[#1f2438] hover:border-[#343c5c]'
      }`}
    >
      {/* Top Row: Element badge, Constellation Stepper & Owned Toggle */}
      <div className="flex items-center justify-between z-10 gap-1">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#0a0b0e]/80 text-zinc-200 border border-white/10 truncate">
          {char.element}
        </span>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isOwned && (
            <div
              role="group"
              aria-label={`${char.name} constellation`}
              className="flex items-center bg-[#0a0c14] rounded-lg border border-[#282e46] p-0.5"
            >
              <button
                type="button"
                onClick={(e) => onStepConstellation(e, char.id, -1)}
                disabled={constellation <= 0}
                aria-label={`Decrease ${char.name} constellation`}
                title="Decrease constellation"
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  constellation > 0
                    ? 'text-zinc-200 hover:text-white hover:bg-[#1e2338]'
                    : 'text-zinc-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <span
                className={`text-[11px] font-extrabold px-1 rounded tabular-nums ${
                  constellation === 6
                    ? 'bg-[#d4af37] text-[#0a0b0e]'
                    : constellation > 0
                      ? 'text-[#f3cf58]'
                      : 'text-zinc-300'
                }`}
              >
                C{constellation}
              </span>

              <button
                type="button"
                onClick={(e) => onStepConstellation(e, char.id, 1)}
                disabled={constellation >= 6}
                aria-label={`Increase ${char.name} constellation`}
                title="Increase constellation"
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  constellation < 6
                    ? 'text-zinc-200 hover:text-white hover:bg-[#1e2338]'
                    : 'text-zinc-600 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOwned(char.id);
            }}
            aria-pressed={isOwned}
            aria-label={isOwned ? `Mark ${char.name} as unowned` : `Mark ${char.name} as owned`}
            title={isOwned ? 'Mark as unowned' : 'Mark as owned'}
            className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
              isOwned
                ? 'bg-[#d4af37] border-[#d4af37] text-[#0a0b0e] font-extrabold shadow-sm hover:bg-[#e5c14d]'
                : 'border-[#3a4261] bg-[#141724] text-zinc-200 hover:text-white hover:border-[#d4af37]/60'
            }`}
          >
            {isOwned ? (
              <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Primary Keyboard-Accessible Details Trigger (Portrait & Identity) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectCharacter(char);
        }}
        onFocus={onPrefetch}
        aria-label={`View ${char.name} build and profile details`}
        className="w-full flex flex-col items-center text-center pt-2 pb-1 z-10 bg-transparent border-0 rounded-xl cursor-pointer"
      >
        <div
          className={`mb-2.5 transition-opacity ${
            isOwned ? 'opacity-100' : 'opacity-75 group-hover:opacity-100'
          }`}
        >
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

        <div
          className={`text-sm font-bold leading-tight line-clamp-1 transition-colors ${
            isOwned
              ? 'text-zinc-100 group-hover:text-[#f3cf58]'
              : 'text-zinc-200 group-hover:text-[#f3cf58]'
          }`}
        >
          {char.name}
        </div>
        <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{char.roles[0]}</div>
      </button>

      {/* Quick-Switch Tags for Element-Specific Traveler Portraits (sibling outside details button) */}
      {char.name.includes('Traveler') && allCharacters && (
        <div
          role="group"
          aria-label="Switch Traveler element"
          className="flex items-center justify-center gap-1 mt-1 mb-1 z-20 flex-wrap"
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
                type="button"
                aria-label={`Quick-switch to Traveler (${tElem})`}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => {
                  if (targetTraveler) onSelectCharacter(targetTraveler);
                }}
                className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer border ${
                  isCurrent
                    ? 'bg-[#d4af37] text-[#0a0b0e] border-[#d4af37] shadow-sm'
                    : 'bg-[#0c0e17] text-zinc-300 border-[#323954] hover:text-white hover:border-[#d4af37]/60'
                }`}
                title={`Quick-switch to Traveler (${tElem})`}
              >
                {tElem[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Row: Weapon & Build Indicator */}
      <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between gap-1.5 text-[11px] text-zinc-300 z-10">
        <span className="truncate flex items-center gap-1 min-w-0">
          {equippedWeaponName ? (
            <>
              <Swords className="w-3 h-3 text-[#d4af37] shrink-0" aria-hidden="true" />
              <span className="truncate text-zinc-200 font-medium" title={equippedWeaponName}>
                {equippedWeaponName}
              </span>
            </>
          ) : (
            <span className="text-zinc-400 truncate">{char.weapon}</span>
          )}
        </span>
        <span
          aria-hidden="true"
          className="flex items-center gap-1 text-[#f3cf58] font-semibold text-[11px] shrink-0"
        >
          <Info className="w-3 h-3" />
          <span>Build</span>
        </span>
      </div>
    </article>
  );
};

export const CharacterCard = React.memo<CharacterCardProps>(
  CharacterCardBase,
  (prev, next) =>
    prev.char.id === next.char.id &&
    prev.isOwned === next.isOwned &&
    prev.constellation === next.constellation &&
    prev.profile?.weapon?.key === next.profile?.weapon?.key &&
    prev.profile?.weapon?.name === next.profile?.weapon?.name &&
    prev.profile?.weapon?.refinement === next.profile?.weapon?.refinement &&
    prev.profile?.weapon?.level === next.profile?.weapon?.level &&
    prev.profile?.level === next.profile?.level
);
