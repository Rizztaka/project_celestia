import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { CharacterCatalog } from '../components/CharacterCatalog';
import { GenshinAvatar } from '../components/GenshinAvatar';
import { PageHeader, UiIcon } from '../components/Ui';
import { fetchGenshinRoster } from '../lib/api';
import { artworkDisplayName } from '../lib/artwork';

export default function IntelligencePage() {
  const roster = useQuery({
    queryKey: ['genshin', 'characters'],
    queryFn: ({ signal }) => fetchGenshinRoster(signal),
    retry: false,
  });
  return (
    <main id="companion-content" tabIndex={-1}>
      <PageHeader
        eyebrow="UNDERSTAND YOUR BUILD"
        title="A little insight. A better next step."
        description="Look closer at your equipment. See what applies, what depends on combat conditions, and what still needs a reviewed rule."
        actions={
          <Link className="button-secondary" to="/roster">
            Your characters <UiIcon name="arrow" />
          </Link>
        }
      />
      <div className="build-lab-intro">
        <div>
          <p className="eyebrow">BUILD LAB</p>
          <h2>Clear conditions. Grounded explanations.</h2>
          <p>
            Open a character to check recorded weapon compatibility and artifact piece counts, then
            compare a hypothetical weapon or set without changing your saved build.
          </p>
          <p className="mt-4">
            Complete item descriptions remain available when an effect has no executable rule. An
            unknown trigger stays unknown.
          </p>
        </div>
        <div>
          <p className="eyebrow">CURRENT RULE COVERAGE</p>
          <h2>Small enough to be accountable.</h2>
          <ul>
            <li>Weapon type compatibility and artifact piece counts</li>
            <li>Harbinger of Dawn refinement and HP conditions</li>
            <li>Deepwood Memories, Gilded Dreams, Golden Troupe and Marechaussee Hunter</li>
          </ul>
          <p className="mt-4">
            These checks explain applicability. They do not calculate damage, rank teams or promise
            an optimal build.
          </p>
        </div>
      </div>
      <section aria-label="Choose a recorded character">
        <h2 className="mb-5 text-xl font-medium">Start with a character</h2>
        {roster.isPending && <p role="status">Loading your characters…</p>}
        {roster.isError && (
          <div role="alert" className="glass-panel rounded-xl p-5">
            <p>
              Your characters could not refresh.{' '}
              {roster.data
                ? 'Last confirmed characters remain below.'
                : 'Try again or explore the archive below.'}
            </p>
            <button className="button-secondary mt-4" onClick={() => void roster.refetch()}>
              Retry characters
            </button>
          </div>
        )}
        {roster.data && !roster.data.characters.length && (
          <p className="page-description">
            No characters are recorded yet. Import a GOOD export, or open a reference from the
            archive.
          </p>
        )}
        {!!roster.data?.characters.length && (
          <div className="catalog-links">
            {roster.data.characters.map((c) => (
              <Link key={c.id} to={`/roster/${encodeURIComponent(c.characterKey)}`}>
                <GenshinAvatar characterKey={c.characterKey} />
                <span>
                  {artworkDisplayName(c.characterKey)}
                  <small className="mt-1 block text-zinc-400">
                    Level {c.level} · C{c.constellation}
                  </small>
                </span>
                <UiIcon name="arrow" />
              </Link>
            ))}
          </div>
        )}
      </section>
      <CharacterCatalog />
    </main>
  );
}
