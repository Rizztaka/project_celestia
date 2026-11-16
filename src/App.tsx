import React, { useState, useEffect, useMemo, useTransition, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { ViewSkeleton } from './components/skeletons/ViewSkeleton';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  getSavedProfiles,
  saveProfiles,
  getSavedUid,
  saveUid,
  getSavedWeapons,
  saveWeapons,
  syncArmoryOnProfileUpdate,
  isDemoModeEnabled,
  setDemoModeEnabled,
  getDemoProfiles,
  DEMO_WEAPONS,
  resetAccountData,
} from './services/storage';
import { fetchShowcaseFromEnka } from './services/enka';
import type { OwnedCharacterProfile, OwnedWeapon } from './types/genshin';
import { WeaponConflictModal } from './components/WeaponConflictModal';
import { getWeaponByKey } from './data/weapons';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const TeamGeneratorView = React.lazy(() =>
  import('./components/TeamGeneratorView').then((m) => ({ default: m.TeamGeneratorView }))
);
const PullAdvisorView = React.lazy(() =>
  import('./components/PullAdvisorView').then((m) => ({ default: m.PullAdvisorView }))
);
const EndgameView = React.lazy(() =>
  import('./components/EndgameView').then((m) => ({ default: m.EndgameView }))
);
const ArtifactStopView = React.lazy(() =>
  import('./components/ArtifactStopView').then((m) => ({ default: m.ArtifactStopView }))
);
const RosterView = React.lazy(() =>
  import('./components/RosterView').then((m) => ({ default: m.RosterView }))
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('teams');
  const [isTabPending, startTransition] = useTransition();

  const handleSelectTab = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };
  const [profiles, setProfiles] = useState<Record<string, OwnedCharacterProfile>>(getSavedProfiles);
  const [weapons, setWeapons] = useState<OwnedWeapon[]>(getSavedWeapons);
  const [isArmoryOpen, setIsArmoryOpen] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoModeEnabled);
  const [uid, setUidState] = useState<string>(getSavedUid);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Derived owned character IDs list
  const ownedIds = useMemo(() => Object.keys(profiles), [profiles]);

  // Sync roster profiles & legacy list to localStorage
  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  // Sync weapons bag to localStorage
  useEffect(() => {
    saveWeapons(weapons);
  }, [weapons]);

  const handleUpdateWeapons = (newWeapons: OwnedWeapon[]) => {
    setWeapons(newWeapons);
    saveWeapons(newWeapons);
  };

  const handleToggleDemoMode = (enable: boolean) => {
    setDemoModeEnabled(enable);
    setIsDemoMode(enable);
    if (enable) {
      const demoProfs = getDemoProfiles();
      const demoWeps = DEMO_WEAPONS;
      setProfiles(demoProfs);
      saveProfiles(demoProfs);
      setWeapons(demoWeps);
      saveWeapons(demoWeps);
      setNotification({
        type: 'success',
        message: 'Demo Mode enabled! Loaded 11 calibrated characters & starter armory.',
      });
    } else {
      resetAccountData();
      setProfiles({});
      setWeapons([]);
      setNotification({
        type: 'success',
        message: 'Demo Mode disabled. Switched to authentic empty account.',
      });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleResetAccount = () => {
    resetAccountData();
    setIsDemoMode(false);
    setProfiles({});
    setWeapons([]);
    setNotification({
      type: 'success',
      message: 'Account data cleared. Account reset to empty state.',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSetUid = (newUid: string) => {
    setUidState(newUid);
    saveUid(newUid);
  };

  const handleToggleOwned = (id: string) => {
    setProfiles((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
        // Unequip weapon into bag if character is removed
        setWeapons((wPrev) =>
          wPrev.map((w) => (w.location === id ? { ...w, location: undefined } : w)),
        );
      } else {
        next[id] = { id, level: 90, constellation: 0 };
      }
      return next;
    });
  };

  const handleSetRoster = (ids: string[]) => {
    setProfiles((prev) => {
      const next: Record<string, OwnedCharacterProfile> = {};
      for (const id of ids) {
        next[id] = prev[id] || { id, level: 90, constellation: 0 };
      }
      return next;
    });
    setWeapons((wPrev) =>
      wPrev.map((w) =>
        w.location && !ids.includes(w.location) ? { ...w, location: undefined } : w,
      ),
    );
  };

  const handleUpdateProfile = (updated: OwnedCharacterProfile) => {
    setProfiles((prev) => {
      const next = { ...prev, [updated.id]: updated };
      if (updated.weapon?.key) {
        const canonicalKey =
          (getWeaponByKey(updated.weapon.key) || getWeaponByKey(updated.weapon.name))?.key ||
          updated.weapon.key;
        for (const [charId, p] of Object.entries(next)) {
          if (charId !== updated.id && p?.weapon) {
            const pKey =
              (getWeaponByKey(p.weapon.key) || getWeaponByKey(p.weapon.name))?.key || p.weapon.key;
            if (pKey === canonicalKey) {
              next[charId] = { ...p, weapon: undefined };
            }
          }
        }
      }
      return next;
    });

    setWeapons((prev) => syncArmoryOnProfileUpdate(prev, updated));
  };

  const handleUpdateProfiles = (updatedProfiles: Record<string, OwnedCharacterProfile>) => {
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
  };

  const handleImportProfiles = (
    newProfiles: Record<string, OwnedCharacterProfile>,
    message: string,
    importedWeapons?: OwnedWeapon[],
  ) => {
    setProfiles(newProfiles);
    if (importedWeapons && importedWeapons.length > 0) {
      setWeapons(importedWeapons);
      saveWeapons(importedWeapons);
    }
    setNotification({
      type: 'success',
      message,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSyncShowcase = async () => {
    if (!uid.trim()) return;
    setIsSyncing(true);
    setNotification(null);

    const result = await fetchShowcaseFromEnka(uid);
    setIsSyncing(false);

    if (result.success && result.avatarIds.length > 0) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const id of result.avatarIds) {
          if (!next[id]) {
            next[id] = { id, level: 90, constellation: 0 };
          }
        }
        return next;
      });

      setNotification({
        type: 'success',
        message: `Synced ${result.avatarIds.length} characters from ${result.nickname ?? 'Traveler'}'s showcase!`,
      });
    } else if (result.success && result.avatarIds.length === 0) {
      setNotification({
        type: 'error',
        message: 'No characters found in public showcase. Make sure "Show Character Details" is ON in Genshin.',
      });
    } else {
      setNotification({
        type: 'error',
        message: result.error ?? 'Failed to sync with Enka showcase.',
      });
    }

    // Auto dismiss notification after 5s
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-[#f0ede6] flex flex-col justify-between selection:bg-[#d4af37]/30 selection:text-[#d4af37]">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          isTabPending={isTabPending}
          uid={uid}
          setUid={handleSetUid}
          onSyncShowcase={handleSyncShowcase}
          isSyncing={isSyncing}
          ownedCount={ownedIds.length}
          weaponCount={weapons.length}
          onOpenArmory={() => setIsArmoryOpen(true)}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
        />

        {/* Sync Toast Notification */}
        {notification && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-zinc-400 hover:text-white ml-2 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <ErrorBoundary>
            <Suspense fallback={<ViewSkeleton type={activeTab} />}>
              {activeTab === 'teams' && (
                <TeamGeneratorView
                  ownedIds={ownedIds}
                  profiles={profiles}
                  weapons={weapons}
                  onUpdateWeapons={handleUpdateWeapons}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateProfiles={handleUpdateProfiles}
                  isDemoMode={isDemoMode}
                  onToggleDemoMode={handleToggleDemoMode}
                />
              )}
              {activeTab === 'pulls' && (
                <PullAdvisorView
                  ownedIds={ownedIds}
                  profiles={profiles}
                  weapons={weapons}
                />
              )}
              {activeTab === 'endgame' && (
                <EndgameView ownedIds={ownedIds} profiles={profiles} />
              )}
              {activeTab === 'artifacts' && <ArtifactStopView />}
              {activeTab === 'roster' && (
                <RosterView
                  ownedIds={ownedIds}
                  profiles={profiles}
                  onToggleOwned={handleToggleOwned}
                  onSetRoster={handleSetRoster}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateProfiles={handleUpdateProfiles}
                  onImportProfiles={handleImportProfiles}
                  weapons={weapons}
                  onUpdateWeapons={handleUpdateWeapons}
                  onOpenArmory={() => setIsArmoryOpen(true)}
                  isDemoMode={isDemoMode}
                  onToggleDemoMode={handleToggleDemoMode}
                  onResetAccount={handleResetAccount}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Weapon Armory & Conflict Resolver Modal */}
      <WeaponConflictModal
        isOpen={isArmoryOpen}
        onClose={() => setIsArmoryOpen(false)}
        weapons={weapons}
        onUpdateWeapons={handleUpdateWeapons}
        profiles={profiles}
        onUpdateProfiles={setProfiles}
      />

      {/* Footer */}
      <footer className="border-t border-[#1c2030] bg-[#0c0d13] py-6 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="text-zinc-400 font-medium">
            Celestia v2 · Built for Speed & Accuracy. 100% Client-Side. Zero Backend Delays.
          </p>
          <p className="text-[11px] text-zinc-600">
            Genshin Impact is a registered trademark of HoYoverse. This project is not affiliated with HoYoverse.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
