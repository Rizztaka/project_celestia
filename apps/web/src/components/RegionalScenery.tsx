import { useState } from 'react';

import { regionalScenery } from '../lib/regional-scenery';
export function RegionalScenery({ region }: { region: string }) {
  const [failed, setFailed] = useState(false);
  const photograph = regionalScenery[region];
  return (
    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-sky-700 via-teal-800 to-indigo-950">
      {!failed && photograph && (
        <img
          src={photograph.image}
          alt={`${region} regional scenery`}
          title={photograph.credit}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"
      />
      <span className="absolute bottom-3 left-4 rounded-full border border-white/25 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
        {region || 'Teyvat'} · Regional scenery
      </span>
    </div>
  );
}
