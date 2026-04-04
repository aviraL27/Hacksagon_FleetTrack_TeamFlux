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
import { useVehicleStore } from '../store/vehicleStore';

const statusClasses = {
  Active: 'status-chip--success',
  Maintenance: 'status-chip--warning',
  Idle: 'bg-[var(--neutral-badge-bg)] text-[var(--neutral-badge-text)] ring-1 ring-[var(--neutral-badge-ring)]',
};

const emptyVehicleForm = {
  assignedDriver: 'Unassigned',
  capacity: '',
  fuelAverage: '12',
  hub: '',
  model: '',
  nextService: '',
  notes: '',
  registrationNumber: '',
  serviceNote: '',
  status: 'Active',
  type: 'Heavy Truck',
  vin: '',
};

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

function FleetLoadingState() {
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
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[52px] w-full" />
            ))}
          </div>
          <Skeleton className="h-[320px] w-full rounded-[28px]" />
        </CardContent>
      </Card>
    </div>
  );
}

function mapVehicleToForm(vehicle) {
  return {
    assignedDriver: vehicle.assignedDriver,
    capacity: vehicle.capacity,
    fuelAverage: String(vehicle.fuelAverage),
    hub: vehicle.hub,
    model: vehicle.model,
    nextService: vehicle.nextService,
    notes: vehicle.notes,
    registrationNumber: vehicle.registrationNumber,
    serviceNote: vehicle.serviceNote,
    status: vehicle.status,
    type: vehicle.type,
    vin: vehicle.vin,
  };
}

