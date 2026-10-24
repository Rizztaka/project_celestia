import '../styles/teams.css';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AccessibleTabs, TabPanel } from '../components/AccessibleTabs';
import { BuildAnalysisFindings } from '../components/BuildAnalysisFindings';
import TeamCharacterPicker, { ElementCrest, TeamPortrait } from '../components/TeamCharacterPicker';
import TeamComparison from '../components/TeamComparison';
import TeamMemberBuild from '../components/TeamMemberBuild';
import { PageHeader, UiIcon } from '../components/Ui';
import { roleOptions } from '../lib/build-analysis/character.calculator';
import { roleLabels } from '../lib/build-analysis/explainer';
import { formIdentity } from '../lib/build-analysis/identity';
import { normalizeObservation } from '../lib/build-analysis/snapshot';
import type { MemberSelection } from '../lib/build-analysis/team.calculator';
import { analyzeTeam, teamContext } from '../lib/build-analysis/team.calculator';
import type { SavedUidTeam } from '../lib/build-analysis/teams-storage';
import {
  parseUidTeamFile,
  serializeUidTeams,
  writeUidTeams,
} from '../lib/build-analysis/teams-storage';
import { RULE_PACK_VERSION } from '../lib/build-analysis/types';
import { uidTeamsKey, useUidTeams } from '../lib/build-analysis/use-teams';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';

