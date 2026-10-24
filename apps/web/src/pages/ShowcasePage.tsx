import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import DashboardWelcome from '../components/DashboardWelcome';
import { readShowcaseUid } from '../lib/showcase';
import { useUidDialog } from '../lib/uid-dialog';

export default function ShowcasePage() {
  const [saved] = useState(readShowcaseUid);
  const [params] = useSearchParams();
  const openUidDialog = useUidDialog();
  if (saved)
    return (
      <Navigate to={`/u/${saved}${params.get('switch') === '1' ? '?switch=1' : ''}`} replace />
    );
  return (
    <main id="companion-content" tabIndex={-1} className="today-page space-y-7">
      <DashboardWelcome onAddUid={openUidDialog} />
      <p className="text-sm leading-relaxed text-zinc-500">
        No sign-in or registration needed. Add your Genshin UID to explore publicly showcased
        characters and equipped builds.
      </p>
    </main>
  );
}
