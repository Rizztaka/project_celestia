import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchNikkeRoster } from '../../lib/api';

export const NikkeRosterPage: React.FC = () => {
  const query = useQuery({
    queryKey: ['nikke', 'roster'],
    queryFn: ({ signal }) => fetchNikkeRoster(signal),
    retry: false,
  });
  const roster = query.data ?? [];
  return (
    <main id="companion-content" tabIndex={-1} className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">NIKKE Roster</h1>
          <p className="text-muted-foreground mt-1">
            Secondary roster records. NIKKE expansion is deferred.
          </p>
        </div>
      </header>

      <button
        className="rounded-lg border border-white/20 px-3 py-2"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh NIKKE records
      </button>
      {query.isPending && <p role="status">Loading NIKKE records…</p>}
      {query.error && (
        <p role="alert">
          Could not refresh NIKKE records. {query.data && 'Last confirmed records remain below.'}
        </p>
      )}
      {!query.isPending && !query.error && roster.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <h2 className="mb-2 text-2xl font-bold">No Nikkes Found</h2>
          <p className="text-muted-foreground">No NIKKE records are saved for this account.</p>
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
    </main>
  );
};
