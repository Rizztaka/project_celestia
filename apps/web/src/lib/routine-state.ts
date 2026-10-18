import {
  type RoutineSnapshotV2,
  SERVER_POLICIES,
  type SupportedServerId,
} from '@celestia/api-contracts';

/** Calendar labels belong to the selected server, independently of the browser timezone. */
export function serverDateLabel(
  instant: string,
  serverId: SupportedServerId,
  locale?: string,
): string {
  const shifted = new Date(
    Date.parse(instant) + SERVER_POLICIES[serverId].utcOffsetHours * 3600000,
  );
  return shifted.toLocaleDateString(locale, { timeZone: 'UTC' });
}

export interface ReceivedRoutine {
  snapshot: RoutineSnapshotV2;
  receivedAt: number;
}

/** Lower revisions and older projections must never replace confirmed state. */
export function newestRoutine(
  previous: ReceivedRoutine | undefined,
  incoming: ReceivedRoutine,
): ReceivedRoutine {
  if (!previous) return incoming;
  if (incoming.snapshot.revision < previous.snapshot.revision) return previous;
  if (
    incoming.snapshot.revision === previous.snapshot.revision &&
    Date.parse(incoming.snapshot.serverNow) < Date.parse(previous.snapshot.serverNow)
  )
    return previous;
  return incoming;
}

export function routineNow(received: ReceivedRoutine, monotonicNow: number): number {
  return Date.parse(received.snapshot.serverNow) + Math.max(0, monotonicNow - received.receivedAt);
}

export function routineExpired(snapshot: RoutineSnapshotV2, now: number): boolean {
  return (
    snapshot.period !== null &&
    (now >= Date.parse(snapshot.period.dailyEnd) || now >= Date.parse(snapshot.period.weeklyEnd))
  );
}
