import { teamCharacterIdentity, type TeamSearchPreferences } from '@celestia/api-contracts';
import { useState } from 'react';

import type { CharacterObservation } from '../lib/observed-roster';

export default function TeamPreferencesForm({
  preferences,
  records,
  dirty,
  issue,
  storageState,
  changedElsewhere,
  onChange,
  onSave,
  onOverwrite,
  onRestore,
}: {
  preferences: TeamSearchPreferences;
  records: CharacterObservation[];
  dirty: boolean;
  issue: string;
  storageState: 'saved' | 'empty' | 'invalid' | 'unavailable';
  changedElsewhere: boolean;
  onChange: (preferences: TeamSearchPreferences) => void;
  onSave: () => void | Promise<void>;
  onOverwrite?: () => void | Promise<void>;
  onRestore: () => void;
}) {
  const [search, setSearch] = useState('');
  const characters = [
    ...new Map(
      records
        .filter((record) => record.uid === preferences.uid)
        .map((record) => [record.character.key, record.character]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, 'en') || a.key.localeCompare(b.key, 'en'));
  const toggle = (items: string[], key: string) =>
    items.includes(key) ? items.filter((item) => item !== key) : [...items, key];
  const savedChoices = [
    ...preferences.requiredForms,
    ...preferences.favoriteCharacters,
    ...preferences.excludedCharacters,
    ...(preferences.goodEnoughCharacters ?? []),
  ];
  const missing = savedChoices.filter(
    (choice) =>
      !characters.some(
        (character) => character.key === choice || teamCharacterIdentity(character.id) === choice,
      ),
  );
  return (
    <details className="team-preferences">
      <summary>Team preferences{dirty ? ' · Unsaved changes' : ''}</summary>
      <p className="analysis-muted">
        Favorites and exclusions apply to a character across forms. Required members use the exact
        selected form. All gear stays as recorded.
      </p>
      <label>
        Ranking priority
        <select
          value={preferences.priority}
          onChange={(event) =>
            onChange({
              ...preferences,
              priority: event.target.value as TeamSearchPreferences['priority'],
            })
          }
        >
          <option value="damage">Highest tested DPS</option>
          <option value="favorites">Fit the most favorites, then DPS</option>
        </select>
      </label>
      <label>
        Find a character
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <div className="team-preferences-characters">
        {characters
          .filter((character) => character.name.toLowerCase().includes(search.toLowerCase()))
          .map((character) => {
            const identity = teamCharacterIdentity(character.id);
            const label = [10000005, 10000007].includes(character.id)
              ? `${character.name} (${character.element ?? 'unknown form'})`
              : character.name;
            return (
              <fieldset key={character.key}>
                <legend>
                  {character.name}
                  {character.element ? ` · ${character.element}` : ''}
                </legend>
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.favoriteCharacters.includes(identity)}
                    onChange={() =>
                      onChange({
                        ...preferences,
                        favoriteCharacters: toggle(preferences.favoriteCharacters, identity),
                      })
                    }
                  />
                  Favorite {label}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.requiredForms.includes(character.key)}
                    disabled={character.skillDepotId === null}
                    title={
                      character.skillDepotId === null
                        ? 'Refresh this character to identify its exact form.'
                        : undefined
                    }
                    onChange={() =>
                      onChange({
                        ...preferences,
                        requiredForms: toggle(preferences.requiredForms, character.key),
                      })
                    }
                  />
                  Require {label}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.excludedCharacters.includes(identity)}
                    onChange={() =>
                      onChange({
                        ...preferences,
                        excludedCharacters: toggle(preferences.excludedCharacters, identity),
                      })
                    }
                  />
                  Exclude {label}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.goodEnoughCharacters?.includes(identity) ?? false}
                    onChange={() =>
                      onChange({
                        ...preferences,
                        goodEnoughCharacters: toggle(
                          preferences.goodEnoughCharacters ?? [],
                          identity,
                        ),
                      })
                    }
                  />
                  Mark as Good Enough
                </label>
              </fieldset>
            );
          })}
      </div>
      {missing.length ? (
        <div className="analysis-notice">
          <p>
            Some saved choices are outside the observed roster. They are retained until you remove
            them.
          </p>
          {[...new Set(missing)].map((choice) => (
            <button
              type="button"
              className="button-secondary"
              key={choice}
              onClick={() =>
                onChange({
                  ...preferences,
                  requiredForms: preferences.requiredForms.filter((key) => key !== choice),
                  favoriteCharacters: preferences.favoriteCharacters.filter(
                    (key) => key !== choice,
                  ),
                  excludedCharacters: preferences.excludedCharacters.filter(
                    (key) => key !== choice,
                  ),
                  goodEnoughCharacters: (preferences.goodEnoughCharacters ?? []).filter(
                    (key) => key !== choice,
                  ),
                })
              }
            >
              Remove saved choice {choice}
            </button>
          ))}
        </div>
      ) : null}
      {changedElsewhere ? (
        <p role="status">
          Preferences changed in another tab. Your draft is kept; load the saved version or save
          yours over it.
        </p>
      ) : null}
      {storageState === 'invalid' || storageState === 'unavailable' ? (
        <p role="status">
          Saved preferences are unavailable. Your choices apply for this visit; existing records are
          preserved.
        </p>
      ) : null}
      {issue ? <p role="alert">{issue}</p> : null}
      <div className="team-preferences-actions">
        <button
          type="button"
          className="button-secondary"
          disabled={
            !dirty ||
            storageState === 'invalid' ||
            storageState === 'unavailable' ||
            changedElsewhere
          }
          onClick={onSave}
        >
          Save preferences
        </button>
        {dirty ? (
          <button type="button" className="button-secondary" onClick={onRestore}>
            Use saved preferences
          </button>
        ) : null}
        {changedElsewhere && onOverwrite ? (
          <button
            type="button"
            className="button-secondary"
            disabled={!dirty || storageState === 'invalid' || storageState === 'unavailable'}
            onClick={onOverwrite}
          >
            Save my preferences over it
          </button>
        ) : null}
      </div>
      <p className="analysis-muted">
        Choices apply immediately to this search. Save to remember them for this preference scope.
      </p>
    </details>
  );
}
