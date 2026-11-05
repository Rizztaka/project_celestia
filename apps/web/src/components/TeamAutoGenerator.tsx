import { type TeamSearchPreferences, teamSearchPreferencesSchema } from '@celestia/api-contracts';
import { useEffect, useMemo, useRef, useState } from 'react';

import { publicAccountContext } from '../lib/account-context.calculator';
import { signature } from '../lib/build-analysis/signature';
import type { CharacterObservation } from '../lib/observed-roster';
import {
  type AutoTeamCandidate,
  buildAutoTeamPool,
} from '../lib/team-damage/auto-generator.calculator';
import { engineCharacter, engineVersion } from '../lib/team-damage/calculator';
import { damageKnowledge } from '../lib/team-damage/knowledge';
import { searchTeamCandidates } from '../lib/team-damage/service';
import { writeTeamPreferences } from '../lib/team-preferences';
import { useTeamPreferences } from '../lib/use-team-preferences';
import { useAuthStore } from '../stores/auth.store';
import { TeamPortrait } from './TeamCharacterPicker';
import TeamPreferencesForm from './TeamPreferencesForm';

const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

interface GeneratorProps {
  uid: string;
  records: CharacterObservation[];
  onSave: (team: AutoTeamCandidate['team']) => Promise<void>;
}

export default function TeamAutoGenerator(props: GeneratorProps) {
  const ownerId = useAuthStore((state) => state.user?.id ?? null);
  return <UidTeamAutoGenerator key={`${props.uid}:${ownerId ?? 'public'}`} {...props} />;
}

function UidTeamAutoGenerator(props: GeneratorProps) {
  const ownerId = useAuthStore((state) => state.user?.id ?? null);
  const preferenceScope = useMemo(() => ({ ownerId, accountId: null }), [ownerId]);
  const saved = useTeamPreferences(props.uid, preferenceScope);
  const [draft, setDraft] = useState<{
    preferences: TeamSearchPreferences;
    baseRaw: typeof saved.raw;
    baseRevision: number;
  } | null>(null);
  const [preferenceIssue, setPreferenceIssue] = useState('');
  const preferences = draft?.preferences ?? saved.preferences;
  const changePreferences = (value: TeamSearchPreferences) => {
    const parsed = teamSearchPreferencesSchema.safeParse(value);
    if (!parsed.success) {
      setPreferenceIssue(parsed.error.issues[0]?.message ?? 'Check your team preferences.');
      return;
    }
    setPreferenceIssue('');
    setDraft({
      preferences: parsed.data,
      baseRaw: draft ? draft.baseRaw : saved.raw,
      baseRevision: draft ? draft.baseRevision : saved.revision,
    });
  };
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const evidence = useMemo(
    () => publicAccountContext(props.uid, props.records, now),
    [props.uid, props.records, now],
  );
  const drivers = evidence.records
    .filter((record) => !!engineCharacter(record.character.key))
    .sort((a, b) => a.character.name.localeCompare(b.character.name, 'en'));
  const driverKey = preferences.preferredDriverKey ?? drivers[0]?.character.key ?? '';
  const missingDriver =
    !!driverKey && !drivers.some((record) => record.character.key === driverKey);
  const savePreferences = async (overwrite: boolean) => {
    try {
      if (saved.isServerBacked) {
        // An explicit overwrite saves against the refreshed revision, keeping the draft.
        const revision = overwrite ? saved.revision : (draft?.baseRevision ?? saved.revision);
        await saved.saveAuthenticated(preferences, revision);
      } else {
        writeTeamPreferences(
          props.uid,
          preferences,
          overwrite ? saved.raw : draft ? draft.baseRaw : saved.raw,
          undefined,
          preferenceScope,
        );
      }
      setDraft(null);
      setPreferenceIssue('');
    } catch (error) {
      setPreferenceIssue(
        error instanceof Error
          ? error.message
          : 'Could not save preferences. Changes still apply for this visit.',
      );
    }
  };
  return (
    <section className="team-auto-generator" aria-labelledby="team-auto-generator-title">
      <header className="team-auto-generator-header">
        <div>
          <p className="eyebrow">DAMAGE-FIRST TEAM MAKER</p>
          <h2 id="team-auto-generator-title">Start with your DPS</h2>
          <p>
            Choose a character and compare complete teams from the builds observed for this UID.
            Rankings use the same target and rotation rules.
          </p>
        </div>
        <span className="analysis-state">Same target · same rules</span>
      </header>
      {saved.state === 'invalid' || saved.state === 'unavailable' ? (
        <p role="status" className="analysis-notice">
          Saved preferences could not be loaded. Search uses your current visit's choices; existing
          saved records are preserved.
        </p>
      ) : null}
      <TeamPreferencesForm
        preferences={preferences}
        records={props.records}
        dirty={draft !== null && JSON.stringify(preferences) !== JSON.stringify(saved.preferences)}
        changedElsewhere={
          draft !== null &&
          (saved.isServerBacked
            ? draft.baseRevision !== saved.revision
            : draft.baseRaw !== saved.raw)
        }
        issue={preferenceIssue}
        storageState={saved.state}
        onChange={changePreferences}
        onRestore={() => {
          setDraft(null);
          setPreferenceIssue('');
        }}
        onSave={() => savePreferences(false)}
        onOverwrite={
          saved.isServerBacked || saved.state === 'saved' ? () => savePreferences(true) : undefined
        }
      />
      <div className="team-auto-controls">
        <label>
          Main DPS
          <select
            name="mainDps"
            value={driverKey}
            onChange={(event) =>
              changePreferences({ ...preferences, preferredDriverKey: event.target.value })
            }
          >
            {missingDriver ? (
              <option value={driverKey}>Saved DPS unavailable · {driverKey}</option>
            ) : null}
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
            name="verificationSamples"
            value={preferences.verificationSamples}
            onChange={(event) =>
              changePreferences({
                ...preferences,
                verificationSamples: Number(
                  event.target.value,
                ) as TeamSearchPreferences['verificationSamples'],
              })
            }
          >
            {[3, 5, 10, 20].map((value) => (
              <option key={value} value={value}>
                {value} fixed-seed samples
              </option>
            ))}
          </select>
        </label>
      </div>
      <TeamAutoGeneratorSession
        key={signature([evidence.context.fingerprint, engineVersion, preferences])}
        {...props}
        records={evidence.records}
        context={evidence.context}
        driverKey={driverKey}
        samples={preferences.verificationSamples}
        preferences={preferences}
      />
    </section>
  );
}

