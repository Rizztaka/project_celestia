import { showcaseUidSchema } from '@celestia/api-contracts';
import { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';

import CharacterBuildDetail from '../components/CharacterBuildDetail';
import PublicCharacterAnalysis from '../components/PublicCharacterAnalysis';
import ShowcaseSnapshot, { ShowcaseStatus } from '../components/ShowcaseSnapshot';
import { PageHeader } from '../components/Ui';
import { useUidDialog } from '../lib/uid-dialog';
import { UidWorkspaceContext } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';
import { useRefreshSeconds, useShowcase } from '../lib/use-showcase';

export default function PublicShowcasePage() {
  const inWorkspace = useContext(UidWorkspaceContext) !== null;
  const openUidDialog = useUidDialog();
  const { uid = '', id } = useParams();
  const valid = showcaseUidSchema.safeParse(uid).success;
  const query = useShowcase(uid);
  const wait = useRefreshSeconds(id ? undefined : query.data);
  const snapshot = query.data?.snapshot;
  const history = useObservedRoster(uid, query.data);
  const currentCharacter = snapshot?.characters.find(
    (item) => item.key === id || String(item.id) === id,
  );
  const retained = history.records.find(
    (item) => item.character.key === id || String(item.character.id) === id,
  );
  const character = retained?.character ?? currentCharacter;
  return (
    <main id="companion-content" tabIndex={-1} className="today-page space-y-6">
      {!id ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            eyebrow="Public Genshin showcase"
            title="My Showcase"
            description={`UID ${uid}`}
          />
          <button
            type="button"
            onClick={openUidDialog}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300"
          >
            Switch UID
          </button>
        </div>
      ) : null}
      {!valid ? (
        <p role="alert">This link needs a valid 9- or 10-digit Genshin UID.</p>
      ) : (
        <>
          {!id ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
                Currently showcased builds only. Characters outside the public showcase are not
                available.
              </p>
              <button
                type="button"
                disabled={query.isFetching || wait > 0}
                onClick={() => {
                  if (!query.isFetching && wait === 0) void query.refetch();
                }}
                aria-describedby="refresh-help"
                className="rounded-lg bg-[#d8be89] px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
              >
                {query.isFetching ? 'Refreshing…' : 'Refresh Showcase'}
              </button>
            </div>
          ) : null}
          {!id ? (
            <p id="refresh-help" className="text-xs text-zinc-400" role="status">
              {wait > 0 ? `Refresh available in ${wait}s.` : 'Ready to refresh.'}
            </p>
          ) : null}
          <ShowcaseStatus
            compact
            result={query.data}
            loading={query.isFetching}
            error={
              query.error
                ? 'Could not reach the showcase service. Check your connection and try again.'
                : undefined
            }
          />
          {id ? (
            <>
              <Link
                to={inWorkspace ? `/u/${uid}/roster` : `/u/${uid}`}
                className="inline-block text-sm text-amber-100 underline underline-offset-4"
              >
                {inWorkspace ? '← All characters' : '← Back to showcase'}
              </Link>
              {!currentCharacter && retained ? (
                <p
                  role="status"
                  className="rounded-xl border border-amber-200/15 p-4 text-sm text-zinc-300"
                >
                  Previously observed build · not in the current public showcase. Last seen{' '}
                  <time dateTime={retained.observedAt}>
                    {new Date(retained.observedAt).toLocaleString()}
                  </time>
                  .
                </p>
              ) : null}
              {history.issue ? (
                <p role="alert" className="text-sm text-amber-100">
                  {history.issue}
                </p>
              ) : null}
              {character ? (
                <CharacterBuildDetail
                  key={`${uid}:${character.key}`}
                  character={character}
                  uid={uid}
                  analysis={
                    <PublicCharacterAnalysis
                      key={`${uid}:${character.key}`}
                      uid={uid}
                      character={character}
                      records={history.records}
                    />
                  }
                />
              ) : snapshot ? (
                <div className="rounded-xl border border-white/10 p-5">
                  <h1 className="mb-3 text-xl">Character build unavailable</h1>
                  <p role="status">
                    This character is not in the current public showcase. It may have been removed
                    or its details may be hidden.
                  </p>
                </div>
              ) : null}
            </>
          ) : query.data ? (
            <ShowcaseSnapshot result={query.data} characterLinks />
          ) : null}
        </>
      )}
    </main>
  );
}
