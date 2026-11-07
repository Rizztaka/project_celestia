import { AccountValuePullsView } from '../components/pulls/AccountValuePullsView';
import { useUidWorkspace } from '../lib/uid-workspace';

export default function UidPullsPage() {
  const { uid } = useUidWorkspace();
  return (
    <main id="companion-content" tabIndex={-1} className="space-y-6">
      <AccountValuePullsView uid={uid} />
    </main>
  );
}
