export type HoyolabServer = 'os_asia' | 'os_usa' | 'os_euro' | 'os_cht';
export interface HoyolabRole {
  uid: string;
  server: HoyolabServer;
  nickname: string;
  level: number;
}
export interface HoyolabNotes {
  observedAt: string;
  resin: { current: number; max: number; fullInSeconds: number };
  commissions: { completed: number; total: number; rewardClaimed: boolean };
  expeditions: { finished: number; total: number };
  realmCurrency: { current: number; max: number } | null;
}
export interface HoyolabStatus {
  contractVersion: 1;
  available: boolean;
  connected: boolean;
  role: HoyolabRole | null;
  roles: HoyolabRole[];
  syncedAt: string | null;
  nextSyncAt: string | null;
  state:
    | 'not_configured'
    | 'disconnected'
    | 'choose_account'
    | 'ready'
    | 'syncing'
    | 'reconnect'
    | 'verification'
    | 'unavailable';
  notes: HoyolabNotes | null;
  notesState: 'ready' | 'unavailable';
}
export interface HoyolabConnectRequest {
  cookies: Record<string, string>;
  consent: true;
}
export interface HoyolabSelectRequest {
  uid: string;
  server: HoyolabServer;
}
