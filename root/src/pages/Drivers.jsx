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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrap,
} from '../components/ui';
import usePageReady from '../hooks/usePageReady';
import useSimulatedAction from '../hooks/useSimulatedAction';
import { useDriverStore } from '../store/driverStore';

const statusClasses = {
  'On Trip': 'status-chip--info',
  Available: 'status-chip--success',
  Inactive: 'bg-[var(--neutral-badge-bg)] text-[var(--neutral-badge-text)] ring-1 ring-[var(--neutral-badge-ring)]',
};

const emptyDriverForm = {
  assignment: '',
  baseHub: '',
  detail: '',
  emergencyContact: '',
  experience: '',
  grade: 'A',
  licenseNumber: '',
  name: '',
  phone: '+91 ',
  score: '90',
  status: 'Available',
};

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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

function DriversLoadingState() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[52px] w-full" />
            ))}
          </div>
          <Skeleton className="h-[360px] w-full rounded-[28px]" />
        </CardContent>
      </Card>
    </div>
  );
}

function mapDriverToForm(driver) {
  return {
    assignment: driver.assignment,
    baseHub: driver.baseHub,
    detail: driver.detail,
    emergencyContact: driver.emergencyContact,
    experience: driver.experience,
    grade: driver.grade,
    licenseNumber: driver.licenseNumber,
    name: driver.name,
    phone: driver.phone,
    score: String(driver.score),
    status: driver.status,
  };
}

