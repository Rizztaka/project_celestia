import type { CharacterEquipmentResponse, GuideScenario } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { captureSession } from '../lib/account-session';
import { guideObservation, guideQueryOptions, guideSnapshotKey } from '../lib/guide-knowledge';
import { useAuthStore } from '../stores/auth.store';

export function GuideAdviceCard({
  equipment,
  onRefresh,
}: {
  equipment: CharacterEquipmentResponse;
  onRefresh: () => void;
}) {
  const epoch = useAuthStore((state) => state.sessionEpoch);
  return (
    <AdviceScenario
      key={`${epoch}:${guideSnapshotKey(equipment)}`}
      equipment={equipment}
      onRefresh={onRefresh}
    />
  );
}
function AdviceScenario({
  equipment,
  onRefresh,
}: {
  equipment: CharacterEquipmentResponse;
  onRefresh: () => void;
}) {
  const [scenario, setScenario] = useState<GuideScenario>({ contractVersion: '1', hp: 'unknown' });
  const advice = useQuery(guideQueryOptions(equipment, scenario, captureSession()));
  const data = advice.data;
  const changed =
    data && JSON.stringify(data.observation) !== JSON.stringify(guideObservation(equipment));
  const recorded = equipment.weapon.item?.weaponKey === 'HarbingerOfDawn';
  return (
    <section
      aria-label="Contextual guide advice"
      className="glass-panel mb-6 min-w-0 space-y-4 rounded-xl border border-indigo-400/20 p-4 sm:p-6"
    >
      <h2 className="text-xl font-semibold text-white">Contextual guide advice</h2>
      <button
        type="button"
        disabled={advice.isFetching}
        className="min-h-11 rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
        onClick={() => void advice.refetch()}
      >
        Refresh advice
      </button>
      <p className="text-sm text-zinc-400">
        Pinned mechanical example · Keqing / Harbinger of Dawn. Recorded equipment is an import
        snapshot; assumptions below do not change your account.
      </p>
      {equipment.character.characterKey === 'Keqing' && (
        <fieldset className="space-y-4">
          <legend className="mb-2 font-medium text-indigo-200">Scenario assumptions</legend>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={!!scenario.example}
              onChange={(event) =>
                setScenario({
                  contractVersion: '1',
                  hp: 'unknown',
                  ...(event.target.checked ? { example: 'harbinger', refinement: 'unknown' } : {}),
                })
              }
            />
            Hypothetical Harbinger of Dawn example (does not imply ownership)
          </label>
          {!scenario.example && (
            <p className="text-sm">
              {recorded
                ? `Using recorded Harbinger of Dawn, stored refinement ${equipment.weapon.item?.refinement}.`
                : `Weapon assignment: ${equipment.weapon.state}. Harbinger of Dawn is not recorded here; opt into the example to explore it.`}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <label className="flex min-w-0 flex-col gap-2 text-sm">
              HP assumption (not live HP)
              <select
                className="min-h-11 max-w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2"
                value={scenario.hp}
                onChange={(event) =>
                  setScenario({ ...scenario, hp: event.target.value as GuideScenario['hp'] })
                }
              >
                <option value="unknown">Unknown HP / uptime</option>
                <option value="above_90">Above 90% HP</option>
                <option value="at_or_below_90">At or below 90% HP</option>
              </select>
            </label>
            {scenario.example && (
              <label className="flex min-w-0 flex-col gap-2 text-sm">
                Hypothetical refinement
                <select
                  className="min-h-11 rounded-lg border border-white/20 bg-zinc-900 px-3 py-2"
                  value={scenario.refinement ?? 'unknown'}
                  onChange={(event) =>
                    setScenario({
                      ...scenario,
                      refinement: event.target.value as GuideScenario['refinement'],
                    })
                  }
                >
                  <option value="unknown">Unknown refinement</option>
                  {[1, 2, 3, 4, 5].map((rank) => (
                    <option key={rank} value={rank}>
                      R{rank}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-white/20 px-3 py-2 text-sm"
            onClick={() => setScenario({ contractVersion: '1', hp: 'unknown' })}
          >
            Reset assumptions
          </button>
        </fieldset>
      )}
      {advice.isFetching && (
        <p role="status">{data ? 'Refreshing contextual advice…' : 'Loading contextual advice…'}</p>
      )}
      {advice.isError && (
        <div role="alert" className="space-y-2 text-amber-200">
          <p>
            Could not refresh contextual advice.{' '}
            {data
              ? 'Showing previously loaded advice for the displayed assumptions and snapshot.'
              : 'Advice is unavailable for these assumptions.'}
          </p>
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => void advice.refetch()}
          >
            Retry advice
          </button>
        </div>
      )}
      {changed ? (
        <div role="status">
          <p>
            Equipment records changed. Refresh equipment to reset assumptions before using this
            advice.
          </p>
          <button type="button" className="min-h-11 underline" onClick={onRefresh}>
            Refresh equipment and reset
          </button>
        </div>
      ) : (
        data && (
          <>
            <div aria-live="polite" className="space-y-2 text-sm">
              <p className="font-medium text-indigo-200">
                {data.coverage === 'unsupported'
                  ? 'Tailored guidance unavailable'
                  : data.conclusion === 'active'
                    ? 'Passive active in this assumed scenario'
                    : data.conclusion === 'inactive'
                      ? 'Passive inactive in this assumed scenario'
                      : 'Conditional passive guidance'}
              </p>
              {data.explanations.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="text-xs text-zinc-400">
              Weapon section import: {data.observation.weaponsReceipt.importedAt ?? 'unknown'} ·{' '}
              {data.observation.weaponsReceipt.source ?? 'unknown source'}. This section receipt
              does not establish current equipment or HP.
            </p>
            <details className="space-y-2 text-sm">
              <summary className="min-h-11 cursor-pointer py-3 text-indigo-200">
                Evidence and coverage
              </summary>
              <p>
                Pack {data.packVersion} · Reviewed {data.review.date} by {data.review.reviewer} (
                {data.review.type})
              </p>
              <p>{data.review.scope}</p>
              {data.evidence.map((source) => (
                <p key={source.id} className="break-words">
                  <a
                    className="text-indigo-200 underline"
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.id} · pinned source
                  </a>
                  <span className="block break-all text-xs text-zinc-400">
                    SHA-256 {source.sha256}
                  </span>
                </p>
              ))}
              <a
                className="inline-block min-h-11 py-3 text-indigo-200 underline"
                href={data.externalReading}
                target="_blank"
                rel="noopener noreferrer"
              >
                Further reading: KeqingMains Keqing Quick Guide
              </a>
              {data.limitations.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </details>
          </>
        )
      )}
    </section>
  );
}
