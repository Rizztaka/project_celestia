import React, { useEffect, useState } from 'react';
import { fetchNikkeRoster, type NikkeCharacter } from '../../lib/api';

export const NikkeRosterPage: React.FC = () => {
  const [roster, setRoster] = useState<NikkeCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNikkeRoster()
      .then((data) => {
        setRoster(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch Nikke roster', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-primary animate-pulse">Loading NIKKE Roster...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">NIKKE Roster</h1>
          <p className="text-muted-foreground mt-1">Manage your Goddess of Victory: NIKKE squad.</p>
        </div>
      </header>

      {roster.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">No Nikkes Found</h2>
          <p className="text-muted-foreground">Your roster is currently empty. Recruit some Nikkes to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roster.map((nikke) => (
            <div key={nikke.id} className="glass-panel p-6 relative overflow-hidden group hover:border-pink-500/50 transition-colors">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all"></div>
              
              <h3 className="text-xl font-bold text-white capitalize">{nikke.characterKey}</h3>
              <div className="flex gap-4 mt-4">
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">Level</div>
                  <div className="font-mono text-lg">{nikke.level}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">Limit Break</div>
                  <div className="font-mono text-lg">★ {nikke.limitBreak}</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm font-mono text-muted-foreground">
                <span>S1: {nikke.skill1}</span>
                <span>S2: {nikke.skill2}</span>
                <span>Burst: {nikke.burstSkill}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
