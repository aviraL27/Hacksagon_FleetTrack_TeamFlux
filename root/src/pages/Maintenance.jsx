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
import { useMaintenanceStore } from '../store/maintenanceStore';

const toneClasses = {
  danger: 'status-chip--danger',
  warning: 'status-chip--warning',
  info: 'status-chip--info',
};

const alertToneConfig = {
  danger: {
    icon: 'device_thermostat',
    border: 'border-[rgba(255,123,114,0.24)]',
    glow: 'shadow-[0_20px_45px_rgba(255,123,114,0.12)]',
    panel: 'bg-[linear-gradient(135deg,rgba(255,123,114,0.14),rgba(255,123,114,0.03))]',
    iconWrap: 'bg-[rgba(255,123,114,0.16)] text-[var(--danger)]',
  },
  warning: {
    icon: 'warning',
    border: 'border-[rgba(255,179,71,0.24)]',
    glow: 'shadow-[0_20px_45px_rgba(255,179,71,0.1)]',
    panel: 'bg-[linear-gradient(135deg,rgba(255,179,71,0.12),rgba(255,179,71,0.03))]',
    iconWrap: 'bg-[rgba(255,179,71,0.16)] text-[var(--warning)]',
  },
  info: {
    icon: 'system_update_alt',
    border: 'border-[rgba(94,184,255,0.24)]',
    glow: 'shadow-[0_20px_45px_rgba(94,184,255,0.1)]',
    panel: 'bg-[linear-gradient(135deg,rgba(94,184,255,0.14),rgba(94,184,255,0.03))]',
    iconWrap: 'bg-[rgba(94,184,255,0.16)] text-sky-300',
  },
};

const alertStatusClasses = {
  New: 'bg-[rgba(255,255,255,0.05)] text-[var(--text)] ring-1 ring-[var(--border)]',
  Available: 'bg-[rgba(94,184,255,0.14)] text-sky-300 ring-1 ring-[rgba(94,184,255,0.18)]',
  Read: 'bg-[var(--surface-muted)] text-[var(--text-muted)] ring-1 ring-[var(--border)]',
  Installed: 'bg-[rgba(102,217,174,0.14)] text-[var(--success)] ring-1 ring-[rgba(102,217,174,0.18)]',
  Scheduled: 'bg-[rgba(255,255,255,0.05)] text-[var(--text)] ring-1 ring-[var(--border)]',
};

const scheduleStatusClasses = {
  Critical: 'status-chip--danger',
  Warning: 'status-chip--warning',
  Good: 'status-chip--success',
};

const emptyEntryForm = {
  costEstimate: '',
  lastService: '',
  nextDue: '',
  notes: '',
  registration: '',
  service: '',
  status: 'Good',
  vendor: '',
};

function mapEntryToForm(entry) {
  return {
    costEstimate: entry.costEstimate,
    lastService: entry.lastService,
    nextDue: entry.nextDue,
    notes: entry.notes,
    registration: entry.registration,
    service: entry.service,
    status: entry.status,
    vendor: entry.vendor,
  };
}

function prefillFromAlert(alert) {
  if (alert?.id === 'alert-1') {
    return {
      ...emptyEntryForm,
      costEstimate: 'INR 18,000',
      notes: 'Engine temperature anomaly routed from active alert.',
      registration: 'FT-7729-LX',
      service: 'Engine Diagnostic and Repair',
      status: 'Critical',
      vendor: 'Delhi Corridor Service Bay',
    };
  }

  return emptyEntryForm;
}

function splitAlertNote(note) {
  const [primary, ...rest] = note.split(' - ');

  return {
    primary,
    secondary: rest.join(' - '),
  };
}

function isAlertResolved(status) {
  return status === 'Read' || status === 'Installed' || status === 'Scheduled';
}

