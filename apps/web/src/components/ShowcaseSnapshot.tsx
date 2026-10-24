import type {
  ShowcaseCharacter,
  ShowcaseEquipment,
  ShowcaseResult,
  ShowcaseStat,
} from '@celestia/api-contracts';
import { Link } from 'react-router-dom';

import { showcaseServer } from '../lib/showcase';

const talentKindLabels = {
  normal: 'Normal Attack',
  skill: 'Elemental Skill',
  burst: 'Elemental Burst',
};

function Statistics({ stats }: { stats: ShowcaseStat[] }) {
  return stats.length ? (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {stats.map((stat, index) => (
        <div
          key={`${stat.id}:${index}`}
          className="flex justify-between gap-3 border-b border-white/5 py-1"
        >
          <dt className="text-zinc-400">{stat.name}</dt>
          <dd className="shrink-0 font-mono text-zinc-100">{stat.formatted}</dd>
        </div>
      ))}
    </dl>
  ) : (
    <p className="text-sm text-zinc-400">Statistics not reported.</p>
  );
}
export function Equipment({ item }: { item: ShowcaseEquipment }) {
  return (
    <article className="min-w-0 rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="mb-3 flex items-center gap-3">
        {item.icon ? (
          <img
            src={item.icon}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-14 w-14 object-contain"
          />
        ) : null}
        <div className="min-w-0">
          <h4 className="font-medium text-zinc-100">{item.name}</h4>
          <p className="text-sm text-zinc-400">
            {item.slot ?? 'Weapon'} ·{' '}
            {item.level === null
              ? 'Level not reported'
              : `${item.slot ? '+' : 'Lv. '}${item.level}`}
            {item.refinement === null ? '' : ` · R${item.refinement}`}
            {item.rarity === null ? '' : ` · ${item.rarity}★`}
          </p>
          {item.ascension !== null ? (
            <p className="text-xs text-zinc-400">Ascension {item.ascension}</p>
          ) : null}
          {item.setName ? <p className="text-xs text-amber-100/80">{item.setName}</p> : null}
        </div>
      </div>
      <Statistics stats={item.stats} />
    </article>
  );
}
export function CharacterBuild({
  character,
  expanded = false,
  detailHref,
}: {
  character: ShowcaseCharacter;
  expanded?: boolean;
  detailHref?: string;
}) {
  const portrait = character.portrait ? (
    <img
      src={character.portrait}
      alt=""
      width={72}
      height={72}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-18 w-18 rounded-xl bg-white/5 object-contain"
    />
  ) : null;
  const header = (
    <>
      {portrait}
      <div className="min-w-0 flex-1">
        <h3 className="text-xl font-medium text-zinc-100">{character.name}</h3>
        <p className="mt-1 text-sm text-zinc-400">
          {character.level === null ? 'Level not reported' : `Level ${character.level}`}
          {' · '}
          {character.ascension === null
            ? 'Ascension not reported'
            : `Ascension ${character.ascension}`}
          {' · '}C{character.constellation}
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          {character.weapon?.name ?? 'Weapon not reported'}
          {character.weapon?.level == null ? '' : ` · Lv. ${character.weapon.level}`}
          {character.weapon?.refinement == null ? '' : ` · R${character.weapon.refinement}`}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {character.artifacts.length} equipped artifacts reported
          {character.talents.length
            ? ` · Base talents ${character.talents.map((talent) => talent.baseLevel).join(' / ')}`
            : ''}
        </p>
        {!character.metadataAvailable ? (
          <p className="mt-1 text-xs text-amber-200">
            Metadata unavailable; ID {character.id} is retained.
          </p>
        ) : null}
      </div>
    </>
  );
  return (
    <article
      aria-label={`${character.name} build`}
      className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60"
    >
      {detailHref ? (
        <Link
          to={detailHref}
          aria-label={`View ${character.name} details`}
          className="flex flex-wrap items-center gap-4 p-5 transition-colors hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-200"
        >
          {header}
        </Link>
      ) : (
        <div className="flex flex-wrap items-center gap-4 p-5">{header}</div>
      )}
      {expanded ? (
        <div className="space-y-6 border-t border-white/10 p-5">
          <section aria-label={`${character.name} talents`}>
            <h4 className="mb-2 font-medium text-zinc-100">Reported talents</h4>
            {character.talents.length ? (
              <div className="flex flex-wrap gap-3">
                {character.talents.map((talent) => (
                  <div key={talent.id} className="rounded-lg bg-white/5 px-4 py-2 text-sm">
                    <p className="mb-1 text-xs text-amber-100/70">
                      {talent.kind ? talentKindLabels[talent.kind] : 'Talent type unavailable'}
                    </p>
                    <p className="font-medium text-zinc-100">{talent.label}</p>
                    <p className="text-zinc-100">
                      Base {talent.baseLevel}
                      {talent.bonusLevel === null ? '' : ` · bonus +${talent.bonusLevel}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Talent levels not reported.</p>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              Order follows Enka character metadata. Only reported base and extra levels are shown.
            </p>
          </section>
          <section aria-label={`${character.name} equipment`}>
            <h4 className="mb-3 font-medium text-zinc-100">Equipped in this public snapshot</h4>
            {!character.equipmentAvailable ? (
              <p className="text-sm text-zinc-400">Equipment details not reported.</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {character.weapon ? (
                  <Equipment item={character.weapon} />
                ) : (
                  <p className="text-sm text-zinc-400">Weapon not reported.</p>
                )}
                {character.artifacts.map((artifact) => (
                  <Equipment key={artifact.slot} item={artifact} />
                ))}
                {!character.artifacts.length ? (
                  <p className="text-sm text-zinc-400">Artifacts not reported.</p>
                ) : null}
              </div>
            )}
          </section>
          <section aria-label={`${character.name} combat statistics`}>
            <h4 className="mb-3 font-medium text-zinc-100">Reported combat statistics</h4>
            <Statistics stats={character.stats} />
          </section>
        </div>
      ) : null}
    </article>
  );
}
const time = (value: string) => new Date(value).toLocaleString();
export function ShowcaseStatus({
  result,
  loading,
  error,
  compact = false,
}: {
  result?: ShowcaseResult;
  loading: boolean;
  error?: string;
  compact?: boolean;
}) {
  if (compact)
    return (
      <div className="space-y-2 text-sm" aria-live="polite">
        {loading ? (
          <p role="status" className="text-zinc-300">
            Loading public showcase…
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-amber-100">
            {error}
            {result?.snapshot ? ' Your previous builds are still shown.' : ''}
          </p>
        ) : null}
        {result?.issue || result?.delivery === 'stale' ? (
          <p role="alert" className="text-amber-100">
            {result.snapshot ? 'Refresh failed — showing the last successful snapshot. ' : ''}
            {result.issue?.message ?? 'Try refreshing again later.'}
          </p>
        ) : null}
      </div>
    );
  return (
    <div className="space-y-2" aria-live="polite">
      {loading ? (
        <p role="status" className="text-sm text-zinc-300">
          Loading public showcase…
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-300/30 p-4 text-sm text-amber-100"
        >
          {error} Any previous snapshot below has been retained.
        </p>
      ) : null}
      {result ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
          <p className="font-medium text-zinc-100">
            {result.delivery === 'fetched'
              ? 'Received a response from Enka.Network'
              : result.delivery === 'cached'
                ? 'Showing a locally cached Enka response'
                : result.delivery === 'stale'
                  ? 'Refresh failed — showing the last successful snapshot'
                  : 'Showcase unavailable'}
          </p>
          {result.fetchedAt ? (
            <p className="mt-1 text-zinc-400">
              Last successful Enka response:{' '}
              <time dateTime={result.fetchedAt}>{time(result.fetchedAt)}</time>
            </p>
          ) : null}
          <p className="mt-1 text-zinc-400">
            Next upstream request allowed:{' '}
            <time dateTime={result.nextRefreshAt}>{time(result.nextRefreshAt)}</time>
          </p>
          {result.issue ? (
            <p role="alert" className="mt-2 text-amber-100">
              {result.issue.message}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500">
            Enka may also cache its response. Receipt time does not establish when the game data
            changed.
          </p>
        </div>
      ) : !loading && !error ? (
        <p className="text-sm text-zinc-400">Enter a UID to load its available public builds.</p>
      ) : null}
    </div>
  );
}
export default function ShowcaseSnapshot({
  result,
  characterLinks = false,
  profileOnly = false,
}: {
  result: ShowcaseResult;
  characterLinks?: boolean;
  profileOnly?: boolean;
}) {
  const snapshot = result.snapshot;
  if (!snapshot) return null;
  return (
    <div className="space-y-6">
      <section
        aria-labelledby="showcase-profile-title"
        className="rounded-2xl border border-white/10 p-5"
      >
        <p className="text-xs uppercase tracking-widest text-amber-100/70">
          Public account overview
        </p>
        <h2 id="showcase-profile-title" className="mt-2 text-2xl text-zinc-100">
          {snapshot.nickname}
        </h2>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">UID</dt>
            <dd className="font-mono text-zinc-100">{snapshot.uid}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Server (from UID)</dt>
            <dd className="text-zinc-100">{showcaseServer(snapshot.uid) ?? 'Not identified'}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Adventure Rank</dt>
            <dd className="text-zinc-100">{snapshot.adventureRank ?? 'Not reported'}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">World Level</dt>
            <dd className="text-zinc-100">{snapshot.worldLevel ?? 'Not reported'}</dd>
          </div>
        </dl>
        {snapshot.signature ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-400">{snapshot.signature}</p>
        ) : null}
      </section>
      {!profileOnly ? (
        <section aria-labelledby="showcase-characters-title" className="space-y-3">
          <h2 id="showcase-characters-title" className="text-xl font-medium text-zinc-100">
            Public character builds{' '}
            <span className="text-zinc-500">({snapshot.characters.length})</span>
          </h2>
          {snapshot.characters.length ? (
            snapshot.characters.map((character) => (
              <CharacterBuild
                key={character.key}
                character={character}
                detailHref={
                  characterLinks
                    ? `/u/${snapshot.uid}/character/${encodeURIComponent(character.key)}`
                    : undefined
                }
              />
            ))
          ) : (
            <div className="rounded-xl border border-white/10 p-6 text-zinc-300">
              <p>No detailed public character builds were returned.</p>
              <p className="mt-2 text-sm text-zinc-400">
                The showcase may be empty or private. Enable Character Showcase details in Genshin
                Impact and add characters, then refresh after the cache expires. This does not mean
                the account owns no characters.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
