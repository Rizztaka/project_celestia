import React, { useState, useEffect, useMemo, useTransition, useRef, useCallback, Suspense } from 'react';
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
  isDemoModeEnabled,
  setDemoModeEnabled,
  resetAccountData,
  isStorageAvailable,
  getLastStorageErrorInfo,
} from './services/storage';
import { fetchShowcaseFromEnka } from './services/enka';
import type { OwnedCharacterProfile, OwnedWeapon } from './types/genshin';
import { resolveWeaponAlias, normalizeWeaponKey } from './data/weapon-aliases';
import { AlertCircle, CheckCircle2, Database, Loader2, Sparkles, X } from 'lucide-react';

function createRetryableLazy<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  maxRetries = 2
) {
  const loadWithRetries = () =>
    new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0;
      const attempt = () => {
        loader()
          .then(resolve)
          .catch((err) => {
            attempts++;
            if (attempts <= maxRetries) {
              setTimeout(attempt, 500 * attempts);
            } else {
              reject(err);
            }
          });
      };
      attempt();
    });

  let LazyComp = React.lazy(loadWithRetries);
  const Wrapper: React.FC<React.ComponentProps<T>> & { reset: () => void } = ((props: any) => {
    return <LazyComp {...props} />;
  }) as any;
  Wrapper.reset = () => {
    LazyComp = React.lazy(loadWithRetries);
  };
  return Wrapper;
}

const TeamGeneratorView = createRetryableLazy(() =>
  import('./components/TeamGeneratorView').then((m) => ({ default: m.TeamGeneratorView }))
);
const PullAdvisorView = createRetryableLazy(() =>
  import('./components/PullAdvisorView').then((m) => ({ default: m.PullAdvisorView }))
);
const EndgameView = createRetryableLazy(() =>
  import('./components/EndgameView').then((m) => ({ default: m.EndgameView }))
);
const ArtifactStopView = createRetryableLazy(() =>
  import('./components/ArtifactStopView').then((m) => ({ default: m.ArtifactStopView }))
);
const RosterView = createRetryableLazy(() =>
  import('./components/RosterView').then((m) => ({ default: m.RosterView }))
);
const WeaponConflictModal = React.lazy(() =>
  import('./components/WeaponConflictModal').then((m) => ({ default: m.WeaponConflictModal }))
);
const AccountBackupModal = React.lazy(() =>
  import('./components/AccountBackupModal').then((m) => ({ default: m.AccountBackupModal }))
);

const TAB_TITLES: Record<string, string> = {
  teams: 'Best Teams',
  pulls: 'Pull Advisor',
  endgame: 'Endgame Helper',
  artifacts: 'Artifact Stop',
  roster: 'My Roster',
};

