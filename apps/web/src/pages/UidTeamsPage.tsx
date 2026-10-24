import '../styles/teams.css';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import TeamBuildEditor from '../components/TeamBuildEditor';
import { ElementCrest, TeamPortrait } from '../components/TeamCharacterPicker';
import { PageHeader, UiIcon } from '../components/Ui';
import { roleLabels } from '../lib/build-analysis/explainer';
import {
  parseUidTeamFile,
  type SavedUidTeam,
  serializeUidTeams,
  writeUidTeams,
} from '../lib/build-analysis/teams-storage';
import { uidTeamsKey, useUidTeams } from '../lib/build-analysis/use-teams';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';

function TeamsWorkspace({ uid }: { uid: string }) {
  const { query } = useUidWorkspace();
  const history = useObservedRoster(uid, query.data);
  const teams = useUidTeams(uid);
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [makerVersion, setMakerVersion] = useState(0);
  const [copy, setCopy] = useState<SavedUidTeam | null>(null);
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const collection = useRef<HTMLElement>(null);
  const expandedId = params.get('team');
  const writable = !teams.isPending && !teams.isError;
  const mutation = useMutation({
    mutationFn: (action: { teams: SavedUidTeam[]; deleteId?: string; importFile?: boolean }) =>
      writeUidTeams(uid, action.teams, action.deleteId, action.importFile),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: uidTeamsKey(uid) });
      setMessage('Team changes saved in this browser.');
    },
    onError: (error) =>
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not save team changes. Existing records were preserved.',
      ),
  });
  function expand(id?: string) {
    const next = new URLSearchParams(params);
    if (id) next.set('team', id);
    else next.delete('team');
    setParams(next, { replace: true });
  }
  function exportTeams() {
    try {
      const url = URL.createObjectURL(
        new Blob([serializeUidTeams(uid, teams.data ?? [])], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `celestia-teams-${uid}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage('Could not create an export.');
    }
  }
  return (
    <main id="companion-content" tabIndex={-1} className="today-page teams-page">
      <PageHeader
        eyebrow="BETTER BUILDS, TOGETHER"
        title="Your teams"
        description="Build a lineup. Keep your favorites close."
      />
      <TeamBuildEditor
        key={`maker-${makerVersion}`}
        uid={uid}
        initialDraft={
          copy ? { name: `${copy.name.slice(0, 70)} (copy)`, slots: copy.members } : undefined
        }
        onSaved={(saved) => {
          setCopy(null);
          setMakerVersion((version) => version + 1);
          expand();
          setMessage('Team saved below. Your team maker is ready for another lineup.');
          collection.current?.scrollIntoView?.({ block: 'start' });
          window.setTimeout(
            () =>
              document
                .getElementById(`saved-team-open-${uid}-${saved.id}`)
                ?.focus({ preventScroll: true }),
            0,
          );
        }}
      />
      <section
        ref={collection}
        className="saved-team-collection"
        aria-labelledby="saved-teams-title"
      >
        <header className="saved-team-collection-heading">
          <div>
            <p className="eyebrow">YOUR LINEUPS</p>
            <h2 id="saved-teams-title">
              Saved teams <span>{teams.data?.length ?? 0}</span>
            </h2>
            <p>Open a team to see all four builds. Saved on this browser for UID {uid}.</p>
          </div>
          <div className="saved-team-file-actions">
            <button
              type="button"
              className="button-secondary"
              disabled={!writable || mutation.isPending}
              onClick={() => input.current?.click()}
            >
              Import
            </button>
            <button
              type="button"
              className="button-secondary"
              disabled={!teams.data?.length}
              onClick={exportTeams}
            >
              Export
            </button>
          </div>
        </header>
        <input
          ref={input}
          hidden
          type="file"
          aria-label="Import teams file"
          accept="application/json,.json"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (!file) return;
            try {
              if (file.size > 200_000) throw new Error('Team file exceeds 200 KB.');
              mutation.mutate({
                teams: parseUidTeamFile(uid, await file.text()),
                importFile: true,
              });
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Invalid team file.');
            }
          }}
        />
        <p role="status" className="analysis-message">
          {message}
        </p>
        {teams.isPending ? (
          <p role="status" className="analysis-muted">
            Loading saved teams…
          </p>
        ) : null}
        {teams.isError ? (
          <p role="alert" className="analysis-notice">
            Saved teams could not load. Existing records are preserved.
          </p>
        ) : null}
        {expandedId && !teams.isPending && !teams.data?.some((team) => team.id === expandedId) ? (
          <p role="status" className="analysis-notice">
            This team is not saved in this browser. Import its file or make a lineup above.
          </p>
        ) : null}
        {!teams.isPending && !teams.isError && !teams.data?.length ? (
          <div className="saved-teams-empty">
            <UiIcon name="characters" />
            <p>Your saved teams will appear here.</p>
            <span>Choose four characters above, then save your lineup.</span>
          </div>
        ) : null}
        <div className="saved-team-grid">
          {teams.data?.map((team) => {
            const expanded = expandedId === team.id;
            return (
              <article key={team.id} className={`saved-team-card ${expanded ? 'is-expanded' : ''}`}>
                <button
                  id={`saved-team-open-${uid}-${team.id}`}
                  type="button"
                  className="saved-team-summary"
                  aria-expanded={expanded}
                  aria-controls={`team-details-${team.id}`}
                  aria-label={`${expanded ? 'Collapse' : 'Open'} ${team.name}`}
                  onClick={() => expand(expanded ? undefined : team.id)}
                >
                  <span className="saved-team-title">
                    <strong>{team.name}</strong>
                    <span aria-hidden="true">{expanded ? '−' : '↗'}</span>
                  </span>
                  <span className="saved-team-portraits">
                    {team.members.map((member, slot) => {
                      const character = history.records.find(
                        (record) => record.character.key === member.characterKey,
                      )?.character;
                      return (
                        <span
                          key={member.characterKey}
                          className={`saved-team-portrait team-element-${character?.element ?? 'Unknown'}`}
                        >
                          {character ? (
                            <>
                              <TeamPortrait character={character} />
                              <ElementCrest element={character.element} />
                            </>
                          ) : (
                            <span className="saved-team-missing">?</span>
                          )}
                          <strong>{character?.name ?? `Member ${slot + 1}`}</strong>
                          <small>
                            {character
                              ? `Lv. ${character.level ?? '?'} · C${character.constellation}`
                              : 'Build unavailable'}
                          </small>
                        </span>
                      );
                    })}
                  </span>
                  <span className="saved-team-summary-footer">
                    <span>
                      {team.members.filter((member) => member.roleId !== 'unspecified').length}{' '}
                      roles selected
                    </span>
                    <span>{expanded ? 'Close details' : 'View all builds'}</span>
                  </span>
                </button>
                <div
                  id={`team-details-${team.id}`}
                  hidden={!expanded}
                  className="saved-team-details"
                >
                  {expanded ? (
                    <>
                      <div className="saved-team-actions">
                        <span>
                          {team.members
                            .map((member) => roleLabels[member.roleId])
                            .filter((role) => role !== roleLabels.unspecified)
                            .join(' · ') || 'Choose roles below to explore build guidance.'}
                        </span>
                        <button
                          type="button"
                          className="button-secondary"
                          disabled={!writable || mutation.isPending}
                          onClick={() => {
                            setCopy(team);
                            setMakerVersion((version) => version + 1);
                            document
                              .getElementById('companion-content')
                              ?.scrollIntoView?.({ block: 'start' });
                          }}
                        >
                          Duplicate to maker
                        </button>
                        <button
                          type="button"
                          className="team-delete-action"
                          disabled={!writable || mutation.isPending}
                          onClick={() =>
                            mutation.mutate(
                              { teams: [], deleteId: team.id },
                              { onSuccess: () => expand() },
                            )
                          }
                        >
                          Delete team
                        </button>
                      </div>
                      <TeamBuildEditor
                        key={team.id}
                        uid={uid}
                        savedTeam={team}
                        onSaved={() => setMessage(`${team.name} updated.`)}
                      />
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <footer className="team-coverage-note">
        <UiIcon name="insights" />
        <p>
          Tailored role guidance: Furina, Sucrose, Skirk and Xilonen. Other characters keep their
          observed builds and general checks.
        </p>
      </footer>
    </main>
  );
}
export default function UidTeamsPage() {
  const { uid } = useUidWorkspace();
  return <TeamsWorkspace key={uid} uid={uid} />;
}
