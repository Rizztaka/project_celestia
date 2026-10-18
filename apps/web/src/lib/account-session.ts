import { useAuthStore } from '../stores/auth.store';

let generation = 0;
useAuthStore.subscribe((next, previous) => {
  if (
    next.sessionEpoch !== previous.sessionEpoch ||
    (next.token !== previous.token && next.tokenRotation === previous.tokenRotation)
  )
    generation += 1;
});
export interface AccountSession {
  token: string | null;
  generation: number;
}
export function captureSession(): AccountSession {
  return { token: useAuthStore.getState().token, generation };
}
export function isCurrentSession(session: AccountSession): boolean {
  return session.generation === generation;
}
export function assertCurrentSession(session: AccountSession): void {
  if (!isCurrentSession(session)) throw new Error('Session changed. This save was not replayed.');
}