const ModalLoadingFallback: React.FC<{ label: string }> = ({ label }) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={label}
    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div className="bg-[#121420] border border-[#24293d] rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl">
      <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <span className="text-sm font-medium text-zinc-200">{label}</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('teams');
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isTabPending, startTransition] = useTransition();

  const [profiles, setProfiles] = useState<Record<string, OwnedCharacterProfile>>(getSavedProfiles);
  const [weapons, setWeapons] = useState<OwnedWeapon[]>(getSavedWeapons);
  const [isArmoryOpen, setIsArmoryOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoModeEnabled);
  const [namespaceVersion, setNamespaceVersion] = useState<number>(0);
  const [uid, setUidState] = useState<string>(getSavedUid);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextPersistRef = useRef<boolean>(false);

  const dismissNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setNotification(null);
  }, []);

  const showNotification = useCallback(
    (type: 'success' | 'error', message: string, durationMs = 4500) => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      setNotification({ type, message });
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
        notificationTimerRef.current = null;
      }, durationMs);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // Probe storage availability on initialization and warn if blocked
  useEffect(() => {
    if (!isStorageAvailable()) {
      showNotification(
        'error',
        'Browser storage is unavailable or restricted. Account changes will not persist across browser restarts.',
        7500
      );
    }
  }, [showNotification]);

  // Keep page title aligned with current view for accessibility & browser tabs
  useEffect(() => {
    const viewName = TAB_TITLES[activeTab] ?? 'Genshin Companion';
    document.title = `${viewName} · Celestia`;
  }, [activeTab]);

  const handleSelectTab = (tab: string) => {
    if (tab === activeTab) return;
    setPendingTab(tab);
    startTransition(() => {
      setActiveTab(tab);
      setPendingTab(null);
    });
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  };

  const handleResetViews = () => {
    TeamGeneratorView.reset();
    PullAdvisorView.reset();
    EndgameView.reset();
    ArtifactStopView.reset();
    RosterView.reset();
  };

  const handleRestoreAccount = () => {
    skipNextPersistRef.current = true;
    setProfiles(getSavedProfiles());
    setWeapons(getSavedWeapons());
    setIsDemoMode(isDemoModeEnabled());
    setUidState(getSavedUid());
    setNamespaceVersion((v) => v + 1);
    handleResetViews();
  };

  // Derived owned character IDs list
  const ownedIds = useMemo(() => Object.keys(profiles), [profiles]);

  // Sync roster profiles & legacy list to localStorage with error handling
  useEffect(() => {
    if (skipNextPersistRef.current) return;
    if (!isStorageAvailable()) return;
    const ok = saveProfiles(profiles);
    if (!ok) {
      const err = getLastStorageErrorInfo();
      showNotification(
        'error',
        err?.code === 'QUOTA_EXCEEDED'
          ? 'Storage quota exceeded: character profiles could not be saved to your browser.'
          : 'Storage write failed: character profiles could not be saved.',
        6000
      );
    }
  }, [profiles, showNotification]);

  // Sync weapons bag to localStorage with error handling
  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (!isStorageAvailable()) return;
    const ok = saveWeapons(weapons);
    if (!ok) {
      const err = getLastStorageErrorInfo();
      showNotification(
        'error',
        err?.code === 'QUOTA_EXCEEDED'
          ? 'Storage quota exceeded: weapons armory could not be saved to your browser.'
          : 'Storage write failed: weapons armory could not be saved.',
        6000
      );
    }
  }, [weapons, showNotification]);

  const handleUpdateWeapons = (newWeapons: OwnedWeapon[]) => {
    setWeapons(newWeapons);
    const ok = saveWeapons(newWeapons);
    if (!ok) {
      showNotification('error', 'Failed to save updated weapons to storage.');
    }
  };

  const handleToggleDemoMode = (enable: boolean) => {
    skipNextPersistRef.current = true;
    const ok = setDemoModeEnabled(enable);
    if (!ok) {
      showNotification('error', 'Unable to toggle Demo Mode due to storage restrictions.');
      return;
    }
    setIsDemoMode(enable);
    setNamespaceVersion((v) => v + 1);
    if (enable) {
      const demoProfs = getSavedProfiles();
      const demoWeps = getSavedWeapons();
      setProfiles(demoProfs);
      setWeapons(demoWeps);
      setUidState(getSavedUid());
      showNotification(
        'success',
        'Demo Mode enabled. You are exploring an isolated sandbox — your real account data is preserved.'
      );
    } else {
      // Disabling demo mode switches back to authentic account without modifying or wiping real records
      const realProfs = getSavedProfiles();
      const realWeps = getSavedWeapons();
      setProfiles(realProfs);
      setWeapons(realWeps);
      setUidState(getSavedUid());
      showNotification(
        'success',
        'Demo Mode disabled. Switched back to your authentic account data.'
      );
    }
  };

  const handleResetAccount = () => {
    skipNextPersistRef.current = true;
    resetAccountData();
    setIsDemoMode(false);
    setProfiles({});
    setWeapons([]);
    setUidState('');
    setNamespaceVersion((v) => v + 1);
    handleResetViews();
    showNotification(
      'success',
      'Account data cleared. All saved profiles, weapons, UID, pull planner, and Abyss settings reset to empty state.'
    );
  };

  const handleSetUid = (newUid: string) => {
    setUidState(newUid);
    const ok = saveUid(newUid);
    if (!ok) {
      showNotification('error', 'Failed to save UID to browser storage.');
    }
  };

  const handleToggleOwned = (id: string) => {
    setProfiles((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
        // Unequip weapon into bag if character is removed
        setWeapons((wPrev) =>
          wPrev.map((w) => (w.location === id ? { ...w, location: undefined } : w))
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
        w.location && !ids.includes(w.location) ? { ...w, location: undefined } : w
      )
    );
  };

  const handleUpdateProfile = (updated: OwnedCharacterProfile) => {
    setProfiles((prev) => {
      const next = { ...prev, [updated.id]: updated };
      if (updated.weapon?.key) {
        const canonicalKey =
          resolveWeaponAlias(updated.weapon.key)?.key ||
          normalizeWeaponKey(updated.weapon.key);
        for (const [charId, p] of Object.entries(next)) {
          if (charId !== updated.id && p?.weapon) {
            const pKey =
              resolveWeaponAlias(p.weapon.key)?.key ||
              normalizeWeaponKey(p.weapon.key);
            if (pKey === canonicalKey) {
              next[charId] = { ...p, weapon: undefined };
            }
          }
        }
      }
      return next;
    });

    import('./services/armory-operations').then(({ syncArmoryOnProfileUpdate }) => {
      setWeapons((prev) => syncArmoryOnProfileUpdate(prev, updated));
    });
  };

  const handleUpdateProfiles = (updatedProfiles: Record<string, OwnedCharacterProfile>) => {
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
  };

  const handleImportProfiles = (
    newProfiles: Record<string, OwnedCharacterProfile>,
    message: string,
    importedWeapons?: OwnedWeapon[]
  ) => {
    setProfiles(newProfiles);
    if (importedWeapons && importedWeapons.length > 0) {
      setWeapons(importedWeapons);
      saveWeapons(importedWeapons);
    }
    showNotification('success', message, 5000);
  };

  const handleSyncShowcase = async () => {
    if (!uid.trim()) return;
    setIsSyncing(true);
    dismissNotification();

    const result = await fetchShowcaseFromEnka(uid);
    setIsSyncing(false);

    if (result.success && result.avatarIds.length > 0) {
      setProfiles((prev) => {
        const next = { ...prev };
        const hasAnyTraveler = Object.keys(prev).some((k) => k.startsWith('Traveler'));

        for (const id of result.avatarIds) {
          if (id === 'Traveler') {
            if (!hasAnyTraveler && !next['TravelerPyro']) {
              next['TravelerPyro'] = { id: 'TravelerPyro', level: 90, constellation: 6 };
            }
          } else if (!next[id]) {
            next[id] = { id, level: 90, constellation: 0 };
          }
        }
        return next;
      });

      const unknownNotice =
        result.unrecognizedIds && result.unrecognizedIds.length > 0
          ? ` (${result.unrecognizedIds.length} unknown character ID[s] skipped)`
          : '';

      showNotification(
        'success',
        `Synced ${result.avatarIds.length} characters from ${result.nickname ?? 'Traveler'}'s showcase. Existing builds preserved.${unknownNotice}`,
        5500
      );
    } else if (result.success && result.avatarIds.length === 0) {
      if (result.unrecognizedIds && result.unrecognizedIds.length > 0) {
        showNotification(
          'error',
          `Showcase returned ${result.unrecognizedIds.length} character(s) with unrecognized IDs (${result.unrecognizedIds.join(', ')}). Please check for Celestia updates.`,
          6000
        );
      } else {
        showNotification(
          'error',
          'No characters found in public showcase. Enable "Show Character Details" in Genshin Impact.',
          6000
        );
      }
    } else {
      showNotification('error', result.error ?? 'Failed to sync with Enka showcase.', 6000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-[#f0ede6] flex flex-col justify-between selection:bg-[#d4af37]/30 selection:text-[#f3cf58]">
      {/* Skip-to-content link for keyboard & screen-reader users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          isTabPending={isTabPending}
          pendingTab={pendingTab}
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

        {/* Persistent Demo Mode Sandbox Ribbon */}
        {isDemoMode && (
          <div
            role="region"
            aria-label="Demo Mode Status"
            className="bg-amber-950/70 border-b border-amber-500/35 text-amber-100"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-amber-200">Demo Sandbox Active</strong> — Changes here stay isolated and never overwrite your real account.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleDemoMode(false)}
                className="px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-100 font-semibold transition-colors cursor-pointer shrink-0"
              >
                Return to My Account
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 focus:outline-none"
        >
          <ErrorBoundary onRetry={handleResetViews}>
            <Suspense fallback={<ViewSkeleton type={pendingTab || activeTab} />}>
              {isTabPending && pendingTab ? (
                <ViewSkeleton type={pendingTab} />
              ) : (
                <>
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
                      key={`pulls-${namespaceVersion}-${isDemoMode}`}
                      ownedIds={ownedIds}
                      profiles={profiles}
                      weapons={weapons}
                    />
                  )}
                  {activeTab === 'endgame' && (
                    <EndgameView
                      key={`endgame-${namespaceVersion}-${isDemoMode}`}
                      ownedIds={ownedIds}
                      profiles={profiles}
                    />
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
                      onRestoreAccount={handleRestoreAccount}
                    />
                  )}
                </>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating Accessible Toast Notification (always visible regardless of scroll position) */}
      <div
        aria-live={notification?.type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className="fixed bottom-[76px] md:bottom-5 right-4 left-4 sm:left-auto sm:w-full sm:max-w-md z-[60] pointer-events-none"
      >
        {notification && (
          <div
            role={notification.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs font-medium shadow-2xl backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-[#0c241b]/95 border-emerald-400/50 text-emerald-100'
                : 'bg-[#2a0f18]/95 border-rose-400/50 text-rose-100'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0 pt-0.5">
              {notification.type === 'success' ? (
                <CheckCircle2
                  className="w-4 h-4 shrink-0 text-emerald-300 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="w-4 h-4 shrink-0 text-rose-300 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <span className="leading-relaxed break-words">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={dismissNotification}
              aria-label="Dismiss notification"
              className="min-w-[36px] min-h-[36px] -my-1.5 -mr-1.5 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Global Weapon Armory & Conflict Resolver Modal */}
      {isArmoryOpen && (
        <ErrorBoundary
          fallbackTitle="Unable to Open Armory"
          onRetry={() => setIsArmoryOpen(false)}
        >
          <Suspense fallback={<ModalLoadingFallback label="Loading Armory…" />}>
            <WeaponConflictModal
              isOpen={isArmoryOpen}
              onClose={() => setIsArmoryOpen(false)}
              weapons={weapons}
              onUpdateWeapons={handleUpdateWeapons}
              profiles={profiles}
              onUpdateProfiles={setProfiles}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Global Account Backup & Restore Modal */}
      {isBackupModalOpen && (
        <ErrorBoundary
          fallbackTitle="Unable to Open Backup & Restore"
          onRetry={() => setIsBackupModalOpen(false)}
        >
          <Suspense fallback={<ModalLoadingFallback label="Loading Backup & Restore…" />}>
            <AccountBackupModal
              isOpen={isBackupModalOpen}
              onClose={() => setIsBackupModalOpen(false)}
              onRestoreSuccess={handleRestoreAccount}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Footer (extra bottom clearance on mobile for fixed bottom navigation bar) */}
      <footer className="border-t border-[#1e2234] bg-[#0c0d13] pt-6 pb-24 md:pb-6 mt-12 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2.5">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="min-h-[44px] md:min-h-[36px] px-3.5 py-2 rounded-lg text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Database className="w-4 h-4" aria-hidden="true" />
              <span>Backup &amp; Restore Account</span>
            </button>
          </div>
          <p className="text-zinc-300 font-medium">
            Celestia v2 · Built for Speed &amp; Accuracy. 100% Client-Side. Zero Backend Delays.
          </p>
          <p className="text-xs text-zinc-400">
            Genshin Impact is a registered trademark of HoYoverse. This project is not affiliated with HoYoverse.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
