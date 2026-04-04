
import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrap,
} from '../components/ui';
import useSimulatedAction from '../hooks/useSimulatedAction';
import { useTeamStore } from '../store/teamStore';

const statusClasses = {
  Active: 'status-chip--success',
  Pending: 'status-chip--warning',
  Inactive: 'bg-[var(--neutral-badge-bg)] text-[var(--neutral-badge-text)] ring-1 ring-[var(--neutral-badge-ring)]',
};

const baseRoleOptions = [
  'Super Admin',
  'Operations Manager',
  'Fleet Dispatcher',
  'Billing Manager',
  'Maintenance Lead',
  'Driver Coordinator',
];

const responsibilityOptions = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Fleet', icon: 'local_shipping' },
  { label: 'Drivers', icon: 'badge' },
  { label: 'Orders', icon: 'inventory_2' },
  { label: 'Live Tracking', icon: 'share' },
  { label: 'Maintenance', icon: 'build' },
  { label: 'Settings', icon: 'settings' },
  { label: 'Billing', icon: 'payments' },
];

const defaultResponsibilitiesByRole = {
  'Super Admin': ['Dashboard', 'Settings', 'Live Tracking'],
  'Operations Manager': ['Orders', 'Drivers', 'Live Tracking'],
  'Fleet Dispatcher': ['Fleet', 'Orders', 'Live Tracking'],
  'Billing Manager': ['Billing', 'Orders', 'Settings'],
  'Maintenance Lead': ['Maintenance', 'Fleet'],
  'Driver Coordinator': ['Drivers', 'Orders'],
};

function getDefaultResponsibilities(role = 'Operations Manager') {
  return defaultResponsibilitiesByRole[role] || ['Orders', 'Live Tracking'];
}

function createEmptyManagerForm(role = 'Operations Manager') {
  return {
    email: '',
    name: '',
    role,
    status: 'Pending',
    phone: '+91 ',
    assignedHub: '',
    responsibilities: getDefaultResponsibilities(role),
    notes: '',
  };
}

function mapManagerToForm(manager) {
  return {
    email: manager.email,
    name: manager.name,
    role: manager.role,
    status: manager.status,
    phone: manager.phone || '',
    assignedHub:
      manager.assignedHub === 'Unassigned' || manager.assignedHub === 'Global Operations'
        ? ''
        : manager.assignedHub,
    responsibilities:
      manager.responsibilities?.length ? [...manager.responsibilities] : getDefaultResponsibilities(manager.role),
    notes: manager.notes || '',
  };
}

function initials(name = 'Manager') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function listSignature(values = []) {
  return [...values].sort().join('|');
}

function getManagerResponsibilities(manager) {
  return Array.isArray(manager?.responsibilities) ? manager.responsibilities : [];
}

function MetricCard({ label, note, value }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">{label}</p>
        <p className="mt-3 font-headline text-3xl font-bold text-[var(--text)]">{value}</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{note}</p>
      </CardContent>
    </Card>
  );
}

function ResponsibilityBadge({ label }) {
  return (
    <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
      {label}
    </span>
  );
}

