import type { ShowcaseCharacter, ShowcaseEquipment, ShowcaseStat } from '@celestia/api-contracts';
import type { CSSProperties, ReactNode } from 'react';

const kinds = { normal: 'Normal Attack', skill: 'Elemental Skill', burst: 'Elemental Burst' };
const accents = {
  Anemo: '#83cbb8',
  Geo: '#dbbc7c',
  Electro: '#b7a0e6',
  Dendro: '#a9c776',
  Hydro: '#8fbde4',
  Pyro: '#e8a28e',
  Cryo: '#9ecddc',
};
const damageStats = {
  Anemo: '44',
  Geo: '45',
  Electro: '41',
  Dendro: '43',
  Hydro: '42',
  Pyro: '40',
  Cryo: '46',
};

function StatRows({ stats }: { stats: ShowcaseStat[] }) {
  return (
    <dl className="build-stat-rows">
      {stats.map((stat, index) => (
        <div key={`${stat.id}:${index}`}>
          <dt>{stat.name}</dt>
          <dd>{stat.formatted}</dd>
        </div>
      ))}
    </dl>
  );
}

function GearArtwork({ item }: { item: ShowcaseEquipment }) {
  return item.icon ? (
    <img
      className="build-gear-art"
      src={item.icon}
      alt=""
      width={72}
      height={72}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  ) : null;
}

function ArtifactCard({ slot, item }: { slot: string; item?: ShowcaseEquipment }) {
  if (!item)
    return (
      <article
        className="build-artifact build-artifact-missing"
        aria-label={`${slot} not reported`}
      >
        <p className="build-label">{slot}</p>
        <span aria-hidden="true">—</span>
        <p>Not reported</p>
      </article>
    );
  // The API explicitly identifies the main stat. Missing main stats must not turn a substat into one.
  const main = item.mainStat;
  const substats = main ? item.stats.slice(1) : item.stats;
  return (
    <article className="build-artifact" aria-label={`${slot}: ${item.name}`}>
      <header>
        <p className="build-label">{slot}</p>
        <span className="build-level">
          {item.level === null ? 'Level unknown' : `+${item.level}`}
        </span>
      </header>
      <GearArtwork item={item} />
      <h3>{item.name}</h3>
      <p className="build-artifact-set">{item.setName ?? 'Set not reported'}</p>
      <div className="build-main-stat">
        {main ? (
          <>
            <span>{main.name}</span>
            <strong>{main.formatted}</strong>
          </>
        ) : (
          <span>Main stat not reported</span>
        )}
      </div>
      {substats.length ? (
        <StatRows stats={substats} />
      ) : (
        <p className="build-muted">Substats not reported.</p>
      )}
    </article>
  );
}

