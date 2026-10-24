import '../styles/today-domains.css';

import {
  SERVER_POLICIES,
  type ShowcaseCharacter,
  type SupportedServerId,
} from '@celestia/api-contracts';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  charactersForDomain,
  farmingClock,
  farmingDays,
  farmingServer,
  missingFarmingMappings,
  resetCountdown,
  type TodayDomain,
  todayDomains,
} from '../lib/today-domains';
import { uidCharacterPath } from '../lib/uid-workspace';
import { GenshinMaterialIcon } from './GenshinMaterialIcon';
import { UiIcon } from './Ui';

const noCharacters: ShowcaseCharacter[] = [];

function ResetTimer({ nextReset }: { nextReset: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="farming-reset">
      Reset in <strong>{resetCountdown(nextReset, now)}</strong>
    </span>
  );
}

function DomainRow({
  domain,
  uid,
  characters,
}: {
  domain: TodayDomain;
  uid?: string;
  characters: ShowcaseCharacter[];
}) {
  const relevant = charactersForDomain(domain, characters);
  return (
    <li className="farming-domain">
      <div className="farming-materials" aria-label="Available materials">
        {domain.dropKeys.map((key) => (
          <GenshinMaterialIcon itemKey={key} size="sm" key={key} />
        ))}
      </div>
      <div className="farming-domain-copy">
        <span className="farming-region">{domain.region}</span>
        <h4>{domain.family}</h4>
        <p>{domain.entrance}</p>
        {uid && relevant.length ? (
          <div className="farming-matches" aria-label="Matching characters">
            {relevant.map((character) => (
              <Link
                key={character.key}
                to={uidCharacterPath(uid, character.key)}
                title={
                  domain.kind === 'weapon'
                    ? `${character.weapon?.name} · ${character.name}'s observed build`
                    : `${character.name}'s observed build`
                }
                aria-label={
                  domain.kind === 'weapon'
                    ? `Open ${character.name} · ${character.weapon?.name}`
                    : `Open ${character.name}`
                }
              >
                {character.portrait ? (
                  <img
                    src={character.portrait}
                    alt=""
                    width={24}
                    height={24}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <span>{domain.kind === 'weapon' ? character.weapon?.name : character.name}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function DomainSection({
  kind,
  domains,
  uid,
  characters,
}: {
  kind: 'talent' | 'weapon';
  domains: TodayDomain[];
  uid?: string;
  characters: ShowcaseCharacter[];
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <section className="farming-section" aria-labelledby={id}>
      <header className="farming-section-heading">
        <span className="farming-section-icon">
          <UiIcon name={kind === 'talent' ? 'planner' : 'inventory'} />
        </span>
        <div>
          <h3 id={id}>{kind === 'talent' ? 'Talents' : 'Weapons'}</h3>
          <p>{kind === 'talent' ? 'Talent level-up materials' : 'Weapon ascension materials'}</p>
        </div>
        <span className="farming-count">{domains.length}</span>
      </header>
      {domains.length ? (
        <ul id={`${id}-list`} className="farming-domain-list">
          {(expanded ? domains : domains.slice(0, 4)).map((domain) => (
            <DomainRow key={domain.domainKey} domain={domain} uid={uid} characters={characters} />
          ))}
        </ul>
      ) : (
        <p className="farming-empty">
          No matching materials on this day. Try another day or All materials.
        </p>
      )}
      {domains.length > 4 ? (
        <button
          type="button"
          className="farming-expand"
          aria-expanded={expanded}
          aria-controls={`${id}-list`}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Show less' : `Show all ${domains.length} material families`}
        </button>
      ) : null}
    </section>
  );
}

export default function TodayDomains({
  uid,
  characters = noCharacters,
  rosterIssue,
}: {
  uid?: string;
  characters?: ShowcaseCharacter[];
  rosterIssue?: string | null;
}) {
  const id = useId();
  const inferred = farmingServer(uid);
  const [server, setServer] = useState<SupportedServerId>(inferred ?? 'asia');
  const [now, setNow] = useState(Date.now);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [scope, setScope] = useState<'roster' | 'all'>('roster');
  const clock = farmingClock(now, server);
  const day = selectedDay ?? clock.weekday;
  const hasRoster = !!uid && characters.length > 0;
  const rosterOnly = scope === 'roster' && hasRoster;
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = setTimeout(update, Math.max(0, clock.nextReset - Date.now()) + 25);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [clock.nextReset]);
  const domains = todayDomains
    .filter(
      (domain) =>
        domain.days.includes(day) &&
        (!rosterOnly || charactersForDomain(domain, characters).length > 0),
    )
    .sort((a, b) => {
      const matching =
        Number(charactersForDomain(b, characters).length > 0) -
        Number(charactersForDomain(a, characters).length > 0);
      return matching || a.region.localeCompare(b.region) || a.family.localeCompare(b.family);
    });
  return (
    <section className="today-farming" aria-labelledby={`${id}-title`}>
      <div className="farming-heading">
        <div>
          <p className="eyebrow">A LITTLE PROGRESS, EVERY DAY</p>
          <h2 id={`${id}-title`}>
            {selectedDay === null ? 'Available today' : `Plan for ${farmingDays[day]}`}
          </h2>
          <p>Find a domain. Make your next step count.</p>
        </div>
        <div className="farming-clock">
          <label>
            <span className="sr-only">Farming server</span>
            <select
              aria-label="Farming server"
              value={server}
              onChange={(event) => {
                setServer(event.target.value as SupportedServerId);
                setNow(Date.now());
              }}
            >
              {Object.entries(SERVER_POLICIES).map(([key, policy]) => (
                <option value={key} key={key}>
                  {policy.label} · {policy.timezone}
                </option>
              ))}
            </select>
          </label>
          <ResetTimer nextReset={clock.nextReset} />
        </div>
      </div>
      <div className="farming-controls">
        <div className="farming-days" role="group" aria-label="Farming day">
          {farmingDays.map((name, index) => (
            <button
              type="button"
              key={name}
              aria-label={`${name}${index === clock.weekday ? ' (today)' : ''}`}
              aria-pressed={day === index}
              onClick={() => setSelectedDay(index === clock.weekday ? null : index)}
            >
              <span>{name.slice(0, 3)}</span>
              <small>{index === clock.weekday ? 'Today' : ' '}</small>
            </button>
          ))}
        </div>
        <div className="farming-scope" role="group" aria-label="Material matches">
          <button
            type="button"
            aria-pressed={rosterOnly}
            disabled={!hasRoster}
            onClick={() => setScope('roster')}
          >
            Your roster
          </button>
          <button type="button" aria-pressed={!rosterOnly} onClick={() => setScope('all')}>
            All materials
          </button>
        </div>
      </div>
      <div className="farming-context">
        <p>
          {farmingDays[day]} ·{' '}
          {rosterOnly
            ? 'Materials used by your saved characters and equipped weapons'
            : 'Standard domain rotation'}
          {day === 6 ? ' · All material families available' : ''}
        </p>
        {selectedDay !== null ? (
          <button type="button" onClick={() => setSelectedDay(null)}>
            Back to today
          </button>
        ) : null}
      </div>
      {!hasRoster ? (
        <p className="farming-note">
          {uid
            ? 'Showing the full schedule. Roster matches appear when character data is available.'
            : 'Add your UID to find materials for your characters and weapons.'}
        </p>
      ) : null}
      {rosterIssue ? (
        <p className="farming-note" role="status">
          {rosterIssue}
        </p>
      ) : null}
      <div className="farming-sections">
        {(['talent', 'weapon'] as const).map((kind) => (
          <DomainSection
            key={`${kind}-${day}-${rosterOnly}-${server}`}
            kind={kind}
            domains={domains.filter((domain) => domain.kind === kind)}
            uid={uid}
            characters={characters}
          />
        ))}
      </div>
      <footer className="farming-footnote">
        <p>
          Resets at 04:00 server time. Matches use saved builds; material stock and farming needs
          are not tracked.
        </p>
        {hasRoster && missingFarmingMappings(characters) ? (
          <p>
            Some characters or weapons have no material mapping yet, including Traveler talents.
          </p>
        ) : null}
        <details>
          <summary>About this schedule</summary>
          <p>
            Standard weekly rotation from the existing{' '}
            <a
              href="https://github.com/theBowja/genshin-db/tree/49a6544a6c6ae36089cb42fa591fc46f01de8bcf"
              target="_blank"
              rel="noreferrer"
            >
              genshin-db catalog
            </a>
            . Temporary event or banner availability may differ; check in-game notices. Domain
            access depends on your game progress.
          </p>
        </details>
      </footer>
    </section>
  );
}
