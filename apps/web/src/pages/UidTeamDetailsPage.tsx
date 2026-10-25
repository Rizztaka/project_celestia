import '../styles/teams.css';
import '../styles/team-workspace.css';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AccessibleTabs } from '../components/AccessibleTabs';
import TeamBuildEditor from '../components/TeamBuildEditor';
import { TeamPortrait } from '../components/TeamCharacterPicker';
import TeamDamagePanel from '../components/TeamDamagePanel';
import { PageHeader, UiIcon } from '../components/Ui';
import { type SavedUidTeam, writeUidTeams } from '../lib/build-analysis/teams-storage';
import { uidTeamsKey, useUidTeams } from '../lib/build-analysis/use-teams';
import type { CharacterObservation } from '../lib/observed-roster';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';

function TeamWorkspace({ team, records }: { team: SavedUidTeam; records: CharacterObservation[] }) {
  const [view, setView] = useState('builds');
  const client = useQueryClient();
  const navigate = useNavigate();
  const prefix = `team-page-${team.uid}-${team.id}`;
  const characters = team.members.map(
    (member) =>
      records.find(
        (record) => record.uid === team.uid && record.character.key === member.characterKey,
      )?.character,
  );
  const deletion = useMutation({
    mutationFn: () => writeUidTeams(team.uid, [], team.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: uidTeamsKey(team.uid) });
      navigate(`/u/${team.uid}/teams`);
    },
  });
  return (
    <>
      <div className="team-workspace-topline">
        <Link className="team-text-link" to={`/u/${team.uid}/teams`}>
          ← Back to teams
        </Link>
        <details className="team-options-menu">
          <summary>
            Team options <span aria-hidden="true">···</span>
          </summary>
          <div>
            <Link to={`/u/${team.uid}/teams?copy=${encodeURIComponent(team.id)}`}>
              Duplicate to maker
            </Link>
            <button type="button" disabled={deletion.isPending} onClick={() => deletion.mutate()}>
              Delete team
            </button>
          </div>
        </details>
      </div>
      <section className="team-workspace-hero" aria-label="Team summary">
        <div>
          <PageHeader
            eyebrow="TEAM WORKSPACE"
            title={team.name}
            description="A clearer view of your lineup. A better way to build together."
          />
          <div className="team-hero-meta">
            <span>
              <i /> Saved on this browser
            </span>
            <span>UID {team.uid}</span>
            <span>{team.members.length} characters</span>
          </div>
        </div>
        <div className="team-hero-roster" aria-label="Saved lineup">
          <div>
            {characters.map((character, index) =>
              character ? (
                <TeamPortrait key={team.members[index].characterKey} character={character} />
              ) : (
                <span key={index}>?</span>
              ),
            )}
          </div>
          <p>
            {characters
              .map((character, index) => character?.name ?? `Member ${index + 1}`)
              .join(' · ')}
          </p>
        </div>
      </section>
      {deletion.isError ? (
        <p role="alert" className="analysis-notice">
          Could not delete this team. Its saved record is preserved.
        </p>
      ) : null}
      <nav className="team-primary-tabs" aria-label="Team sections">
        <AccessibleTabs
          label="Team page"
          prefix={prefix}
          active={view}
          onChange={setView}
          tabs={[
            {
              id: 'builds',
              label: (
                <>
                  <UiIcon name="characters" />
                  <span>Lineup & builds</span>
                </>
              ),
            },
            {
              id: 'damage',
              label: (
                <>
                  <UiIcon name="insights" />
                  <span>Damage lab</span>
                </>
              ),
            },
          ]}
        />
        <span className="team-tab-hint">Your team, at your pace.</span>
      </nav>
      {/* Keep both editors mounted: navigation must not discard drafts, results or a running job. */}
      <section
        role="tabpanel"
        id={`${prefix}-panel-builds`}
        aria-labelledby={`${prefix}-tab-builds`}
        hidden={view !== 'builds'}
        tabIndex={0}
      >
        <TeamBuildEditor
          uid={team.uid}
          savedTeam={team}
          presentation="workspace"
          onSaved={() => {}}
        />
      </section>
      <section
        role="tabpanel"
        id={`${prefix}-panel-damage`}
        aria-labelledby={`${prefix}-tab-damage`}
        hidden={view !== 'damage'}
        tabIndex={0}
      >
        <TeamDamagePanel uid={team.uid} team={team} records={records} />
      </section>
    </>
  );
}

export default function UidTeamDetailsPage() {
  const { uid, query } = useUidWorkspace();
  const { teamId } = useParams();
  const teams = useUidTeams(uid);
  const history = useObservedRoster(uid, query.data);
  const team = teams.data?.find((entry) => entry.id === teamId);
  return (
    <main id="companion-content" tabIndex={-1} className="today-page teams-page team-details-page">
      {team ? (
        <TeamWorkspace key={`${uid}:${team.id}`} team={team} records={history.records} />
      ) : (
        <>
          <Link className="team-text-link" to={`/u/${uid}/teams`}>
            ← Back to teams
          </Link>
          <PageHeader eyebrow="YOUR LINEUPS" title="Team details" />
          {teams.isPending ? (
            <p role="status">Loading saved team…</p>
          ) : teams.isError ? (
            <p role="alert">Saved teams could not load. Existing records are preserved.</p>
          ) : (
            <section className="saved-teams-empty">
              <h2>This team is not saved in this browser.</h2>
              <p>
                Return to your teams and import its file, or create a lineup. Teams belong to the
                UID and browser where they were saved.
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
