import { WishSandboxView } from '../components/simulators/WishSandboxView';

export default function SimulatorsPage() {
  return (
    <main id="companion-content" tabIndex={-1} className="space-y-6">
      <WishSandboxView />
    </main>
  );
}
