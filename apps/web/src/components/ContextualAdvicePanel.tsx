import {
  type CharacterEquipmentResponse,
  type ContextualReleaseAdviceData,
  type ContextualReleaseMetadata,
  type ContextualScenario,
  contextualSets,
} from '@celestia/api-contracts';
import { hashKey, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { captureSession } from '../lib/account-session';
import { fetchGenshinRoster, type RosterCharacter } from '../lib/api';
import {
  type ContextualObservationDisposition,
  ContextualSnapshotChanged,
  contextualSnapshotChangedMessage,
  contextualSnapshotKey,
  defaultContextualScenario,
} from '../lib/contextual-advice';
import {
  contextualQueryOptions,
  contextualRecordGuardKey,
  ContextualReleaseChanged,
  contextualReleaseQueryOptions,
  type ContextualReleaseSelection,
  contextualSelectionKey,
  releaseChangedMessage,
  releaseObservationKey,
} from '../lib/contextual-release-client';
import { useAuthStore } from '../stores/auth.store';

const labels: Record<string, string> = {
  talents: 'Talent relevance',
  energy: 'Energy and Burst context',
  team: 'Team interaction',
  unknown: 'Unknown / not assumed',
  on_field: 'On-field attacks',
  off_field: 'Off-field / Oz',
  burst_swap: 'Skill/Burst then swap',
  quickswap_support: 'Quickswap support / plunge',
  recorded: 'Recorded equipment',
  MarechausseeHunter: 'Marechaussee Hunter',
  GoldenTroupe: 'Golden Troupe',
  ViridescentVenerer: 'Viridescent Venerer',
  Keqing: 'Keqing',
  Fischl: 'Fischl',
  KaedeharaKazuha: 'Kaedehara Kazuha',
  yes: 'Assume yes',
  no: 'Assume no',
  within_5s: 'Within 5 seconds',
  within_10s: 'Within 10 seconds',
  expired: 'Expired',
  use: 'Plan to use Burst',
  skip: 'Plan to skip Burst',
  returned_under_2s_with_bonus: 'Carried bonus: under 2s after return',
  on_field_at_least_2s: 'On-field for at least 2s',
  pyro: 'Pyro',
  hydro: 'Hydro',
  electro: 'Electro',
  cryo: 'Cryo',
  anemo: 'Anemo',
  geo: 'Geo',
  dendro: 'Dendro',
  unlocked: 'Assume Ascension 4 unlocked',
};
const supported = ['Keqing', 'Fischl', 'KaedeharaKazuha'];
export function ContextualAdvicePanel({
  equipment,
  onRefresh,
}: {
  equipment: CharacterEquipmentResponse;
  onRefresh: () => void;
}) {
  const epoch = useAuthStore((state) => state.sessionEpoch);
  const roster = useQuery({
    queryKey: ['genshin', 'characters'],
    queryFn: ({ signal }) => fetchGenshinRoster(signal),
    retry: false,
  });
  const members = roster.data?.characters ?? [];
  return (
    <ContextualScenarioPanel
      key={`${epoch}:${contextualSnapshotKey(equipment, members)}`}
      equipment={equipment}
      roster={members}
      onRefresh={() => {
        onRefresh();
        void roster.refetch();
      }}
    />
  );
}
function SelectAssumption({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm">
      <span>{label}</span>
      <select
        className="min-h-11 w-full min-w-0 max-w-full rounded-lg border border-white/20 bg-zinc-900 px-2 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
function ContextualScenarioPanel({
  equipment,
  roster,
  onRefresh,
}: {
  equipment: CharacterEquipmentResponse;
  roster: RosterCharacter[];
  onRefresh: () => void;
}) {
  const [scenario, setScenario] = useState<ContextualScenario>(defaultContextualScenario);
  const session = captureSession();
  const releaseInfo = useQuery(contextualReleaseQueryOptions(session));
  const selection = useQuery<ContextualReleaseSelection | null>({
    queryKey: contextualSelectionKey(session),
    queryFn: () => null,
    enabled: false,
    gcTime: Infinity,
  });
  const release = releaseInfo.data?.release;
  const revision = selection.data?.revision ?? 0;
  const disposition = useQuery<ContextualObservationDisposition | null>({
    queryKey: contextualRecordGuardKey(equipment, session, roster),
    queryFn: () => null,
    enabled: false,
    // The rejection must not expire while advice from this observation can still be retained.
    gcTime: Infinity,
  });
  const releaseDisposition = useQuery<ContextualObservationDisposition | null>({
    queryKey: releaseObservationKey(equipment, session, roster, release),
    queryFn: () => null,
    enabled: false,
    gcTime: Infinity,
  });
  const metadata = useQuery(
    contextualQueryOptions(
      equipment,
      defaultContextualScenario(),
      session,
      roster,
      release,
      revision,
    ),
  );
  const options = contextualQueryOptions(equipment, scenario, session, roster, release, revision);
  const advice = useQuery(options);
  const data = advice.data?.advice;
  const changed =
    advice.error instanceof ContextualSnapshotChanged ||
    Boolean(
      disposition.data && !disposition.data.alignedQueries.includes(hashKey(options.queryKey)),
    ) ||
    Boolean(
      releaseDisposition.data &&
      !releaseDisposition.data.alignedQueries.includes(hashKey(options.queryKey)),
    );
  const releaseChanged =
    advice.error instanceof ContextualReleaseChanged ||
    Boolean(
      selection.data?.rejected &&
      !selection.data.alignedQueries.includes(hashKey(options.queryKey)),
    );
  const isSupported = supported.includes(equipment.character.characterKey);
  const field = <K extends keyof ContextualScenario>(key: K, value: ContextualScenario[K]) =>
    setScenario((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'setExample' ? { examplePieces: 'unknown' as const } : {}),
    }));
  const select = <K extends keyof ContextualScenario>(
    key: K,
    label: string,
    options: readonly string[],
  ) => (
    <SelectAssumption
      key={key}
      label={label}
      value={String(scenario[key] ?? 'unknown')}
      options={options}
      onChange={(value) =>
        field(
          key,
          (value === 'unknown' && key === 'activeCharacter'
            ? undefined
            : value) as ContextualScenario[K],
        )
      }
    />
  );
  const peers = [...new Set([...supported, ...roster.map((entry) => entry.characterKey)])].filter(
    (key) => key !== equipment.character.characterKey,
  );
  const teamSelection = (characterKey: string, selection: string) =>
    setScenario((previous) => {
      const team = [
        ...(previous.team ?? []).filter((entry) => entry.characterKey !== characterKey),
        ...(selection === 'none'
          ? []
          : [{ characterKey, selection: selection as 'owned' | 'hypothetical' }]),
      ];
      return {
        ...previous,
        team,
        activeCharacter:
          previous.activeCharacter === characterKey && selection === 'none'
            ? undefined
            : previous.activeCharacter,
        exampleFischlA4: team.some(
          (entry) => entry.characterKey === 'Fischl' && entry.selection === 'hypothetical',
        )
          ? previous.exampleFischlA4
          : 'unknown',
      };
    });
  return (
    <section
      aria-label="Contextual guidance v2"
      className="glass-panel mb-6 min-w-0 space-y-4 rounded-xl border border-indigo-400/20 p-4 sm:p-6"
    >
      <h2 className="text-xl font-semibold text-white">Guidance for your scenario</h2>
      <p className="text-sm text-zinc-400">
        Choose how you play, then explore conditions that matter. Assumptions are temporary;
        recorded equipment stays unchanged.
      </p>
      {isSupported && (
        <>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {select(
              'role',
              'Ability-use role',
              metadata.data?.advice.supportedRoles ?? ['unknown'],
            )}
            {select('burst', 'Burst plan', ['unknown', 'use', 'skip'])}
          </div>
          <details className="rounded-lg border border-white/10 p-3">
            <summary className="min-h-11 cursor-pointer py-2">
              Set examples and trigger assumptions
            </summary>
            <p className="my-3 text-xs text-zinc-400">
              Recorded piece counts are lower/upper bounds. Missing slots are unresolved.
              Hypothetical counts and combat triggers do not equip items or prove uptime.
            </p>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {select('setExample', 'Set setup', ['recorded', ...contextualSets])}
              {scenario.setExample !== 'recorded' &&
                select('examplePieces', 'Exact hypothetical matching pieces', [
                  'unknown',
                  '0',
                  '1',
                  '2',
                  '3',
                  '4',
                  '5',
                ])}
            </div>
            <details className="mt-3">
              <summary className="min-h-11 cursor-pointer py-2">
                Marechaussee Hunter: HP-change stacks
              </summary>
              <div className="grid gap-3 sm:grid-cols-2">
                {select('hpChange', 'Current HP changed (not max-HP-only)', [
                  'unknown',
                  'yes',
                  'no',
                ])}
                {select('mhOnField', 'Wearer on field at HP-change trigger', [
                  'unknown',
                  'yes',
                  'no',
                ])}
                {select('mhStacks', 'Active MH stacks assumed', ['unknown', '0', '1', '2', '3'])}
                {select('mhWindow', 'MH stack window', ['unknown', 'within_5s', 'expired'])}
              </div>
            </details>
            <details>
              <summary className="min-h-11 cursor-pointer py-2">
                Golden Troupe: field timing
              </summary>
              {select('gtField', 'Golden Troupe field-time assumption', [
                'unknown',
                'off_field',
                'returned_under_2s_with_bonus',
                'on_field_at_least_2s',
              ])}
            </details>
            <details>
              <summary className="min-h-11 cursor-pointer py-2">
                Viridescent Venerer: ordinary Swirl
              </summary>
              <div className="grid gap-3 sm:grid-cols-2">
                {select('swirl', 'Wearer triggered ordinary Swirl', ['unknown', 'yes', 'no'])}
                {select('vvOnField', 'Wearer on field at Swirl trigger', ['unknown', 'yes', 'no'])}
                {select('swirlElement', 'Swirled element', [
                  'unknown',
                  'pyro',
                  'hydro',
                  'electro',
                  'cryo',
                  'anemo',
                  'geo',
                  'dendro',
                ])}
                {select('targetElement', 'Resistance target element', [
                  'unknown',
                  'pyro',
                  'hydro',
                  'electro',
                  'cryo',
                  'anemo',
                  'geo',
                  'dendro',
                ])}
                {select('vvWindow', 'VV debuff window', ['unknown', 'within_10s', 'expired'])}
              </div>
            </details>
          </details>
          <details className="rounded-lg border border-white/10 p-3">
            <summary className="min-h-11 cursor-pointer py-2">
              Temporary team and Oz context
            </summary>
            <p className="my-3 text-xs text-zinc-400">
              This owned character is included. Select up to three additional unique members. Owned
              selections are checked by the API; hypothetical examples imply no ownership.
              Membership alone proves no reactions or activation.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                Add temporary member
                <select
                  className="min-h-11 min-w-0 max-w-full rounded-lg border border-white/20 bg-zinc-900 px-2"
                  value=""
                  disabled={(scenario.team?.length ?? 0) >= 3}
                  onChange={(event) => {
                    const member = JSON.parse(event.target.value) as {
                      characterKey: string;
                      selection: string;
                    };
                    teamSelection(member.characterKey, member.selection);
                  }}
                >
                  <option value="" disabled>
                    Choose owned or hypothetical member
                  </option>
                  {peers
                    .filter((key) => !scenario.team?.some((entry) => entry.characterKey === key))
                    .flatMap((key) => [
                      ...(roster.some((entry) => entry.characterKey === key)
                        ? [
                            <option
                              key={`owned-${key}`}
                              value={JSON.stringify({ characterKey: key, selection: 'owned' })}
                            >
                              {labels[key] ?? key} · owned selection
                            </option>,
                          ]
                        : []),
                      ...(supported.includes(key)
                        ? [
                            <option
                              key={`example-${key}`}
                              value={JSON.stringify({
                                characterKey: key,
                                selection: 'hypothetical',
                              })}
                            >
                              {labels[key] ?? key} · hypothetical example
                            </option>,
                          ]
                        : []),
                    ])}
                </select>
              </label>
              {(scenario.team ?? []).map((entry) => (
                <div
                  key={entry.characterKey}
                  className="flex min-w-0 flex-wrap items-center gap-2 text-sm"
                >
                  <span>
                    {labels[entry.characterKey] ?? entry.characterKey} · {entry.selection}
                  </span>
                  <button
                    type="button"
                    className="min-h-11 underline"
                    onClick={() => teamSelection(entry.characterKey, 'none')}
                  >
                    Remove {labels[entry.characterKey] ?? entry.characterKey}
                  </button>
                </div>
              ))}
              {select('activeCharacter', 'Assumed active reactor', [
                'unknown',
                equipment.character.characterKey,
                ...(scenario.team ?? []).map((entry) => entry.characterKey),
              ])}
              {select('oz', 'Oz present', ['unknown', 'yes', 'no'])}
              {select('electroReaction', 'Active reactor triggers Electro-related reaction', [
                'unknown',
                'yes',
                'no',
              ])}
              {scenario.team?.some(
                (member) => member.characterKey === 'Fischl' && member.selection === 'hypothetical',
              ) && select('exampleFischlA4', 'Hypothetical Fischl A4', ['unknown', 'unlocked'])}
            </div>
            {data && (
              <p className="mt-3 text-xs">
                API-confirmed scenario members:{' '}
                {data.team
                  .map(
                    (member) =>
                      `${labels[member.characterKey] ?? member.characterKey} (${member.selection})`,
                  )
                  .join(', ')}
              </p>
            )}
          </details>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-white/20 px-3 py-2 text-sm"
              onClick={() => setScenario(defaultContextualScenario())}
            >
              Reset guidance assumptions
            </button>
            <button
              type="button"
              disabled={advice.isFetching}
              className="min-h-11 rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
              onClick={() => void advice.refetch()}
            >
              Refresh contextual guidance
            </button>
          </div>
        </>
      )}
      {advice.isFetching && (
        <p role="status">
          {data ? 'Refreshing contextual guidance…' : 'Loading contextual guidance…'}
        </p>
      )}
      {(changed || releaseChanged || advice.isError || releaseInfo.isError) && (
        <div role="alert" className="space-y-2 text-sm text-amber-200">
          <p>
            {changed
              ? contextualSnapshotChangedMessage
              : releaseChanged
                ? releaseChangedMessage
                : releaseInfo.isError && !releaseInfo.data
                  ? 'Release information unavailable. Retry to load reviewed guidance.'
                  : data
                    ? 'Refresh failed. Showing previously loaded guidance for these assumptions and snapshot.'
                    : 'Guidance is unavailable for these assumptions. Retry or reset.'}
          </p>
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => {
              if (changed) onRefresh();
              else if (releaseChanged || releaseInfo.isError)
                void releaseInfo.refetch().then(() => advice.refetch());
              else void advice.refetch();
            }}
          >
            {changed
              ? 'Refresh records and reset'
              : releaseChanged || releaseInfo.isError
                ? 'Refresh release and retry'
                : 'Retry contextual guidance'}
          </button>
        </div>
      )}
      {!isSupported && (
        <p>
          Tailored guidance unavailable for this character. Recorded equipment remains browsable.
        </p>
      )}
      {data && !changed && !releaseChanged && releaseInfo.data && isSupported && (
        <GuidanceResults
          data={data}
          metadata={releaseInfo.data}
          characterKey={equipment.character.characterKey}
        />
      )}
    </section>
  );
}
function GuidanceResults({
  data,
  metadata,
  characterKey,
}: {
  data: ContextualReleaseAdviceData;
  metadata: ContextualReleaseMetadata;
  characterKey: string;
}) {
  const topics = ['talents', 'energy', ...contextualSets, 'team'] as const;
  return (
    <>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2" aria-live="polite">
        {topics.map((topic) => {
          const cards = data.cards.filter(
            (card) => card.topic === topic && card.presentation === 'card',
          );
          const bounds = data.setBounds.find((entry) => entry.setKey === topic);
          return cards.length ? (
            <article
              key={topic}
              aria-label={topic}
              className="min-w-0 space-y-2 rounded-lg border border-white/10 p-3"
            >
              <h3 className="font-semibold text-indigo-200">{labels[topic] ?? topic}</h3>
              {bounds && (
                <p className="text-xs text-zinc-400">
                  Recorded matching pieces: {bounds.recorded.min}–{bounds.recorded.max}
                  {data.scenario.setExample !== 'recorded'
                    ? ` · Hypothetical: ${bounds.modeled.min === bounds.modeled.max ? bounds.modeled.min : `${bounds.modeled.min}–${bounds.modeled.max}`} (not equipped; ${bounds.origin})`
                    : ''}
                  . Eligibility is separate from activation.
                </p>
              )}
              {cards.map((card) => (
                <div key={card.id} className="space-y-1 text-sm">
                  <p className="font-medium">{card.title}</p>
                  <p>{card.summary}</p>
                  <details>
                    <summary className="min-h-11 cursor-pointer py-2 text-xs text-indigo-200">
                      Why, conditions and sources: {card.title}
                    </summary>
                    <p className="text-xs">{card.explanation}</p>
                    <p className="my-2 text-xs">
                      Eligibility: {card.eligibility} · Applicability: {card.applicability} · Review{' '}
                      {card.review.date} ({card.review.type})
                    </p>
                    <ul className="space-y-1 break-words text-xs">
                      {card.trace.map((entry) => (
                        <li key={entry.path}>
                          {entry.path}: {entry.op} {entry.fact ?? ''} ·{' '}
                          {JSON.stringify(entry.value)} → {entry.result} ({entry.origin})
                        </li>
                      ))}
                    </ul>
                    {card.sourceIds.map((id) => {
                      const source = data.sources.find((entry) => entry.id === id)!;
                      return (
                        <a
                          key={id}
                          className="block min-h-11 break-words py-2 text-xs text-indigo-200 underline"
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {id} · {source.upstreamVersion}
                        </a>
                      );
                    })}
                  </details>
                </div>
              ))}
            </article>
          ) : null;
        })}
      </div>
      <p className="text-xs text-zinc-400">
        Stored talent convention is unknown. Account section receipts date imports, not live
        equipment/HP. These effects use different units and are not DPS gains or rankings.
      </p>
      <Link
        className="inline-block min-h-11 py-2 text-sm text-indigo-200 underline"
        to={`/planner?tab=farming&target=${encodeURIComponent(characterKey)}`}
      >
        Review explicit goals
      </Link>
      <details>
        <summary className="min-h-11 cursor-pointer py-2 text-sm text-indigo-200">
          Coverage and review limits
        </summary>
        <p className="text-xs">
          Release {metadata.release.id} · {metadata.release.digest}. Pack {data.packVersion} ·{' '}
          {metadata.release.packHash}. Review attribution: {metadata.reviewerTypes.join(', ')}.{' '}
          {metadata.activeClaims} active / {metadata.excludedClaims} excluded claims. No
          human/in-game/official patch certification is inferred. Activation and rollback require
          API restart. Fingerprint {data.fingerprint}
        </p>
        {metadata.reviewScope.map((scope) => (
          <p key={scope} className="my-2 text-xs">
            {scope}
          </p>
        ))}
        {metadata.limitations
          .filter((line) => !data.limitations.includes(line))
          .map((line) => (
            <p key={line} className="my-2 text-xs">
              {line}
            </p>
          ))}
        {data.limitations.map((line) => (
          <p key={line} className="my-2 text-xs">
            {line}
          </p>
        ))}
        {data.excluded.map((entry) => (
          <p key={entry.id} className="my-2 text-xs">
            {entry.reason}
          </p>
        ))}
        {data.externalReading.map((entry) => (
          <a
            key={entry.url}
            className="block min-h-11 py-2 text-sm text-indigo-200 underline"
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {entry.label}
          </a>
        ))}
      </details>
    </>
  );
}
