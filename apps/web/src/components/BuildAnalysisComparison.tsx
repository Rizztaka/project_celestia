import { useState } from 'react';

import { compareCharacter } from '../lib/build-analysis/compare';
import equipment from '../lib/build-analysis/equipment-identity.json';
import { statLabel } from '../lib/build-analysis/explainer';
import type { AnalysisInput, ArtifactSlot, Hypothesis } from '../lib/build-analysis/types';
import { canonicalEquipmentStat, slotStatVocabulary } from '../lib/build-analysis/units';
import { BuildAnalysisFindings } from './BuildAnalysisFindings';

const mainStatIds = [
  'FIGHT_PROP_HP_PERCENT',
  'FIGHT_PROP_ATTACK_PERCENT',
  'FIGHT_PROP_DEFENSE_PERCENT',
  'FIGHT_PROP_ELEMENT_MASTERY',
  'FIGHT_PROP_CHARGE_EFFICIENCY',
  'FIGHT_PROP_CRITICAL',
  'FIGHT_PROP_CRITICAL_HURT',
  'FIGHT_PROP_HEAL_ADD',
  'FIGHT_PROP_PHYSICAL_ADD_HURT',
  'FIGHT_PROP_FIRE_ADD_HURT',
  'FIGHT_PROP_ELEC_ADD_HURT',
  'FIGHT_PROP_WATER_ADD_HURT',
  'FIGHT_PROP_WIND_ADD_HURT',
  'FIGHT_PROP_ICE_ADD_HURT',
  'FIGHT_PROP_ROCK_ADD_HURT',
  'FIGHT_PROP_GRASS_ADD_HURT',
];
const reviewedSets = Object.entries(equipment.sets).filter(([, set]) =>
  [
    'GoldenTroupe',
    'ViridescentVenerer',
    'FinaleOfTheDeepGalleries',
    'MarechausseeHunter',
    'ScrollOfTheHeroOfCinderCity',
  ].includes(set.reference ?? ''),
);
export function BuildAnalysisComparison({ input }: { input: AnalysisInput }) {
  const [kind, setKind] = useState<'main_stat' | 'set_pieces'>('main_stat');
  const [slot, setSlot] = useState<ArtifactSlot>('Sands');
  const [stat, setStat] = useState('FIGHT_PROP_HP_PERCENT');
  const [setId, setSetId] = useState(Number(reviewedSets[0]?.[0]));
  const [pieces, setPieces] = useState<2 | 4>(4);
  const options = mainStatIds.filter((id) =>
    slotStatVocabulary[slot]?.includes(canonicalEquipmentStat(id)!),
  );
  const selectedStat = options.includes(stat) ? stat : options[0];
  const hypothesis: Hypothesis =
    kind === 'main_stat' ? { kind, slot, statId: selectedStat } : { kind, setId, pieces };
  const result = compareCharacter(input, hypothesis);
  return (
    <details className="analysis-disclosure">
      <summary>Compare an equipment assumption</summary>
      <p className="analysis-muted">
        One hypothetical change. Recorded gear and combat statistics stay unchanged. This compares
        supported rule findings, without simulating damage or new totals.
      </p>
      <div className="analysis-controls">
        <label>
          Change
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="main_stat">Artifact main stat</option>
            <option value="set_pieces">Artifact set</option>
          </select>
        </label>
        {kind === 'main_stat' ? (
          <>
            <label>
              Slot
              <select value={slot} onChange={(e) => setSlot(e.target.value as ArtifactSlot)}>
                {['Sands', 'Goblet', 'Circlet'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Main stat
              <select value={selectedStat} onChange={(e) => setStat(e.target.value)}>
                {options.map((id) => (
                  <option value={id} key={id}>
                    {statLabel(canonicalEquipmentStat(id)!)}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label>
              Set
              <select value={setId} onChange={(e) => setSetId(Number(e.target.value))}>
                {reviewedSets.map(([id, set]) => (
                  <option key={id} value={id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pieces
              <select value={pieces} onChange={(e) => setPieces(Number(e.target.value) as 2 | 4)}>
                <option value={2}>2</option>
                <option value={4}>4</option>
              </select>
            </label>
          </>
        )}
      </div>
      <div aria-live="polite">
        <BuildAnalysisFindings
          findings={result.changed}
          empty="This assumption changes no supported conclusions for the selected role and context."
        />
      </div>
    </details>
  );
}
