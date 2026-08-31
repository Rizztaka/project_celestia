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
        <div className="text-primary animate-pulse text-xl">Loading NIKKE Roster...</div>
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
          <h2 className="mb-2 text-2xl font-bold">No Nikkes Found</h2>
          <p className="text-muted-foreground">
            Your roster is currently empty. Recruit some Nikkes to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roster.map((nikke) => (
            <div
              key={nikke.id}
              className="glass-panel group relative overflow-hidden p-6 transition-colors hover:border-pink-500/50"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-pink-500/10 blur-2xl transition-all group-hover:bg-pink-500/20"></div>

              <h3 className="text-xl font-bold capitalize text-white">{nikke.characterKey}</h3>
              <div className="mt-4 flex gap-4">
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    Level
                  </div>
                  <div className="font-mono text-lg">{nikke.level}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    Limit Break
                  </div>
                  <div className="font-mono text-lg">★ {nikke.limitBreak}</div>
                </div>
              </div>

              <div className="text-muted-foreground mt-4 flex justify-between border-t border-white/10 pt-4 font-mono text-sm">
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
