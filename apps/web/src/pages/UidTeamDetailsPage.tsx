import '../styles/teams.css';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import TeamBuildEditor from '../components/TeamBuildEditor';
import TeamDamagePanel from '../components/TeamDamagePanel';
import { PageHeader } from '../components/Ui';
import { writeUidTeams } from '../lib/build-analysis/teams-storage';
import { uidTeamsKey, useUidTeams } from '../lib/build-analysis/use-teams';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';

export default function UidTeamDetailsPage() {
  const { uid, query } = useUidWorkspace();
  const { teamId } = useParams();
  const teams = useUidTeams(uid);
  const history = useObservedRoster(uid, query.data);
  const team = teams.data?.find((entry) => entry.id === teamId);
  const client = useQueryClient();
  const navigate = useNavigate();
  const deletion = useMutation({
    mutationFn: () => writeUidTeams(uid, [], teamId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: uidTeamsKey(uid) });
      navigate(`/u/${uid}/teams`);
    },
  });
  return (
    <main id="companion-content" tabIndex={-1} className="today-page teams-page team-details-page">
      <Link className="team-text-link" to={`/u/${uid}/teams`}>
        ← Back to teams
      </Link>
      <PageHeader
        eyebrow="YOUR TEAM, UP CLOSE"
        title={team?.name ?? 'Team details'}
        description="Your lineup, its builds, and the damage of your rotation."
      />
      {teams.isPending ? (
        <p role="status">Loading saved team…</p>
      ) : teams.isError ? (
        <p role="alert">Saved teams could not load. Existing records are preserved.</p>
      ) : !team ? (
        <section className="saved-teams-empty">
          <h2>This team is not saved in this browser.</h2>
          <p>
            Return to your teams and import its file, or create a lineup. Teams belong to the UID
            and browser where they were saved.
          </p>
        </section>
      ) : (
        <>
          <div className="saved-team-actions">
            <span>Saved for UID {uid} in this browser.</span>
            <Link
              className="button-secondary"
              to={`/u/${uid}/teams?copy=${encodeURIComponent(team.id)}`}
            >
              Duplicate to maker
            </Link>
            <button
              className="team-delete-action"
              type="button"
              disabled={deletion.isPending}
              onClick={() => deletion.mutate()}
            >
              Delete team
            </button>
          </div>
          {deletion.isError ? (
            <p role="alert" className="analysis-notice">
              Could not delete this team. Its saved record is preserved.
            </p>
          ) : null}
          <TeamDamagePanel
            key={`damage:${uid}:${team.id}`}
            uid={uid}
            team={team}
            records={history.records}
          />
          <TeamBuildEditor
            key={`builds:${uid}:${team.id}`}
            uid={uid}
            savedTeam={team}
            onSaved={() => {}}
          />
        </>
      )}
    </main>
  );
}
