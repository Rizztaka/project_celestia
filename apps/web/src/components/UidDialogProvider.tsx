import '../styles/uid-showcase.css';

import { lazy, type ReactNode, Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { UidDialogContext } from '../lib/uid-dialog';

const UidDialog = lazy(() =>
  import('./UidDialog').then((module) => ({ default: module.UidDialog })),
);

export default function UidDialogProvider({ children }: { children: ReactNode }) {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const params = new URLSearchParams(search);
  const requested = params.get('switch') === '1' || params.has('add');
  const close = () => {
    setOpen(false);
    if (requested) {
      params.delete('switch');
      params.delete('add');
      navigate({ pathname, search: params.toString() }, { replace: true });
    }
  };
  return (
    <UidDialogContext value={() => setOpen(true)}>
      {children}
      {open || requested ? (
        <Suspense
          fallback={
            <p role="status" className="uid-dialog-loading">
              Opening UID search…
            </p>
          }
        >
          <UidDialog onClose={close} />
        </Suspense>
      ) : null}
    </UidDialogContext>
  );
}
