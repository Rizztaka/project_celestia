import { useMemo, useRef, useState } from 'react';

import type { CharacterObservation } from '../lib/observed-roster';
import {
  type AutoTeamCandidate,
  buildAutoTeamPool,
} from '../lib/team-damage/auto-generator.calculator';
import { engineCharacter } from '../lib/team-damage/calculator';
import { damageKnowledge } from '../lib/team-damage/knowledge';
import { searchTeamCandidates } from '../lib/team-damage/service';
import { TeamPortrait } from './TeamCharacterPicker';

const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function TeamAutoGenerator({
  uid,
  records,
  onSave,
}: {
  uid: string;
  records: CharacterObservation[];
  onSave: (team: AutoTeamCandidate['team']) => Promise<void>;
}) {
  const drivers = useMemo(
    () =>
      records
        .filter((record) => record.uid === uid && !!engineCharacter(record.character.key))
        .sort((a, b) => a.character.name.localeCompare(b.character.name)),
    [records, uid],
  );
  const [driverKey, setDriverKey] = useState(drivers[0]?.character.key ?? '');
  const [samples, setSamples] = useState(5);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState('');
  const [results, setResults] = useState<
    { candidate: AutoTeamCandidate; result: AutoTeamCandidate['team'] & { dps: number } }[]
  >([]);
  const job = useRef<ReturnType<typeof searchTeamCandidates> | null>(null);
  const selectedDriverKey = drivers.some((record) => record.character.key === driverKey)
    ? driverKey
    : (drivers[0]?.character.key ?? '');
  const pool = useMemo(
    () => buildAutoTeamPool(uid, selectedDriverKey, records),
    [uid, selectedDriverKey, records],
  );
  const names = useMemo(
    () =>
      Object.fromEntries(records.map((record) => [record.character.key, record.character.name])),
    [records],
  );

  function clearResults() {
    setResults([]);
    setError('');
    setStatus('');
    setSavedId('');
  }

  async function generate() {
    clearResults();
    if (!pool.candidates.length) {
      setError('No complete supported team can be generated from this observed roster.');
      return;
    }
    setRunning(true);
    setStatus('Preparing candidate teams…');
    const handle = searchTeamCandidates(
      pool.candidates.map((candidate) => ({ id: candidate.id, config: candidate.config })),
      samples,
      setStatus,
    );
    job.current = handle;
    try {
      const search = await handle.promise;
      setResults(
        search.ranked.flatMap((row) => {
          const candidate = pool.candidates.find((entry) => entry.id === row.id);
          return candidate
            ? [{ candidate, result: { ...candidate.team, dps: row.result.dps } }]
            : [];
        }),
      );
      setStatus(
        `Compared ${search.tested} complete teams and verified the strongest ${search.ranked.length}.`,
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Team generation failed.');
      setStatus('');
    } finally {
      if (job.current === handle) job.current = null;
      setRunning(false);
    }
  }

  return (
    <section className="team-auto-generator" aria-labelledby="team-auto-generator-title">
      <header className="team-auto-generator-header">
        <div>
          <p className="eyebrow">DAMAGE-FIRST TEAM MAKER</p>
          <h2 id="team-auto-generator-title">Start with your DPS</h2>
          <p>
            Pick the character you want on field. Celestia will test every complete three-teammate
            combination it can build from this UID and rank them by average damage per second.
          </p>
        </div>
        <span className="analysis-state">Same target · same rules</span>
      </header>
      {!drivers.length ? (
        <p role="status" className="analysis-notice">
          No observed character is ready for the pinned damage engine. Refresh the public roster or
          choose a character with complete level, weapon and artifact data.
        </p>
      ) : (
        <>
          <div className="team-auto-controls">
            <label>
              Main DPS
              <select
                value={selectedDriverKey}
                disabled={running}
                onChange={(event) => {
                  setDriverKey(event.target.value);
                  clearResults();
                }}
              >
                {drivers.map((record) => (
                  <option key={record.character.key} value={record.character.key}>
                    {record.character.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Verification samples
              <select
                value={samples}
                disabled={running}
                onChange={(event) => setSamples(Number(event.target.value))}
              >
                {[3, 5, 10, 20].map((value) => (
                  <option key={value} value={value}>
                    {value} fixed-seed samples
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="button-primary"
              disabled={running || !pool.candidates.length}
              onClick={() => void generate()}
            >
              {running ? 'Generating…' : 'Generate best teams'}
            </button>
          </div>
          <div className="team-auto-pool-note">
            <span>
              {pool.eligibleTeammates.length} supported teammate builds · {pool.candidates.length}{' '}
              complete combinations ready
            </span>
            {pool.excludedCharacterKeys.length ? (
              <span>
                {pool.excludedCharacterKeys.length} observed character
                {pool.excludedCharacterKeys.length === 1 ? '' : 's'} skipped because the pinned
                engine has no safe profile.
              </span>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="analysis-notice">
              {error}
            </p>
          ) : null}
          <p role="status" className="analysis-message">
            {status}
          </p>
          {results.length ? (
            <div className="team-auto-results" aria-label="Generated team results">
              {results.map(({ candidate, result }, index) => (
                <article key={candidate.id} className="team-auto-result">
                  <header>
                    <div>
                      <span className="team-auto-rank">#{index + 1}</span>
                      <div>
                        <strong>{format(result.dps)} DPS</strong>
                        <small>
                          {index === 0 ? 'Best observed combination' : 'Verified candidate'} ·{' '}
                          {samples} samples
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={savedId === candidate.id}
                      onClick={async () => {
                        setSavedId(candidate.id);
                        try {
                          await onSave({
                            ...candidate.team,
                            id: crypto.randomUUID(),
                            name: `${names[selectedDriverKey] ?? 'DPS'} · ${format(result.dps)} DPS`,
                          });
                        } catch (failure) {
                          setError(
                            failure instanceof Error ? failure.message : 'Could not save team.',
                          );
                          setSavedId('');
                          return;
                        }
                        setStatus('Generated team saved below.');
                      }}
                    >
                      {savedId === candidate.id ? 'Saved' : 'Save team'}
                    </button>
                  </header>
                  <div className="team-auto-members">
                    {candidate.team.members.map((member) => {
                      const character = records.find(
                        (record) => record.character.key === member.characterKey,
                      )?.character;
                      return character ? (
                        <div key={member.characterKey}>
                          <TeamPortrait character={character} />
                          <strong>{character.name}</strong>
                          <small>
                            {member.characterKey === selectedDriverKey ? 'Main DPS' : 'Teammate'}
                          </small>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <p>
                    The selected {names[selectedDriverKey] ?? 'DPS'} stays on field in the default
                    loop; the other three characters contribute their Skills first.
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}
      <details className="team-dps-knowledge">
        <summary>{damageKnowledge.title}</summary>
        <p>{damageKnowledge.summary}</p>
        <div className="team-dps-knowledge-grid">
          {damageKnowledge.steps.map((step) => (
            <section key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </section>
          ))}
        </div>
        <p className="analysis-muted">{damageKnowledge.patchNote}</p>
        <p className="analysis-muted">
          Pinned coverage: {damageKnowledge.coverage.characterForms} character forms ·{' '}
          {damageKnowledge.coverage.weapons} weapons · {damageKnowledge.coverage.artifactSets} sets
          · {damageKnowledge.coverage.engineVersion}.
        </p>
      </details>
    </section>
  );
}