function ResponsibilityToggle({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      className={[
        'flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm transition duration-200',
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] shadow-[inset_0_0_0_1px_var(--accent-outline)]'
          : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]',
      ].join(' ')}
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function Settings() {
  const team = useTeamStore((state) => state.data);
  const draftProfile = useTeamStore((state) => state.draftProfile) || {
    domainPrefix: '',
    headquartersAddress: '',
    legalEntityName: '',
  };
  const profile = useTeamStore((state) => state.profile) || {
    domainPrefix: '',
    headquartersAddress: '',
    legalEntityName: '',
  };
  const error = useTeamStore((state) => state.error);
  const updateDraft = useTeamStore((state) => state.updateDraft);
  const saveChanges = useTeamStore((state) => state.saveChanges);
  const discardChanges = useTeamStore((state) => state.discardChanges);
  const addManager = useTeamStore((state) => state.add);
  const updateMember = useTeamStore((state) => state.updateMember);
  const deleteMember = useTeamStore((state) => state.deleteMember);
  const clearError = useTeamStore((state) => state.clearError);
  const { pendingKey, runAction } = useSimulatedAction();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [viewManagerId, setViewManagerId] = useState(null);
  const [editingManagerId, setEditingManagerId] = useState(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerForm, setManagerForm] = useState(createEmptyManagerForm());
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draftProfile) !== JSON.stringify(profile),
    [draftProfile, profile]
  );

  const availableRoles = useMemo(
    () => Array.from(new Set([...baseRoleOptions, ...team.map((member) => member.role)])).sort(),
    [team]
  );

  const visibleTeam = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return team.filter((member) => {
      const matchesStatus = statusFilter === 'All Status' || member.status === statusFilter;
      const matchesRole = roleFilter === 'All Roles' || member.role === roleFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          member.name,
          member.email,
          member.role,
          member.assignedHub,
          ...(member.responsibilities || []),
        ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesRole && matchesQuery;
    });
  }, [deferredSearchQuery, roleFilter, statusFilter, team]);

  const selectedManager = team.find((member) => member.id === viewManagerId) || null;

  const stats = useMemo(() => {
    const activeCount = team.filter((member) => member.status === 'Active').length;
    const pendingCount = team.filter((member) => member.status === 'Pending').length;
    const superAdminCount = team.filter((member) => member.role === 'Super Admin').length;
    const uniqueResponsibilities = new Set(team.flatMap((member) => member.responsibilities || []));
    const coveredHubs = new Set(
      team
        .map((member) => member.assignedHub)
        .filter((hub) => hub && hub !== 'Unassigned' && hub !== 'Global Operations')
    );

    return [
      { label: 'Team Size', value: String(team.length), note: `${activeCount} active workspace operators` },
      { label: 'Pending Invites', value: String(pendingCount), note: `${Math.max(team.length - activeCount - pendingCount, 0)} inactive or archived profiles` },
      { label: 'Coverage Areas', value: String(uniqueResponsibilities.size), note: `${coveredHubs.size} hubs mapped to manager ownership` },
      { label: 'Super Admins', value: String(superAdminCount), note: 'Critical access retained by protected profiles' },
    ];
  }, [team]);

  function resetFilters() {
    setSearchQuery('');
    setStatusFilter('All Status');
    setRoleFilter('All Roles');
  }

  function handleManagerFormChange(event) {
    const { name, value } = event.target;

    setManagerForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleRoleChange(event) {
    const nextRole = event.target.value;

    setManagerForm((currentForm) => {
      const shouldRefreshResponsibilities =
        !currentForm.responsibilities.length ||
        listSignature(currentForm.responsibilities) === listSignature(getDefaultResponsibilities(currentForm.role));

      return {
        ...currentForm,
        role: nextRole,
        responsibilities: shouldRefreshResponsibilities
          ? getDefaultResponsibilities(nextRole)
          : currentForm.responsibilities,
      };
    });
  }

  function toggleResponsibility(label) {
    setManagerForm((currentForm) => {
      const responsibilities = currentForm.responsibilities.includes(label)
        ? currentForm.responsibilities.filter((item) => item !== label)
        : [...currentForm.responsibilities, label];

      return {
        ...currentForm,
        responsibilities,
      };
    });
  }

  function closeManagerModal() {
    setIsManagerModalOpen(false);
    setEditingManagerId(null);
    setManagerForm(createEmptyManagerForm());
  }

  function openAddManagerModal() {
    clearError();
    setEditingManagerId(null);
    setManagerForm(createEmptyManagerForm());
    setIsManagerModalOpen(true);
  }

  function openEditManagerModal(manager) {
    clearError();
    setEditingManagerId(manager.id);
    setManagerForm(mapManagerToForm(manager));
    setIsManagerModalOpen(true);
  }

  async function handleSaveChanges() {
    await runAction('settings-save', () => saveChanges());
  }

  async function handleDiscardChanges() {
    await runAction('settings-discard', () => {
      discardChanges();
    });
  }

  async function handleManagerSubmit(event) {
    event?.preventDefault?.();

    await runAction('manager-submit', async () => {
      if (editingManagerId) {
        await updateMember(editingManagerId, managerForm);
      } else {
        await addManager(managerForm);
      }

      closeManagerModal();
    });
  }

  async function handleDeleteManager(manager) {
    if (!manager || manager.isOwner) {
      return;
    }

    const confirmed = window.confirm(`Remove ${manager.name} from the team workspace?`);

    if (!confirmed) {
      return;
    }

    await runAction(`manager-delete-${manager.id}`, async () => {
      await deleteMember(manager.id);

      if (viewManagerId === manager.id) {
        setViewManagerId(null);
      }

      if (editingManagerId === manager.id) {
        closeManagerModal();
      }
    });
  }

  return (
    <>
      <div className="space-y-8 pb-16">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Admin</p>
            <h2 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Organization Settings</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)]">
              Tune workspace identity, manage admin profiles, and distribute operational ownership across the people running dispatch, tracking, maintenance, and billing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              loading={pendingKey === 'settings-discard'}
              disabled={!hasUnsavedChanges}
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </Button>
            <Button
              loading={pendingKey === 'settings-save'}
              disabled={!hasUnsavedChanges}
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[var(--text)]">
            {error}
          </div>
        ) : null}

        <section>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Identity and workspace naming in a unified form layout.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Field label="Legal Entity Name">
                <Input value={draftProfile.legalEntityName} onChange={(event) => updateDraft('legalEntityName', event.target.value)} />
              </Field>
              <Field label="Domain Prefix">
                <Input value={draftProfile.domainPrefix} onChange={(event) => updateDraft('domainPrefix', event.target.value)} suffix=".fleettrack.io" />
              </Field>
              <Field label="Headquarters Address" className="md:col-span-2">
                <Input
                  as="textarea"
                  value={draftProfile.headquartersAddress}
                  onChange={(event) => updateDraft('headquartersAddress', event.target.value)}
                  rows={3}
                />
              </Field>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </section>

        <Card>
          <CardHeader className="flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Each manager now has a proper profile, editable ownership areas, and a dedicated view for access planning instead of a flat, read-only roster.
              </CardDescription>
            </div>
            <Button onClick={openAddManagerModal}>
              <span className="material-symbols-outlined text-base">person_add</span>
              Add Manager
            </Button>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid gap-4 border-b border-[var(--border)] pb-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Field label="Search Team">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, role, hub, or ownership"
                  icon={<span className="material-symbols-outlined text-base">search</span>}
                />
              </Field>
              <Field label="Status">
                <Input as="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
                </Input>
              </Field>
              <Field label="Role">
                <Input as="select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option>All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </Input>
              </Field>
              <div className="flex items-end justify-end">
                <Button variant="secondary" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>

            {visibleTeam.length ? (
              <>
                <TableWrap className="border-none">
                  <Table className="min-w-[1080px]">
                    <TableHeader>
                      <tr>
                        <TableHead>Manager</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned Hub</TableHead>
                        <TableHead>Ownership</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {visibleTeam.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl [background:linear-gradient(135deg,var(--accent-gradient-soft),rgba(125,179,255,0.18))] font-headline text-sm font-bold text-[var(--text)]">
                                {initials(member.name)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-[var(--text)]">{member.name}</p>
                                  {member.isOwner ? (
                                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                                      Owner
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-[var(--text)]">{member.role}</TableCell>
                          <TableCell className="text-[var(--text-muted)]">{member.assignedHub}</TableCell>
                          <TableCell>
                            <div className="flex max-w-[260px] flex-wrap gap-2">
                              {getManagerResponsibilities(member).slice(0, 2).map((responsibility) => (
                                <ResponsibilityBadge key={`${member.id}-${responsibility}`} label={responsibility} />
                              ))}
                              {getManagerResponsibilities(member).length > 2 ? (
                                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-dim)]">
                                  +{getManagerResponsibilities(member).length - 2} more
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-[var(--text)]">{member.lastLogin}</p>
                            <p className="text-xs text-[var(--text-muted)]">{member.lastLoginDetail}</p>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[member.status]}`}>
                              {member.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setViewManagerId(member.id)}>
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditManagerModal(member)}>
                                <span className="material-symbols-outlined text-base">edit</span>
                              </Button>
                              <Button
                                variant={member.isOwner ? 'secondary' : 'danger'}
                                size="icon"
                                disabled={member.isOwner || Boolean(pendingKey)}
                                onClick={() => handleDeleteManager(member)}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {member.isOwner
                                    ? 'lock'
                                    : pendingKey === `manager-delete-${member.id}`
                                      ? 'progress_activity'
                                      : 'delete'}
                                </span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrap>

                <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
                  <p>
                    Showing <span className="font-semibold text-[var(--text)]">1-{visibleTeam.length}</span> of {team.length} managers in the workspace
                  </p>
                  <p>
                    Ownership mapped across <span className="font-semibold text-[var(--text)]">{new Set(team.flatMap((member) => member.responsibilities || [])).size}</span> control areas
                  </p>
                </div>
              </>
            ) : (
              <EmptyState
                icon="groups"
                title="No managers match this view"
                description="Try broadening the filters or search term to bring the full team workspace back into view."
                action={<Button onClick={resetFilters}>Clear filters</Button>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isManagerModalOpen}
        onClose={closeManagerModal}
        size="lg"
        title={editingManagerId ? 'Edit Manager Profile' : 'Add Manager'}
        description="Manager profiles now support ownership areas, hub mapping, and notes so your team roster reflects actual operational responsibilities."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={closeManagerModal}>
              Cancel
            </Button>
            <Button loading={pendingKey === 'manager-submit'} onClick={handleManagerSubmit}>
              {editingManagerId ? 'Save Manager' : 'Add Manager'}
            </Button>
          </div>
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleManagerSubmit}>
          <Field label="Manager Name">
            <Input name="name" value={managerForm.name} onChange={handleManagerFormChange} />
          </Field>
          <Field label="Email">
            <Input name="email" value={managerForm.email} onChange={handleManagerFormChange} />
          </Field>
          <Field label="Role">
            <Input as="select" name="role" value={managerForm.role} onChange={handleRoleChange}>
              {availableRoles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </Input>
          </Field>
          <Field label="Status">
            <Input as="select" name="status" value={managerForm.status} onChange={handleManagerFormChange}>
              <option>Pending</option>
              <option>Active</option>
              <option>Inactive</option>
            </Input>
          </Field>
          <Field label="Phone">
            <Input name="phone" value={managerForm.phone} onChange={handleManagerFormChange} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Assigned Hub" hint="Use a yard, city hub, or leave blank for cross-network coverage.">
            <Input name="assignedHub" value={managerForm.assignedHub} onChange={handleManagerFormChange} placeholder="Mumbai Central Hub" />
          </Field>
          <Field
            label="Responsibilities"
            className="md:col-span-2"
            hint="Choose the areas this manager owns inside the workspace."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {responsibilityOptions.map((item) => (
                <ResponsibilityToggle
                  key={item.label}
                  active={managerForm.responsibilities.includes(item.label)}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => toggleResponsibility(item.label)}
                />
              ))}
            </div>
          </Field>
          <Field label="Working Notes" className="md:col-span-2">
            <Input
              as="textarea"
              name="notes"
              value={managerForm.notes}
              onChange={handleManagerFormChange}
              rows={4}
              placeholder="Add quick context about this manager's scope, approvals, or escalation responsibilities."
            />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedManager)}
        onClose={() => setViewManagerId(null)}
        size="lg"
        title={selectedManager?.name || 'Manager Profile'}
        description={selectedManager ? `${selectedManager.role} · ${selectedManager.email}` : ''}
        footer={
          selectedManager ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {selectedManager.isOwner ? (
                  <p className="text-sm text-[var(--text-dim)]">Workspace owner access is protected and cannot be removed.</p>
                ) : (
                  <Button
                    variant="danger"
                    disabled={Boolean(pendingKey)}
                    onClick={() => handleDeleteManager(selectedManager)}
                  >
                    Remove Manager
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={() => setViewManagerId(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    openEditManagerModal(selectedManager);
                    setViewManagerId(null);
                  }}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {selectedManager ? (
          <div className="space-y-5">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-subtle)] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] [background:linear-gradient(135deg,var(--accent-gradient-soft),rgba(125,179,255,0.18))] font-headline text-xl font-bold text-[var(--text)]">
                    {initials(selectedManager.name)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-headline text-2xl font-bold text-[var(--text)]">{selectedManager.name}</p>
                      {selectedManager.isOwner ? (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                          Workspace Owner
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedManager.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">
                    {selectedManager.role}
                  </span>
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[selectedManager.status]}`}>
                    {selectedManager.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Contact</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedManager.email}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedManager.phone || 'Phone not added yet'}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Assigned Hub</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedManager.assignedHub}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Use this to anchor physical ownership in dispatch reviews.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Last Activity</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedManager.lastLogin}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedManager.lastLoginDetail}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Ownership Footprint</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">{getManagerResponsibilities(selectedManager).length} mapped areas</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Profile access spans the modules shown below.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Responsibilities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getManagerResponsibilities(selectedManager).length ? (
                    getManagerResponsibilities(selectedManager).map((responsibility) => (
                      <ResponsibilityBadge key={`${selectedManager.id}-${responsibility}`} label={responsibility} />
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No ownership areas have been assigned yet.</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Working Notes</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  {selectedManager.notes || 'No working notes have been added for this manager yet.'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