export default function Drivers() {
  const isReady = usePageReady();
  const drivers = useDriverStore((state) => state.data);
  const addDriver = useDriverStore((state) => state.add);
  const updateDriver = useDriverStore((state) => state.update);
  const deleteDriver = useDriverStore((state) => state.delete);
  const resetDrivers = useDriverStore((state) => state.reset);
  const { pendingKey, runAction } = useSimulatedAction();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [availabilityFilter, setAvailabilityFilter] = useState('All Availability');
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [viewDriverId, setViewDriverId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState(emptyDriverForm);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const visibleDrivers = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return drivers.filter((driver) => {
      const matchesStatus = statusFilter === 'All Status' || driver.status === statusFilter;
      const matchesAvailability =
        availabilityFilter === 'All Availability' ||
        (availabilityFilter === 'On Route' && driver.status === 'On Trip') ||
        (availabilityFilter === 'Standby' && driver.status === 'Available') ||
        (availabilityFilter === 'On Leave' && driver.assignment === 'Medical Leave');
      const matchesQuery =
        !normalizedQuery ||
        [driver.name, driver.licenseNumber, driver.detail, driver.assignment].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

      return matchesStatus && matchesAvailability && matchesQuery;
    });
  }, [availabilityFilter, deferredSearchQuery, drivers, statusFilter]);

  const selectedDriver = drivers.find((driver) => driver.id === viewDriverId) || null;

  const stats = useMemo(() => {
    const onTripCount = drivers.filter((driver) => driver.status === 'On Trip').length;
    const availableCount = drivers.filter((driver) => driver.status === 'Available').length;
    const averageScore =
      drivers.reduce((total, driver) => total + Number(driver.score || 0), 0) / Math.max(drivers.length, 1);

    return [
      { label: 'Total Drivers', value: String(drivers.length), note: `${onTripCount} currently assigned` },
      { label: 'On Trip', value: String(onTripCount), note: 'Active long-haul and regional routes' },
      { label: 'Available', value: String(availableCount), note: 'Ready for next dispatch window' },
      { label: 'Avg. Score', value: averageScore.toFixed(1), note: 'Safety and punctuality combined' },
    ];
  }, [drivers]);

  function resetFilters() {
    setSearchQuery('');
    setStatusFilter('All Status');
    setAvailabilityFilter('All Availability');
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function openAddModal() {
    setEditingDriverId(null);
    setFormState(emptyDriverForm);
    setIsFormOpen(true);
  }

  function openEditModal(driver) {
    setEditingDriverId(driver.id);
    setFormState(mapDriverToForm(driver));
    setIsFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await runAction('driver-submit', async () => {
      if (editingDriverId) {
        await updateDriver(editingDriverId, formState);
      } else {
        await addDriver(formState);
      }

      setIsFormOpen(false);
      setEditingDriverId(null);
      setFormState(emptyDriverForm);
    });
  }

  async function handleResetDirectory() {
    await runAction('driver-reset', async () => {
      await resetDrivers();
      resetFilters();
      setIsFormOpen(false);
      setViewDriverId(null);
      setEditingDriverId(null);
    });
  }

  async function handleDelete(driver) {
    const confirmed = window.confirm(`Delete ${driver.name} from the local driver directory?`);

    if (!confirmed) {
      return;
    }

    await runAction(`driver-delete-${driver.id}`, async () => {
      await deleteDriver(driver.id);

      if (viewDriverId === driver.id) {
        setViewDriverId(null);
      }

      if (editingDriverId === driver.id) {
        setIsFormOpen(false);
        setEditingDriverId(null);
      }
    });
  }

  if (!isReady) {
    return <DriversLoadingState />;
  }

  return (
    <>
      <div className="space-y-8">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Workforce</p>
            <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Driver Operations</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              Manage roster coverage, current assignments, and performance signals across the India network using the same workspace structure as vehicles.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={openAddModal}>
              <span className="material-symbols-outlined text-base">person_add</span>
              Add New Driver
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </section>

        <Card>
          <CardHeader className="flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Driver Directory</CardTitle>
              <CardDescription>Personnel now follows the same table treatment, density, and footer controls as vehicle inventory.</CardDescription>
            </div>
            <p className="text-xs text-[var(--text-dim)]">{drivers.length} drivers synced for this tenant</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid gap-4 border-b border-[var(--border)] pb-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Field label="Search">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by driver, license, or route"
                  icon={<span className="material-symbols-outlined text-base">search</span>}
                />
              </Field>
              <Field label="Status">
                <Input as="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option>All Status</option>
                  <option>On Trip</option>
                  <option>Available</option>
                  <option>Inactive</option>
                </Input>
              </Field>
              <Field label="Availability">
                <Input as="select" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
                  <option>All Availability</option>
                  <option>On Route</option>
                  <option>Standby</option>
                  <option>On Leave</option>
                </Input>
              </Field>
              <div className="flex items-end xl:justify-end">
                <Button loading={pendingKey === 'driver-reset'} variant="ghost" onClick={handleResetDirectory}>
                  Reset
                </Button>
              </div>
            </div>

            {visibleDrivers.length ? (
              <>
                <TableWrap className="border-none">
                  <Table className="min-w-[860px]">
                    <TableHeader>
                      <tr>
                        <TableHead>Driver</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Route / Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {visibleDrivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl [background:linear-gradient(135deg,var(--accent-gradient-soft),rgba(125,179,255,0.18))] font-headline text-sm font-bold text-[var(--text)]">
                                {initials(driver.name)}
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-[var(--text)]">{driver.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">License: {driver.licenseNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-[var(--text)]">{driver.assignment}</TableCell>
                          <TableCell className="text-[var(--text-muted)]">{driver.detail}</TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[driver.status]}`}>
                              {driver.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-[var(--text)]">
                              {driver.score}
                              <span className="ml-1 text-xs text-[var(--text-muted)]">/100</span>
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex min-w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-bold text-[var(--accent)]">
                              {driver.grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setViewDriverId(driver.id)}>
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(driver)}>
                                <span className="material-symbols-outlined text-base">edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={Boolean(pendingKey)}
                                onClick={() => handleDelete(driver)}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {pendingKey === `driver-delete-${driver.id}` ? 'progress_activity' : 'delete'}
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
                    Showing <span className="font-semibold text-[var(--text)]">1-{visibleDrivers.length}</span> of {drivers.length} drivers
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="icon" disabled>
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </Button>
                    <Button>1</Button>
                    <Button variant="secondary" size="icon" disabled={visibleDrivers.length === drivers.length}>
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon="badge"
                title="No drivers match this view"
                description="Try widening the availability or status filters to bring back the full workforce roster."
                action={<Button onClick={resetFilters}>Clear filters</Button>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingDriverId ? 'Edit Driver' : 'Add Driver'}
        description="Driver records are stored in the tenant backend so the directory updates instantly across sessions."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={pendingKey === 'driver-submit'} onClick={handleSubmit}>
              {editingDriverId ? 'Save Driver' : 'Add Driver'}
            </Button>
          </div>
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Driver Name">
            <Input name="name" value={formState.name} onChange={handleFormChange} />
          </Field>
          <Field label="License Number">
            <Input name="licenseNumber" value={formState.licenseNumber} onChange={handleFormChange} />
          </Field>
          <Field label="Status">
            <Input as="select" name="status" value={formState.status} onChange={handleFormChange}>
              <option>Available</option>
              <option>On Trip</option>
              <option>Inactive</option>
            </Input>
          </Field>
          <Field label="Grade">
            <Input name="grade" value={formState.grade} onChange={handleFormChange} />
          </Field>
          <Field label="Assignment">
            <Input name="assignment" value={formState.assignment} onChange={handleFormChange} />
          </Field>
          <Field label="Route / Detail">
            <Input name="detail" value={formState.detail} onChange={handleFormChange} />
          </Field>
          <Field label="Performance Score">
            <Input name="score" value={formState.score} onChange={handleFormChange} />
          </Field>
          <Field label="Experience">
            <Input name="experience" value={formState.experience} onChange={handleFormChange} />
          </Field>
          <Field label="Phone">
            <Input name="phone" value={formState.phone} onChange={handleFormChange} />
          </Field>
          <Field label="Base Hub">
            <Input name="baseHub" value={formState.baseHub} onChange={handleFormChange} />
          </Field>
          <Field label="Emergency Contact" className="md:col-span-2">
            <Input name="emergencyContact" value={formState.emergencyContact} onChange={handleFormChange} />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedDriver)}
        onClose={() => setViewDriverId(null)}
        title={selectedDriver?.name || 'Driver Details'}
        description={selectedDriver ? `License ${selectedDriver.licenseNumber}` : ''}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setViewDriverId(null)}>
              Close
            </Button>
            {selectedDriver ? (
              <Button
                onClick={() => {
                  openEditModal(selectedDriver);
                  setViewDriverId(null);
                }}
              >
                Edit Driver
              </Button>
            ) : null}
          </div>
        }
      >
        {selectedDriver ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Assignment</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedDriver.assignment}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedDriver.detail}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Status</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedDriver.status}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Base Hub</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedDriver.baseHub}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Contact</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedDriver.phone}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedDriver.emergencyContact}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Performance Snapshot</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                {selectedDriver.score}/100 - Grade {selectedDriver.grade}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedDriver.experience} experience in the active roster.</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
