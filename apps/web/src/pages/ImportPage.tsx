import {
  type ImportPreviewRequest,
  type ImportSection,
  importSections,
} from '@celestia/api-contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { ImportStatus } from '../components/ImportStatus';
import { invalidateIntentQueries } from '../lib/account-cache';
import { captureSession, isCurrentSession } from '../lib/account-session';
import { ApiError, importGenshinAccount, previewGenshinImport } from '../lib/api';

const labels: Record<ImportSection, string> = {
  characters: 'Characters',
  weapons: 'Weapons',
  artifacts: 'Artifacts',
  materials: 'Materials',
};
const buttonClass =
  'rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function ImportPage() {
  const [goodJson, setGoodJson] = useState('');
  const [selected, setSelected] = useState<ImportSection[]>([]);
  const [confirmed, setConfirmed] = useState<ImportSection[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [session] = useState(captureSession);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const completeHeading = useRef<HTMLHeadingElement>(null);
  const exportInput = useRef<HTMLTextAreaElement>(null);
  const errorNotice = useRef<HTMLParagraphElement>(null);
  const restart = useRef(false);
  const preview = useMutation({
    mutationFn: (request: ImportPreviewRequest) => previewGenshinImport(request, session),
    retry: false,
    networkMode: 'always',
  });
  const commit = useMutation({
    mutationFn: (request: Parameters<typeof importGenshinAccount>[0]) =>
      importGenshinAccount(request, session),
    retry: false,
    networkMode: 'always',
    onSuccess: async () => {
      if (!isCurrentSession(session)) return;
      await invalidateIntentQueries(queryClient);
    },
    onError: (error) => {
      if (!isCurrentSession(session)) return;
      // An uncertain network outcome also requires a fresh preview before retrying.
      if (!(error instanceof ApiError) || error.status === 409 || error.status >= 500) {
        preview.reset();
        setConfirmed([]);
      }
    },
  });
  const pending = preview.isPending || commit.isPending;
  let payload: unknown;
  try {
    payload = JSON.parse(goodJson);
  } catch {
    /* Shown on preview submission. */
  }
  const available = importSections.filter(
    (section) => payload !== null && typeof payload === 'object' && Object.hasOwn(payload, section),
  );
  const visibleSelected = selected.filter((section) => available.includes(section));
  const error = parseError ?? (commit.error ?? preview.error)?.message;
  useEffect(() => {
    if (!pending && isCurrentSession(session)) {
      if (error) errorNotice.current?.focus();
      else if (commit.isSuccess) completeHeading.current?.focus();
      else if (preview.isSuccess) previewHeading.current?.focus();
      else if (restart.current) {
        exportInput.current?.focus();
        restart.current = false;
      }
    }
  }, [pending, error, commit.isSuccess, preview.isSuccess, session]);

  function edit() {
    preview.reset();
    commit.reset();
    setConfirmed([]);
    setParseError(null);
  }
  function review(event: React.FormEvent) {
    event.preventDefault();
    setParseError(null);
    commit.reset();
    setConfirmed([]);
    if (!goodJson.trim()) {
      setParseError('Paste your GOOD export first.');
      return;
    }
    if (payload === undefined) {
      setParseError('This is not valid JSON. Copy the complete export and try again.');
      return;
    }
    if (!visibleSelected.length) {
      setParseError('Select at least one section to import.');
      return;
    }
    const request: ImportPreviewRequest = { requestVersion: 1, payload, sections: visibleSelected };
    preview.mutate(request);
  }

  return (
    <div className="min-h-screen text-zinc-300">
      <main id="companion-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="eyebrow">BRING YOUR BUILDS ALONG</p>
        <h1 className="font-display mb-3 text-3xl font-bold text-white">Import account data</h1>
        <p className="mb-8 leading-relaxed text-zinc-400">
          Bring a GOOD export from Genshin Optimizer or Inventory Kamera into your companion. Choose
          what to update, review the changes, then confirm. Nothing is saved during preview. Imports
          update observations; focus, declared goals, history and plan choices stay yours.
        </p>
        <p className="mb-6 text-sm">
          Importing is optional.{' '}
          <Link className="text-indigo-200 underline" to="/workspace">
            Use Today without an import
          </Link>
          . Receipts date this import, not a live game observation.
        </p>
        <ImportStatus />
        {commit.isSuccess ? (
          <section className="glass-panel space-y-6 rounded-2xl p-6" aria-live="polite">
            <h2 ref={completeHeading} tabIndex={-1} className="text-2xl font-semibold text-white">
              Import complete
            </h2>
            <p>Selected sections were updated. All other inventory was preserved.</p>
            <dl className="grid grid-cols-2 gap-4">
              {commit.data.sections.map((section) => (
                <div key={section}>
                  <dt className="text-zinc-400">{labels[section]}</dt>
                  <dd className="text-2xl text-white">{commit.data[`${section}Imported`]}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-4">
              <Link className={buttonClass} to="/workspace">
                Return to Today
              </Link>
              <Link className={buttonClass} to="/roster">
                View characters
              </Link>
              <Link className={buttonClass} to="/inventory">
                View equipment
              </Link>
              <button
                onClick={() => {
                  restart.current = true;
                  edit();
                  setGoodJson('');
                  setSelected([]);
                }}
              >
                Import another file
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={review} className="glass-panel space-y-6 rounded-2xl p-5 sm:p-8">
            <div>
              <label htmlFor="good-json" className="mb-2 block font-medium text-white">
                GOOD JSON export
              </label>
              <textarea
                ref={exportInput}
                id="good-json"
                rows={9}
                value={goodJson}
                disabled={pending}
                onChange={(event) => {
                  edit();
                  setGoodJson(event.target.value);
                  setSelected([]);
                }}
                spellCheck={false}
                placeholder={'{ "format": "GOOD", "version": 2, "characters": [...] }'}
                className="w-full rounded-xl border border-white/15 bg-black/25 p-4 font-mono text-sm focus:border-indigo-400 focus:outline-none disabled:opacity-50"
              />
            </div>
            <fieldset disabled={pending} className="space-y-3">
              <legend className="mb-2 font-medium text-white">Choose sections to update</legend>
              <p className="text-sm text-zinc-400">
                Unselected or missing sections stay as they are. Characters merge into your roster;
                selected inventories replace the saved lists.
              </p>
              {importSections.map((section) => (
                <label key={section} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    disabled={!available.includes(section)}
                    checked={visibleSelected.includes(section)}
                    onChange={(event) => {
                      edit();
                      setSelected(
                        event.target.checked
                          ? [...selected, section]
                          : selected.filter((value) => value !== section),
                      );
                    }}
                  />
                  <span className="shrink-0">{labels[section]}</span>
                  {!available.includes(section) && (
                    <span className="text-xs text-zinc-500">Not in export · preserved</span>
                  )}
                </label>
              ))}
            </fieldset>
            {error && (
              <p
                ref={errorNotice}
                tabIndex={-1}
                role="alert"
                className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {error}
              </p>
            )}
            <button type="submit" disabled={pending} className={buttonClass}>
              {preview.isPending ? 'Checking export…' : 'Preview changes'}
            </button>
            {preview.data && (
              <section
                aria-label="Import preview"
                className="space-y-5 border-t border-white/10 pt-6"
              >
                <h2 ref={previewHeading} tabIndex={-1} className="text-xl font-semibold text-white">
                  Review your changes
                </h2>
                <p className="text-sm text-zinc-400">
                  Preview expires at {new Date(preview.data.expiresAt).toLocaleTimeString()}.
                  Changing your export or selection requires a new preview.
                </p>
                <div
                  className="overflow-x-auto"
                  role="region"
                  aria-label="Section counts; scroll horizontally on narrow screens"
                  tabIndex={0}
                >
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <caption className="mb-3 text-left text-zinc-400">
                      Counts are saved entries, not total material quantities.
                    </caption>
                    <thead>
                      <tr>
                        {['Section', 'Action', 'Saved', 'Incoming', 'After'].map((label) => (
                          <th key={label} className="px-2 py-3">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.sections.map((row) => (
                        <tr key={row.section} className="border-t border-white/10">
                          <th className="px-2 py-3">{labels[row.section]}</th>
                          <td className="px-2 py-3 capitalize">{row.action}</td>
                          <td className="px-2 py-3">{row.currentCount}</td>
                          <td className="px-2 py-3">{row.incomingCount ?? 'Not provided'}</td>
                          <td className="px-2 py-3">{row.resultingCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.data.clearSections.map((section) => (
                  <label
                    key={section}
                    className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      disabled={pending}
                      checked={confirmed.includes(section)}
                      onChange={(event) =>
                        setConfirmed(
                          event.target.checked
                            ? [...confirmed, section]
                            : confirmed.filter((value) => value !== section),
                        )
                      }
                    />
                    <span>
                      I confirm: clear all saved {labels[section].toLowerCase()} using this empty
                      section.
                    </span>
                  </label>
                ))}
                <button
                  type="button"
                  className={buttonClass}
                  disabled={
                    pending ||
                    preview.data.clearSections.some((section) => !confirmed.includes(section))
                  }
                  onClick={() => {
                    if (preview.variables && preview.data)
                      commit.mutate({
                        ...preview.variables,
                        previewToken: preview.data.previewToken,
                        confirmClear: confirmed,
                      });
                  }}
                >
                  {commit.isPending ? 'Saving import…' : 'Confirm import'}
                </button>
              </section>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
