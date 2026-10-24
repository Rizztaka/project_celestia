import type { ShowcaseCharacter } from '@celestia/api-contracts';
import { Link } from 'react-router-dom';

import type { CharacterObservation } from '../lib/observed-roster';
import { uidCharacterPath } from '../lib/uid-workspace';
import { UiIcon } from './Ui';

export default function UidCharacterGrid({
  uid,
  characters,
  observations = [],
  currentKeys,
}: {
  uid: string;
  characters: ShowcaseCharacter[];
  observations?: CharacterObservation[];
  currentKeys?: Set<string>;
}) {
  return (
    <div className="collection-grid">
      {characters.map((character) => {
        const observation = observations.find((record) => record.character.key === character.key);
        const retained = currentKeys && !currentKeys.has(character.key);
        return (
          <Link
            to={uidCharacterPath(uid, character.key)}
            className="collection-card uid-character-card"
            key={character.key}
            aria-label={`Open ${character.name}`}
          >
            <div className="collection-art">
              {character.portrait ? (
                <img
                  src={character.portrait}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="collection-avatar object-contain"
                  width={160}
                  height={160}
                />
              ) : null}
              <span className="collection-constellation">C{character.constellation}</span>
            </div>
            <div className="collection-body">
              <p className="collection-element">
                {retained ? 'Previously observed' : 'Public showcase'}
              </p>
              {retained ? (
                <p className="mb-3 text-xs text-zinc-400">
                  Not in the current showcase.
                  {observation ? (
                    <>
                      {' '}
                      Last seen{' '}
                      <time dateTime={observation.observedAt}>
                        {new Date(observation.observedAt).toLocaleString()}
                      </time>
                      .
                    </>
                  ) : null}
                </p>
              ) : null}
              <h2 className="collection-name">{character.name}</h2>
              {!character.metadataAvailable ? (
                <p className="text-xs text-amber-100">Metadata unavailable · ID {character.id}</p>
              ) : null}
              <div className="collection-level">
                <span>
                  {character.level === null ? 'Level not reported' : `Level ${character.level}`}
                  {character.ascension === null ? '' : ` / Asc. ${character.ascension}`}
                </span>
              </div>
              <div className="collection-talents">
                <span>Base talents</span>
                {character.talents.length ? (
                  character.talents.map((talent) => (
                    <strong
                      key={talent.id}
                      title={`${talent.label}${talent.bonusLevel === null ? '' : ` · bonus +${talent.bonusLevel}`}`}
                    >
                      {talent.baseLevel}
                    </strong>
                  ))
                ) : (
                  <span>Not reported</span>
                )}
              </div>
              <div className="collection-weapon">
                <span className="text-sm text-zinc-200">
                  {character.weapon?.name ?? 'Weapon not reported'}
                </span>
              </div>
              <div className="collection-open">
                <span>Open character</span>
                <UiIcon name="arrow" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
