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
import { ORDER_ROUTE_OPTIONS } from '../store/mockData';
import { useOrderStore } from '../store/orderStore';

const statusClasses = {
  'In Transit': 'status-chip--info',
  Pending: 'status-chip--warning',
  Delivered: 'status-chip--success',
  Delayed: 'status-chip--danger',
};

const priorityClasses = {
  Critical: 'bg-[rgba(255,123,114,0.14)] text-[var(--danger)] ring-1 ring-[rgba(255,123,114,0.24)]',
  High: 'bg-[rgba(255,179,71,0.14)] text-[var(--warning)] ring-1 ring-[rgba(255,179,71,0.22)]',
  Medium: 'bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent-outline)]',
  Low: 'bg-[var(--surface-muted)] text-[var(--text-muted)] ring-1 ring-[var(--border)]',
};

const emptyOrderForm = {
  customer: '',
  destination: ORDER_ROUTE_OPTIONS[0].destination,
  driver: 'Unassigned',
  origin: ORDER_ROUTE_OPTIONS[0].origin,
  priority: 'Medium',
  status: 'Pending',
  weight: '',
};

function MetricPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

function StatusChip({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>{status}</span>;
}

function PriorityChip({ priority }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[priority] || priorityClasses.Medium}`}>
      {priority}
    </span>
  );
}

function OrderDetailsPanel({ selectedAuditLogs, selectedOrder, driverOptions, pendingKey, onDriverChange, onOpenStatusActions, onClose }) {
  if (!selectedOrder) {
    return (
      <EmptyState
        icon="box"
        title="Select an order to inspect"
        description="The detail rail will show route context, driver assignment, and audit events for the chosen shipment."
      />
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface-subtle),rgba(125,179,255,0.06))] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">Selected Route</p>
            <h3 className="mt-3 font-headline text-2xl font-bold text-[var(--text)]">{selectedOrder.route}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {selectedOrder.detail || `${selectedOrder.origin} to ${selectedOrder.destination}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PriorityChip priority={selectedOrder.priority} />
            <StatusChip status={selectedOrder.status} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricPill label="Origin" value={selectedOrder.origin} />
          <MetricPill label="Destination" value={selectedOrder.destination} />
          <MetricPill label="ETA" value={selectedOrder.eta || 'Awaiting driver'} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Assigned Driver</p>
              <p className="mt-3 font-semibold text-[var(--text)]">{selectedOrder.driver}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {selectedOrder.id} - {selectedOrder.weight}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button className="w-full sm:w-auto" variant="secondary" onClick={onOpenStatusActions}>
                <span className="material-symbols-outlined text-base">swap_horiz</span>
                Update Status
              </Button>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-dim)]">Dispatch controls</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Customer</p>
          <p className="mt-3 text-sm font-semibold text-[var(--text)]">{selectedOrder.customer}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedOrder.eta || 'ETA syncing'}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Live Status</p>
          <p className="mt-3 text-sm font-semibold text-[var(--text)]">{selectedOrder.speed || 'Awaiting dispatch'}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{selectedOrder.detail || selectedOrder.route}</p>
        </div>
      </div>

      <Field label="Reassign Driver">
        <Input as="select" value={selectedOrder.driver} disabled={pendingKey === 'order-driver'} onChange={onDriverChange}>
          {driverOptions.map((driverName) => (
            <option key={driverName}>{driverName}</option>
          ))}
        </Input>
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="w-full sm:w-auto" variant="secondary" onClick={onOpenStatusActions}>
          <span className="material-symbols-outlined text-base">tune</span>
          Manage shipment
        </Button>
        <Button className="w-full sm:w-auto" variant="ghost" onClick={onClose}>
          Clear selection
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Audit Logs</p>
          <Button className="sm:hidden" variant="ghost" size="icon" onClick={onClose}>
            <span className="material-symbols-outlined text-base">close</span>
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {selectedAuditLogs.length ? (
            selectedAuditLogs.map((log, index) => (
              <div key={log.id} className="flex gap-3">
                <div className={`mt-1.5 h-3 w-3 rounded-full ${index === 0 ? 'bg-[var(--accent)]' : 'bg-[var(--timeline-dot-muted)]'}`} />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{log.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{log.time}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No audit activity has been recorded for this order yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

function OrdersLoadingState() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
      <Card>
        <CardHeader className="flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_auto_auto]">
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[44px] w-28" />
            <Skeleton className="h-[44px] w-40" />
          </div>
          <Skeleton className="h-[44px] w-full max-w-80" />
          <Skeleton className="h-[360px] w-full rounded-[28px]" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full rounded-[28px]" />
          <Skeleton className="h-24 w-full rounded-[24px]" />
          <Skeleton className="h-36 w-full rounded-[24px]" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Orders() {
  const isReady = usePageReady();
  const orders = useOrderStore((state) => state.data);
  const addOrder = useOrderStore((state) => state.add);
  const updateOrderStatus = useOrderStore((state) => state.updateStatus);
  const assignOrderDriver = useOrderStore((state) => state.assignDriver);
  const drivers = useDriverStore((state) => state.data);
  const { pendingKey, runAction } = useSimulatedAction();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Orders');
  const [driverFilter, setDriverFilter] = useState('All Drivers');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [selectedOrderId, setSelectedOrderId] = useState(() => useOrderStore.getState().data[0]?.id || null);
  const [actionOrderId, setActionOrderId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState(emptyOrderForm);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const driverOptions = useMemo(
    () => ['Unassigned', ...Array.from(new Set(drivers.map((driver) => driver.name)))],
    [drivers]
  );

  const boardStats = useMemo(
    () => [
      { label: 'All', value: orders.length },
      { label: 'Pending', value: orders.filter((order) => order.status === 'Pending').length },
      { label: 'In Transit', value: orders.filter((order) => order.status === 'In Transit').length },
      { label: 'Delayed', value: orders.filter((order) => order.status === 'Delayed').length },
    ],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'All Orders' || order.status === statusFilter;
      const matchesDriver = driverFilter === 'All Drivers' || order.driver === driverFilter;
      const matchesPriority = priorityFilter === 'All Priorities' || order.priority === priorityFilter;
      const matchesQuery =
        !normalizedQuery ||
        [order.id, order.customer, order.route, order.driver].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

      return matchesStatus && matchesDriver && matchesPriority && matchesQuery;
    });
  }, [deferredSearchQuery, driverFilter, orders, priorityFilter, statusFilter]);

  const selectedOrder = selectedOrderId ? orders.find((order) => order.id === selectedOrderId) || null : null;
  const actionOrder = orders.find((order) => order.id === actionOrderId) || null;
  const selectedAuditLogs = selectedOrder ? selectedOrder.auditLogs || [] : [];

  function resetBoardFilters() {
    setSearchQuery('');
    setStatusFilter('All Orders');
    setDriverFilter('All Drivers');
    setPriorityFilter('All Priorities');
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleCreateOrder(event) {
    event.preventDefault();

    await runAction('order-create', async () => {
      const created = await addOrder({
        ...formState,
      });

      setSelectedOrderId(created.id);
      setIsCreateOpen(false);
      setFormState(emptyOrderForm);
    });
  }

  async function handleStatusUpdate(orderId, status) {
    await runAction(`order-status-${orderId}-${status}`, async () => {
      await updateOrderStatus(orderId, status);
      setActionOrderId(null);
      setSelectedOrderId(orderId);
    });
  }

  async function handleDriverChange(event) {
    const nextDriver = event.target.value;

    if (!selectedOrder) {
      return;
    }

    await runAction('order-driver', async () => {
      await assignOrderDriver(selectedOrder.id, nextDriver);
    });
  }

  if (!isReady) {
    return <OrdersLoadingState />;
  }

  return (
    <>
      <div className="space-y-8">
        <section>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Dispatch Board</p>
            <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Orders</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              The page structure stays familiar, but the filters, actions, details panel, and order table now all use the same system components.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <Card>
            <CardHeader className="flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Order List</CardTitle>
                <CardDescription>Shared inputs and buttons remove the one-off toolbar styling from this screen.</CardDescription>
              </div>
              <p className="text-xs text-[var(--text-dim)]">{filteredOrders.length} active results</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_auto_auto]">
                <Field label="Search">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search shipping ID or customer"
                    icon={<span className="material-symbols-outlined text-base">search</span>}
                  />
                </Field>
                <div className="flex items-end">
                  <Button className="w-full sm:w-auto" variant="secondary" onClick={() => setIsFilterOpen(true)}>
                    <span className="material-symbols-outlined text-base">filter_list</span>
                    Filter
                  </Button>
                </div>
                <div className="flex items-end md:col-span-2 xl:col-span-1">
                  <Button className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Create New Order
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {['All Orders', 'Pending', 'In Transit', 'Delivered', 'Delayed'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'primary' : 'secondary'}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'Delivered' ? 'Completed' : status}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {boardStats.map((item) => (
                  <MetricPill key={item.label} label={item.label} value={String(item.value).padStart(2, '0')} />
                ))}
              </div>

              {filteredOrders.length ? (
                <>
                  <div className="grid gap-4 lg:hidden">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`rounded-3xl border p-4 text-left transition duration-200 ${
                          selectedOrder?.id === order.id
                            ? 'border-[var(--accent)] bg-[var(--surface-muted)] shadow-[var(--shadow-soft)]'
                            : 'border-[var(--border)] bg-[var(--surface-overlay)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--accent)]">{order.id}</p>
                              <p className="mt-2 text-base font-semibold text-[var(--text)]">{order.customer}</p>
                              <p className="mt-1 text-sm text-[var(--text-muted)]">{order.route}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <PriorityChip priority={order.priority} />
                              <StatusChip status={order.status} />
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-[var(--surface-subtle)] px-3 py-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Driver</p>
                              <p className="mt-2 text-sm font-medium text-[var(--text)]">{order.driver}</p>
                            </div>
                            <div className="rounded-2xl bg-[var(--surface-subtle)] px-3 py-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Weight</p>
                              <p className="mt-2 text-sm font-medium text-[var(--text)]">{order.weight}</p>
                            </div>
                            <div className="rounded-2xl bg-[var(--surface-subtle)] px-3 py-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">ETA</p>
                              <p className="mt-2 text-sm font-medium text-[var(--text)]">{order.eta || 'Syncing'}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => setSelectedOrderId(order.id)}>
                              <span className="material-symbols-outlined text-base">visibility</span>
                              View details
                            </Button>
                            <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setActionOrderId(order.id)}>
                              <span className="material-symbols-outlined text-base">more_horiz</span>
                              Update status
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <TableWrap className="hidden border-none lg:block">
                    <Table className="min-w-[920px]">
                      <TableHeader>
                        <tr>
                          <TableHead>Order</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </tr>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow
                            key={order.id}
                            className={selectedOrder?.id === order.id ? 'bg-[var(--surface-muted)]' : 'cursor-pointer'}
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <TableCell className="font-semibold text-[var(--accent)]">{order.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-semibold text-[var(--text)]">{order.customer}</p>
                                <p className="text-xs text-[var(--text-muted)]">{order.priority} priority</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-[var(--text-muted)]">{order.route}</TableCell>
                            <TableCell>{order.weight}</TableCell>
                            <TableCell>
                              <StatusChip status={order.status} />
                            </TableCell>
                            <TableCell>{order.driver}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  aria-label={`View ${order.id}`}
                                  variant="ghost"
                                  size="icon"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedOrderId(order.id);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-base">visibility</span>
                                </Button>
                                <Button
                                  aria-label={`Update ${order.id}`}
                                  variant="ghost"
                                  size="icon"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setActionOrderId(order.id);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-base">more_vert</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableWrap>
                </>
              ) : (
                <EmptyState
                  icon="inventory_2"
                  title="No orders match this board"
                  description="Clear the current search or switch the status pills to bring orders back into view."
                  action={<Button onClick={resetBoardFilters}>Reset board</Button>}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Focused side panel for route, driver, and audit context.</CardDescription>
              </div>
              <Button className="hidden sm:inline-flex" variant="ghost" size="icon" onClick={() => setSelectedOrderId(null)}>
                <span className="material-symbols-outlined text-base">close</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <OrderDetailsPanel
                driverOptions={driverOptions}
                onClose={() => setSelectedOrderId(null)}
                onDriverChange={handleDriverChange}
                onOpenStatusActions={() => {
                  if (selectedOrder) {
                    setActionOrderId(selectedOrder.id);
                  }
                }}
                pendingKey={pendingKey}
                selectedAuditLogs={selectedAuditLogs}
                selectedOrder={selectedOrder}
              />
            </CardContent>
          </Card>
        </section>
      </div>

      <Modal
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Orders"
        description="These filters only affect the current tenant order view."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                resetBoardFilters();
                setIsFilterOpen(false);
              }}
            >
              Clear Filters
            </Button>
            <Button onClick={() => setIsFilterOpen(false)}>Done</Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Driver">
            <Input as="select" value={driverFilter} onChange={(event) => setDriverFilter(event.target.value)}>
              <option>All Drivers</option>
              {driverOptions.map((driverName) => (
                <option key={driverName}>{driverName}</option>
              ))}
            </Input>
          </Field>
          <Field label="Priority">
            <Input as="select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option>All Priorities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Input>
          </Field>
        </div>
      </Modal>

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Order"
        description="New orders are saved to the backend and reflected in the dispatch board immediately."
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button loading={pendingKey === 'order-create'} onClick={handleCreateOrder}>
              Create Order
            </Button>
          </div>
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateOrder}>
          <Field label="Customer">
            <Input name="customer" value={formState.customer} onChange={handleFormChange} />
          </Field>
          <Field label="Weight">
            <Input name="weight" value={formState.weight} onChange={handleFormChange} placeholder="8,000 kg" />
          </Field>
          <Field label="Origin">
            <Input as="select" name="origin" value={formState.origin} onChange={handleFormChange}>
              {Array.from(new Set(ORDER_ROUTE_OPTIONS.map((route) => route.origin))).map((origin) => (
                <option key={origin}>{origin}</option>
              ))}
            </Input>
          </Field>
          <Field label="Destination">
            <Input as="select" name="destination" value={formState.destination} onChange={handleFormChange}>
              {Array.from(new Set(ORDER_ROUTE_OPTIONS.map((route) => route.destination))).map((destination) => (
                <option key={destination}>{destination}</option>
              ))}
            </Input>
          </Field>
          <Field label="Status">
            <Input as="select" name="status" value={formState.status} onChange={handleFormChange}>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delayed</option>
              <option>Delivered</option>
            </Input>
          </Field>
          <Field label="Priority">
            <Input as="select" name="priority" value={formState.priority} onChange={handleFormChange}>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Input>
          </Field>
          <Field label="Driver" className="md:col-span-2">
            <Input as="select" name="driver" value={formState.driver} onChange={handleFormChange}>
              {driverOptions.map((driverName) => (
                <option key={driverName}>{driverName}</option>
              ))}
            </Input>
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={Boolean(actionOrder)}
        onClose={() => setActionOrderId(null)}
        title={actionOrder ? `Update ${actionOrder.id}` : 'Order Actions'}
        description="Status actions persist to the backend and also update the order details rail and live tracking data."
        footer={
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setActionOrderId(null)}>
              Close
            </Button>
          </div>
        }
      >
        {actionOrder ? (
          <div className="grid gap-3">
            {['Pending', 'In Transit', 'Delayed', 'Delivered'].map((status) => (
              <Button
                key={status}
                variant={actionOrder.status === status ? 'primary' : 'secondary'}
                loading={pendingKey === `order-status-${actionOrder.id}-${status}`}
                onClick={() => handleStatusUpdate(actionOrder.id, status)}
              >
                Mark as {status}
              </Button>
            ))}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
