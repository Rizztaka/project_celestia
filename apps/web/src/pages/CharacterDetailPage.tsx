import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { CharacterEquipmentView } from '../components/CharacterEquipmentView';
import { FocusButton } from '../components/FocusButton';
import { ApiError, fetchCharacterEquipment, fetchGoals, fetchImportStatus } from '../lib/api';

export default function CharacterDetailPage() {
  const { characterKey = '' } = useParams();
  const detail = useQuery({
    queryKey: ['genshin', 'character-equipment', characterKey],
    queryFn: ({ signal }) => fetchCharacterEquipment(characterKey, signal),
    retry: false,
  });
  const goals = useQuery({
    queryKey: ['companion', 'goals'],
    queryFn: ({ signal }) => fetchGoals(signal),
    retry: false,
  });
  const notFound = detail.error instanceof ApiError && detail.error.status === 404;
  const status = useQuery({
    queryKey: ['genshin', 'import-status'],
    queryFn: ({ signal }) => fetchImportStatus(signal),
    enabled: notFound,
    retry: false,
  });
  const noImport = status.data?.sections.every((section) => section.status === 'unknown');
  return (
    <div className="min-h-screen text-zinc-300">
      <main
        id="companion-content"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/roster" className="text-sm text-indigo-300 hover:text-indigo-200">
            ← All characters
          </Link>
          <button
            disabled={detail.isFetching}
            onClick={() => void detail.refetch()}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            {detail.isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {!detail.data && !notFound && (
          <h1 className="mb-6 text-2xl font-bold text-white">Character equipment</h1>
        )}
        {detail.isLoading && (
          <p role="status" className="glass-panel rounded-xl p-6">
            Loading recorded equipment…
          </p>
        )}
        {notFound ? (
          <div className="glass-panel space-y-4 rounded-2xl p-6">
            <h1 className="text-2xl font-semibold text-white">Character not found</h1>
            <p>
              {noImport
                ? 'No import is recorded for this account. This character is not in your recorded roster.'
                : 'This character is not in your recorded roster.'}
            </p>
            <Link to="/import" className="inline-block text-indigo-300">
              Import character data
            </Link>
          </div>
        ) : (
          <>
            {detail.isError && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
              >
                <p>
                  {detail.error instanceof Error
                    ? detail.error.message
                    : 'Could not load recorded equipment.'}
                </p>
                {detail.data && (
                  <p className="mt-2 text-sm">
                    Showing the previously loaded records. Refresh failed.
                  </p>
                )}
                <button
                  onClick={() => void detail.refetch()}
                  disabled={detail.isFetching}
                  className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Retry
                </button>
              </div>
            )}
            {detail.data && (
              <>
                <section
                  className="glass-panel mb-6 space-y-4 rounded-xl p-4"
                  aria-label="Focus and goals"
                >
                  <FocusButton characterKey={characterKey} />
                  <div className="flex flex-wrap gap-3 text-sm text-indigo-200">
                    <Link to={`/planner?tab=farming&target=${encodeURIComponent(characterKey)}`}>
                      Manage character goals
                    </Link>
                    <Link
                      to={`/planner?tab=farming&newType=CHARACTER_ASCENSION&key=${encodeURIComponent(characterKey)}`}
                    >
                      Add ascension goal
                    </Link>
                    <Link
                      to={`/planner?tab=farming&newType=CHARACTER_TALENT&key=${encodeURIComponent(characterKey)}`}
                    >
                      Add base talent goal
                    </Link>
                    {detail.data.weapon.item && (
                      <Link
                        to={`/planner?tab=farming&newType=WEAPON_ASCENSION&key=${encodeURIComponent(detail.data.weapon.item.weaponKey)}`}
                      >
                        Add weapon type goal ({detail.data.weapon.item.weaponKey})
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Weapon goals retain the selected type key after equipment changes; they do not
                    track a physical copy. Raw talent values cannot be compared to base talent
                    targets.
                  </p>
                  {goals.isPending && <p role="status">Loading goals…</p>}
                  {goals.error && (
                    <p role="alert">
                      Goals could not refresh. Last confirmed goals, if any, remain below.{' '}
                      <button className="underline" onClick={() => void goals.refetch()}>
                        Retry goals
                      </button>
                    </p>
                  )}
                  {goals.data
                    ?.filter(
                      (goal) =>
                        goal.targetKey === characterKey && goal.goalType !== 'WEAPON_ASCENSION',
                    )
                    .map((goal) => (
                      <p key={goal.id} className="text-sm">
                        <Link
                          className="text-indigo-200"
                          to={`/planner?tab=farming&goal=${encodeURIComponent(goal.id)}`}
                        >
                          {goal.status} · Priority {goal.priority} · Declared {goal.fromPhase} →{' '}
                          {goal.toPhase}
                        </Link>
                        {goal.goalType === 'CHARACTER_ASCENSION'
                          ? ` · Stored ascension ${detail.data.character.ascension}; lifecycle remains your decision.`
                          : ' · Base-level comparison unknown.'}
                      </p>
                    ))}
                  <p className="text-xs text-zinc-400">
                    Stored progression has no per-character observation timestamp. Section receipts
                    describe imports.
                  </p>
                </section>
                <CharacterEquipmentView data={detail.data} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
