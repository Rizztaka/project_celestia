import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { roleOptions } from '../lib/build-analysis/character.calculator';
import { roleLabels } from '../lib/build-analysis/explainer';
import { formIdentity } from '../lib/build-analysis/identity';
import { normalizeObservation } from '../lib/build-analysis/snapshot';
import type { MemberSelection } from '../lib/build-analysis/team.calculator';
import { analyzeTeam, teamContext } from '../lib/build-analysis/team.calculator';
import type { SavedUidTeam } from '../lib/build-analysis/teams-storage';
import { writeUidTeams } from '../lib/build-analysis/teams-storage';
import { RULE_PACK_VERSION } from '../lib/build-analysis/types';
import { uidTeamsKey, useUidTeams } from '../lib/build-analysis/use-teams';
import { useUidWorkspace } from '../lib/uid-workspace';
import { useObservedRoster } from '../lib/use-observed-roster';
import { AccessibleTabs, TabPanel } from './AccessibleTabs';
import { BuildAnalysisFindings } from './BuildAnalysisFindings';
import TeamCharacterPicker, { ElementCrest, TeamPortrait } from './TeamCharacterPicker';
import TeamComparison from './TeamComparison';
import TeamMemberBuild from './TeamMemberBuild';
import { UiIcon } from './Ui';

