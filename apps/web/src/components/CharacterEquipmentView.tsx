import {
  artifactSlots,
  type CharacterEquipmentResponse,
  type EquipmentAssignment,
  type EquipmentSectionReceipt,
  type RecordedArtifact,
} from '@celestia/api-contracts';
import { useState } from 'react';

import { ASSET_MAPPING } from '../lib/asset-mapping';

function recordedName(key: string): string {
  return (
    key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim() || key
  );
}
function RecordedImage({
  asset,
  kind,
  name,
}: {
  asset?: string;
  kind: 'Avatar' | 'Equip';
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-xl font-semibold text-zinc-400">
      <span aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>
      {asset && !failed && (
        <img
          src={`https://enka.network/ui/UI_${kind}Icon_${asset}.png`}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
function Receipt({
  receipt,
  merged = false,
}: {
  receipt: EquipmentSectionReceipt;
  merged?: boolean;
}) {
  return (
    <div className="mt-3 space-y-1 text-xs leading-relaxed text-zinc-400">
      {receipt.status === 'unknown' ? (
        <p>Import provenance unknown. Stored records may predate section receipts.</p>
      ) : (
        <>
          <p>
            Section received:{' '}
            <time dateTime={receipt.importedAt!}>
              {new Date(receipt.importedAt!).toLocaleString()}
            </time>
          </p>
          <p className="break-words">
            Source label: {receipt.source || 'Not supplied'} · Supplied entries:{' '}
            {receipt.entryCount}
          </p>
          <p>
            {merged
              ? 'Characters were merged. This receipt does not date each retained character.'
              : 'Recorded section replacement. This receipt does not prove a complete game scan.'}
          </p>
        </>
      )}
    </div>
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
      <div>
        <p className="break-words font-semibold text-white">{recordedName(item.setKey)}</p>
        <p className="break-all text-xs text-zinc-500">{item.setKey}</p>
      </div>
      <p className="text-sm text-zinc-300">
        {item.rarity}★ · Level +{item.level}
        {item.locked ? ' · Locked' : ''}
      </p>
      <div className="rounded-lg bg-white/5 p-3">
        <p className="text-xs text-zinc-400">Main stat key</p>
        <p className="break-all font-medium text-white">{item.mainStatKey}</p>
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
                <dt className="min-w-0 break-all text-zinc-300">{stat.key || 'Unnamed stat'}</dt>
                <dd className="shrink-0 tabular-nums text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
export function CharacterEquipmentView({ data }: { data: CharacterEquipmentResponse }) {
  const c = data.character;
  const name = recordedName(c.characterKey);
  const setCounts = new Map<string, number>();
  for (const slot of artifactSlots) {
    const assigned = data.artifacts[slot];
    if (assigned.state === 'recorded_assigned')
      setCounts.set(assigned.item.setKey, (setCounts.get(assigned.item.setKey) ?? 0) + 1);
  }
  return (
    <div className="space-y-6">
      <section
        className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-6"
        aria-labelledby="character-title"
      >
        <div className="flex items-center gap-4">
          <RecordedImage
            key={c.characterKey}
            asset={ASSET_MAPPING.characters[c.characterKey]}
            kind="Avatar"
            name={name}
          />
          <div className="min-w-0">
            <p className="mb-1 text-xs uppercase tracking-widest text-indigo-300">
              Recorded character
            </p>
            <h1
              id="character-title"
              className="font-display break-words text-3xl font-bold text-white"
            >
              {name}
            </h1>
            <p className="mt-1 break-all text-xs text-zinc-500">{c.characterKey}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-3">
          {[
            ['Level', c.level],
            ['Ascension', c.ascension],
            ['Constellation', c.constellation],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/5 p-3">
              <dt className="text-xs text-zinc-400">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <h2 className="mt-6 text-sm font-semibold text-zinc-200">Stored talents</h2>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          {[
            ['Normal attack', c.talents.normal],
            ['Skill', c.talents.skill],
            ['Burst', c.talents.burst],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-zinc-400">{label}</dt>
              <dd className="mt-1 text-lg text-white">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          Values are stored as supplied. Base versus constellation-adjusted talent levels cannot be
          established from these records. Legacy/default origin is not recorded per value.
        </p>
        <Receipt receipt={data.provenance.characters} merged />
      </section>
      <section
        className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-6"
        aria-labelledby="weapon-title"
      >
        <h2 id="weapon-title" className="mb-4 text-lg font-semibold text-white">
          Recorded weapon assignment
        </h2>
        {data.weapon.state === 'recorded_assigned' ? (
          <div className="flex items-start gap-4">
            <RecordedImage
              key={data.weapon.item.weaponKey}
              asset={ASSET_MAPPING.weapons[data.weapon.item.weaponKey]}
              kind="Equip"
              name={recordedName(data.weapon.item.weaponKey)}
            />
            <div className="min-w-0">
              <p className="break-words font-semibold text-white">
                {recordedName(data.weapon.item.weaponKey)}
              </p>
              <p className="mt-1 break-all text-xs text-zinc-500">{data.weapon.item.weaponKey}</p>
              <p className="mt-3 text-sm text-zinc-300">
                Level {data.weapon.item.level} · Ascension {data.weapon.item.ascension} · Refinement{' '}
                {data.weapon.item.refinement}
                {data.weapon.item.locked ? ' · Locked' : ''}
              </p>
            </div>
          </div>
        ) : (
          <MissingAssignment assignment={data.weapon} />
        )}
        <Receipt receipt={data.provenance.weapons} />
      </section>
      <section aria-labelledby="artifacts-title">
        <h2 id="artifacts-title" className="text-lg font-semibold text-white">
          Recorded artifact assignments
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
                className="glass-panel min-w-0 rounded-2xl border border-white/10 p-5"
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
            <ul className="mt-2 space-y-1">
              {[...setCounts].map(([set, count]) => (
                <li key={set} className="break-words">
                  {recordedName(set)}: {count} recorded {count === 1 ? 'piece' : 'pieces'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">No pieces assigned in the five recorded slots.</p>
          )}
          <p className="mt-2 text-xs">
            Counts describe these records; set effects and build quality are not evaluated.
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
