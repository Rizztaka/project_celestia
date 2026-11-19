import React, { Suspense } from 'react';
import type { Character, OwnedCharacterProfile, OwnedWeapon } from '../types/genshin';

export interface CharacterDetailModalProps {
  character: Character | null;
  onClose: () => void;
  isOwned: boolean;
  onToggleOwned?: (id: string) => void;
  profile?: OwnedCharacterProfile;
  onUpdateProfile?: (profile: OwnedCharacterProfile) => void;
  profiles?: Record<string, OwnedCharacterProfile>;
  onUpdateProfiles?: (profiles: Record<string, OwnedCharacterProfile>) => void;
  weapons?: OwnedWeapon[];
  onUpdateWeapons?: (weapons: OwnedWeapon[]) => void;
  onSelectCharacter?: (char: Character) => void;
}

let modalLoaderPromise: Promise<{ default: React.ComponentType<CharacterDetailModalProps> }> | null = null;

export function preloadCharacterDetailModal() {
  if (!modalLoaderPromise) {
    modalLoaderPromise = import('./CharacterDetailModal')
      .then((m) => ({
        default: m.CharacterDetailModal,
      }))
      .catch((err) => {
        modalLoaderPromise = null;
        throw err;
      });
  }
  return modalLoaderPromise;
}

const LazyModal = React.lazy(preloadCharacterDetailModal);

export const LazyCharacterDetailModal: React.FC<CharacterDetailModalProps> = (props) => {
  if (!props.character) return null;
  return (
    <Suspense fallback={null}>
      <LazyModal {...props} />
    </Suspense>
  );
};
