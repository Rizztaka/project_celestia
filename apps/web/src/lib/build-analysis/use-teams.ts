import { useQuery } from '@tanstack/react-query';

import { readUidTeams } from './teams-storage';
export const uidTeamsKey = (uid: string) => ['public-teams', uid] as const;
export function useUidTeams(uid: string) {
  return useQuery({
    queryKey: uidTeamsKey(uid),
    queryFn: () => readUidTeams(uid),
    retry: false,
    staleTime: Infinity,
  });
}
