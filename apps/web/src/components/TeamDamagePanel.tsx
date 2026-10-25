import { useEffect, useMemo, useRef, useState } from 'react';

import type { SavedUidTeam } from '../lib/build-analysis/teams-storage';
import type { CharacterObservation } from '../lib/observed-roster';
import {
  damageInput,
  type DamageSettings,
  engineCharacter,
  type RotationStep,
} from '../lib/team-damage/calculator';
import { explainDamageIssue } from '../lib/team-damage/explainer';
import { readDamageSettings, saveDamageSettings } from '../lib/team-damage/preferences';
import { describeRotation } from '../lib/team-damage/rotation-explainer';
import {
  damageChange,
  type RotationCandidate,
  rotationCandidates,
} from '../lib/team-damage/rotation-search.calculator';
import {
  type DamageResult,
  runTeamSimulation,
  type SearchResult,
  searchTeamRotations,
} from '../lib/team-damage/service';
import RotationBuilder from './RotationBuilder';

const defaults = (): DamageSettings => ({
  duration: 60,
  enemyLevel: 100,
  resistance: 0,
  samples: 20,
  steps: [],
});
const format = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const numericValue = (value: number) => (Number.isFinite(value) ? value : '');
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
  const [customTarget, setCustomTarget] = useState(
    () => settings.enemyLevel !== 100 || ![0, 10].includes(settings.resistance),
  );
  const [searchLimit, setSearchLimit] = useState<12 | 48>(12);
  const [searchReport, setSearchReport] = useState<{
    signature: string;
    value: SearchResult;
    candidates: RotationCandidate[];
  } | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [starterDriver, setStarterDriver] = useState(
    team.members.find((member) => member.roleId === 'on_field_damage')?.characterKey ?? '',
  );
  const [result, setResult] = useState<{ signature: string; value: DamageResult } | null>(null);
  const job = useRef<{ cancel: () => void } | null>(null);
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
  const plannedSearch = useMemo(
    () => rotationCandidates(settings.steps, searchLimit),
    [settings.steps, searchLimit],
  );
  const freshSearch = searchReport?.signature === input.signature ? searchReport : null;
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
  async function search() {
    if (!input.config || job.current || plannedSearch.candidates.length < 2) return;
    setRunning(true);
    setError('');
    setSearchReport(null);
    const captured = input.signature;
    let handle: ReturnType<typeof searchTeamRotations> | null = null;
    try {
      const candidates = plannedSearch.candidates.map((candidate) => ({
        id: candidate.id,
        config: damageInput(uid, team, records, { ...settings, steps: candidate.steps }).config,
      }));
      if (candidates.some((candidate) => !candidate.config))
        throw new Error('One of the candidate rotations is invalid. Check your steps.');
      handle = searchTeamRotations(
        candidates as { id: string; config: string }[],
        settings.samples,
        (message) => {
          if (mounted.current) setStatus(message);
        },
      );
      job.current = handle;
      const value = await handle.promise;
      if (mounted.current) {
        setSearchReport({ signature: captured, value, candidates: [...plannedSearch.candidates] });
        setStatus('Rotation search complete. Your builder is unchanged until you choose a result.');
      }
    } catch (failure) {
      if (mounted.current) {
        setStatus('');
        setError(failure instanceof Error ? failure.message : 'Search failed.');
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
          <div className="damage-training-dummy">
            <div>
              <p className="eyebrow">ONE TARGET. FAIR COMPARISONS.</p>
              <h3>
                Training dummy <span>∞ HP</span>
              </h3>
              <p>
                One stationary enemy that cannot die during the timed test. No shields, phases,
                attacks or HP-drop particles.
              </p>
            </div>
            <label>
              Training dummy preset
              <select
                value={customTarget ? 'custom' : settings.resistance === 0 ? 'neutral' : 'standard'}
                onChange={(event) => {
                  const value = event.target.value;
                  setCustomTarget(value === 'custom');
                  if (value !== 'custom')
                    setSettings((current) => ({
                      ...current,
                      enemyLevel: 100,
                      resistance: value === 'neutral' ? 0 : 10,
                    }));
                }}
              >
                <option value="neutral">Neutral · Lv. 100 · 0% RES</option>
                <option value="standard">Standard · Lv. 100 · 10% RES</option>
                <option value="custom">Custom level / uniform RES</option>
              </select>
            </label>
            <p className="analysis-muted">
              Starting resistance: <strong>{settings.resistance}%</strong> to Pyro, Hydro, Cryo,
              Electro, Anemo, Geo, Dendro and Physical. Normal level-based DEF and your team’s
              resistance reductions still apply. Every search candidate uses this exact dummy and
              test duration.
            </p>
          </div>
          <div className="damage-enemy-settings">
            <label>
              Duration (seconds)
              <input
                type="number"
                min={10}
                max={180}
                value={numericValue(settings.duration)}
                onChange={(e) => setSettings((s) => ({ ...s, duration: e.target.valueAsNumber }))}
              />
            </label>
            {customTarget ? (
              <label>
                Enemy level
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={numericValue(settings.enemyLevel)}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, enemyLevel: e.target.valueAsNumber }))
                  }
                />
              </label>
            ) : null}
            {customTarget ? (
              <label>
                Starting resistance to all damage (%)
                <input
                  type="number"
                  min={-100}
                  max={300}
                  value={numericValue(settings.resistance)}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, resistance: e.target.valueAsNumber }))
                  }
                />
              </label>
            ) : null}
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
            Start with a template, or tap actions below. Each card is one step in your repeating
            rotation. Add Bursts, set attack counts and move cards into the order you play.
            Templates are editable starting points.
          </p>
          <RotationBuilder
            team={team}
            records={records}
            steps={settings.steps}
            onChange={(steps) => setSettings((current) => ({ ...current, steps }))}
          />
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
            Timed training dummy, full starting character HP/energy, no external particles, 12-frame
            swap delay. Cooldown and energy limits stay enabled. Conditional passives use the
            engine’s defaults. The first run downloads about 9 MB of simulator data; calculation
            stays on your device.
          </p>
          <button
            type="button"
            className="button-primary"
            disabled={!input.config}
            onClick={() => void run()}
          >
            Calculate team damage
          </button>
          <section className="rotation-search-controls" aria-labelledby="rotation-search-title">
            <p className="eyebrow">TRY A STRONGER SEQUENCE</p>
            <h3 id="rotation-search-title">Find a better rotation</h3>
            <p>
              Consecutive steps for one character form a turn. Try different orders for these turns,
              plus 3, 6 or 9 repeats of the last Normal attack step. Each turn keeps its own Skill,
              Burst and combo order. Add the actions you want tested in the builder first.
            </p>
            <div className="damage-rotation-actions">
              <label>
                Search size
                <select
                  value={searchLimit}
                  onChange={(event) => setSearchLimit(Number(event.target.value) as 12 | 48)}
                >
                  <option value={12}>Quick · up to 12 rotations</option>
                  <option value={48}>Wider · up to 48 rotations</option>
                </select>
              </label>
              <button
                type="button"
                className="button-secondary"
                disabled={!input.config || plannedSearch.candidates.length < 2}
                onClick={() => void search()}
              >
                Find best tested rotation
              </button>
            </div>
            <p className="analysis-muted">
              Screens {plannedSearch.candidates.length} candidates with seed 1, then verifies the
              top three and your current rotation with the same {settings.samples} samples each.
              Ranks verified finalists by average DPS over {settings.duration}s. This is a bounded
              search, not a proof of the highest possible damage. Longer searches may take a few
              minutes.
            </p>
            {plannedSearch.issue === 'turn_limit' ? (
              <p role="status">
                Search supports up to 8 character turns. Combine adjacent actions for the same
                character or simplify your loop. Manual calculation still supports 64 steps.
              </p>
            ) : null}
          </section>
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
        {freshSearch ? (
          <section className="rotation-search-results" aria-label="Rotation search results">
            <p className="eyebrow">BEST VERIFIED ROTATION</p>
            <h3>
              {freshSearch.value.ranked[0].id === '0'
                ? 'Your current rotation came out on top'
                : 'A stronger tested sequence'}
            </h3>
            <p>
              {freshSearch.value.tested} candidates screened · {freshSearch.value.ranked.length}{' '}
              finalists compared over seeds 1–{freshSearch.value.samples} · Lv.{' '}
              {settings.enemyLevel} dummy · {settings.resistance}% starting RES ·{' '}
              {settings.duration}s
            </p>
            {freshSearch.value.failed ? (
              <p role="status">
                {freshSearch.value.failed} candidate evaluations failed and were excluded. No damage
                was invented for them.
              </p>
            ) : null}
            <p className="analysis-muted">
              The best result below is the highest measured among these verified finalists. Untested
              combos, waits, parameters and longer rotations can perform better. Nothing is applied
              or saved automatically.
            </p>
            {freshSearch.value.ranked.map((row, rank) => {
              const candidate = freshSearch.candidates.find((entry) => entry.id === row.id)!;
              const baseline = freshSearch.value.ranked.find((entry) => entry.id === '0')!.result;
              const change = damageChange(baseline.dps, row.result.dps);
              return (
                <article key={row.id}>
                  <header>
                    <div>
                      <small>
                        #{rank + 1} ·{' '}
                        {row.id === '0' ? 'Your current rotation' : 'Tested alternative'}
                      </small>
                      <strong>{format(row.result.dps)} DPS</strong>
                      <span>
                        {row.id === '0'
                          ? 'Baseline'
                          : change === null
                            ? 'Baseline dealt zero damage'
                            : `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs current`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={running || row.id === '0'}
                      onClick={() => {
                        const next = {
                          ...settings,
                          steps: candidate.steps.map((step) => ({ ...step })),
                        };
                        setSettings(next);
                        setResult({
                          signature: damageInput(uid, team, records, next).signature,
                          value: row.result,
                        });
                        setSearchReport(null);
                        setStatus(
                          'Tested rotation applied to the builder. Use Save rotation to keep it.',
                        );
                      }}
                    >
                      Use this rotation
                    </button>
                  </header>
                  <ol>
                    {describeRotation(candidate.steps, names).map((description, index) => (
                      <li key={index}>{description}</li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </section>
        ) : searchReport ? (
          <p className="analysis-muted">
            The build or settings changed. Run the rotation search again for a fair comparison.
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
              Lv. {settings.enemyLevel} training dummy · {settings.resistance}% starting resistance
              to all damage · infinite HP. Mean of {fresh.samples} fixed-seed samples (seeds 1–
              {fresh.samples}). Sample DPS range: {format(fresh.minDps)}–{format(fresh.maxDps)}.
              This estimates the displayed rotation and enemy; it is not guaranteed in-game damage.
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
