import { useState } from 'react';

import type { CharacterObservation } from '../lib/observed-roster';
import type { AutoTeamCandidate } from '../lib/team-damage/auto-generator.calculator';
import { defensibleRotation } from '../lib/team-damage/benchmark.calculator';
import { explainTeamComfort } from '../lib/team-damage/team-comfort.explainer';
import RotationTimelineView from './RotationTimelineView';
import { TeamPortrait } from './TeamCharacterPicker';

interface CardProps {
  rank: number;
  isTopDps: boolean;
  isComfortAlternative: boolean;
  candidate: AutoTeamCandidate;
  dps: number;
  errorMargin?: number;
  samples: number;
  names: Record<string, string>;
  records: CharacterObservation[];
  selectedDriverKey: string;
  onSave: () => Promise<void>;
}

const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function TeamRecommendationCard({
  rank,
  isTopDps,
  isComfortAlternative,
  candidate,
  dps,
  errorMargin,
  samples,
  names,
  records,
  selectedDriverKey,
  onSave,
}: CardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const comfort = candidate.comfort;
  const comfortExplanations = comfort ? explainTeamComfort(comfort) : [];
  const rotationSteps = defensibleRotation(candidate.team, selectedDriverKey);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      className={`team-auto-result ${isTopDps ? 'team-top-dps' : ''} ${isComfortAlternative ? 'team-comfort-alt' : ''}`}
      aria-label={`Team recommendation ${rank}`}
    >
      <header>
        <div className="team-header-main">
          <div className="team-badges-row">
            <span className="team-auto-rank">#{rank}</span>
            {isTopDps ? <span className="team-badge-pill dps-pill">Top Tested Damage</span> : null}
            {isComfortAlternative ? (
              <span className="team-badge-pill comfort-pill">Comfortable Alternative</span>
            ) : null}
            {comfort ? (
              <span className={`team-badge-pill tier-${comfort.tier}`}>
                Comfort: {comfort.score} ({comfort.tier.replace('_', ' ')})
              </span>
            ) : null}
          </div>
          <div className="team-stats-row">
            <strong>
              {format(dps)} DPS
              {errorMargin ? ` ± ${format(errorMargin)}` : ''}
            </strong>
            <small>
              {isTopDps
                ? 'Highest simulated damage ceiling'
                : isComfortAlternative
                  ? 'High defensive stability & lower execution friction'
                  : 'Verified team candidate'}{' '}
              · {samples} samples
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
          disabled={saving || saved}
          onClick={() => void handleSave()}
        >
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save team'}
        </button>
      </header>

      <div className="team-auto-members">
        {candidate.team.members.map((member) => {
          const character = records.find(
            (record) => record.character.key === member.characterKey,
          )?.character;
          return character ? (
            <div key={member.characterKey} className="team-member-chip">
              <TeamPortrait character={character} />
              <strong>{character.name}</strong>
              <small>
                {member.characterKey === selectedDriverKey ? 'Main DPS' : 'Teammate'}
              </small>
            </div>
          ) : null;
        })}
      </div>

      {comfortExplanations.length ? (
        <div className="team-comfort-explainer">
          <span className="explainer-heading">Defensive & Comfort Profile:</span>
          <ul>
            {comfortExplanations.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <RotationTimelineView steps={rotationSteps} names={names} />
    </article>
  );
}
