import { useUidWorkspace } from '../lib/uid-workspace';
import { useRefreshSeconds } from '../lib/use-showcase';
import { ShowcaseStatus } from './ShowcaseSnapshot';

export default function UidShowcaseToolbar() {
  const { query } = useUidWorkspace();
  const wait = useRefreshSeconds(query.data);
  return (
    <section className="space-y-3" aria-label="Connected showcase status">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
          Refresh retrieves the current public showcase. Previously observed builds stay in your
          browser roster.
        </p>
        <button
          className="button-secondary disabled:opacity-50"
          type="button"
          disabled={query.isFetching || wait > 0}
          aria-describedby="uid-refresh-help"
          onClick={() => {
            if (!query.isFetching && !wait) void query.refetch();
          }}
        >
          {query.isFetching ? 'Refreshing…' : 'Refresh Showcase'}
        </button>
      </div>
      <p id="uid-refresh-help" className="text-xs text-zinc-500" role="status">
        {wait ? `Refresh available in ${wait}s.` : 'Ready to refresh.'}
      </p>
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
    </section>
  );
}
