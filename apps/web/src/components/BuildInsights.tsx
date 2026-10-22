import type { BuildInsightCard, BuildInsightQuery } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { captureSession } from '../lib/account-session';
import { fetchBuildInsights } from '../lib/build-insights';
import { useAuthStore } from '../stores/auth.store';
import { SourceText } from './ProfileDescription';

const states = {
  applies: 'Requirement met',
  conditional: 'Conditional',
  not_applicable: 'Does not apply',
  unavailable: 'Unknown',
  reference: 'Description available',
};
export function InsightCards({ cards }: { cards: BuildInsightCard[] }) {
  return (
    <div className="insight-grid">
      {cards.map((card) => (
        <article
          data-insight-state={card.state}
          key={card.id}
          className="rounded-lg border border-white/10 p-4"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold">{card.title}</h3>
            <span className="text-xs text-indigo-200">{states[card.state]}</span>
          </div>
          {card.explanations.map((text) => (
            <p key={text} className="mt-2 text-sm text-zinc-300">
              {text}
            </p>
          ))}
          {card.sourceText && (
            <details className="mt-3 text-xs text-zinc-400">
              <summary className="cursor-pointer text-indigo-200">
                Effect, conditions and source
              </summary>
              <div className="mt-2">
                <SourceText text={card.sourceText} />
              </div>
              {card.source && (
                <a
                  className="mt-2 inline-block underline"
                  href={card.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pinned source · {card.source.revision.slice(0, 7)}
                </a>
              )}
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
export function BuildInsights(props: { characterKey: string; recordsBoundary?: string }) {
  const epoch = useAuthStore((s) => s.sessionEpoch);
  return <SessionInsights key={`${epoch}:${props.characterKey}`} {...props} epoch={epoch} />;
}
function SessionInsights({
  characterKey,
  recordsBoundary = '',
  epoch,
}: {
  characterKey: string;
  recordsBoundary?: string;
  epoch: number;
}) {
  const [session] = useState(captureSession);
  const [choice, setChoice] = useState('');
  const [refinement, setRefinement] = useState('');
  const [pieces, setPieces] = useState('4');
  const query: BuildInsightQuery = choice.startsWith('weapon:')
    ? { weapon: choice.slice(7), ...(refinement ? { refinement: Number(refinement) } : {}) }
    : choice.startsWith('set:')
      ? { artifactSet: choice.slice(4), pieces: Number(pieces) }
      : {};
  const result = useQuery({
    queryKey: ['genshin', 'build-insights', epoch, characterKey, recordsBoundary],
    queryFn: ({ signal }) => fetchBuildInsights(characterKey, {}, signal, session),
    retry: false,
    staleTime: 0,
  });
  const comparison = useQuery({
    queryKey: [
      'genshin',
      'build-insights',
      epoch,
      characterKey,
      recordsBoundary,
      'comparison',
      query,
    ],
    queryFn: ({ signal }) => fetchBuildInsights(characterKey, query, signal, session),
    enabled: !!choice,
    retry: false,
    staleTime: 0,
  });
  const data = result.data;
  return (
    <section
      aria-label="Build insights"
      className="glass-panel space-y-4 rounded-xl border border-indigo-400/20 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Build insights</h2>
        <button
          type="button"
          disabled={result.isFetching || comparison.isFetching}
          onClick={() => {
            void result.refetch();
            if (choice) void comparison.refetch();
          }}
          className="rounded border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
        >
          {result.isFetching ? 'Checking…' : 'Refresh equipment check'}
        </button>
      </div>
      <p className="text-sm text-zinc-400">
        See which requirements your recorded equipment meets and which benefits remain conditional.
      </p>
      {result.isPending ? (
        <p role="status">Checking build…</p>
      ) : result.isError ? (
        <p role="alert">Build insights are unavailable. Refresh to retry.</p>
      ) : (
        data && (
          <>
            {!data.recorded && (
              <p className="text-sm text-amber-200">
                No character equipment is recorded. You can still explore hypothetical alternatives
                below.
              </p>
            )}
            <InsightCards cards={data.cards} />
            <details className="rounded-lg border border-white/10 p-3">
              <summary className="cursor-pointer text-sm text-indigo-200">
                Compare a hypothetical alternative
              </summary>
              <label className="mt-3 block text-sm">
                Alternative
                <select
                  className="mt-1 w-full rounded border border-white/20 bg-zinc-950 p-2"
                  value={choice}
                  onChange={(e) => {
                    setChoice(e.target.value);
                    setRefinement('');
                  }}
                >
                  <option value="">Choose a weapon or artifact set</option>
                  <optgroup label="Compatible weapon types">
                    {data.weaponOptions.map((w) => (
                      <option key={w.key} value={`weapon:${w.key}`}>
                        {w.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Artifact sets">
                    {data.artifactOptions.map((s) => (
                      <option key={s.key} value={`set:${s.key}`}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              {choice.startsWith('weapon:') && (
                <label className="mt-3 block text-sm">
                  Hypothetical refinement
                  <select
                    className="ml-2 rounded bg-zinc-950 p-2"
                    value={refinement}
                    onChange={(e) => setRefinement(e.target.value)}
                  >
                    <option value="">Unknown</option>
                    {[1, 2, 3, 4, 5].map((rank) => (
                      <option key={rank} value={rank}>
                        R{rank}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {choice.startsWith('set:') && (
                <label className="mt-3 block text-sm">
                  Hypothetical pieces
                  <select
                    className="ml-2 rounded bg-zinc-950 p-2"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {choice &&
                (comparison.isPending || comparison.isFetching ? (
                  <p role="status" className="mt-3 text-sm">
                    Checking alternative…
                  </p>
                ) : comparison.isError ? (
                  <p role="alert">The alternative could not be checked. Refresh to retry.</p>
                ) : (
                  comparison.data?.comparison && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-amber-200">
                        Hypothetical only · recorded equipment stays unchanged. Effects are compared
                        by their conditions; no overall ranking is implied.
                      </p>
                      <InsightCards cards={comparison.data.comparison} />
                    </div>
                  )
                ))}
            </details>
            <details className="text-xs text-zinc-400">
              <summary className="cursor-pointer">Coverage and limits</summary>
              {data.limitations.map((text) => (
                <p key={text} className="mt-2">
                  {text}
                </p>
              ))}
            </details>
          </>
        )
      )}
    </section>
  );
}
