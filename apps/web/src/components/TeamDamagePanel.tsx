import { useEffect, useMemo, useRef, useState } from 'react';

import type { SavedUidTeam } from '../lib/build-analysis/teams-storage';
import type { CharacterObservation } from '../lib/observed-roster';
import {
  benchmarkSettings,
  defaultRotation,
  TEAM_BENCHMARK,
} from '../lib/team-damage/benchmark.calculator';
import { damageInput, engineCharacter, type RotationStep } from '../lib/team-damage/calculator';
import { explainDamageIssue } from '../lib/team-damage/explainer';
import { readRotationChoice, saveRotationChoice } from '../lib/team-damage/preferences';
import { describeRotation } from '../lib/team-damage/rotation-explainer';
import { type DamageResult, runTeamSimulation } from '../lib/team-damage/service';
import RotationBuilder from './RotationBuilder';

const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });
export default function TeamDamagePanel({
  uid,
  team,
  records,
}: {
  uid: string;
  team: SavedUidTeam;
  records: CharacterObservation[];
}) {
  const [savedChoice] = useState(() => readRotationChoice(uid, team.id));
  const [mode, setMode] = useState<'default' | 'custom'>(savedChoice?.mode ?? 'default');
  const [customSteps, setCustomSteps] = useState<RotationStep[]>(savedChoice?.customSteps ?? []);
  const [selectedDriver, setSelectedDriver] = useState(
    savedChoice?.driver ||
      team.members.find((member) => member.roleId === 'on_field_damage')?.characterKey ||
      team.members[0]?.characterKey ||
      '',
  );
  const driver = team.members.some((member) => member.characterKey === selectedDriver)
    ? selectedDriver
    : (team.members[0]?.characterKey ?? '');
  const starter = useMemo(() => defaultRotation(team, driver), [team, driver]);
  const settings = useMemo(
    () => benchmarkSettings(mode === 'default' ? starter : customSteps),
    [mode, starter, customSteps],
  );
  const input = useMemo(
    () => damageInput(uid, team, records, settings),
    [uid, team, records, settings],
  );
  const names = Object.fromEntries(
    records
      .filter((record) => record.uid === uid)
      .map((record) => [record.character.key, record.character.name]),
  );
  const engineNames = Object.fromEntries(
    team.members.flatMap((member) => {
      const profile = engineCharacter(member.characterKey);
      return profile ? [[profile.key, names[member.characterKey] ?? member.characterKey]] : [];
    }),
  );
  const messages = [
    ...new Set(
      input.issues
        .filter((issue) => issue.code !== 'invalid_rotation')
        .map((issue) => explainDamageIssue(issue, names)),
    ),
  ];
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ signature: string; value: DamageResult } | null>(null);
  const fresh = result?.signature === input.signature ? result.value : null;
  const job = useRef<ReturnType<typeof runTeamSimulation> | null>(null);
  const mounted = useRef(true);
  const resultRegion = useRef<HTMLElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      job.current?.cancel();
    };
  }, []);
  function chooseMode(next: 'default' | 'custom') {
    if (next === 'custom' && !customSteps.length)
      setCustomSteps(starter.map((step) => ({ ...step })));
    setMode(next);
    setError('');
    setStatus('');
  }
  async function run() {
    if (!input.config || job.current) return;
    setRunning(true);
    setError('');
    setStatus('Calculating average damage per second…');
    const captured = input.signature;
    let handle: ReturnType<typeof runTeamSimulation> | null = null;
    try {
      handle = runTeamSimulation(input.config, TEAM_BENCHMARK.samples, (message) => {
        if (mounted.current) setStatus(message);
      });
      job.current = handle;
      const value = await handle.promise;
      if (mounted.current) {
        setResult({ signature: captured, value });
        setStatus('DPS calculation complete.');
        window.requestAnimationFrame?.(() =>
          resultRegion.current?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' }),
        );
      }
    } catch (failure) {
      if (mounted.current) {
        setStatus('');
        setError(failure instanceof Error ? failure.message : 'Calculation failed.');
      }
    } finally {
      if (job.current === handle) job.current = null;
      if (mounted.current) setRunning(false);
    }
  }
  return (
    <div className="team-damage-workspace team-dps-workspace">
      <section className="team-damage-panel" aria-labelledby="team-damage-title">
        <header className="team-section-intro">
          <div>
            <p className="eyebrow">YOUR ROTATION. YOUR RESULT.</p>
            <h2 id="team-damage-title">Team DPS</h2>
            <p>
              Choose a rotation, then see the damage your team deals per second. Save lineup edits
              before testing.
            </p>
          </div>
          <span className="analysis-state">One fixed benchmark</span>
        </header>
        {messages.length ? (
          <div className="analysis-notice" role="status">
            <strong>Complete team damage is unavailable for this build.</strong>
            <ul>
              {messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <fieldset disabled={running} className="damage-settings">
          <legend className="sr-only">Choose a rotation</legend>
          <div className="lab-editor-grid">
            <aside className="lab-target-panel" aria-label="Benchmark enemy details">
              <header className="lab-section-header">
                <span>01</span>
                <div>
                  <h3>Benchmark enemy</h3>
                  <p>The same enemy for every team.</p>
                </div>
              </header>
              <div className="damage-training-dummy">
                <div>
                  <h3>
                    Training dummy <span>∞ HP</span>
                  </h3>
                  <p>
                    One target that cannot die during the timed test. No shields, phases or enemy
                    attacks.
                  </p>
                </div>
              </div>
              <dl className="benchmark-facts">
                <div>
                  <dt>Level</dt>
                  <dd>{TEAM_BENCHMARK.enemyLevel}</dd>
                </div>
                <div>
                  <dt>HP</dt>
                  <dd>Infinite</dd>
                </div>
                <div>
                  <dt>Starting resistance</dt>
                  <dd>{TEAM_BENCHMARK.resistance}% · all elements &amp; Physical</dd>
                </div>
                <div>
                  <dt>Defense</dt>
                  <dd>Normal level-based DEF</dd>
                </div>
                <div>
                  <dt>Test duration</dt>
                  <dd>{TEAM_BENCHMARK.duration} seconds</dd>
                </div>
              </dl>
              <p className="analysis-muted benchmark-note">
                These details are fixed. Your team’s buffs, reactions and resistance reductions
                still work normally.
              </p>
            </aside>
            <section className="lab-rotation-panel">
              <header className="lab-section-header">
                <span>02</span>
                <div>
                  <h3>Choose your rotation</h3>
                  <p>Use the default loop or make your own sequence.</p>
                </div>
              </header>
              <div className="rotation-mode-options" role="radiogroup" aria-label="Rotation choice">
                <label>
                  <input
                    type="radio"
                    name={`rotation-${uid}-${team.id}`}
                    checked={mode === 'default'}
                    onChange={() => chooseMode('default')}
                  />
                  <span>
                    <strong>Default rotation</strong>
                    <small>A simple, ready-to-use starting loop</small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name={`rotation-${uid}-${team.id}`}
                    checked={mode === 'custom'}
                    onChange={() => chooseMode('custom')}
                  />
                  <span>
                    <strong>Custom rotation</strong>
                    <small>You choose the actions, order and timing</small>
                  </span>
                </label>
              </div>
              {mode === 'default' ? (
                <div className="default-rotation-preview">
                  <label>
                    Main attacker
                    <select
                      value={driver}
                      onChange={(event) => setSelectedDriver(event.target.value)}
                    >
                      {team.members.map((member) => (
                        <option key={member.characterKey} value={member.characterKey}>
                          {names[member.characterKey] ?? member.characterKey}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ol aria-label="Default rotation steps">
                    {describeRotation(starter, names).map((description, index) => (
                      <li key={index}>
                        <span>{index + 1}</span>
                        {description}
                      </li>
                    ))}
                  </ol>
                  <p className="analysis-muted">
                    Other members use their Skills, then {names[driver] ?? 'the main attacker'} uses
                    their Skill and six Normal attacks. This is a basic loop; use Custom for Bursts,
                    combos and timing.
                  </p>
                </div>
              ) : (
                <>
                  <RotationBuilder
                    team={team}
                    records={records}
                    steps={customSteps}
                    onChange={setCustomSteps}
                  />
                  <div className="damage-rotation-actions">
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={customSteps.length >= 64}
                      onClick={() =>
                        setCustomSteps((steps) => [
                          ...steps,
                          {
                            characterKey: team.members[0].characterKey,
                            action: 'skill',
                            repeat: 1,
                            waitFrames: 0,
                            params: '',
                          },
                        ])
                      }
                    >
                      ＋ Add step
                    </button>
                  </div>
                </>
              )}
              <div className="damage-rotation-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    try {
                      saveRotationChoice(uid, team.id, mode, driver, customSteps);
                      setError('');
                      setStatus('Rotation choice saved in this browser.');
                    } catch {
                      setError(
                        'Could not save this rotation. Check the steps and browser storage.',
                      );
                    }
                  }}
                >
                  Save rotation
                </button>
                <span className="rotation-choice-note">
                  Switching modes keeps your custom draft.
                </span>
              </div>
              {mode === 'custom' &&
              input.issues.some((issue) => issue.code === 'invalid_rotation') ? (
                <p role="status" className="analysis-notice">
                  {explainDamageIssue({ code: 'invalid_rotation' }, names)}
                </p>
              ) : null}
            </section>
          </div>
          <section className="lab-test-panel dps-run-panel">
            <div className="lab-section-header">
              <span>03</span>
              <div>
                <h3>See your damage per second</h3>
                <p>
                  Your selected rotation repeats against the fixed dummy for{' '}
                  {TEAM_BENCHMARK.duration} seconds.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="button-primary"
              disabled={!input.config}
              onClick={() => void run()}
            >
              Show DPS
            </button>
          </section>
        </fieldset>
        {running ? (
          <button type="button" className="button-secondary" onClick={() => job.current?.cancel()}>
            Cancel calculation
          </button>
        ) : null}
        <p role="status" className="analysis-message">
          {status}
        </p>
        {error ? (
          <p role="alert" className="analysis-notice">
            {error}
          </p>
        ) : null}
        <section ref={resultRegion} className="dps-result-region" aria-live="polite">
          {fresh ? (
            <section className="damage-results" aria-label="Team damage results">
              <div className="team-dps-primary">
                <small>AVERAGE TEAM DPS</small>
                <div>
                  <strong>{format(fresh.dps)}</strong>
                  <span>damage / second</span>
                </div>
                <p>
                  On average, your team deals <b>{format(fresh.dps)}</b> damage every second with
                  this rotation.
                </p>
              </div>
              <p className="analysis-muted">
                DPS = total damage ÷ time. This averages the full {TEAM_BENCHMARK.duration}-second
                test, including setup, cooldowns and waiting. Individual seconds can be higher or
                lower; this is not only the opening second.
              </p>
              <div className="damage-member-results">
                {fresh.members.map((member) => (
                  <div key={member.key}>
                    <div>
                      <strong>{engineNames[member.key] ?? member.key}</strong>
                      <span>{format(member.dps)} damage / sec</span>
                    </div>
                    <progress
                      max={Math.max(fresh.damage, 1)}
                      value={member.damage}
                      aria-label={`${engineNames[member.key] ?? member.key} damage contribution`}
                    />
                    {member.actions === 0 ? (
                      <small>No actions executed in this rotation.</small>
                    ) : member.waits > 0 ? (
                      <small>Some actions waited for cooldowns or energy.</small>
                    ) : null}
                  </div>
                ))}
              </div>
              <details className="analysis-disclosure">
                <summary>Calculation breakdown</summary>
                <p>
                  Total damage: {format(fresh.damage)} over {TEAM_BENCHMARK.duration} seconds. Mean
                  of {fresh.samples} fixed-seed samples (seeds 1–{fresh.samples}). Sample DPS range:{' '}
                  {format(fresh.minDps)}–{format(fresh.maxDps)}. This estimates the selected
                  rotation, not guaranteed in-game damage.
                </p>
              </details>
            </section>
          ) : result ? (
            <p className="analysis-muted">
              Your lineup or rotation changed. Click Show DPS again for the current selection.
            </p>
          ) : (
            <section className="lab-results-empty" aria-label="No damage results yet">
              <span aria-hidden="true">◇</span>
              <div>
                <h3>Your DPS will appear here</h3>
                <p>Choose Default or Custom, then click Show DPS.</p>
              </div>
            </section>
          )}
        </section>
        <details className="analysis-disclosure">
          <summary>Test conditions, engine &amp; generated configuration</summary>
          <p className="analysis-muted">
            Fixed level-{TEAM_BENCHMARK.enemyLevel} dummy, infinite HP, 0% starting resistance to
            every element and Physical, normal DEF, no external particles, full starting character
            HP/energy and 12-frame swap delay. Cooldown and energy limits remain enabled. The
            selected loop repeats for {TEAM_BENCHMARK.duration}s across {TEAM_BENCHMARK.samples}{' '}
            samples with seeds 1–{TEAM_BENCHMARK.samples}.
          </p>
          <p className="analysis-muted">
            Stats are rebuilt from levels, base talents, weapons and artifacts. Roles guide build
            advice; they do not multiply damage. Calculation runs on your device; the first run
            downloads about 9 MB of engine data.
          </p>
          <p className="analysis-muted">
            Pinned{' '}
            <a
              href="https://github.com/genshinsim/gcsim/tree/caf738dc807a646e2eee7e7b572f225dd6deb510"
              target="_blank"
              rel="noreferrer"
            >
              gcsim v2.47.2
            </a>
            , MIT license, with a seeded bridge. Unimplemented characters and equipment remain
            unavailable.
          </p>
          <pre>
            {input.config ??
              'Resolve the coverage or rotation issues above to generate a configuration.'}
          </pre>
          <a href="/vendor/gcsim-v2.47.2/LICENSE" target="_blank" rel="noreferrer">
            Engine license
          </a>
        </details>
      </section>
    </div>
  );
}