function TeamAutoGeneratorSession({
  uid,
  records,
  onSave,
  context,
  driverKey,
  samples,
  preferences,
}: GeneratorProps & {
  context: ReturnType<typeof publicAccountContext>['context'];
  driverKey: string;
  samples: number;
  preferences: TeamSearchPreferences;
}) {
  const drivers = useMemo(
    () =>
      records
        .filter((record) => record.uid === uid && !!engineCharacter(record.character.key))
        .sort((a, b) => a.character.name.localeCompare(b.character.name)),
    [records, uid],
  );
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState('');
  const [results, setResults] = useState<
    { candidate: AutoTeamCandidate; result: AutoTeamCandidate['team'] & { dps: number } }[]
  >([]);
  const job = useRef<ReturnType<typeof searchTeamCandidates> | null>(null);
  useEffect(
    () => () => {
      const active = job.current;
      job.current = null;
      active?.cancel();
    },
    [],
  );
  const selectedDriverKey = driverKey;
  const pool = useMemo(
    () => buildAutoTeamPool(uid, selectedDriverKey, records, preferences),
    [uid, selectedDriverKey, records, preferences],
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
    let handle: ReturnType<typeof searchTeamCandidates> | null = null;
    try {
      handle = searchTeamCandidates(
        pool.candidates.map((candidate) => ({ id: candidate.id, config: candidate.config })),
        samples,
        setStatus,
      );
      job.current = handle;
      const search = await handle.promise;
      if (job.current !== handle) return;
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
      if (handle && job.current !== handle) return;
      setError(failure instanceof Error ? failure.message : 'Team generation failed.');
      setStatus('');
    } finally {
      if (!handle || job.current === handle) {
        job.current = null;
        setRunning(false);
      }
    }
  }

  return (
    <div className="team-auto-search">
      <p className="analysis-muted">
        Using {records.length} observed builds from a partial public roster. Characters missing from
        the showcase may still be owned.
        {context.mixedObservationTimes
          ? ' These builds were observed at different times.'
          : ''}{' '}
        Shared equipment between snapshots has not been verified.
      </p>
      {context.characters.some((character) => character.freshness === 'stale') ? (
        <p className="analysis-notice">
          {context.characters.filter((character) => character.freshness === 'stale').length} build
          snapshots are over seven days old. Refresh those characters to compare their current
          equipment.
        </p>
      ) : null}
      {context.issues.length || context.rejectedRecordCount ? (
        <p className="analysis-notice">
          Some observations have conflicting builds or unreliable timestamps and were excluded.
          Refresh those characters to include them.
        </p>
      ) : null}
      {!drivers.length ? (
        <p role="status" className="analysis-notice">
          No observed character is ready for the pinned damage engine. Refresh the public roster or
          choose a character with complete level, weapon and artifact data.
        </p>
      ) : (
        <>
          <div className="team-auto-controls">
            <button
              type="button"
              className="button-primary"
              disabled={running || !pool.candidates.length}
              onClick={() => void generate()}
            >
              {running ? 'Generating…' : 'Generate best teams'}
            </button>
            {running ? (
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  const active = job.current;
                  job.current = null;
                  active?.cancel();
                  setRunning(false);
                  setStatus('Search cancelled.');
                }}
              >
                Cancel search
              </button>
            ) : null}
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
            {pool.preferenceExcludedCount ? (
              <span>{pool.preferenceExcludedCount} characters excluded by your preferences.</span>
            ) : null}
            {preferences.priority === 'favorites' ? (
              <span>
                Favorites first: comparing teams with the maximum {pool.maxFavoriteCount} observed
                favorites that fit your requirements.
              </span>
            ) : null}
          </div>
          {pool.issues.length ? (
            <p role="status" className="analysis-notice">
              {pool.issues.includes('driver_excluded')
                ? 'Your selected DPS is excluded. Change the DPS or remove its exclusion.'
                : pool.issues.includes('required_slots_exceeded')
                  ? 'Four other characters are required. Choose one as the DPS or remove a requirement.'
                  : pool.issues.includes('required_form_conflict')
                    ? 'Your selected DPS conflicts with a required form of the same character.'
                    : pool.issues.includes('required_unavailable')
                      ? `Required builds are unavailable or unsupported: ${pool.missingRequiredKeys.map((key) => names[key] ?? key).join(', ')}. Refresh those builds or remove their requirements.`
                      : 'The selected DPS build is unavailable. Refresh it or select another DPS.'}
            </p>
          ) : null}
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
                          {index === 0 ? 'Best tested combination' : 'Verified candidate'} ·{' '}
                          {samples} samples
                        </small>
                        {candidate.favoriteCount ? (
                          <small>
                            {candidate.favoriteCount} favorite
                            {candidate.favoriteCount === 1 ? '' : 's'}
                          </small>
                        ) : null}
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
                            name: `${names[selectedDriverKey] ?? 'DPS'} team`,
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
    </div>
  );
}
