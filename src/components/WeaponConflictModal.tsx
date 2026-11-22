import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { OwnedWeapon, OwnedCharacterProfile, WeaponType } from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { WEAPONS_BY_TYPE, getWeaponByKey } from '../data/weapons';
import {
  Swords,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  Sliders,
  Undo2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface WeaponConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  weapons: OwnedWeapon[];
  onUpdateWeapons: (weapons: OwnedWeapon[]) => void;
  profiles: Record<string, OwnedCharacterProfile>;
  onUpdateProfiles: (profiles: Record<string, OwnedCharacterProfile>) => void;
}

const WEAPON_TYPES: WeaponType[] = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];

const CHARACTER_NAME_BY_ID = new Map<string, string>(
  CHARACTERS.map((c) => [c.id, c.name])
);

function getCharacterName(id: string): string {
  return CHARACTER_NAME_BY_ID.get(id) ?? id;
}

function generateNewWeaponId(key: string): string {
  return `${key}_${Date.now()}`;
}

interface DeletedWeaponSnapshot {
  weapon: OwnedWeapon;
  previousProfileWeapon?: OwnedCharacterProfile['weapon'];
}

export const WeaponConflictModal: React.FC<WeaponConflictModalProps> = ({
  isOpen,
  onClose,
  weapons,
  onUpdateWeapons,
  profiles,
  onUpdateProfiles,
}) => {
  const [tab, setTab] = useState<'all' | 'equipped' | 'bag' | 'add'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [editingWeaponId, setEditingWeaponId] = useState<string | null>(null);
  const [deletedSnapshot, setDeletedSnapshot] = useState<DeletedWeaponSnapshot | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New weapon form state
  const [newType, setNewType] = useState<WeaponType>('Sword');
  const [newKey, setNewKey] = useState<string>(() => WEAPONS_BY_TYPE.Sword?.[0]?.key || '');
  const [newLevel, setNewLevel] = useState<number>(90);
  const [newRefinement, setNewRefinement] = useState<number>(1);
  const [newLocation, setNewLocation] = useState<string>('');

  // Edit form state
  const [editLevel, setEditLevel] = useState<number>(90);
  const [editRefinement, setEditRefinement] = useState<number>(1);
  const [editLocation, setEditLocation] = useState<string>('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
  });

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setDeletedSnapshot(null);
      setEditingWeaponId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 4500);
  };

  const characterList = useMemo(() => {
    return Object.keys(profiles)
      .map((id) => {
        const char = CHARACTERS.find((c) => c.id === id);
        return {
          id,
          name: char ? char.name : id,
          weaponType: char ? char.weapon : undefined,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles]);

  // Detect conflicts: Multiple weapons claiming the same character
  const characterEquippedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of weapons) {
      if (w.location && w.location.trim().length > 0) {
        counts[w.location] = (counts[w.location] || 0) + 1;
      }
    }
    return counts;
  }, [weapons]);

  const conflicts = useMemo(() => {
    return Object.entries(characterEquippedCounts).filter(([, count]) => count > 1);
  }, [characterEquippedCounts]);

  const equippedCount = useMemo(
    () => weapons.filter((w) => w.location && w.location.trim()).length,
    [weapons]
  );

  const bagCount = weapons.length - equippedCount;

  const filteredWeapons = useMemo(() => {
    return weapons.filter((w) => {
      if (tab === 'equipped' && (!w.location || !w.location.trim())) return false;
      if (tab === 'bag' && w.location && w.location.trim()) return false;

      const dbWeapon = getWeaponByKey(w.key) || getWeaponByKey(w.name);
      if (typeFilter !== 'All' && dbWeapon && dbWeapon.weaponType !== typeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (dbWeapon?.name || w.name).toLowerCase().includes(query);
        const locName = w.location ? getCharacterName(w.location).toLowerCase() : '';
        const matchesLocation =
          (w.location?.toLowerCase().includes(query) ?? false) || locName.includes(query);
        if (!matchesName && !matchesLocation) return false;
      }

      return true;
    });
  }, [weapons, tab, typeFilter, searchQuery]);

  if (!isOpen) return null;

  const handleStartEdit = (w: OwnedWeapon) => {
    setEditingWeaponId(w.id);
    setEditLevel(w.level);
    setEditRefinement(w.refinement);
    setEditLocation(w.location || '');
  };

  const handleSaveEdit = (w: OwnedWeapon) => {
    const clampedLevel = Math.max(1, Math.min(90, Math.round(editLevel) || 1));
    const targetLocation = editLocation.trim() || undefined;
    const oldLocation = w.location?.trim() || undefined;

    const updated = weapons.map((item) => {
      if (item.id === w.id) {
        const canonical = getWeaponByKey(item.key) || getWeaponByKey(item.name);
        return {
          ...item,
          key: canonical?.key || item.key,
          name: canonical?.name || item.name,
          rarity: canonical?.rarity || item.rarity,
          level: clampedLevel,
          refinement: editRefinement,
          location: targetLocation,
        };
      }
      if (targetLocation && item.location === targetLocation) {
        return {
          ...item,
          location: undefined,
        };
      }
      return item;
    });

    onUpdateWeapons(updated);

    const nextProfiles = { ...profiles };
    let profilesChanged = false;

    if (oldLocation && oldLocation !== targetLocation && nextProfiles[oldLocation]) {
      const oldProfWeapon = nextProfiles[oldLocation].weapon;
      if (oldProfWeapon) {
        const oldProfKey =
          (getWeaponByKey(oldProfWeapon.key) || getWeaponByKey(oldProfWeapon.name))?.key ||
          oldProfWeapon.key;
        const currentWeaponKey =
          (getWeaponByKey(w.key) || getWeaponByKey(w.name))?.key || w.key;
        if (oldProfKey === currentWeaponKey) {
          nextProfiles[oldLocation] = {
            ...nextProfiles[oldLocation],
            weapon: undefined,
          };
          profilesChanged = true;
        }
      }
    }

    if (targetLocation && nextProfiles[targetLocation]) {
      const dbW = getWeaponByKey(w.key) || getWeaponByKey(w.name);
      nextProfiles[targetLocation] = {
        ...nextProfiles[targetLocation],
        weapon: {
          key: dbW?.key || w.key,
          name: dbW?.name || w.name,
          level: clampedLevel,
          refinement: editRefinement,
          rarity: dbW?.rarity || w.rarity || 4,
          ascension: w.ascension,
        },
      };
      profilesChanged = true;
    }

    if (profilesChanged) {
      onUpdateProfiles(nextProfiles);
    }

    setEditingWeaponId(null);
    setDeletedSnapshot(null);
    showFeedback(
      targetLocation
        ? `Updated ${w.name} (Lv. ${clampedLevel}, R${editRefinement}) on ${getCharacterName(targetLocation)}.`
        : `Updated ${w.name} (Lv. ${clampedLevel}, R${editRefinement}) and stored in bag.`
    );
  };

  const handleDeleteWeapon = (id: string) => {
    const deleted = weapons.find((w) => w.id === id);
    if (!deleted) return;

    const previousProfileWeapon =
      deleted.location && profiles[deleted.location]?.weapon
        ? profiles[deleted.location].weapon
        : undefined;

    const nextWeapons = weapons.filter((w) => w.id !== id);
    onUpdateWeapons(nextWeapons);

    if (deleted.location && profiles[deleted.location]) {
      const charProf = profiles[deleted.location];
      if (charProf?.weapon) {
        const profKey =
          (getWeaponByKey(charProf.weapon.key) || getWeaponByKey(charProf.weapon.name))?.key ||
          charProf.weapon.key;
        const delKey =
          (getWeaponByKey(deleted.key) || getWeaponByKey(deleted.name))?.key || deleted.key;
        if (profKey === delKey) {
          const nextProfiles = { ...profiles };
          nextProfiles[deleted.location] = {
            ...nextProfiles[deleted.location],
            weapon: undefined,
          };
          onUpdateProfiles(nextProfiles);
        }
      }
    }

    setDeletedSnapshot({ weapon: deleted, previousProfileWeapon });
    setFeedback(null);
  };

  const handleUndoDelete = () => {
    if (!deletedSnapshot) return;
    const { weapon: restored, previousProfileWeapon } = deletedSnapshot;

    // Avoid duplicating equipment if that character already equipped something else meanwhile
    const charNowHasWeapon =
      restored.location && weapons.some((w) => w.location === restored.location);
    const safeRestored: OwnedWeapon = charNowHasWeapon
      ? { ...restored, location: undefined }
      : restored;

    onUpdateWeapons([safeRestored, ...weapons]);

    if (safeRestored.location && profiles[safeRestored.location]) {
      const dbW = getWeaponByKey(safeRestored.key) || getWeaponByKey(safeRestored.name);
      onUpdateProfiles({
        ...profiles,
        [safeRestored.location]: {
          ...profiles[safeRestored.location],
          weapon: previousProfileWeapon ?? {
            key: dbW?.key || safeRestored.key,
            name: dbW?.name || safeRestored.name,
            level: safeRestored.level,
            refinement: safeRestored.refinement,
            rarity: dbW?.rarity || safeRestored.rarity || 4,
            ascension: safeRestored.ascension,
          },
        },
      });
    }

    setDeletedSnapshot(null);
    showFeedback(`Restored ${safeRestored.name} to your armory.`);
  };

  const handleAddWeapon = (e: React.FormEvent) => {
    e.preventDefault();
    const candidateList = WEAPONS_BY_TYPE[newType] || [];
    const selected = candidateList.find((w) => w.key === newKey) || candidateList[0];
    if (!selected) return;

    const clampedLevel = Math.max(1, Math.min(90, Math.round(newLevel) || 90));
    const targetLocation = newLocation.trim() || undefined;

    const newOwnedWeapon: OwnedWeapon = {
      id: generateNewWeaponId(selected.key),
      key: selected.key,
      name: selected.name,
      level: clampedLevel,
      refinement: newRefinement,
      rarity: selected.rarity,
      location: targetLocation,
      lock: true,
    };

    const updatedExisting = weapons.map((item) => {
      if (targetLocation && item.location === targetLocation) {
        return { ...item, location: undefined };
      }
      return item;
    });

    const nextWeapons = [newOwnedWeapon, ...updatedExisting];
    onUpdateWeapons(nextWeapons);

    if (targetLocation && profiles[targetLocation]) {
      const targetProf = profiles[targetLocation];
      onUpdateProfiles({
        ...profiles,
        [targetLocation]: {
          ...targetProf,
          weapon: {
            key: newOwnedWeapon.key,
            name: newOwnedWeapon.name,
            level: newOwnedWeapon.level,
            refinement: newOwnedWeapon.refinement,
            rarity: newOwnedWeapon.rarity,
          },
        },
      });
    }

    setNewLocation('');
    setDeletedSnapshot(null);
    setTab('all');
    showFeedback(
      targetLocation
        ? `Added ${selected.name} and equipped it on ${getCharacterName(targetLocation)}.`
        : `Added ${selected.name} (Lv. ${clampedLevel}, R${newRefinement}) to your bag.`
    );
  };

  const availableForType = WEAPONS_BY_TYPE[newType] || [];
  const hasActiveFilters = searchQuery.trim().length > 0 || typeFilter !== 'All';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Armory & Weapon Manager"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-[#121420] border border-[#2c334d] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#24293d] flex items-center justify-between gap-3 bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#f3cf58] shrink-0">
              <Swords className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-100">
                  Armory &amp; Weapon Manager
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1a1e2e] text-[#f3cf58] border border-[#323954] font-semibold font-mono">
                  {weapons.length} Weapons
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Manage inventory weapons, equip heroes, resolve conflicts, or add new weapons.
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#22283d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Conflicts Banner if any */}
        {conflicts.length > 0 && (
          <div
            role="alert"
            className="bg-amber-950/50 border-b border-amber-400/40 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-100 shrink-0"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
              <span>
                Equipment Conflict Detected:{' '}
                {conflicts
                  .map(([charId, count]) => `${getCharacterName(charId)} has ${count} weapons assigned`)
                  .join(', ')}
                .
              </span>
            </div>
            <span className="text-xs font-semibold text-amber-200">
              Reassign or move excess weapons to bag below.
            </span>
          </div>
        )}

        {/* Undo Delete Banner */}
        {deletedSnapshot && (
          <div
            role="status"
            aria-live="polite"
            className="bg-rose-950/55 border-b border-rose-400/45 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-100 shrink-0"
          >
            <span>
              Removed <strong className="text-white">{deletedSnapshot.weapon.name}</strong> from your armory.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndoDelete}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/50 text-amber-100 font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletedSnapshot(null)}
                aria-label="Dismiss removal notice"
                className="min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center text-rose-200 hover:text-white hover:bg-rose-500/20 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Action Feedback Banner */}
        {feedback && !deletedSnapshot && (
          <div
            role="status"
            aria-live="polite"
            className="bg-emerald-950/50 border-b border-emerald-400/40 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2 text-xs text-emerald-100 shrink-0"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
              <span>{feedback}</span>
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss notification"
              className="min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center text-emerald-200 hover:text-white hover:bg-emerald-500/20 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Navigation & Controls */}
        <div className="p-3.5 sm:p-4 border-b border-[#24293d] bg-[#0e1019] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Armory views"
            className="flex items-center gap-1 bg-[#161928] p-1 rounded-xl border border-[#24293d] overflow-x-auto touch-pan-x max-w-full"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'all'}
              onClick={() => setTab('all')}
              className={`min-h-[38px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                tab === 'all'
                  ? 'bg-[#d4af37] text-[#0a0b0e] font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
              }`}
            >
              All ({weapons.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'equipped'}
              onClick={() => setTab('equipped')}
              className={`min-h-[38px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                tab === 'equipped'
                  ? 'bg-[#d4af37] text-[#0a0b0e] font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
              }`}
            >
              Equipped ({equippedCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'bag'}
              onClick={() => setTab('bag')}
              className={`min-h-[38px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                tab === 'bag'
                  ? 'bg-[#d4af37] text-[#0a0b0e] font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1f243b]'
              }`}
            >
              Bag ({bagCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'add'}
              onClick={() => {
                setTab('add');
                if (!newKey) setNewKey(availableForType[0]?.key || '');
              }}
              className={`min-h-[38px] sm:min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                tab === 'add'
                  ? 'bg-[#d4af37] text-[#0a0b0e] font-bold'
                  : 'text-emerald-300 hover:text-emerald-200 hover:bg-[#1a2433]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Forge / Add</span>
            </button>
          </div>

          {/* Search & Type Filters (visible when not on Add tab) */}
          {tab !== 'add' && (
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Search weapon or hero"
                  placeholder="Search weapon or hero..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#161928] border border-[#2c324a] text-xs text-zinc-100 placeholder:text-zinc-400 pl-8 pr-8 min-h-[40px] sm:min-h-[36px] rounded-lg focus:border-[#d4af37] w-full sm:w-52"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear weapon search"
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[30px] min-h-[30px] rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#242a40] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <select
                aria-label="Filter by weapon type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#161928] border border-[#2c324a] text-xs text-zinc-100 px-2.5 min-h-[40px] sm:min-h-[36px] rounded-lg focus:border-[#d4af37] cursor-pointer shrink-0"
              >
                <option value="All">All Types</option>
                {WEAPON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          {tab === 'add' ? (
            /* ADD NEW WEAPON FORM */
            <form
              onSubmit={handleAddWeapon}
              className="max-w-xl mx-auto bg-[#151826] border border-[#282f48] p-5 rounded-2xl space-y-4 shadow-lg"
            >
              <h3 className="text-sm font-bold text-[#f3cf58] flex items-center gap-1.5">
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Forge / Add New Weapon to Armory</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Weapon Type */}
                <div className="space-y-1.5">
                  <label htmlFor="armory-new-type" className="block text-xs text-zinc-300 font-semibold">
                    Weapon Type
                  </label>
                  <select
                    id="armory-new-type"
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as WeaponType;
                      setNewType(t);
                      const available = WEAPONS_BY_TYPE[t] || [];
                      setNewKey(available[0]?.key || '');
                    }}
                    className="w-full min-h-[42px] sm:min-h-[38px] bg-[#1a1e2e] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-2 focus:border-[#d4af37]"
                  >
                    {WEAPON_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weapon Selection */}
                <div className="space-y-1.5">
                  <label htmlFor="armory-new-model" className="block text-xs text-zinc-300 font-semibold">
                    Weapon Model
                  </label>
                  <select
                    id="armory-new-model"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full min-h-[42px] sm:min-h-[38px] bg-[#1a1e2e] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-2 focus:border-[#d4af37]"
                  >
                    {availableForType.map((w) => (
                      <option key={w.key} value={w.key}>
                        {'★'.repeat(Math.max(1, Math.min(5, Math.floor(w.rarity))))} {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="armory-new-level" className="text-zinc-300 font-semibold">
                      Level
                    </label>
                    <span className="font-bold text-[#f3cf58] font-mono">Lv. {newLevel}</span>
                  </div>
                  <input
                    id="armory-new-level"
                    type="range"
                    min="1"
                    max="90"
                    aria-valuetext={`Level ${newLevel}`}
                    value={newLevel}
                    onChange={(e) => setNewLevel(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer h-2"
                  />
                </div>

                {/* Refinement Selector */}
                <div className="space-y-1.5">
                  <span className="block text-xs text-zinc-300 font-semibold">Refinement</span>
                  <div role="group" aria-label="Weapon refinement" className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        type="button"
                        key={r}
                        aria-pressed={newRefinement === r}
                        onClick={() => setNewRefinement(r)}
                        className={`flex-1 min-h-[40px] sm:min-h-[36px] py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          newRefinement === r
                            ? 'bg-[#d4af37] text-[#0a0b0e] font-extrabold'
                            : 'bg-[#1a1e2e] text-zinc-200 hover:text-white border border-[#323954]'
                        }`}
                      >
                        R{r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equip To */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="armory-new-location" className="block text-xs text-zinc-300 font-semibold">
                    Equip on Character (Optional)
                  </label>
                  <select
                    id="armory-new-location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full min-h-[42px] sm:min-h-[38px] bg-[#1a1e2e] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-2 focus:border-[#d4af37]"
                  >
                    <option value="">Keep in Bag (Unequipped)</option>
                    {characterList
                      .filter((c) => !c.weaponType || c.weaponType === newType)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {characterEquippedCounts[c.id] ? '(Has weapon equipped)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#24293d]">
                <button
                  type="button"
                  onClick={() => setTab('all')}
                  className="min-h-[42px] sm:min-h-[38px] px-4 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#1e2336] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] sm:min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold bg-[#d4af37] text-[#0a0b0e] hover:bg-[#e5c14d] transition-colors cursor-pointer"
                >
                  Save to Armory
                </button>
              </div>
            </form>
          ) : (
            /* WEAPONS LIST */
            <div className="space-y-2.5">
              {filteredWeapons.length === 0 ? (
                <div
                  role="status"
                  className="bg-[#151826] border border-[#24293d] rounded-2xl text-center py-10 px-4 space-y-3"
                >
                  <p className="text-xs text-zinc-300">
                    {weapons.length === 0
                      ? 'Your armory is currently empty. Add weapons manually or import them via GOOD JSON.'
                      : 'No weapons found matching your current search or filter.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setTypeFilter('All');
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 border border-[#323954] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Clear Filters</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setTab('add');
                        if (!newKey) setNewKey(availableForType[0]?.key || '');
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Forge / Add Weapon</span>
                    </button>
                  </div>
                </div>
              ) : (
                filteredWeapons.map((w) => {
                  const dbWeapon = getWeaponByKey(w.key) || getWeaponByKey(w.name);
                  const isEditing = editingWeaponId === w.id;
                  const isConflict = w.location && (characterEquippedCounts[w.location] || 0) > 1;
                  const displayName = dbWeapon?.name || w.name;
                  const locationDisplayName = w.location ? getCharacterName(w.location) : undefined;

                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        isConflict
                          ? 'bg-amber-950/25 border-amber-400/50'
                          : 'bg-[#151826] border-[#24293d] hover:border-[#323954]'
                      }`}
                    >
                      {isEditing ? (
                        /* INLINE EDIT FORM */
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24293d] pb-2">
                            <span className="text-xs font-bold text-[#f3cf58]">
                              Editing: {displayName}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">ID: {w.id}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <label
                                htmlFor={`edit-lvl-${w.id}`}
                                className="block text-xs text-zinc-300 font-medium"
                              >
                                Level (1–90)
                              </label>
                              <input
                                id={`edit-lvl-${w.id}`}
                                type="number"
                                min="1"
                                max="90"
                                value={editLevel}
                                onChange={(e) => setEditLevel(Number(e.target.value))}
                                className="w-full min-h-[40px] sm:min-h-[36px] bg-[#1a1e2e] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-1.5 focus:border-[#d4af37]"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label
                                htmlFor={`edit-ref-${w.id}`}
                                className="block text-xs text-zinc-300 font-medium"
                              >
                                Refinement (R1–R5)
                              </label>
                              <select
                                id={`edit-ref-${w.id}`}
                                value={editRefinement}
                                onChange={(e) => setEditRefinement(Number(e.target.value))}
                                className="w-full min-h-[40px] sm:min-h-[36px] bg-[#1a1e2e] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-1.5 focus:border-[#d4af37]"
                              >
                                {[1, 2, 3, 4, 5].map((r) => (
                                  <option key={r} value={r}>
                                    R{r}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label
                                htmlFor={`edit-loc-${w.id}`}
                                className="block text-xs text-zinc-300 font-medium"
                              >
                                Equip Target
                              </label>
                              <select
                                id={`edit-loc-${w.id}`}
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                className="w-full min-h-[40px] sm:min-h-[36px] bg-[#1a1e2e] border border-[#323954] text-xs text-zinc-100 rounded-lg px-2.5 py-1.5 focus:border-[#d4af37]"
                              >
                                <option value="">In Bag (Unequipped)</option>
                                {characterList
                                  .filter(
                                    (c) =>
                                      !c.weaponType ||
                                      !dbWeapon ||
                                      c.weaponType === dbWeapon.weaponType,
                                  )
                                  .map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingWeaponId(null)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#1f243b] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(w)}
                              className="min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* WEAPON CARD DISPLAY */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {dbWeapon?.icon ? (
                              <img
                                src={dbWeapon.icon}
                                alt=""
                                className="w-10 h-10 rounded-lg bg-[#1a1e2e] object-contain p-0.5 border border-[#2c334d] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[#1a1e2e] flex items-center justify-center text-[#d4af37] border border-[#2c334d] shrink-0">
                                <Swords className="w-5 h-5" aria-hidden="true" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-zinc-100">{displayName}</span>
                                <span className="text-xs text-[#f3cf58] font-semibold">
                                  {'★'.repeat(
                                    Math.max(1, Math.min(5, Math.floor(dbWeapon?.rarity || w.rarity || 4)))
                                  )}
                                </span>
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/35 font-mono">
                                  R{w.refinement}
                                </span>
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#1e2336] text-zinc-200 font-mono">
                                  Lv. {w.level}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-300 mt-1">
                                <span>{dbWeapon?.weaponType || 'Weapon'}</span>
                                {dbWeapon?.baseAtk && <span>Base ATK: {dbWeapon.baseAtk}</span>}
                                {dbWeapon?.subStatValue && (
                                  <span className="text-zinc-200">
                                    {dbWeapon.subStatType}: {dbWeapon.subStatValue}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                            {locationDisplayName ? (
                              <div
                                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 ${
                                  isConflict
                                    ? 'bg-amber-950/60 border-amber-400/50 text-amber-200'
                                    : 'bg-emerald-950/50 border-emerald-400/40 text-emerald-200'
                                }`}
                              >
                                {isConflict && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                                )}
                                <span>
                                  Equipped: <strong>{locationDisplayName}</strong>
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1a1e2e] border border-[#2c334d] text-zinc-300 font-medium">
                                In Bag (Available)
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(w)}
                                aria-label={`Edit ${displayName}`}
                                className="min-w-[40px] min-h-[40px] sm:min-w-[34px] sm:min-h-[34px] rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#22283f] transition-colors cursor-pointer"
                                title="Edit Weapon"
                              >
                                <Sliders className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWeapon(w.id)}
                                aria-label={`Delete ${displayName}`}
                                className="min-w-[40px] min-h-[40px] sm:min-w-[34px] sm:min-h-[34px] rounded-lg flex items-center justify-center text-zinc-300 hover:text-rose-200 hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="Delete Weapon"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
