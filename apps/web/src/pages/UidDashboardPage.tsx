import { AccountSyncCard } from '../components/dashboard/AccountSyncCard';
import { CompanionSummaryGrid } from '../components/dashboard/CompanionSummaryGrid';
import { NextActionSummaryCard } from '../components/dashboard/NextActionSummaryCard';
import DashboardWelcome from '../components/DashboardWelcome';
import TodayDomains from '../components/TodayDomains';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useCompanionSummary } from '../lib/use-companion-summary';
import { useObservedRoster } from '../lib/use-observed-roster';

export default function UidDashboardPage() {
  const { uid, query } = useUidWorkspace();
  const roster = useObservedRoster(uid, query.data);
  const { summary, refetch, isFetching } = useCompanionSummary(uid);

  return (
    <main id="companion-content" tabIndex={-1} className="today-page space-y-7">
      <DashboardWelcome uid={uid} compact />
      <AccountSyncCard
        summary={summary}
        uid={uid}
        onRefresh={() => void refetch()}
        isRefreshing={isFetching}
      />
      {summary && (
        <div className="space-y-4">
          <NextActionSummaryCard
            summary={summary}
            onRefresh={() => void refetch()}
            isRefreshing={isFetching}
            uid={uid}
          />
          <CompanionSummaryGrid summary={summary} />
        </div>
      )}
      <TodayDomains
        uid={uid}
        key={uid}
        characters={roster.records.map((record) => record.character)}
        rosterIssue={roster.issue}
      />
    </main>
  );
}
