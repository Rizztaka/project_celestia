import { createContext, useContext } from 'react';

import type { useShowcase } from './use-showcase';

export const UidWorkspaceContext = createContext<{
  uid: string;
  query: ReturnType<typeof useShowcase>;
} | null>(null);

export function useUidWorkspace() {
  const workspace = useContext(UidWorkspaceContext);
  if (!workspace) throw new Error('UID workspace is required.');
  return workspace;
}

export const uidCharacterPath = (uid: string, key: string) =>
  `/u/${uid}/character/${encodeURIComponent(key)}`;

export function uidNavigationActive(to: string, pathname: string, uid: string) {
  const base = `/u/${uid}`;
  if (to === base) return pathname === base || pathname === `${base}/`;
  if (to === `${base}/roster` && pathname.startsWith(`${base}/character/`)) return true;
  return pathname === to || pathname.startsWith(`${to}/`);
}
