import { WishSandboxView } from '../components/simulators/WishSandboxView';
import { useUidWorkspace } from '../lib/uid-workspace';

export default function UidSimulatorsPage() {
  const { uid } = useUidWorkspace();
  return (
    <main id="companion-content" tabIndex={-1} className="space-y-6">
      <WishSandboxView uid={uid} />
    </main>
  );
}