export default function Maintenance() {
  const alerts = useMaintenanceStore((state) => state.alerts);
  const schedule = useMaintenanceStore((state) => state.data);
  const history = useMaintenanceStore((state) => state.history);
  const addEntry = useMaintenanceStore((state) => state.add);
  const updateEntry = useMaintenanceStore((state) => state.update);
  const deleteEntry = useMaintenanceStore((state) => state.delete);
  const markAlertRead = useMaintenanceStore((state) => state.markAlertRead);
  const installNow = useMaintenanceStore((state) => state.installNow);
  const scheduleService = useMaintenanceStore((state) => state.scheduleService);
  const { pendingKey, runAction } = useSimulatedAction();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [viewEntryId, setViewEntryId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sourceAlertId, setSourceAlertId] = useState(null);
  const [formState, setFormState] = useState(emptyEntryForm);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const visibleSchedule = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return schedule.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return [item.registration, item.service, item.status, item.vendor].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [deferredSearchQuery, schedule]);

  const selectedEntry = schedule.find((item) => item.id === viewEntryId) || null;

  const stats = useMemo(() => {
    const criticalCount = schedule.filter((entry) => entry.status === 'Critical').length;
    const warningCount = schedule.filter((entry) => entry.status === 'Warning').length;
    const healthScore = Math.max(92.4, 100 - criticalCount * 1.8 - warningCount * 0.6);

    return [
      { label: 'Vehicles in Service', value: String(schedule.length), note: `${schedule.length - criticalCount} on routine plans` },
      { label: 'Overdue Maintenance', value: String(criticalCount).padStart(2, '0'), note: 'Immediate action' },
      { label: 'Upcoming Service', value: String(warningCount + 2).padStart(2, '0'), note: 'Due in next 7 days' },
      { label: 'System Health', value: `${healthScore.toFixed(1)}%`, note: 'Local telemetry operating normally' },
    ];
  }, [schedule]);

  const alertStats = useMemo(() => {
    const critical = alerts.filter((alert) => alert.tone === 'danger').length;
    const pending = alerts.filter((alert) => !isAlertResolved(alert.status)).length;
    const resolved = alerts.length - pending;

    return [
      { label: 'Live Queue', note: 'Signals waiting for action', value: String(alerts.length).padStart(2, '0') },
      { label: 'Critical Now', note: 'Immediate technician escalation', value: String(critical).padStart(2, '0') },
      { label: 'Pending Actions', note: 'Needs operator acknowledgement', value: String(pending).padStart(2, '0') },
      { label: 'Resolved Today', note: 'Handled by service workflow', value: String(resolved).padStart(2, '0') },
    ];
  }, [alerts]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function openAddModal() {
    setEditingEntryId(null);
    setSourceAlertId(null);
    setFormState(emptyEntryForm);
    setIsFormOpen(true);
  }

  function openEditModal(entry) {
    setEditingEntryId(entry.id);
    setSourceAlertId(null);
    setFormState(mapEntryToForm(entry));
    setIsFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await runAction('maintenance-submit', async () => {
      if (sourceAlertId) {
        await scheduleService(formState, sourceAlertId);
      } else if (editingEntryId) {
        await updateEntry(editingEntryId, formState);
      } else {
        await addEntry(formState);
      }

      setIsFormOpen(false);
      setEditingEntryId(null);
      setSourceAlertId(null);
      setFormState(emptyEntryForm);
    });
  }

  async function handleAlertAction(alert) {
    if (alert.id === 'alert-1') {
      setSourceAlertId(alert.id);
      setEditingEntryId(null);
      setFormState(prefillFromAlert(alert));
      setIsFormOpen(true);
      return;
    }

    if (alert.id === 'alert-2') {
      await runAction(`alert-${alert.id}`, async () => {
        await markAlertRead(alert.id);
      });
      return;
    }

    await runAction(`alert-${alert.id}`, async () => {
      await installNow(alert.id);
    });
  }

  async function handleDelete(entry) {
    const confirmed = window.confirm(`Delete maintenance entry for ${entry.registration}?`);

    if (!confirmed) {
      return;
    }

    await runAction(`maintenance-delete-${entry.id}`, async () => {
      await deleteEntry(entry.id);
      setViewEntryId(null);
    });
  }

  return (
    <>
      <div className="space-y-8 pb-16">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Asset Health</p>
            <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Fleet Maintenance</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              Maintenance now follows the same dark card, action, and table treatment used by dispatch and settings.
            </p>
          </div>
          <Button onClick={openAddModal}>
            <span className="material-symbols-outlined text-base">build_circle</span>
            Schedule Service
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">{item.label}</p>
                <p className="mt-3 font-headline text-3xl font-bold text-[var(--text)]">{item.value}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <Card>
            <CardHeader className="flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Escalations, warnings, and fleet-wide notices are organized into a response queue with clearer severity and action states.</CardDescription>
              </div>
              <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setIsHistoryOpen(true)}>
                View History
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {alertStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">{item.label}</p>
                    <p className="mt-3 font-headline text-3xl font-bold text-[var(--text)]">{item.value}</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {alerts.map((alert) => {
                  const tone = alertToneConfig[alert.tone] || alertToneConfig.info;
                  const noteParts = splitAlertNote(alert.note);
                  const resolved = isAlertResolved(alert.status);

                  return (
                    <div
                      key={alert.id}
                      className={`group relative overflow-hidden rounded-[28px] border bg-[var(--surface-subtle)] p-5 transition duration-300 hover:-translate-y-1 hover:bg-[var(--surface-hover)] ${tone.border} ${tone.glow}`}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 ${tone.panel}`} />
                      <div className="flex h-full flex-col gap-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.iconWrap}`}>
                            <span className="material-symbols-outlined text-[22px]">{tone.icon}</span>
                          </div>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${alertStatusClasses[alert.status] || alertStatusClasses.New}`}>
                            {alert.status}
                          </span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[alert.tone]}`}>
                              {alert.level}
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
                              {resolved ? 'Workflow locked' : 'Awaiting response'}
                            </span>
                          </div>
                          <h3 className="mt-4 font-headline text-[1.45rem] font-bold leading-tight text-[var(--text)]">{alert.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{alert.note}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Asset Scope</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--text)]">{noteParts.primary}</p>
                          </div>
                          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Ops Context</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--text)]">{noteParts.secondary || 'Central maintenance desk'}</p>
                          </div>
                        </div>

                        <div className="mt-auto flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Recommended Action</p>
                            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{alert.action}</p>
                          </div>
                          <Button
                            className="w-full sm:w-auto"
                            variant={alert.tone === 'danger' ? 'primary' : 'secondary'}
                            loading={pendingKey === `alert-${alert.id}`}
                            disabled={resolved}
                            onClick={() => handleAlertAction(alert)}
                          >
                            {resolved ? alert.status : alert.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Search, add, and review service entries using the shared table and form components.</CardDescription>
            </div>
            <p className="text-xs text-[var(--text-dim)]">{visibleSchedule.length} matching entries</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
              <Field label="Search">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search registration"
                  icon={<span className="material-symbols-outlined text-base">search</span>}
                />
              </Field>
              <div className="flex items-end">
                <Button onClick={openAddModal}>
                  <span className="material-symbols-outlined text-base">add</span>
                  Add Entry
                </Button>
              </div>
            </div>

            {visibleSchedule.length ? (
              <TableWrap className="border-none">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Registration</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Last Service</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {visibleSchedule.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.registration}</TableCell>
                        <TableCell>{item.service}</TableCell>
                        <TableCell className="text-[var(--text-muted)]">{item.lastService}</TableCell>
                        <TableCell>{item.nextDue}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${scheduleStatusClasses[item.status]}`}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setViewEntryId(item.id)}>
                            <span className="material-symbols-outlined text-base">more_vert</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrap>
            ) : (
              <EmptyState
                icon="build"
                title="No maintenance items match your search"
                description="Try a registration number, service type, or status to find the right record."
                action={<Button onClick={() => setSearchQuery('')}>Clear search</Button>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEntryId ? 'Edit Maintenance Entry' : sourceAlertId ? 'Schedule Service from Alert' : 'Add Maintenance Entry'}
        description="Maintenance actions are persisted for the tenant and reflected in alerts, schedule entries, and history."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={pendingKey === 'maintenance-submit'} onClick={handleSubmit}>
              {editingEntryId ? 'Save Entry' : 'Save Schedule'}
            </Button>
          </div>
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Registration">
            <Input name="registration" value={formState.registration} onChange={handleFormChange} />
          </Field>
          <Field label="Service Type">
            <Input name="service" value={formState.service} onChange={handleFormChange} />
          </Field>
          <Field label="Last Service">
            <Input name="lastService" value={formState.lastService} onChange={handleFormChange} />
          </Field>
          <Field label="Next Due">
            <Input name="nextDue" value={formState.nextDue} onChange={handleFormChange} />
          </Field>
          <Field label="Status">
            <Input as="select" name="status" value={formState.status} onChange={handleFormChange}>
              <option>Critical</option>
              <option>Warning</option>
              <option>Good</option>
            </Input>
          </Field>
          <Field label="Vendor">
            <Input name="vendor" value={formState.vendor} onChange={handleFormChange} />
          </Field>
          <Field label="Cost Estimate">
            <Input name="costEstimate" value={formState.costEstimate} onChange={handleFormChange} />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <Input as="textarea" name="notes" value={formState.notes} onChange={handleFormChange} rows={4} />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedEntry)}
        onClose={() => setViewEntryId(null)}
        title={selectedEntry ? `${selectedEntry.registration} Maintenance` : 'Maintenance Entry'}
        description={selectedEntry?.service}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {selectedEntry ? (
              <Button variant="danger" loading={pendingKey === `maintenance-delete-${selectedEntry.id}`} onClick={() => handleDelete(selectedEntry)}>
                Delete Entry
              </Button>
            ) : <span />}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="ghost" onClick={() => setViewEntryId(null)}>
                Close
              </Button>
              {selectedEntry ? (
                <Button
                  onClick={() => {
                    openEditModal(selectedEntry);
                    setViewEntryId(null);
                  }}
                >
                  Edit Entry
                </Button>
              ) : null}
            </div>
          </div>
        }
      >
        {selectedEntry ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Vendor</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedEntry.vendor}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Cost Estimate</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedEntry.costEstimate}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Notes</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{selectedEntry.notes}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Maintenance History"
        description="Stored tenant history for completed service work and maintenance actions."
        footer={
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setIsHistoryOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--text)]">{item.registration}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{item.service}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-dim)]">{item.completedOn}</p>
              </div>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{item.technician}</p>
              <p className="mt-1 text-sm text-[var(--text)]">{item.result}</p>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
