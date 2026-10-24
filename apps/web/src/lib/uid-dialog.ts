import { createContext, useContext } from 'react';

export const UidDialogContext = createContext<(() => void) | null>(null);

export function useUidDialog() {
  const open = useContext(UidDialogContext);
  if (!open) throw new Error('UID dialog provider is required.');
  return open;
}
