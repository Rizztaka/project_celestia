import DashboardWelcome from '../components/DashboardWelcome';
import { useUidWorkspace } from '../lib/uid-workspace';

export default function UidDashboardPage() {
  const { uid } = useUidWorkspace();
  return (
    <main id="companion-content" tabIndex={-1} className="today-page space-y-7">
      <DashboardWelcome uid={uid} />
    </main>
  );
}
