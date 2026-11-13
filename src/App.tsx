import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TeamGeneratorView } from './components/TeamGeneratorView';
import { PullAdvisorView } from './components/PullAdvisorView';
import { EndgameView } from './components/EndgameView';
import { ArtifactStopView } from './components/ArtifactStopView';
import { RosterView } from './components/RosterView';
import {
  getSavedRoster,
  saveRoster,
  getSavedUid,
  saveUid,
} from './services/storage';
import { fetchShowcaseFromEnka } from './services/enka';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('teams');
  const [ownedIds, setOwnedIds] = useState<string[]>(getSavedRoster);
  const [uid, setUidState] = useState<string>(getSavedUid);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sync roster updates to localStorage
  useEffect(() => {
    saveRoster(ownedIds);
  }, [ownedIds]);

  const handleSetUid = (newUid: string) => {
    setUidState(newUid);
    saveUid(newUid);
  };

  const handleToggleOwned = (id: string) => {
    setOwnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSyncShowcase = async () => {
    if (!uid.trim()) return;
    setIsSyncing(true);
    setNotification(null);

    const result = await fetchShowcaseFromEnka(uid);
    setIsSyncing(false);

    if (result.success && result.avatarIds.length > 0) {
      // Merge unique characters
      setOwnedIds((prev) => Array.from(new Set([...prev, ...result.avatarIds])));
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
          setActiveTab={setActiveTab}
          uid={uid}
          setUid={handleSetUid}
          onSyncShowcase={handleSyncShowcase}
          isSyncing={isSyncing}
          ownedCount={ownedIds.length}
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
          {activeTab === 'teams' && <TeamGeneratorView ownedIds={ownedIds} />}
          {activeTab === 'pulls' && <PullAdvisorView ownedIds={ownedIds} />}
          {activeTab === 'endgame' && <EndgameView ownedIds={ownedIds} />}
          {activeTab === 'artifacts' && <ArtifactStopView />}
          {activeTab === 'roster' && (
            <RosterView
              ownedIds={ownedIds}
              onToggleOwned={handleToggleOwned}
              onSetRoster={setOwnedIds}
            />
          )}
        </main>
      </div>

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
