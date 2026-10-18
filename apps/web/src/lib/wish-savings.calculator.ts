const DAY_MS = 86_400_000;
export interface SavingsInput {
  today: string;
  targetDate: string;
  primogems: number;
  fates: number;
  pity: number;
  guaranteed: boolean;
  targetType: 'character' | 'weapon';
  commissions: boolean;
  welkin: boolean;
  battlePass: boolean;
  abyss: number;
  eventPrimogems: number;
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dateAfter(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Absorbing-state probability of obtaining the selected target at least once.
 * Character: simplified 50/50 then guaranteed; weapon: selected path, zero fate points.
 * Soft-pity ramps are planning approximations, shared with the simulator for characters.
 */
export function targetProbability(
  pulls: number,
  pity: number,
  guaranteed: boolean,
  weapon: boolean,
) {
  const hard = weapon ? 80 : 90;
  const base = weapon ? 0.007 : 0.006;
  const soft = weapon ? 63 : 74;
  const initialTargetRate = weapon ? (guaranteed ? 0.5 : 0.375) : guaranteed ? 1 : 0.5;
  let first = new Array<number>(hard).fill(0);
  let second = new Array<number>(hard).fill(0);
  first[Math.max(0, Math.min(hard - 1, pity))] = 1;
  let success = 0;
  for (let pull = 0; pull < Math.min(pulls, hard * 2); pull++) {
    const nextFirst = new Array<number>(hard).fill(0);
    const nextSecond = new Array<number>(hard).fill(0);
    for (let current = 0; current < hard; current++) {
      const next = current + 1;
      const rate =
        next >= hard
          ? 1
          : Math.min(1, base + Math.max(0, next - soft + 1) * (weapon ? 0.07 : 0.06));
      success += first[current] * rate * initialTargetRate + second[current] * rate;
      nextSecond[0] += first[current] * rate * (1 - initialTargetRate);
      if (next < hard) {
        nextFirst[next] += first[current] * (1 - rate);
        nextSecond[next] += second[current] * (1 - rate);
      }
    }
    first = nextFirst;
    second = nextSecond;
  }
  return Math.max(0, Math.min(1, success));
}

export function calculateSavings(input: SavingsInput) {
  const start = Date.parse(`${input.today}T00:00:00Z`);
  const end = Date.parse(`${input.targetDate}T00:00:00Z`);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    new Date(start).toISOString().slice(0, 10) !== input.today ||
    new Date(end).toISOString().slice(0, 10) !== input.targetDate ||
    end < start ||
    end - start > 3660 * DAY_MS
  )
    return null;
  const days = Math.floor((end - start) / DAY_MS);
  let resets = 0;
  for (let offset = 1; offset <= days; offset++) {
    const day = new Date(start + offset * DAY_MS).getUTCDate();
    if (day === 1 || day === 16) resets++;
  }
  const cycles = input.battlePass ? Math.floor(days / 40) : 0;
  const commissions = input.commissions ? days * 60 : 0;
  const welkin = input.welkin ? days * 90 : 0;
  const abyss = resets * input.abyss;
  const battlePass = cycles * 680;
  const earned = commissions + welkin + abyss + battlePass + input.eventPrimogems;
  const primogems = input.primogems + earned;
  const fates = input.fates + cycles * 4;
  const pulls = Math.floor(primogems / 160) + fates;
  const hard = input.targetType === 'weapon' ? 80 : 90;
  const pity = Math.max(0, Math.min(hard - 1, input.pity));
  const hardNeeded = hard - pity;
  const featuredNeeded =
    (input.targetType === 'character' && input.guaranteed ? hard : hard * 2) - pity;
  const softReached = pulls + pity >= (input.targetType === 'weapon' ? 65 : 75);
  return {
    days,
    resets,
    cycles,
    commissions,
    welkin,
    abyss,
    battlePass,
    earned,
    primogems,
    fates,
    pulls,
    leftoverPrimogems: primogems % 160,
    hardNeeded,
    featuredNeeded,
    softReached,
    hardGuaranteed: pulls >= hardNeeded,
    featuredGuaranteed: pulls >= featuredNeeded,
    probability: targetProbability(pulls, pity, input.guaranteed, input.targetType === 'weapon'),
  };
}
