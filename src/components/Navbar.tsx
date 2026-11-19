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
    { id: 'teams', label: 'Best Teams', icon: Sparkles },
    { id: 'pulls', label: 'Pull Advisor', icon: Compass },
    { id: 'endgame', label: 'Endgame Helper', icon: ShieldCheck },
    { id: 'artifacts', label: 'Artifact Stop', icon: PieChart },
    { id: 'roster', label: `My Roster (${ownedCount})`, icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d0e14]/90 backdrop-blur-md border-b border-[#222638] relative">
      {isTabPending && (
        <div
          role="progressbar"
          aria-label="Switching view"
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-pulse z-10"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <button
            type="button"
            aria-label="Celestia Home"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 text-left bg-transparent border-0 p-0"
            onClick={() => setActiveTab('teams')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8c7320] flex items-center justify-center shadow-lg shadow-[#d4af37]/20 shrink-0">
              <span className="font-bold text-[#0a0b0e] text-base sm:text-lg">✦</span>
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-sm sm:text-base text-[#f0ede6] block leading-tight font-serif">
                CELESTIA
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest text-[#d4af37] font-semibold block uppercase">
                Speed · Accuracy
              </span>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#141622] p-1 rounded-xl border border-[#232738]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isTargetPending = isTabPending && pendingTab === tab.id;
              const isActive = (pendingTab || activeTab) === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#d4af37] text-[#0a0b0e] shadow-md font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1c2030]'
                  } ${isTargetPending ? 'animate-pulse' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* UID Sync Control, Demo Mode & Armory Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onToggleDemoMode && (
              <button
                onClick={() => onToggleDemoMode(!isDemoMode)}
                aria-label={`Demo Mode ${isDemoMode ? 'ON' : 'OFF'}`}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer border shadow-sm shrink-0 ${
                  isDemoMode
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-[#181c2c] hover:bg-[#22273e] text-zinc-400 hover:text-zinc-200 border-[#2a3048]'
                }`}
                title={
                  isDemoMode
                    ? 'Demo Mode is active. Click to switch to authentic empty account.'
                    : 'Enable Demo Mode to explore with starter roster & armory.'
                }
              >
                <Sparkles className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span className="hidden sm:inline">Demo Mode</span>
                <span
                  className={`text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    isDemoMode ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isDemoMode ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {onOpenArmory && (
              <button
                onClick={onOpenArmory}
                aria-label="Armory"
                className="bg-[#181c2c] hover:bg-[#22273e] text-zinc-200 hover:text-[#d4af37] border border-[#2a3048] hover:border-[#d4af37]/40 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                title="Armory & Conflict Resolver"
              >
                <Swords className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline">Armory</span>
                {weaponCount !== undefined && (
                  <span className="text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full bg-[#272e48] text-amber-300 font-mono">
                    {weaponCount}
                  </span>
                )}
              </button>
            )}

            <div className="relative shrink-0">
              <input
                type="text"
                aria-label="Player UID"
                placeholder="Enter UID..."
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="bg-[#141622] border border-[#262a3b] text-xs text-zinc-200 rounded-lg px-2 sm:px-3 py-1.5 w-24 sm:w-36 focus:outline-none focus:border-[#d4af37] transition-colors"
                maxLength={10}
              />
            </div>
            <button
              onClick={onSyncShowcase}
              disabled={isSyncing || !uid.trim()}
              aria-label="Sync Showcase"
              className="bg-[#1c2030] hover:bg-[#252b42] text-[#d4af37] border border-[#d4af37]/40 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Sync public showcase from Enka (adds newly seen characters without overwriting your customized builds)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden flex items-center justify-around py-1 border-t border-[#1c2030] overflow-x-auto touch-pan-x [-webkit-overflow-scrolling:touch]"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTargetPending = isTabPending && pendingTab === tab.id;
            const isActive = (pendingTab || activeTab) === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                className={`flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 px-2.5 text-[10px] font-medium transition-colors cursor-pointer shrink-0 ${
                  isActive ? 'text-[#d4af37] font-bold' : 'text-zinc-400'
                } ${isTargetPending ? 'animate-pulse' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
