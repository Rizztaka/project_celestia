import React from 'react';
import { Sparkles, Users, Compass, ShieldCheck, PieChart, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  uid: string;
  setUid: (uid: string) => void;
  onSyncShowcase: () => void;
  isSyncing: boolean;
  ownedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  uid,
  setUid,
  onSyncShowcase,
  isSyncing,
  ownedCount,
}) => {
  const tabs = [
    { id: 'teams', label: 'Best Teams', icon: Sparkles },
    { id: 'pulls', label: 'Pull Advisor', icon: Compass },
    { id: 'endgame', label: 'Endgame Helper', icon: ShieldCheck },
    { id: 'artifacts', label: 'Artifact Stop', icon: PieChart },
    { id: 'roster', label: `My Roster (${ownedCount})`, icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d0e14]/90 backdrop-blur-md border-b border-[#222638]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('teams')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8c7320] flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
              <span className="font-bold text-[#0a0b0e] text-lg">✦</span>
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-base text-[#f0ede6] block leading-tight font-serif">
                CELESTIA
              </span>
              <span className="text-[10px] tracking-widest text-[#d4af37] font-semibold block uppercase">
                Speed · Accuracy
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#141622] p-1 rounded-xl border border-[#232738]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#d4af37] text-[#0a0b0e] shadow-md font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1c2030]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* UID Sync Control */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter UID..."
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="bg-[#141622] border border-[#262a3b] text-xs text-zinc-200 rounded-lg px-3 py-1.5 w-32 sm:w-36 focus:outline-none focus:border-[#d4af37] transition-colors"
                maxLength={10}
              />
            </div>
            <button
              onClick={onSyncShowcase}
              disabled={isSyncing || !uid.trim()}
              className="bg-[#1c2030] hover:bg-[#252b42] text-[#d4af37] border border-[#d4af37]/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Sync public showcase from Enka"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-[#1c2030] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#d4af37] font-bold' : 'text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
