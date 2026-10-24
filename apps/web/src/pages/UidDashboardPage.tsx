import DashboardWelcome from '../components/DashboardWelcome';
import TodayDomains from '../components/TodayDomains';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';

export default function UidDashboardPage() {
  const { uid, query } = useUidWorkspace();
  const roster = useObservedRoster(uid, query.data);
  return (
    <main id="companion-content" tabIndex={-1} className="today-page space-y-7">
      <DashboardWelcome uid={uid} compact />
      <TodayDomains
        uid={uid}
        key={uid}
        characters={roster.records.map((record) => record.character)}
        rosterIssue={roster.issue}
      />
    </main>
  );
}
