import type { SavedUidTeam } from '../lib/build-analysis/teams-storage';
import type { CharacterObservation } from '../lib/observed-roster';
import { engineCharacter, type RotationStep } from '../lib/team-damage/calculator';
import { actionLabels } from '../lib/team-damage/explainer';
import { describeRotation } from '../lib/team-damage/rotation-explainer';
import { TeamPortrait } from './TeamCharacterPicker';

const numericValue = (value: number) => (Number.isFinite(value) ? value : '');

export default function RotationBuilder({
  team,
  records,
  steps,
  onChange,
}: {
  team: SavedUidTeam;
  records: CharacterObservation[];
  steps: RotationStep[];
  onChange: (steps: RotationStep[]) => void;
}) {
  const characters = team.members.map(
    (member) =>
      records.find(
        (record) => record.uid === team.uid && record.character.key === member.characterKey,
      )?.character,
  );
  const names = Object.fromEntries(
    characters.flatMap((character) => (character ? [[character.key, character.name]] : [])),
  );
  const preview = describeRotation(steps, names);
  function change(index: number, update: Partial<RotationStep>) {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...update } : step)));
  }
  function move(index: number, direction: -1 | 1) {
    const next = [...steps];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  }
  return (
    <>
      <div className="rotation-action-palette" aria-label="Add character actions">
        {team.members.map((member, index) => {
          const character = characters[index];
          const actions = engineCharacter(member.characterKey)?.actions ?? [];
          return (
            <div key={member.characterKey}>
              <div className="rotation-palette-character">
                {character ? <TeamPortrait character={character} /> : null}
                <strong>{names[member.characterKey] ?? member.characterKey}</strong>
              </div>
              <div className="rotation-palette-buttons">
                {[
                  ['skill', 'Skill · E'],
                  ['burst', 'Burst · Q'],
                  ['attack', 'Normal attack'],
                  ['charge', 'Charged attack'],
                ]
                  .filter(([action]) => actions.some((a) => a.action === action))
                  .map(([action, label]) => (
                    <button
                      key={action}
                      type="button"
                      className="button-secondary"
                      disabled={steps.length >= 64}
                      aria-label={`Add ${names[member.characterKey] ?? member.characterKey} ${actionLabels[action]}`}
                      onClick={() =>
                        onChange([
                          ...steps,
                          {
                            characterKey: member.characterKey,
                            action,
                            repeat: 1,
                            waitFrames: 0,
                            params: '',
                          },
                        ])
                      }
                    >
                      {label} ＋
                    </button>
                  ))}
                {!actions.length ? <small>Actions unavailable for this kit.</small> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="rotation-readable-plan" aria-label="Rotation preview">
        <span>YOUR REPEATING LOOP</span>
        <p>
          {preview.length
            ? preview.join(' → ')
            : 'Tap a character’s Skill, Burst or attack above to start.'}
        </p>
      </div>
      <ol className="rotation-builder-steps" aria-label="Rotation steps">
        {steps.map((step, index) => {
          const profile = engineCharacter(step.characterKey);
          const action = profile?.actions.find((a) => a.action === step.action);
          return (
            <li key={index}>
              <header>
                <strong>
                  <span>{String(index + 1).padStart(2, '0')}</span>{' '}
                  {names[step.characterKey] ?? 'Unavailable member'}
                </strong>
                <div className="rotation-step-tools">
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label={`Move step ${index + 1} earlier`}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === steps.length - 1}
                    aria-label={`Move step ${index + 1} later`}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove rotation step ${index + 1}`}
                    onClick={() => onChange(steps.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              </header>
              <div className="rotation-step-fields">
                <label>
                  Character
                  <select
                    aria-label={`Step ${index + 1} character`}
                    value={step.characterKey}
                    onChange={(event) =>
                      change(index, {
                        characterKey: event.target.value,
                        action: 'skill',
                        params: '',
                      })
                    }
                  >
                    {!team.members.some((m) => m.characterKey === step.characterKey) ? (
                      <option value={step.characterKey}>Unavailable member</option>
                    ) : null}
                    {team.members.map((member) => (
                      <option key={member.characterKey} value={member.characterKey}>
                        {names[member.characterKey] ?? member.characterKey}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Do this
                  <select
                    aria-label={`Step ${index + 1} action`}
                    value={step.action}
                    onChange={(event) => change(index, { action: event.target.value, params: '' })}
                  >
                    {profile?.actions.map((a) => (
                      <option key={a.action} value={a.action}>
                        {actionLabels[a.action] ?? a.action}
                      </option>
                    )) ?? <option value={step.action}>Unsupported action</option>}
                  </select>
                </label>
                <label>
                  Repeat
                  <input
                    aria-label={`Step ${index + 1} repeats`}
                    type="number"
                    min={1}
                    max={20}
                    value={numericValue(step.repeat)}
                    onChange={(event) => change(index, { repeat: event.target.valueAsNumber })}
                  />
                </label>
                <label>
                  Wait after (seconds)
                  <input
                    aria-label={`Step ${index + 1} wait seconds`}
                    type="number"
                    min={0}
                    max={30}
                    step="any"
                    value={numericValue(Number((step.waitFrames / 60).toFixed(3)))}
                    onChange={(event) =>
                      change(index, { waitFrames: Math.round(event.target.valueAsNumber * 60) })
                    }
                  />
                </label>
              </div>
              <details className="damage-step-options">
                <summary>Advanced action options{action?.note ? ' / character notes' : ''}</summary>
                {action?.note ? <p className="analysis-muted">{action.note}</p> : null}
                <label>
                  Numeric parameters
                  <input
                    aria-label={`Step ${index + 1} parameters`}
                    maxLength={160}
                    placeholder="e.g. hold=1"
                    value={step.params}
                    onChange={(event) => change(index, { params: event.target.value })}
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
      <p className="analysis-muted">
        Read top to bottom, then repeat. Switching characters happens automatically. Waits use
        seconds, rounded to the nearest game frame. Cooldowns and energy can delay an action.
      </p>
    </>
  );
}
