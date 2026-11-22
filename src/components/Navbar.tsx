import React from 'react';
import { Sparkles, Users, Compass, ShieldCheck, PieChart, RefreshCw, Swords } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  uid: string;
  setUid: (uid: string) => void;
  onSyncShowcase: () => void;
  isSyncing: boolean;
  ownedCount: number;
  weaponCount?: number;
  onOpenArmory?: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
  isTabPending?: boolean;
  pendingTab?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  uid,
  setUid,
  onSyncShowcase,
  isSyncing,
  ownedCount,
  weaponCount,
  onOpenArmory,
  isDemoMode = false,
  onToggleDemoMode,
  isTabPending = false,
  pendingTab,
}) => {
  const tabs = [
    { id: 'teams', label: 'Best Teams', shortLabel: 'Teams', icon: Sparkles },
    { id: 'pulls', label: 'Pull Advisor', shortLabel: 'Pulls', icon: Compass },
    { id: 'endgame', label: 'Endgame Helper', shortLabel: 'Endgame', icon: ShieldCheck },
    { id: 'artifacts', label: 'Artifact Stop', shortLabel: 'Artifacts', icon: PieChart },
    { id: 'roster', label: `My Roster (${ownedCount})`, shortLabel: 'Roster', icon: Users },
  ];

  const handleUidSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSyncing && uid.trim()) {
      onSyncShowcase();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0d0e14]/95 backdrop-blur-md border-b border-[#222638]">
        {isTabPending && (
          <div
            role="progressbar"
            aria-label="Switching view"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-pulse motion-reduce:animate-none z-10"
          />
        )}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-x-3 gap-y-2 py-2.5 lg:py-0 lg:h-16">
            {/* Logo */}
            <button
              type="button"
              aria-label="Celestia Home"
              className="order-1 flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 text-left bg-transparent border-0 p-1 -ml-1 rounded-lg min-h-[44px] lg:min-h-0"
              onClick={() => setActiveTab('teams')}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8c7320] flex items-center justify-center shadow-lg shadow-[#d4af37]/20 shrink-0">
                <span className="font-bold text-[#0a0b0e] text-base sm:text-lg" aria-hidden="true">
                  ✦
                </span>
              </div>
              <div>
                <span className="font-extrabold tracking-wider text-sm sm:text-base text-[#f0ede6] block leading-tight font-serif">
                  CELESTIA
                </span>
                <span className="text-[10px] tracking-widest text-[#d4af37] font-semibold block uppercase">
                  Speed · Accuracy
                </span>
              </div>
            </button>

            {/* Desktop Navigation Tabs */}
            <nav
              aria-label="Primary Navigation"
              className="order-3 lg:order-2 hidden md:flex items-center gap-1 bg-[#141622] p-1 rounded-xl border border-[#24293d]"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isTargetPending = isTabPending && pendingTab === tab.id;
                const isActive = (pendingTab || activeTab) === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#d4af37] text-[#0a0b0e] shadow-md font-bold'
                        : 'text-zinc-300 hover:text-white hover:bg-[#1e2336]'
                    } ${isTargetPending ? 'animate-pulse motion-reduce:animate-none' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions (Demo Mode & Armory) + UID Sync Form */}
            <div className="order-2 lg:order-3 flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 w-auto ml-auto lg:ml-0">
              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(!isDemoMode)}
                  aria-label={`Demo Mode ${isDemoMode ? 'ON' : 'OFF'}`}
                  aria-pressed={isDemoMode}
                  className={`min-h-[40px] lg:min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shadow-sm shrink-0 ${
                    isDemoMode
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 hover:bg-amber-500/30'
                      : 'bg-[#181c2c] hover:bg-[#22273e] text-zinc-300 hover:text-white border-[#2c334d]'
                  }`}
                  title={
                    isDemoMode
                      ? 'Demo Mode is active. Click to return to your real account.'
                      : 'Enable Demo Mode to explore with a starter roster & armory.'
                  }
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-300' : 'text-zinc-400'}`}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">Demo</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                      isDemoMode
                        ? 'bg-amber-400/25 text-amber-200'
                        : 'bg-[#252a3f] text-zinc-300'
                    }`}
                  >
                    {isDemoMode ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {onOpenArmory && (
                <button
                  type="button"
                  onClick={onOpenArmory}
                  aria-label="Armory"
                  className="min-h-[40px] lg:min-h-[36px] bg-[#181c2c] hover:bg-[#22273e] text-zinc-200 hover:text-[#f3cf58] border border-[#2c334d] hover:border-[#d4af37]/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
                  title="Armory & Weapon Conflict Resolver"
                >
                  <Swords className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                  <span className="hidden sm:inline">Armory</span>
                  {weaponCount !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#272e48] text-amber-200 font-mono">
                      {weaponCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Single UID Showcase Sync Form (full-width row on mobile, inline on desktop) */}
            <form
              onSubmit={handleUidSubmit}
              className="order-4 w-full sm:w-auto flex items-center gap-1.5"
            >
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  aria-label="Player UID"
                  placeholder="Enter UID..."
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="bg-[#141622] border border-[#2c324a] text-xs text-zinc-100 placeholder:text-zinc-400 rounded-lg px-3 min-h-[40px] lg:min-h-[36px] w-full sm:w-32 lg:w-36 focus:border-[#d4af37] transition-colors"
                  maxLength={10}
                />
              </div>
              <button
                type="submit"
                disabled={isSyncing || !uid.trim()}
                aria-label="Sync Showcase"
                className="min-h-[40px] lg:min-h-[36px] min-w-[44px] bg-[#1c2030] hover:bg-[#252b42] text-[#f3cf58] border border-[#d4af37]/50 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                title="Sync public showcase from Enka (adds newly seen characters without overwriting your customized builds)"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin motion-reduce:animate-none' : ''}`}
                  aria-hidden="true"
                />
                <span>{isSyncing ? 'Syncing…' : 'Sync'}</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (thumb-friendly, >= 48px touch targets, safe-area aware) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0d0e14]/95 backdrop-blur-md border-t border-[#222638] pb-[env(safe-area-inset-bottom)] pointer-events-auto"
      >
        <div className="grid grid-cols-5 items-stretch w-full max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTargetPending = isTabPending && pendingTab === tab.id;
            const isActive = (pendingTab || activeTab) === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 min-h-[56px] px-1 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#f3cf58] font-bold' : 'text-zinc-400 hover:text-zinc-200'
                } ${isTargetPending ? 'animate-pulse motion-reduce:animate-none' : ''}`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 inset-x-3 h-[2px] rounded-b-full bg-[#d4af37]"
                  />
                )}
                <span className="relative inline-flex items-center justify-center">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tab.id === 'roster' && ownedCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-3.5 min-w-[16px] h-4 px-1 rounded-full bg-[#24293d] border border-[#3a4261] text-[9px] font-mono font-bold text-zinc-200 flex items-center justify-center"
                    >
                      {ownedCount}
                    </span>
                  )}
                </span>
                <span className="leading-none">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
