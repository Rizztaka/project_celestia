import { useQuery } from '@tanstack/react-query';

import { fetchImportStatus } from '../lib/api';

export function ImportStatus() {
  const status = useQuery({
    queryKey: ['genshin', 'import-status'],
    queryFn: ({ signal }) => fetchImportStatus(signal),
  });
  return (
    <details className="glass-panel mb-6 rounded-xl p-4">
      <summary className="cursor-pointer font-medium text-zinc-200">Saved data freshness</summary>
      <p className="mt-3 text-sm text-zinc-400">
        Times show when Celestia received your export, not when you last played. Source labels come
        from the export. No automatic game sync.
      </p>
      {status.isPending && (
        <p role="status" className="mt-3 text-sm">
          Loading import details…
        </p>
      )}
      {status.isError && (
        <div role="alert" className="mt-3 text-sm text-amber-300">
          <p>
            {status.data
              ? 'Import details could not refresh. Last confirmed receipts remain below.'
              : 'Import details are unavailable. Your saved inventory is still available.'}
          </p>
          <button type="button" onClick={() => void status.refetch()} className="mt-2 underline">
            Retry import details
          </button>
        </div>
      )}
      {status.data && (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {status.data.sections.map((section) => (
            <div key={section.section} className="min-w-0">
              <dt className="font-medium capitalize text-white">{section.section}</dt>
              <dd className="mt-1 break-words text-sm text-zinc-400">
                {section.status === 'unknown' ? (
                  'Import date and source unknown.'
                ) : (
                  <>
                    <span className="block">
                      Last imported {new Date(section.importedAt!).toLocaleString()}
                    </span>
                    <span className="block">
                      {section.source || 'Unspecified export source'} · {section.entryCount} entries
                      supplied
                    </span>
                    <span className="block">
                      {section.scope === 'merged_entries'
                        ? 'Merged entries; older character records may remain.'
                        : 'Replaced this section using the supplied export.'}
                    </span>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </details>
  );
}