interface Draft {
  id?: string;
  name: string;
  slots: (MemberSelection | null)[];
}
const blankDraft = (): Draft => ({ name: 'Untitled team', slots: [null, null, null, null] });
export default function TeamBuildEditor({
  uid,
  savedTeam,
  initialDraft,
  presentation = 'default',
  onSaved,
}: {
  uid: string;
  savedTeam?: SavedUidTeam;
  initialDraft?: Draft;
  presentation?: 'default' | 'workspace';
  onSaved: (team: SavedUidTeam) => void;
}) {
  const { query } = useUidWorkspace();
  const history = useObservedRoster(uid, query.data);
  const teams = useUidTeams(uid);
  const client = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(initialDraft ?? null);
  const [message, setMessage] = useState('');
  const [view, setView] = useState(savedTeam ? 'members' : 'overview');
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const closePicker = useCallback(() => setPickerSlot(null), []);
  const selected = savedTeam;
  const prefix = savedTeam ? `saved-team-${savedTeam.id}` : 'team-maker';
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
  const writable = !teams.isError && !teams.isPending && !mutation.isPending;
  function save() {
    const id = current.id ?? crypto.randomUUID();
    mutation.mutate(
      { teams: [{ version: 1, uid, id, name: current.name.trim(), members }] },
      {
        onSuccess: () => {
          setDraft(null);
          onSaved({ version: 1, uid, id, name: current.name.trim(), members });
        },
      },
    );
  }
  const activeSlot = view.startsWith('member-') ? Number(view.slice(7)) : null;
  const slotMember = activeSlot === null ? null : current.slots[activeSlot];
  const activeView = activeSlot !== null && !slotMember ? 'overview' : view;
  const tabs = [
    ...(savedTeam ? [{ id: 'members', label: 'All members' }] : []),
    { id: 'overview', label: 'Team overview' },
    ...current.slots.flatMap((m, i) =>
      m ? [{ id: `member-${i}`, label: subjects[m.characterKey] ?? `Member ${i + 1}` }] : [],
    ),
    { id: 'compare', label: 'Compare' },
  ];
  const elements = [...new Set(context.members.flatMap((m) => (m.element ? [m.element] : [])))];
  function renderMember(slot: number) {
    const member = current.slots[slot];
    if (!member) return null;
    const observation = history.records.find((r) => r.character.key === member.characterKey);
    const memberAnalysis = analysis.members.find(
      (m) => m.characterKey === member.characterKey,
    )?.analysis;
    const record = normalized.find((r) => r.key === member.characterKey);
    return observation && memberAnalysis && record ? (
      <TeamMemberBuild
        uid={uid}
        character={observation.character}
        roleId={member.roleId}
        observedAt={observation.observedAt}
        analysis={memberAnalysis}
        input={{
          rulePackVersion: RULE_PACK_VERSION,
          uid,
          character: record,
          roleId: member.roleId,
          team: context,
          hypothesis: null,
        }}
        teamId={savedContextMatches ? current.id : undefined}
        compact={presentation === 'workspace' && activeView === 'members'}
        onRole={(roleId) => {
          const slots = [...current.slots];
          slots[slot] = { ...member, roleId };
          update({ slots });
        }}
        onReplace={() => setPickerSlot(slot)}
      />
    ) : (
      <div className="team-overview-empty">
        <h2>This build is unavailable.</h2>
        <p>The saved membership is preserved. Choose another observed character to continue.</p>
        <button className="button-secondary" onClick={() => setPickerSlot(slot)}>
          Replace character
        </button>
      </div>
    );
  }
  return (
    <section
      className={`team-build-editor ${presentation === 'workspace' ? 'team-build-editor-workspace' : ''}`}
      aria-label={savedTeam ? `Edit ${savedTeam.name}` : 'Team maker'}
    >
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
      <section className="team-editor" aria-label="Team draft">
        <header className="team-editor-header">
          <div>
            {presentation === 'workspace' ? (
              <span className="team-editor-label">YOUR LINEUP</span>
            ) : null}
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
            disabled={
              !writable || members.length !== 4 || !current.name.trim() || (!!savedTeam && !dirty)
            }
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
      {members.length ? (
        <>
          <div className="team-workspace-tabs">
            <AccessibleTabs
              label="Team workspace"
              prefix={prefix}
              tabs={tabs}
              active={activeView}
              onChange={setView}
            />
          </div>
          <section className="team-workspace-content">
            {current.slots.map((member, slot) =>
              member && slot !== activeSlot ? (
                <TabPanel key={slot} prefix={prefix} id={`member-${slot}`} active={activeView} />
              ) : null,
            )}
            {savedTeam ? (
              <TabPanel prefix={prefix} id="members" active={activeView}>
                <div className="saved-team-build-grid">
                  {current.slots.map((member, slot) =>
                    member ? (
                      <section
                        key={slot}
                        className="saved-member-build"
                        aria-label={`Build for ${subjects[member.characterKey] ?? `member ${slot + 1}`}`}
                      >
                        {renderMember(slot)}
                      </section>
                    ) : null,
                  )}
                </div>
              </TabPanel>
            ) : null}
            <TabPanel prefix={prefix} id="overview" active={activeView}>
              {!members.length ? (
                <div className="team-overview-empty">
                  <div className="team-empty-mark">
                    <UiIcon name="characters" />
                  </div>
                  <p className="eyebrow">EVERY TEAM STARTS WITH ONE</p>
                  <h2>Bring your characters together.</h2>
                  <p>
                    Choose your first member above. Then explore how their builds fit, which roles
                    they fill, and what to work on next.
                  </p>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setPickerSlot(0)}
                  >
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
                      These builds were observed at different times; this is not a simultaneous
                      in-game snapshot.
                    </p>
                  ) : null}
                  {analysis.missingMembers.length ? (
                    <p role="status" className="analysis-notice">
                      {analysis.missingMembers.length} member build(s) are unavailable. Other
                      members can still be checked.
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
              <TabPanel prefix={prefix} id={`member-${activeSlot}`} active={activeView}>
                {renderMember(activeSlot)}
              </TabPanel>
            ) : null}
            <TabPanel prefix={prefix} id="compare" active={activeView}>
              <header className="team-section-intro">
                <div>
                  <p className="eyebrow">EXPLORE AN ALTERNATIVE</p>
                  <h2>One change. A clearer picture.</h2>
                  <p>
                    Compare another observed teammate with the same recorded builds. Your saved
                    lineup stays untouched.
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
        </>
      ) : null}
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
    </section>
  );
}