export default function CharacterBuildDetail({
  character,
  uid,
  analysis,
}: {
  character: ShowcaseCharacter;
  uid: string;
  analysis?: ReactNode;
}) {
  const element = character.element;
  const ids = [
    '2000',
    '2001',
    '2002',
    '28',
    '20',
    '22',
    '23',
    ...(element ? [damageStats[element]] : []),
  ];
  const keyStats = ids.flatMap((id) => {
    const stat = character.stats.find((entry) => entry.id === id);
    return stat ? [stat] : [];
  });
  const sets = new Map<string, number>();
  for (const artifact of character.artifacts)
    if (artifact.setName) sets.set(artifact.setName, (sets.get(artifact.setName) ?? 0) + 1);
  const weapon = character.weapon;
  return (
    <article
      aria-label={`${character.name} build`}
      className="character-build-detail"
      style={{ '--build-accent': element ? accents[element] : '#d8be89' } as CSSProperties}
    >
      <div className="build-hero-grid">
        <header className="build-hero">
          <div className="build-portrait-frame">
            {character.portrait ? (
              <img
                src={character.portrait}
                alt=""
                width={176}
                height={176}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span aria-hidden="true">✧</span>
            )}
          </div>
          <div>
            <p className="build-kicker">{element ? `${element} · ` : ''}PUBLIC BUILD</p>
            <h1>{character.name}</h1>
            <p className="build-uid">UID {uid}</p>
            <div className="build-badges">
              <span className="build-badge">
                {character.level === null ? 'Level not reported' : `Level ${character.level}`}
              </span>
              <span className="build-badge">Constellation {character.constellation}</span>
              <span className="build-badge">
                {character.ascension === null
                  ? 'Ascension not reported'
                  : `Ascension ${character.ascension}`}
              </span>
            </div>
            {!character.metadataAvailable ? (
              <p className="build-muted">Metadata unavailable; ID {character.id} is retained.</p>
            ) : null}
          </div>
        </header>
        <section className="build-panel build-key-panel" aria-label="Key build statistics">
          <h2>Key statistics</h2>
          {keyStats.length ? (
            <dl className="build-key-stats">
              {keyStats.map((stat) => (
                <div key={stat.id}>
                  <dt>{stat.name}</dt>
                  <dd>{stat.formatted}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="build-muted">Statistics not reported.</p>
          )}
        </section>
      </div>
      {analysis}
      <div className="build-loadout-grid">
        <section className="build-panel build-weapon" aria-label={`${character.name} weapon`}>
          <h2>Weapon</h2>
          {weapon ? (
            <>
              <div className="build-weapon-heading">
                <GearArtwork item={weapon} />
                <div>
                  <h3>{weapon.name}</h3>
                  <p>
                    {weapon.rarity === null ? '' : `${weapon.rarity}★ · `}
                    {weapon.level === null ? 'Level not reported' : `Lv. ${weapon.level}`}
                    {weapon.refinement === null ? '' : ` · R${weapon.refinement}`}
                  </p>
                  {weapon.ascension !== null ? <small>Ascension {weapon.ascension}</small> : null}
                </div>
              </div>
              <StatRows stats={weapon.stats} />
            </>
          ) : (
            <p className="build-muted">
              {character.equipmentAvailable
                ? 'Weapon not reported.'
                : 'Equipment details not reported.'}
            </p>
          )}
        </section>
        <section className="build-panel" aria-label={`${character.name} talents`}>
          <h2>Talents</h2>
          {character.talents.length ? (
            <div className="build-talents">
              {character.talents.map((talent) => (
                <div className="build-talent" key={talent.id}>
                  <p className="build-label">
                    {talent.kind ? kinds[talent.kind] : 'Talent type unavailable'}
                  </p>
                  <h3>{talent.label}</h3>
                  <strong>
                    {talent.bonusLevel === null ? 'Base Lv. ' : 'Lv. '}
                    {talent.baseLevel + (talent.bonusLevel ?? 0)}
                  </strong>
                  <p className="build-muted">
                    Base {talent.baseLevel}
                    {talent.bonusLevel === null ? '' : ` · bonus +${talent.bonusLevel}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="build-muted">Talent levels not reported.</p>
          )}
        </section>
      </div>
      <section className="build-artifacts-section" aria-label={`${character.name} artifacts`}>
        <div className="build-section-heading">
          <h2>Artifacts</h2>
          <p>{[...sets].map(([name, count]) => `${count}× ${name}`).join(' · ')}</p>
        </div>
        {!character.equipmentAvailable ? (
          <p className="build-muted">Equipment details not reported.</p>
        ) : (
          <>
            <div className="build-artifacts">
              {['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet'].map((slot) => (
                <ArtifactCard
                  key={slot}
                  slot={slot}
                  item={character.artifacts.find((item) => item.slot === slot)}
                />
              ))}
            </div>
            {!character.artifacts.length ? (
              <p className="build-muted">Artifacts not reported.</p>
            ) : null}
          </>
        )}
      </section>
      {character.stats.length ? (
        <details className="build-panel build-all-stats">
          <summary>All combat statistics</summary>
          <StatRows stats={character.stats} />
        </details>
      ) : null}
    </article>
  );
}
