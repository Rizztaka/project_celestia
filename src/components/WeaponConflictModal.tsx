import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

interface WeaponConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  weapons: OwnedWeapon[];
  onUpdateWeapons: (weapons: OwnedWeapon[]) => void;
  profiles: Record<string, OwnedCharacterProfile>;
  onUpdateProfiles: (profiles: Record<string, OwnedCharacterProfile>) => void;
}

const WEAPON_TYPES: WeaponType[] = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];

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

  // New weapon form state
  const [newType, setNewType] = useState<WeaponType>('Sword');
  const [newKey, setNewKey] = useState<string>('');
  const [newLevel, setNewLevel] = useState<number>(90);
  const [newRefinement, setNewRefinement] = useState<number>(1);
  const [newLocation, setNewLocation] = useState<string>('');

  // Edit form state
  const [editLevel, setEditLevel] = useState<number>(90);
  const [editRefinement, setEditRefinement] = useState<number>(1);
  const [editLocation, setEditLocation] = useState<string>('');

  const characterList = useMemo(() => {
    return Object.keys(profiles).map((id) => {
      const char = CHARACTERS.find((c) => c.id === id);
      return {
        id,
        name: char ? char.name : id,
        weaponType: char ? char.weapon : undefined,
      };
    });
  }, [profiles]);

  // Detect conflicts: Multiple weapons claiming the same character or duplicate assignments
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
    return Object.entries(characterEquippedCounts).filter(([_, count]) => count > 1);
  }, [characterEquippedCounts]);

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
        const matchesName = w.name.toLowerCase().includes(query);
        const matchesLocation = w.location?.toLowerCase().includes(query) ?? false;
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
    const targetLocation = editLocation.trim() || undefined;
    const oldLocation = w.location?.trim() || undefined;

    // Update weapons array:
    // 1. If targetLocation is specified, any other weapon previously on targetLocation is unequipped
    // 2. Weapon w receives editLevel, editRefinement, targetLocation
    const updated = weapons.map((item) => {
      if (item.id === w.id) {
        const canonical = getWeaponByKey(item.key) || getWeaponByKey(item.name);
        return {
          ...item,
          key: canonical?.key || item.key,
          name: canonical?.name || item.name,
          rarity: canonical?.rarity || item.rarity,
          level: editLevel,
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

    // Keep character profiles in sync
    const nextProfiles = { ...profiles };
    let profilesChanged = false;

    // If weapon was moved away from old character, clear old character's weapon profile
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

    // If weapon was assigned to a target character, update that character's weapon profile
    if (targetLocation && nextProfiles[targetLocation]) {
      const dbW = getWeaponByKey(w.key) || getWeaponByKey(w.name);
      nextProfiles[targetLocation] = {
        ...nextProfiles[targetLocation],
        weapon: {
          key: dbW?.key || w.key,
          name: dbW?.name || w.name,
          level: editLevel,
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
  };

  const handleDeleteWeapon = (id: string) => {
    const deleted = weapons.find((w) => w.id === id);
    const nextWeapons = weapons.filter((w) => w.id !== id);
    onUpdateWeapons(nextWeapons);

    // If deleted weapon was equipped on a profile, unequip it only if canonical key matches
    if (deleted?.location && profiles[deleted.location]) {
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
  };

  const handleAddWeapon = (e: React.FormEvent) => {
    e.preventDefault();
    const candidateList = WEAPONS_BY_TYPE[newType] || [];
    const selected = candidateList.find((w) => w.key === newKey) || candidateList[0];
    if (!selected) return;

    const targetLocation = newLocation.trim() || undefined;

    const newOwnedWeapon: OwnedWeapon = {
      id: `${selected.key}_${Date.now()}`,
      key: selected.key,
      name: selected.name,
      level: newLevel,
      refinement: newRefinement,
      rarity: selected.rarity,
      location: targetLocation,
      lock: true,
    };

    // If equipped on a character, unequip any existing weapon from that character in weapons
    const updatedExisting = weapons.map((item) => {
      if (targetLocation && item.location === targetLocation) {
        return { ...item, location: undefined };
      }
      return item;
    });

    const nextWeapons = [newOwnedWeapon, ...updatedExisting];
    onUpdateWeapons(nextWeapons);

    // If equipped on a character, update that character profile
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

    // Reset form & navigate to all
    setNewLocation('');
    setTab('all');
  };

  const availableForType = WEAPONS_BY_TYPE[newType] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f111a] border border-[#23273e] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-5 border-b border-[#202538] flex items-center justify-between bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-zinc-100">
                  Armory & Weapon Manager
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e2336] text-[#d4af37] border border-[#2d344e] font-semibold">
                  {weapons.length} Weapons
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Manage inventory weapons, equip heroes, resolve equipment conflicts, or add new weapons.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-[#1f243b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflicts Banner if any */}
        {conflicts.length > 0 && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 p-3 px-5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Equipment Conflict Detected: {conflicts.map(([charId, count]) => `${charId} has ${count} weapons assigned`).join(', ')}.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-400">
              Reassign or move excess weapons to bag below.
            </span>
          </div>
        )}

        {/* Navigation & Controls */}
        <div className="p-4 border-b border-[#202538] bg-[#0c0d14] flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#141624] p-1 rounded-xl border border-[#232738]">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'all'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({weapons.length})
            </button>
            <button
              onClick={() => setTab('equipped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'equipped'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Equipped ({weapons.filter((w) => w.location && w.location.trim()).length})
            </button>
            <button
              onClick={() => setTab('bag')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'bag'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Bag ({weapons.filter((w) => !w.location || !w.location.trim()).length})
            </button>
            <button
              onClick={() => {
                setTab('add');
                setNewKey(availableForType[0]?.key || '');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                tab === 'add'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-emerald-400 hover:bg-[#1a2333]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Forge / Add</span>
            </button>
          </div>

          {/* Search & Type Filters (visible when not on Add tab) */}
          {tab !== 'add' && (
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search weapon or hero..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141624] border border-[#262c44] text-xs text-zinc-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-[#d4af37] w-full sm:w-48"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#141624] border border-[#262c44] text-xs text-zinc-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#d4af37] cursor-pointer"
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
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'add' ? (
            /* ADD NEW WEAPON FORM */
            <form onSubmit={handleAddWeapon} className="max-w-xl mx-auto bg-[#131622] border border-[#23273e] p-5 rounded-2xl space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Forge / Add New Weapon to Armory</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Weapon Type */}
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">Weapon Type</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as WeaponType;
                      setNewType(t);
                      const available = WEAPONS_BY_TYPE[t] || [];
                      setNewKey(available[0]?.key || '');
                    }}
                    className="w-full bg-[#1a1e30] border border-[#29304a] text-xs text-zinc-100 rounded-lg p-2 focus:outline-none focus:border-[#d4af37]"
                  >
                    {WEAPON_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weapon Selection */}
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">Weapon Model</label>
                  <select
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full bg-[#1a1e30] border border-[#29304a] text-xs text-zinc-100 rounded-lg p-2 focus:outline-none focus:border-[#d4af37]"
                  >
                    {availableForType.map((w) => (
                      <option key={w.key} value={w.key}>
                        {'★'.repeat(Math.max(1, Math.min(5, Math.floor(w.rarity))))} {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level Slider / Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-semibold">Level</span>
                    <span className="font-bold text-[#d4af37]">Lv. {newLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="90"
                    value={newLevel}
                    onChange={(e) => setNewLevel(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* Refinement Selector */}
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">Refinement</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setNewRefinement(r)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          newRefinement === r
                            ? 'bg-[#d4af37] text-black font-extrabold'
                            : 'bg-[#1a1e30] text-zinc-400 hover:text-zinc-200 border border-[#29304a]'
                        }`}
                      >
                        R{r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equip To */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">Equip on Character (Optional)</label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-[#1a1e30] border border-[#29304a] text-xs text-zinc-100 rounded-lg p-2 focus:outline-none focus:border-[#d4af37]"
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

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#202538]">
                <button
                  type="button"
                  onClick={() => setTab('all')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-[#1c2030] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#d4af37] text-black hover:bg-[#e6c158] transition-colors cursor-pointer"
                >
                  Save to Armory
                </button>
              </div>
            </form>
          ) : (
            /* WEAPONS LIST */
            <div className="space-y-2.5">
              {filteredWeapons.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No weapons found matching your criteria.
                </div>
              ) : (
                filteredWeapons.map((w) => {
                  const dbWeapon = getWeaponByKey(w.key) || getWeaponByKey(w.name);
                  const isEditing = editingWeaponId === w.id;
                  const isConflict = w.location && (characterEquippedCounts[w.location] || 0) > 1;

                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isConflict
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-[#131622] border-[#22263b] hover:border-[#2d3450]'
                      }`}
                    >
                      {isEditing ? (
                        /* INLINE EDIT FORM */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-[#202538] pb-2">
                            <span className="text-xs font-bold text-[#d4af37]">
                              Editing: {w.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {w.id}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] text-zinc-400">Level (1–90)</label>
                              <input
                                type="number"
                                min="1"
                                max="90"
                                value={editLevel}
                                onChange={(e) => setEditLevel(Number(e.target.value))}
                                className="w-full bg-[#1a1e30] border border-[#29304a] text-xs text-zinc-100 rounded-lg p-1.5 focus:outline-none focus:border-[#d4af37]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-zinc-400">Refinement (R1–R5)</label>
                              <select
                                value={editRefinement}
                                onChange={(e) => setEditRefinement(Number(e.target.value))}
                                className="w-full bg-[#1a1e30] border border-[#29304a] text-xs text-zinc-100 rounded-lg p-1.5 focus:outline-none focus:border-[#d4af37]"
                              >
                                {[1, 2, 3, 4, 5].map((r) => (
                                  <option key={r} value={r}>
                                    R{r}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] text-zinc-400">Equip Target</label>
                              <select
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                className="w-full bg-[#1a1e30] border border-[#29304a] text-xs text-zinc-100 rounded-lg p-1.5 focus:outline-none focus:border-[#d4af37]"
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
                              className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(w)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-[#d4af37] text-black"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* WEAPON CARD DISPLAY */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Weapon Icon */}
                            {dbWeapon?.icon ? (
                              <img
                                src={dbWeapon.icon}
                                alt={w.name}
                                className="w-10 h-10 rounded-lg bg-[#181b2a] object-contain p-0.5 border border-[#262c44] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[#181b2a] flex items-center justify-center text-[#d4af37] border border-[#262c44] shrink-0">
                                <Swords className="w-5 h-5" />
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-zinc-100">{dbWeapon?.name || w.name}</span>
                                <span className="text-xs text-[#d4af37] font-semibold">
                                  {'★'.repeat(Math.max(1, Math.min(5, Math.floor(dbWeapon?.rarity || w.rarity || 4))))}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                  R{w.refinement}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#1e2336] text-zinc-300 font-mono">
                                  Lv. {w.level}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                                <span>{dbWeapon?.weaponType || 'Weapon'}</span>
                                {dbWeapon?.baseAtk && (
                                  <span>Base ATK: {dbWeapon.baseAtk}</span>
                                )}
                                {dbWeapon?.subStatValue && (
                                  <span className="text-zinc-300">
                                    {dbWeapon.subStatType}: {dbWeapon.subStatValue}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Equipped Badge */}
                            {w.location && w.location.trim() ? (
                              <div
                                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 ${
                                  isConflict
                                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                }`}
                              >
                                {isConflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                                <span>Equipped: <strong>{w.location}</strong></span>
                              </div>
                            ) : (
                              <div className="text-xs px-2.5 py-1 rounded-lg bg-[#181b28] border border-[#252a3f] text-zinc-400 font-medium">
                                In Bag (Available)
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEdit(w)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-[#1f243b] transition-colors cursor-pointer"
                                title="Edit Weapon"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteWeapon(w.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete Weapon"
                              >
                                <Trash2 className="w-4 h-4" />
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
