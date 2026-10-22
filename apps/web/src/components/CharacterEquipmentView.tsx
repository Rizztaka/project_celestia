import {
  artifactSlots,
  type CharacterEquipmentResponse,
  type EquipmentAssignment,
  type EquipmentSectionReceipt,
  type RecordedArtifact,
} from '@celestia/api-contracts';

import { artworkDisplayName } from '../lib/artwork';
import { statLabel, statValue } from '../lib/profile-presentation';
import { ArtifactReference, WeaponReference } from './EquipmentReference';
import { GenshinArtifactIcon } from './GenshinArtifactIcon';
import { GenshinWeaponIcon } from './GenshinWeaponIcon';

const recordedName = artworkDisplayName;
function Receipt({
  receipt,
  merged = false,
}: {
  receipt: EquipmentSectionReceipt;
  merged?: boolean;
}) {
  return (
    <details className="mt-4 text-xs text-zinc-300">
      <summary className="cursor-pointer">Import provenance</summary>
      <div className="mt-2 space-y-2">
        <p>
          {receipt.status === 'unknown'
            ? 'Import history unknown'
            : `Received ${receipt.importedAt ? new Date(receipt.importedAt).toLocaleString() : 'date unknown'} · ${receipt.source ?? 'Source not recorded'} · ${receipt.entryCount} supplied entries`}
        </p>
        <p>
          {merged
            ? 'Character entries were merged; this receipt does not date each retained value.'
            : 'A replacement section does not prove a complete in-game scan.'}
        </p>
        <p>Receipt dates describe import time, not acquisition or live observation.</p>
      </div>
    </details>
  );
}
function MissingAssignment({
  assignment,
}: {
  assignment: Exclude<EquipmentAssignment<unknown>, { state: 'recorded_assigned' }>;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-400">
      <p className="font-medium text-zinc-200">
        {assignment.state === 'unrecorded'
          ? 'No assignment in recorded data'
          : 'Assignment unknown'}
      </p>
      <p className="mt-1">
        {assignment.reason === 'inconsistent_relation'
          ? 'The stored equipment relation is inconsistent. Import a fresh section to update this view.'
          : assignment.reason === 'provenance_unknown'
            ? 'No equipment assignment is recorded here, and the equipment import history is unknown.'
            : 'No piece is assigned here in the stored section.'}
      </p>
      <p className="mt-2 text-zinc-200">
        Celestia cannot tell whether this slot is empty or equipped in-game.
      </p>
    </div>
  );
}
function ArtifactPiece({ item }: { item: RecordedArtifact }) {
  return (
    <div className="space-y-3">
      <ArtifactReference itemKey={item.setKey} slot={item.slotKey} />
      <GenshinArtifactIcon
        setKey={item.setKey}
        slotKey={item.slotKey}
        rarity={item.rarity}
        size="lg"
      />
      <div>
        <p className="break-words font-semibold text-white">
          {recordedName(item.setKey)} · Equipped
        </p>
      </div>
      <p className="text-sm text-zinc-300">
        {item.rarity}★ · Level +{item.level}
        {item.locked ? ' · Inventory lock recorded' : ''}
      </p>
      <div className="rounded-lg bg-white/5 p-3">
        <p className="text-xs text-zinc-400">Main stat</p>
        <p className="break-all font-medium text-white">{statLabel(item.mainStatKey)}</p>
        <p className="mt-1 text-xs text-zinc-400">Amount unavailable — not stored.</p>
      </div>
      <div>
        <p className="mb-2 text-xs text-zinc-400">Stored substats</p>
        {item.subStats === null ? (
          <p className="text-sm text-zinc-400">
            Substat values unavailable: unsupported stored data.
          </p>
        ) : item.subStats.length === 0 ? (
          <p className="text-sm text-zinc-400">No substat values recorded.</p>
        ) : (
          <dl className="space-y-1 text-sm">
            {item.subStats.map((stat, index) => (
              <div key={index} className="flex justify-between gap-3">
                <dt className="min-w-0 break-all text-zinc-300">{statLabel(stat.key)}</dt>
                <dd className="shrink-0 tabular-nums text-white">
                  {statValue(stat.key, stat.value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
export function CharacterEquipmentView({ data }: { data: CharacterEquipmentResponse }) {
  const setCounts = new Map<string, number>();
  for (const slot of artifactSlots) {
    const assigned = data.artifacts[slot];
    if (assigned.state === 'recorded_assigned')
      setCounts.set(assigned.item.setKey, (setCounts.get(assigned.item.setKey) ?? 0) + 1);
  }
  return (
    <div className="space-y-6">
      <Receipt receipt={data.provenance.characters} merged />
      <section
        className={`rounded-2xl border p-5 sm:p-6 ${data.weapon.item ? 'border-indigo-300/40 bg-indigo-500/15' : 'border-dashed border-zinc-600 bg-zinc-900/70'}`}
        aria-labelledby="weapon-title"
      >
        <h2 id="weapon-title" className="mb-4 text-lg font-semibold text-white">
          {data.weapon.item
            ? 'Equipped weapon · Recorded'
            : data.weapon.state === 'unknown'
              ? 'Weapon assignment · Unknown'
              : 'Weapon assignment · Not recorded'}
        </h2>
        {data.weapon.state === 'recorded_assigned' ? (
          <div className="flex items-start gap-4">
            <GenshinWeaponIcon
              weaponKey={data.weapon.item.weaponKey}
              refinement={data.weapon.item.refinement}
              size="lg"
            />
            <div className="min-w-0">
              <p className="break-words font-semibold text-white">
                {recordedName(data.weapon.item.weaponKey)}
              </p>

              <p className="mt-3 text-sm text-zinc-300">
                Level {data.weapon.item.level} · Ascension {data.weapon.item.ascension} · Refinement{' '}
                {data.weapon.item.refinement}
                {data.weapon.item.locked ? ' · Inventory lock recorded' : ''}
              </p>
            </div>
          </div>
        ) : (
          <MissingAssignment assignment={data.weapon} />
        )}
        {data.weapon.item && (
          <div className="mt-4">
            <WeaponReference
              itemKey={data.weapon.item.weaponKey}
              refinement={data.weapon.item.refinement}
            />
          </div>
        )}
        <Receipt receipt={data.provenance.weapons} />
      </section>
      <section aria-labelledby="artifacts-title">
        <h2 id="artifacts-title" className="text-lg font-semibold text-white">
          Artifacts · Recorded assignments
        </h2>
        <Receipt receipt={data.provenance.artifacts} />
        {!data.artifactRelationsConsistent && (
          <p role="status" className="mt-3 text-sm text-amber-300">
            Some stored artifact relations are inconsistent. Only your account’s pieces are shown.
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artifactSlots.map((slot) => {
            const assignment = data.artifacts[slot];
            return (
              <article
                key={slot}
                className={`min-w-0 rounded-2xl border p-5 ${assignment.state === 'recorded_assigned' ? 'border-indigo-300/40 bg-indigo-500/15' : 'border-dashed border-zinc-600 bg-zinc-900/70'}`}
              >
                <h3 className="mb-4 flex items-center gap-3 text-base font-semibold capitalize text-indigo-200">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-xs uppercase"
                    aria-hidden="true"
                  >
                    {slot[0]}
                  </span>
                  {slot}
                </h3>
                {assignment.state === 'recorded_assigned' ? (
                  <ArtifactPiece item={assignment.item} />
                ) : (
                  <MissingAssignment assignment={assignment} />
                )}
              </article>
            );
          })}
        </div>
        {data.unrecognizedSlots.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/20 p-4">
            <h3 className="mb-3 font-semibold text-amber-200">Records with unrecognized slots</h3>
            {data.unrecognizedSlots.map((item, i) => (
              <div key={i} className="mb-4">
                <p className="mb-2 break-all text-sm text-zinc-400">Slot key: {item.slotKey}</p>
                <ArtifactPiece item={item} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">Recorded set counts</p>
          {setCounts.size ? (
            <ul className="mt-3 space-y-4">
              {[...setCounts].map(([set, count]) => (
                <li key={set} className="break-words">
                  <p className="mb-3 text-zinc-200">
                    {recordedName(set)}: {count} recorded {count === 1 ? 'piece' : 'pieces'}
                  </p>
                  <ArtifactReference itemKey={set} count={count} data={data} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">No pieces assigned in the five recorded slots.</p>
          )}
          <p className="mt-2 text-xs">
            Counts describe recorded assignments. Conditional activation remains unknown; incomplete
            slots do not establish missing inventory.
          </p>
        </div>
      </section>
      <p className="text-xs leading-relaxed text-zinc-500">
        Import receipts describe when Celestia received a section, not when items were observed in
        the game. Equipment is recorded data, with no live game connection or acquisition dates.
        Explicit empty-slot observations are not stored.
      </p>
    </div>
  );
}