interface Draft {
  id?: string;
  name: string;
  slots: (MemberSelection | null)[];
}
const blankDraft = (): Draft => ({ name: 'Untitled team', slots: [null, null, null, null] });
function TeamsWorkspace({ uid }: { uid: string }) {
  const { query } = useUidWorkspace();
  const history = useObservedRoster(uid, query.data);
  const teams = useUidTeams(uid);
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState('');
  const [view, setView] = useState('overview');
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const closePicker = useCallback(() => setPickerSlot(null), []);
  const selected = teams.data?.find((t) => t.id === params.get('team'));
  const current =
    draft ??
    (selected
      ? { id: selected.id, name: selected.name, slots: [...selected.members] }
      : blankDraft());
  const members = current.slots.filter((m): m is MemberSelection => !!m);
  const normalized = useMemo(() => history.records.map(normalizeObservation), [history.records]);
  const analysis = analyzeTeam(uid, members, normalized);
  const context = teamContext(uid, members, normalized);
  const subjects = Object.fromEntries(normalized.map((r) => [r.key, r.name]));
  const savedContextMatches =
    selected?.id === current.id && JSON.stringify(selected?.members) === JSON.stringify(members);
  const dirty =
    !!draft &&
    JSON.stringify({ name: current.name, members }) !==
      JSON.stringify({ name: selected?.name, members: selected?.members });
  const mutation = useMutation({
    mutationFn: async (action: {
      teams: SavedUidTeam[];
      deleteId?: string;
      importFile?: boolean;
    }) => writeUidTeams(uid, action.teams, action.deleteId, action.importFile),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: uidTeamsKey(uid) });
      setMessage('Team changes saved in this browser.');
    },
    onError: (error) =>
      setMessage(
        error instanceof Error ? error.message : 'Could not save. Existing teams were preserved.',
      ),
  });
  function update(next: Partial<Draft>) {
    setDraft({ ...current, ...next });
    setMessage('');
  }
  function openTeam(team?: SavedUidTeam) {
    const next = new URLSearchParams(params);
    if (team) next.set('team', team.id);
    else next.delete('team');
    setParams(next);
    setDraft(null);
    setView('overview');
    setMessage('');
  }
  const writable = !teams.isError && !teams.isPending && !mutation.isPending;
  function save() {
    const id = current.id ?? crypto.randomUUID();
    mutation.mutate(
      { teams: [{ version: 1, uid, id, name: current.name.trim(), members }] },
      {
        onSuccess: () => {
          setDraft(null);
          const next = new URLSearchParams(params);
          next.set('team', id);
          setParams(next);
        },
      },
    );
  }
  const activeSlot = view.startsWith('member-') ? Number(view.slice(7)) : null;
  const slotMember = activeSlot === null ? null : current.slots[activeSlot];
  const activeObservation = history.records.find(
    (r) => r.character.key === slotMember?.characterKey,
  );
  const activeAnalysis = analysis.members.find(
    (m) => m.characterKey === slotMember?.characterKey,
  )?.analysis;
  const activeNormalized = normalized.find((r) => r.key === slotMember?.characterKey);
  const activeView = activeSlot !== null && !slotMember ? 'overview' : view;
  const tabs = [
    { id: 'overview', label: 'Team overview' },
    ...current.slots.flatMap((m, i) =>
      m ? [{ id: `member-${i}`, label: subjects[m.characterKey] ?? `Member ${i + 1}` }] : [],
    ),
    { id: 'compare', label: 'Compare' },
  ];
  const elements = [...new Set(context.members.flatMap((m) => (m.element ? [m.element] : [])))];
  return (
    <main id="companion-content" tabIndex={-1} className="today-page teams-page">
      <PageHeader
        eyebrow="BETTER BUILDS, TOGETHER"
        title="Your teams"
        description="A place for every character. A purpose for every build."
        actions={
          <button type="button" className="button-secondary" onClick={() => openTeam()}>
            <span aria-hidden="true">＋</span> New team
          </button>
        }
      />
      <div className="team-library-bar">
        <div className="team-library-control">
          <UiIcon name="characters" />
          <label>
            <span className="sr-only">Saved team</span>
            <select
              value={current.id ?? ''}
              onChange={(e) => openTeam(teams.data?.find((t) => t.id === e.target.value))}
            >
              <option value="">New team</option>
              {teams.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <span className="team-library-count">{teams.data?.length ?? 0} saved</span>
        </div>
        <div className="team-library-right">
          <span className="team-local-badge">
            <span aria-hidden="true" /> UID {uid} · on this browser
          </span>
          <details
            className="team-manage-menu"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.currentTarget.open = false;
                event.currentTarget.querySelector('summary')?.focus();
              }
            }}
          >
            <summary aria-label="Manage teams">•••</summary>
            <div
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('button')) {
                  const menu = event.currentTarget.closest('details');
                  if (menu) menu.open = false;
                }
              }}
            >
              <button
                type="button"
                disabled={!writable}
                onClick={() => importInput.current?.click()}
              >
                Import teams
              </button>
              <button
                type="button"
                disabled={!teams.data?.length}
                onClick={() => {
                  try {
                    const url = URL.createObjectURL(
                      new Blob([serializeUidTeams(uid, teams.data ?? [])], {
                        type: 'application/json',
                      }),
                    );
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `celestia-teams-${uid}.json`;
                    a.click();
                    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                  } catch {
                    setMessage('Could not create an export.');
                  }
                }}
              >
                Export teams
              </button>
              <button
                type="button"
                disabled={!current.id || !writable}
                onClick={() =>
                  update({ id: undefined, name: `${current.name.slice(0, 70)} (copy)` })
                }
              >
                Duplicate as draft
              </button>
              <button
                type="button"
                className="team-delete-action"
                disabled={!current.id || !writable}
                onClick={() =>
                  mutation.mutate(
                    { teams: [], deleteId: current.id },
                    { onSuccess: () => openTeam() },
                  )
                }
              >
                Delete team
              </button>
            </div>
          </details>
        </div>
        <input
          ref={importInput}
          hidden
          type="file"
          aria-label="Import teams file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (!file) return;
            try {
              if (file.size > 200_000) throw new Error('Team file exceeds 200 KB.');
              const imported = parseUidTeamFile(uid, await file.text());
              mutation.mutate({ teams: imported, importFile: true });
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Invalid team file.');
            }
          }}
        />
      </div>
      {teams.isPending ? (
        <p role="status" className="analysis-muted">
          Loading saved teams…
        </p>
      ) : null}
      {teams.isError ? (
        <p role="alert" className="analysis-notice">
          Saved teams could not load. Your records are preserved; you can still explore a draft.
        </p>
      ) : null}
      {history.issue ? (
        <p role="alert" className="analysis-notice">
          {history.issue}
        </p>
      ) : null}
      {params.get('team') && !selected && !teams.isPending ? (
        <p role="status" className="analysis-notice">
          This team is not saved in this browser. Import its file or start a new lineup.
        </p>
      ) : null}
      <section className="team-editor" aria-label="Team draft">
        <header className="team-editor-header">
          <div>
            <label className="team-title-field">
              <span className="sr-only">Team name</span>
              <input
                maxLength={80}
                value={current.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Name your team"
              />
            </label>
            <p>
              {dirty ? 'Unsaved changes' : current.id ? 'Saved lineup' : 'New lineup'}{' '}
              <span aria-hidden="true">·</span> {members.length} of 4 members
            </p>
          </div>
          <button
            type="button"
            className="button-primary team-save-button"
            disabled={!writable || members.length !== 4 || !current.name.trim()}
            onClick={save}
          >
            {mutation.isPending ? 'Saving…' : current.id ? 'Save changes' : 'Save team'}
            <UiIcon name="arrow" />
          </button>
        </header>
        <div className="team-slot-grid">
          {current.slots.map((member, slot) => {
            const c = history.records.find(
              (r) => r.character.key === member?.characterKey,
            )?.character;
            return (
              <article
                key={slot}
                className={`team-slot ${member ? 'team-slot-filled' : 'team-slot-empty'} ${activeView === `member-${slot}` ? 'is-selected' : ''} team-element-${c?.element ?? 'Unknown'}`}
              >
                <button
                  type="button"
                  className="team-slot-focus"
                  aria-label={
                    member ? `Edit ${c?.name ?? `member ${slot + 1}`}` : `Add member ${slot + 1}`
                  }
                  onClick={() => (member ? setView(`member-${slot}`) : setPickerSlot(slot))}
                >
                  <span className="team-slot-number">0{slot + 1}</span>
                  {c ? (
                    <>
                      <ElementCrest element={c.element} />
                      <div className="team-slot-portrait">
                        <TeamPortrait key={c.portrait} character={c} />
                      </div>
                      <div className="team-slot-copy">
                        <p>
                          {c.element ?? 'Unknown element'} <span>Lv. {c.level ?? '?'}</span>
                        </p>
                        <h2>{c.name}</h2>
                        <small>
                          {member?.roleId === 'unspecified'
                            ? roleOptions(c).length
                              ? 'Set a build role'
                              : 'General build checks'
                            : roleLabels[member!.roleId]}
                        </small>
                      </div>
                      <span className="team-slot-constellation">C{c.constellation}</span>
                    </>
                  ) : member ? (
                    <>
                      <span className="team-slot-plus" aria-hidden="true">
                        ?
                      </span>
                      <div className="team-slot-copy">
                        <h2>Build unavailable</h2>
                        <small>Membership preserved</small>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="team-slot-plus" aria-hidden="true">
                        ＋
                      </span>
                      <div className="team-slot-copy">
                        <h2>Add character</h2>
                        <small>Choose from your roster</small>
                      </div>
                    </>
                  )}
                </button>
                {member ? (
                  <button
                    type="button"
                    className="team-slot-remove"
                    aria-label={`Remove ${c?.name ?? `member ${slot + 1}`}`}
                    onClick={() => {
                      const next = [...current.slots];
                      next[slot] = null;
                      update({ slots: next });
                      setView('overview');
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
        <footer className="team-lineup-footer">
          <div>
            {elements.length ? (
              elements.map((e) => (
                <span key={e}>
                  <ElementCrest element={e} />
                  {e}
                </span>
              ))
            ) : (
              <span>Four slots. Your next team starts here.</span>
            )}
          </div>
          <span>
            {analysis.mixedObservationTimes ? 'Mixed observation times' : 'Latest observed builds'}
          </span>
        </footer>
      </section>
      <p role="status" className="analysis-message team-save-message">
        {message}
      </p>
      <div className="team-workspace-tabs">
        <AccessibleTabs
          label="Team workspace"
          prefix="team-workspace"
          tabs={tabs}
          active={activeView}
          onChange={setView}
        />
      </div>
      <section className="team-workspace-content">
        {current.slots.map((member, slot) =>
          member && slot !== activeSlot ? (
            <TabPanel
              key={slot}
              prefix="team-workspace"
              id={`member-${slot}`}
              active={activeView}
            />
          ) : null,
        )}
        <TabPanel prefix="team-workspace" id="overview" active={activeView}>
          {!members.length ? (
            <div className="team-overview-empty">
              <div className="team-empty-mark">
                <UiIcon name="characters" />
              </div>
              <p className="eyebrow">EVERY TEAM STARTS WITH ONE</p>
              <h2>Bring your characters together.</h2>
              <p>
                Choose your first member above. Then explore how their builds fit, which roles they
                fill, and what to work on next.
              </p>
              <button type="button" className="button-secondary" onClick={() => setPickerSlot(0)}>
                Choose first character <UiIcon name="arrow" />
              </button>
            </div>
          ) : (
            <>
              <header className="team-section-intro">
                <div>
                  <p className="eyebrow">THE BIG PICTURE</p>
                  <h2>How your team fits together.</h2>
                  <p>
                    {members.length < 4
                      ? 'This lineup is still taking shape. Unfilled slots keep team conditions unresolved.'
                      : 'Your recorded builds, viewed together. Combat triggers and rotation choices remain conditional.'}
                  </p>
                </div>
                <div className="team-overview-count">
                  <strong>
                    {analysis.members.filter((m) => m.analysis.coverage.roleSupported).length}
                    <span> / {members.length}</span>
                  </strong>
                  <small>roles assessed</small>
                </div>
              </header>
              {analysis.mixedObservationTimes ? (
                <p className="analysis-notice">
                  These builds were observed at different times; this is not a simultaneous in-game
                  snapshot.
                </p>
              ) : null}
              {analysis.missingMembers.length ? (
                <p role="status" className="analysis-notice">
                  {analysis.missingMembers.length} member build(s) are unavailable. Other members
                  can still be checked.
                </p>
              ) : null}
              <div className="team-overview-columns">
                <section>
                  <div className="team-subheading">
                    <h3>Worth a closer look</h3>
                    <span>{analysis.actions.length} next steps</span>
                  </div>
                  <BuildAnalysisFindings
                    findings={analysis.actions.slice(0, 4)}
                    subjects={subjects}
                    empty="No supported change identified. Open a member and choose their role to look closer."
                  />
                  {analysis.actions.length > 4 ? (
                    <details className="analysis-disclosure">
                      <summary>{analysis.actions.length - 4} more next steps</summary>
                      <BuildAnalysisFindings
                        findings={analysis.actions.slice(4)}
                        subjects={subjects}
                      />
                    </details>
                  ) : null}
                </section>
                <section>
                  <div className="team-subheading">
                    <h3>Team interactions</h3>
                    <span>Conditional checks</span>
                  </div>
                  <BuildAnalysisFindings
                    findings={analysis.teamFindings}
                    subjects={subjects}
                    empty="Team interactions appear here when selected roles have reviewed rules. Elemental presence alone does not prove synergy."
                  />
                </section>
              </div>
            </>
          )}
        </TabPanel>
        {activeSlot !== null && slotMember ? (
          <TabPanel prefix="team-workspace" id={`member-${activeSlot}`} active={activeView}>
            {activeObservation && activeAnalysis && activeNormalized ? (
              <TeamMemberBuild
                uid={uid}
                character={activeObservation.character}
                roleId={slotMember.roleId}
                observedAt={activeObservation.observedAt}
                analysis={activeAnalysis}
                input={{
                  rulePackVersion: RULE_PACK_VERSION,
                  uid,
                  character: activeNormalized,
                  roleId: slotMember.roleId,
                  team: context,
                  hypothesis: null,
                }}
                teamId={savedContextMatches ? current.id : undefined}
                onRole={(roleId) => {
                  const slots = [...current.slots];
                  slots[activeSlot] = { ...slotMember, roleId };
                  update({ slots });
                }}
                onReplace={() => setPickerSlot(activeSlot)}
              />
            ) : (
              <div className="team-overview-empty">
                <h2>This build is unavailable.</h2>
                <p>
                  The saved membership is preserved. Choose another observed character to continue.
                </p>
                <button className="button-secondary" onClick={() => setPickerSlot(activeSlot)}>
                  Replace character
                </button>
              </div>
            )}
          </TabPanel>
        ) : null}
        <TabPanel prefix="team-workspace" id="compare" active={activeView}>
          <header className="team-section-intro">
            <div>
              <p className="eyebrow">EXPLORE AN ALTERNATIVE</p>
              <h2>One change. A clearer picture.</h2>
              <p>
                Compare another observed teammate with the same recorded builds. Your saved lineup
                stays untouched.
              </p>
            </div>
          </header>
          {members.length ? (
            <TeamComparison key={context.id} uid={uid} members={members} records={normalized} />
          ) : (
            <p className="analysis-muted">Add a character before comparing teammates.</p>
          )}
        </TabPanel>
      </section>
      <footer className="team-coverage-note">
        <UiIcon name="insights" />
        <p>
          Tailored role guidance: Furina, Sucrose, Skirk and Xilonen. Other characters keep their
          observed builds and generic checks.{' '}
          <span>Teams and retained observations are saved on this browser.</span>
        </p>
      </footer>
      {pickerSlot !== null ? (
        <TeamCharacterPicker
          slot={pickerSlot}
          characters={history.records.map((r) => r.character)}
          excludedForms={current.slots.flatMap((m, i) =>
            m && i !== pickerSlot
              ? [formIdentity({ avatarId: Number(m.characterKey.split(':')[0]) })]
              : [],
          )}
          onClose={closePicker}
          onSelect={(c) => {
            const slots = [...current.slots];
            slots[pickerSlot] = { characterKey: c.key, roleId: 'unspecified' };
            update({ slots });
            setView(`member-${pickerSlot}`);
            closePicker();
          }}
        />
      ) : null}
    </main>
  );
}
export default function UidTeamsPage() {
  const { uid } = useUidWorkspace();
  return <TeamsWorkspace key={uid} uid={uid} />;
}
