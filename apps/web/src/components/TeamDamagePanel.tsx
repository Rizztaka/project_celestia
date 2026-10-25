import { useEffect, useMemo, useRef, useState } from 'react';

import type { SavedUidTeam } from '../lib/build-analysis/teams-storage';
import type { CharacterObservation } from '../lib/observed-roster';
import {
  damageInput,
  type DamageSettings,
  engineCharacter,
  type RotationStep,
} from '../lib/team-damage/calculator';
import { actionLabels, explainDamageIssue } from '../lib/team-damage/explainer';
import { readDamageSettings, saveDamageSettings } from '../lib/team-damage/preferences';
import { type DamageResult, runTeamSimulation } from '../lib/team-damage/service';

const defaults = (): DamageSettings => ({
  duration: 60,
  enemyLevel: 100,
  resistance: 10,
  samples: 20,
  steps: [],
});
const format = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
export default function TeamDamagePanel({
  uid,
  team,
  records,
}: {
  uid: string;
  team: SavedUidTeam;
  records: CharacterObservation[];
}) {
  const [settings, setSettings] = useState<DamageSettings>(
    () => readDamageSettings(uid, team.id) ?? defaults(),
  );
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [starterDriver, setStarterDriver] = useState(
    team.members.find((member) => member.roleId === 'on_field_damage')?.characterKey ?? '',
  );
  const [result, setResult] = useState<{ signature: string; value: DamageResult } | null>(null);
  const job = useRef<ReturnType<typeof runTeamSimulation> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      job.current?.cancel();
    };
  }, []);
  const input = useMemo(
    () => damageInput(uid, team, records, settings),
    [uid, team, records, settings],
  );
  const names = Object.fromEntries(
    records.filter((r) => r.uid === uid).map((r) => [r.character.key, r.character.name]),
  );
  const engineNames = Object.fromEntries(
    team.members.flatMap((m) => {
      const c = engineCharacter(m.characterKey);
      return c ? [[c.key, names[m.characterKey] ?? m.characterKey]] : [];
    }),
  );
  const messages = [
    ...new Set(
      input.issues
        .filter((i) => i.code !== 'invalid_rotation')
        .map((i) => explainDamageIssue(i, names)),
    ),
  ];
  const fresh = result?.signature === input.signature ? result.value : null;
  function changeStep(index: number, update: Partial<RotationStep>) {
    setSettings((s) => ({
      ...s,
      steps: s.steps.map((step, i) => (i === index ? { ...step, ...update } : step)),
    }));
  }
  function stepFor(characterKey: string, action = 'skill', repeat = 1): RotationStep {
    return { characterKey, action, repeat, params: '', waitFrames: 0 };
  }
  function loadStarter() {
    const driver = team.members.find((m) => m.characterKey === starterDriver);
    if (!driver) return;
    setSettings((s) => ({
      ...s,
      steps: [
        ...team.members
          .filter((m) => m.characterKey !== driver.characterKey)
          .map((m) => stepFor(m.characterKey)),
        stepFor(driver.characterKey),
        stepFor(driver.characterKey, 'attack', 6),
      ],
    }));
    setStatus(
      'Basic skill + normal-attack loop loaded. Edit the order, Bursts, timing and parameters to match your play. This is not an optimized rotation.',
    );
  }
  async function run() {
    if (!input.config || job.current) return;
    setRunning(true);
    setError('');
    setStatus('Loading simulator…');
    const captured = input.signature;
    let handle: ReturnType<typeof runTeamSimulation> | null = null;
    try {
      handle = runTeamSimulation(input.config, settings.samples, (message) => {
        if (mounted.current) setStatus(message);
      });
      job.current = handle;
      const value = await handle.promise;
      if (mounted.current) {
        setResult({ signature: captured, value });
        setStatus('Simulation complete.');
      }
    } catch (failure) {
      if (mounted.current) {
        setStatus('');
        setError(failure instanceof Error ? failure.message : 'Simulation failed.');
      }
    } finally {
      if (job.current === handle) job.current = null;
      if (mounted.current) setRunning(false);
    }
  }
  return (
    <details className="team-damage-disclosure">
      <summary>
        <span>
          <small>TEAM DAMAGE</small>
          <strong>Calculate this lineup’s damage</strong>
          <span>Choose a rotation and enemy to estimate team DPS.</span>
        </span>
        <span aria-hidden="true">↗</span>
      </summary>
      <section className="team-damage-panel" aria-labelledby="team-damage-title">
        <header className="team-section-intro">
          <div>
            <p className="eyebrow">PLAY IT THROUGH</p>
            <h2 id="team-damage-title">Team damage</h2>
            <p>
              Simulate your saved lineup using your rotation. Save any build edits below before
              calculating.
            </p>
          </div>
          <span className="analysis-state">Rotation simulation</span>
        </header>
        <p className="analysis-muted">
          The simulator rebuilds stats from levels, base talents, weapons and artifacts, then
          evaluates attacks, reactions and team effects. Roles guide build advice; they do not
          multiply damage.
        </p>
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
          <legend className="sr-only">Simulation settings and rotation</legend>
          <div className="damage-enemy-settings">
            <label>
              Duration (seconds)
              <input
                type="number"
                min={10}
                max={180}
                value={settings.duration}
                onChange={(e) => setSettings((s) => ({ ...s, duration: e.target.valueAsNumber }))}
              />
            </label>
            <label>
              Enemy level
              <input
                type="number"
                min={1}
                max={200}
                value={settings.enemyLevel}
                onChange={(e) => setSettings((s) => ({ ...s, enemyLevel: e.target.valueAsNumber }))}
              />
            </label>
            <label>
              Enemy resistance (%)
              <input
                type="number"
                min={-100}
                max={300}
                value={settings.resistance}
                onChange={(e) => setSettings((s) => ({ ...s, resistance: e.target.valueAsNumber }))}
              />
            </label>
            <label>
              Simulation samples
              <select
                value={settings.samples}
                onChange={(e) => setSettings((s) => ({ ...s, samples: Number(e.target.value) }))}
              >
                {[1, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="damage-rotation-heading">
            <h3>Your rotation</h3>
            <label>
              On-field attacker for template
              <select
                value={starterDriver}
                onChange={(event) => setStarterDriver(event.target.value)}
              >
                <option value="">Choose a character</option>
                {team.members.map((member) => (
                  <option key={member.characterKey} value={member.characterKey}>
                    {names[member.characterKey] ?? member.characterKey}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="button-secondary"
              disabled={!team.members.some((member) => member.characterKey === starterDriver)}
              onClick={loadStarter}
            >
              Load basic rotation
            </button>
          </div>
          <p className="analysis-muted">
            Steps repeat for the chosen duration (60 frames = 1 second). The basic template is a
            starting point, not a recommended combo. Add Bursts and timing where your actual
            rotation uses them.
          </p>
          <ol className="damage-rotation-steps">
            {settings.steps.map((step, index) => {
              const profile = engineCharacter(step.characterKey);
              const action = profile?.actions.find((a) => a.action === step.action);
              return (
                <li key={index}>
                  <span className="damage-step-index">{String(index + 1).padStart(2, '0')}</span>
                  <label>
                    Character
                    <select
                      aria-label={`Step ${index + 1} character`}
                      value={step.characterKey}
                      onChange={(e) =>
                        changeStep(index, {
                          characterKey: e.target.value,
                          action: 'skill',
                          params: '',
                        })
                      }
                    >
                      {!team.members.some((m) => m.characterKey === step.characterKey) ? (
                        <option value={step.characterKey}>Unavailable member</option>
                      ) : null}
                      {team.members.map((m) => (
                        <option key={m.characterKey} value={m.characterKey}>
                          {names[m.characterKey] ?? m.characterKey}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Action
                    <select
                      aria-label={`Step ${index + 1} action`}
                      value={step.action}
                      onChange={(e) => changeStep(index, { action: e.target.value, params: '' })}
                    >
                      {profile?.actions.map((a) => (
                        <option key={a.action} value={a.action}>
                          {actionLabels[a.action] ?? a.action}
                        </option>
                      )) ?? <option value={step.action}>Unsupported character</option>}
                    </select>
                  </label>
                  <label>
                    Times
                    <input
                      aria-label={`Step ${index + 1} repeats`}
                      type="number"
                      min={1}
                      max={20}
                      value={step.repeat}
                      onChange={(e) => changeStep(index, { repeat: e.target.valueAsNumber })}
                    />
                  </label>
                  <label>
                    Wait after (frames)
                    <input
                      aria-label={`Step ${index + 1} wait`}
                      type="number"
                      min={0}
                      max={1800}
                      value={step.waitFrames}
                      onChange={(e) => changeStep(index, { waitFrames: e.target.valueAsNumber })}
                    />
                  </label>
                  <button
                    className="team-icon-button"
                    type="button"
                    aria-label={`Remove rotation step ${index + 1}`}
                    onClick={() =>
                      setSettings((s) => ({ ...s, steps: s.steps.filter((_, i) => i !== index) }))
                    }
                  >
                    ×
                  </button>
                  <details className="damage-step-options">
                    <summary>Action options{action?.note ? ' / notes' : ''}</summary>
                    {action?.note ? <p className="analysis-muted">{action.note}</p> : null}
                    <label>
                      Numeric parameters
                      <input
                        aria-label={`Step ${index + 1} parameters`}
                        placeholder="e.g. hold=1"
                        value={step.params}
                        maxLength={160}
                        onChange={(e) => changeStep(index, { params: e.target.value })}
                      />
                    </label>
                    <a
                      href={`https://docs.gcsim.app/reference/characters/${profile?.key ?? ''}/`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Character action reference ↗
                    </a>
                  </details>
                </li>
              );
            })}
          </ol>
          <div className="damage-rotation-actions">
            <button
              type="button"
              className="button-secondary"
              disabled={settings.steps.length >= 64}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  steps: [...s.steps, stepFor(team.members[0].characterKey)],
                }))
              }
            >
              ＋ Add step
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                try {
                  saveDamageSettings(uid, team.id, settings);
                  setStatus('Rotation saved in this browser.');
                } catch {
                  setError('Could not save this rotation. Check the settings and browser storage.');
                }
              }}
            >
              Save rotation
            </button>
          </div>
          {settings.steps.length && input.issues.some((i) => i.code === 'invalid_rotation') ? (
            <p role="status" className="analysis-notice">
              {explainDamageIssue({ code: 'invalid_rotation' }, names)}
            </p>
          ) : null}
          <p className="analysis-muted">
            Single enemy, full starting HP/energy, no external particles, 12-frame swap delay.
            Cooldown and energy limits stay enabled. Conditional passives use the engine’s defaults.
            The first run downloads about 9 MB of simulator data; calculation stays on your device.
          </p>
          <button
            type="button"
            className="button-primary"
            disabled={!input.config}
            onClick={() => void run()}
          >
            Calculate team damage
          </button>
        </fieldset>
        {running ? (
          <button type="button" className="button-secondary" onClick={() => job.current?.cancel()}>
            Cancel simulation
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
        {fresh ? (
          <section className="damage-results" aria-label="Team damage results">
            <div className="damage-total">
              <div>
                <small>TEAM DPS</small>
                <strong>{format(fresh.dps)}</strong>
              </div>
              <div>
                <small>TOTAL DAMAGE · {settings.duration}s</small>
                <strong>{format(fresh.damage)}</strong>
              </div>
            </div>
            <p className="analysis-muted">
              Mean of {fresh.samples} fixed-seed samples (seeds 1–{fresh.samples}). Sample DPS
              range: {format(fresh.minDps)}–{format(fresh.maxDps)}. This estimates the displayed
              rotation and enemy; it is not guaranteed in-game damage.
            </p>
            <div className="damage-member-results">
              {fresh.members.map((member) => (
                <div key={member.key}>
                  <div>
                    <strong>{engineNames[member.key] ?? member.key}</strong>
                    <span>
                      {format(member.dps)} DPS · {format(member.damage)} damage
                    </span>
                  </div>
                  <progress
                    max={Math.max(fresh.damage, 1)}
                    value={member.damage}
                    aria-label={`${engineNames[member.key] ?? member.key} damage contribution`}
                  />
                  {member.actions === 0 ? (
                    <small>No actions executed in this rotation.</small>
                  ) : member.waits > 0 ? (
                    <small>
                      Action waits occurred; check cooldowns, energy and rotation timing.
                    </small>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : result ? (
          <p className="analysis-muted">
            The build or settings changed. Calculate again for the current lineup.
          </p>
        ) : null}
        <details className="analysis-disclosure">
          <summary>Calculation source and generated configuration</summary>
          <p className="analysis-muted">
            Pinned{' '}
            <a
              href="https://github.com/genshinsim/gcsim/tree/caf738dc807a646e2eee7e7b572f225dd6deb510"
              target="_blank"
              rel="noreferrer"
            >
              gcsim v2.47.2
            </a>
            , MIT license, with a seeded Celestia bridge. Newer/unimplemented kits and equipment
            remain unavailable. No AI-generated multipliers are used.
          </p>
          <pre>
            {input.config ??
              'Resolve the coverage/data gaps above and choose your rotation to generate a configuration.'}
          </pre>
          <a href="/vendor/gcsim-v2.47.2/LICENSE" target="_blank" rel="noreferrer">
            Engine license
          </a>
        </details>
      </section>
    </details>
  );
}