export default function Fleet() {
  const isReady = usePageReady();
  const vehicles = useVehicleStore((state) => state.data);
  const addVehicle = useVehicleStore((state) => state.add);
  const updateVehicle = useVehicleStore((state) => state.update);
  const deleteVehicle = useVehicleStore((state) => state.delete);
  const resetVehicles = useVehicleStore((state) => state.reset);
  const { pendingKey, runAction } = useSimulatedAction();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Vehicles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [viewVehicleId, setViewVehicleId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState(emptyVehicleForm);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const visibleVehicles = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesType = typeFilter === 'All Vehicles' || vehicle.type === typeFilter;
      const matchesStatus = statusFilter === 'All Status' || vehicle.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [vehicle.registrationNumber, vehicle.model, vehicle.assignedDriver, vehicle.type].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

      return matchesType && matchesStatus && matchesQuery;
    });
  }, [deferredSearchQuery, statusFilter, typeFilter, vehicles]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === viewVehicleId) || null;
  const vehicleTypes = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.type))).sort(),
    [vehicles]
  );

  const stats = useMemo(() => {
    const activeCount = vehicles.filter((vehicle) => vehicle.status === 'Active').length;
    const maintenanceCount = vehicles.filter((vehicle) => vehicle.status === 'Maintenance').length;
    const pendingAssignments = vehicles.filter((vehicle) => vehicle.assignedDriver === 'Unassigned').length;
    const fuelAverage =
      vehicles.reduce((total, vehicle) => total + Number(vehicle.fuelAverage || 0), 0) / Math.max(vehicles.length, 1);

    return [
      { label: 'Total Fleet', value: String(vehicles.length), note: `${pendingAssignments} awaiting assignment` },
      {
        label: 'Operational',
        value: String(activeCount),
        note: `${((activeCount / Math.max(vehicles.length, 1)) * 100).toFixed(1)}% efficiency`,
      },
      { label: 'Maintenance', value: String(maintenanceCount), note: `${maintenanceCount} service windows active` },
      { label: 'Fuel Avg.', value: fuelAverage.toFixed(1), note: 'L/100km fleet wide' },
    ];
  }, [vehicles]);

  function resetFilters() {
    setSearchQuery('');
    setTypeFilter('All Vehicles');
    setStatusFilter('All Status');
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function openAddModal() {
    setEditingVehicleId(null);
    setFormState(emptyVehicleForm);
    setIsFormOpen(true);
  }

  function openEditModal(vehicle) {
    setEditingVehicleId(vehicle.id);
    setFormState(mapVehicleToForm(vehicle));
    setIsFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await runAction('fleet-submit', async () => {
      if (editingVehicleId) {
        await updateVehicle(editingVehicleId, formState);
      } else {
        await addVehicle(formState);
      }

      setIsFormOpen(false);
      setEditingVehicleId(null);
      setFormState(emptyVehicleForm);
    });
  }

  async function handleResetInventory() {
    await runAction('fleet-reset', async () => {
      await resetVehicles();
      resetFilters();
      setIsFormOpen(false);
      setViewVehicleId(null);
      setEditingVehicleId(null);
    });
  }

  async function handleDelete(vehicle) {
    const confirmed = window.confirm(`Delete ${vehicle.registrationNumber} from the local fleet store?`);

    if (!confirmed) {
      return;
    }

    await runAction(`fleet-delete-${vehicle.id}`, async () => {
      await deleteVehicle(vehicle.id);

      if (viewVehicleId === vehicle.id) {
        setViewVehicleId(null);
      }

      if (editingVehicleId === vehicle.id) {
        setIsFormOpen(false);
        setEditingVehicleId(null);
      }
    });
  }

  if (!isReady) {
    return <FleetLoadingState />;
  }

  return (
    <>
      <div className="space-y-8">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Asset Control</p>
            <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Vehicle Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              Monitor vehicle readiness, assignments, and service windows across the India fleet from a single structured workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={openAddModal}>
              <span className="material-symbols-outlined text-base">add</span>
              Add Vehicle
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
              <CardTitle>Vehicle Inventory</CardTitle>
              <CardDescription>Vehicles now use the same dense, readable table rhythm as the driver directory.</CardDescription>
            </div>
            <p className="text-xs text-[var(--text-dim)]">{vehicles.length} vehicles in this tenant workspace</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid gap-4 border-b border-[var(--border)] pb-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Field label="Search">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by reg number, driver, or model"
                  icon={<span className="material-symbols-outlined text-base">search</span>}
                />
              </Field>
              <Field label="Status">
                <Input as="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Maintenance</option>
                  <option>Idle</option>
                </Input>
              </Field>
              <Field label="Vehicle Type">
                <Input as="select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option>All Vehicles</option>
                  {vehicleTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </Input>
              </Field>
              <div className="flex items-end justify-end">
                <Button variant="secondary" loading={pendingKey === 'fleet-reset'} onClick={handleResetInventory}>
                  Reset
                </Button>
              </div>
            </div>

            {visibleVehicles.length ? (
              <>
                <TableWrap className="border-none">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <tr>
                        <TableHead>Registration</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Assigned Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Service Due</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {visibleVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold text-[var(--text)]">{vehicle.registrationNumber}</p>
                              <p className="text-xs text-[var(--text-muted)]">{vehicle.model}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-[var(--text-muted)]">{vehicle.type}</TableCell>
                          <TableCell className={vehicle.assignedDriver === 'Unassigned' ? 'text-[var(--text-muted)]' : ''}>
                            {vehicle.assignedDriver}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[vehicle.status]}`}>
                              {vehicle.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-[var(--text)]">{vehicle.nextService}</p>
                            <p className="text-xs text-[var(--text-muted)]">{vehicle.serviceNote}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => setViewVehicleId(vehicle.id)}>
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(vehicle)}>
                                <span className="material-symbols-outlined text-base">edit</span>
                              </Button>
                              <Button
                                variant="danger"
                                size="icon"
                                disabled={Boolean(pendingKey)}
                                onClick={() => handleDelete(vehicle)}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {pendingKey === `fleet-delete-${vehicle.id}` ? 'progress_activity' : 'delete'}
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
                    Showing <span className="font-semibold text-[var(--text)]">1-{visibleVehicles.length}</span> of {vehicles.length} vehicles
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="icon" disabled>
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </Button>
                    <Button>1</Button>
                    <Button variant="secondary" size="icon" disabled={visibleVehicles.length === vehicles.length}>
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon="directions_car"
                title="No vehicles match these filters"
                description="Try broadening the status or type filters, or clear the search to see the full fleet again."
                action={<Button onClick={resetFilters}>Reset filters</Button>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}
        description="Changes are saved to the tenant backend and reflected across the fleet workspace immediately."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={pendingKey === 'fleet-submit'} onClick={handleSubmit}>
              {editingVehicleId ? 'Save Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Registration Number">
            <Input name="registrationNumber" value={formState.registrationNumber} onChange={handleFormChange} />
          </Field>
          <Field label="Model">
            <Input name="model" value={formState.model} onChange={handleFormChange} />
          </Field>
          <Field label="Vehicle Type">
            <Input as="select" name="type" value={formState.type} onChange={handleFormChange}>
              <option>Heavy Truck</option>
              <option>Light Van</option>
              <option>Box Truck</option>
            </Input>
          </Field>
          <Field label="Status">
            <Input as="select" name="status" value={formState.status} onChange={handleFormChange}>
              <option>Active</option>
              <option>Maintenance</option>
              <option>Idle</option>
            </Input>
          </Field>
          <Field label="Assigned Driver">
            <Input name="assignedDriver" value={formState.assignedDriver} onChange={handleFormChange} />
          </Field>
          <Field label="Hub">
            <Input name="hub" value={formState.hub} onChange={handleFormChange} />
          </Field>
          <Field label="Next Service">
            <Input name="nextService" value={formState.nextService} onChange={handleFormChange} />
          </Field>
          <Field label="Service Note">
            <Input name="serviceNote" value={formState.serviceNote} onChange={handleFormChange} />
          </Field>
          <Field label="Fuel Average">
            <Input name="fuelAverage" value={formState.fuelAverage} onChange={handleFormChange} />
          </Field>
          <Field label="Capacity">
            <Input name="capacity" value={formState.capacity} onChange={handleFormChange} />
          </Field>
          <Field label="VIN" className="md:col-span-2">
            <Input name="vin" value={formState.vin} onChange={handleFormChange} />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <Input as="textarea" name="notes" value={formState.notes} onChange={handleFormChange} rows={4} />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedVehicle)}
        onClose={() => setViewVehicleId(null)}
        title={selectedVehicle?.registrationNumber || 'Vehicle Details'}
        description={selectedVehicle?.model}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setViewVehicleId(null)}>
              Close
            </Button>
            {selectedVehicle ? (
              <Button
                onClick={() => {
                  openEditModal(selectedVehicle);
                  setViewVehicleId(null);
                }}
              >
                Edit Vehicle
              </Button>
            ) : null}
          </div>
        }
      >
        {selectedVehicle ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Driver</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedVehicle.assignedDriver}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Status</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedVehicle.status}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Capacity</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedVehicle.capacity}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Hub</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedVehicle.hub}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Service Window</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{selectedVehicle.nextService}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedVehicle.serviceNote}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Operational Notes</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{selectedVehicle.notes}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
