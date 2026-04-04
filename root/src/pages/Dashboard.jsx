import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Modal,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrap,
} from '../components/ui';
import { useDashboardStore } from '../store/dashboardStore';

const toneClasses = {
  success: 'status-chip--success',
  info: 'status-chip--info',
  warning: 'status-chip--warning',
  danger: 'status-chip--danger',
};

const chartWidth = 760;
const chartHeight = 280;
const chartPaddingX = 10;
const chartPaddingTop = 20;
const chartPaddingBottom = 26;
function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createAnimatedProgressSeries(series, motionPhase) {
  if (!Array.isArray(series) || !series.length) {
    return [];
  }

  return series.map((entry, index) => {
    const deliveredBase = Number(entry.delivered) || 0;
    const baselineBase = Number(entry.baseline) || 0;
    const deliveredAmplitude = clampValue(deliveredBase * 0.08, 0.35, 2.4);
    const baselineAmplitude = clampValue(baselineBase * 0.06, 0.28, 1.9);
    const phase = motionPhase + index * 0.82;
    const deliveredOffset =
      Math.sin(phase) * deliveredAmplitude +
      Math.cos(phase * 0.58 + index * 0.33) * deliveredAmplitude * 0.55;
    const baselineOffset =
      Math.cos(phase * 0.74 + 0.8) * baselineAmplitude +
      Math.sin(phase * 0.42 + index * 0.27) * baselineAmplitude * 0.5;

    return {
      ...entry,
      baseline: Math.max(0, baselineBase + baselineOffset),
      delivered: Math.max(0, deliveredBase + deliveredOffset),
    };
  });
}

function createSeriesPoints(series, key, maxValue) {
  const usableWidth = chartWidth - chartPaddingX * 2;
  const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;
  const stepX = usableWidth / Math.max(series.length - 1, 1);

  return series.map((entry, index) => ({
    ...entry,
    x: chartPaddingX + stepX * index,
    y: chartPaddingTop + (1 - entry[key] / Math.max(maxValue, 1)) * usableHeight,
  }));
}

function buildSmoothPath(points) {
  if (!points.length) {
    return '';
  }

  const path = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;

    path.push(`C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`);
  }

  return path.join(' ');
}

function buildAreaPath(points, baseY) {
  if (!points.length) {
    return '';
  }

  return `${buildSmoothPath(points)} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
}

function StatCard({ icon, label, note, tone, value }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-3 font-headline text-3xl font-bold text-[var(--text)]">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        </div>
        <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
          {note}
        </span>
      </CardContent>
    </Card>
  );
}

function ActivityLogModal({ logs, onClose, open }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Activity Logs"
      description="Detailed dispatch, maintenance, and operations updates from the latest control window."
      footer={(
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    >
      <div className="space-y-3">
        {logs.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                    {item.category}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${toneClasses[item.tone]}`}>
                    {item.time}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                <p className="text-sm leading-6 text-[var(--text-muted)]">{item.detail}</p>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {item.loggedAt}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Modal>
  );
}

function DeliveryProgressChart({ dailyAchieved, dailyGoal, series }) {
  const [motionPhase, setMotionPhase] = useState(0);

  useEffect(() => {
    if (!series.length) {
      return undefined;
    }

    let frameId = 0;
    let startTime = 0;

    const tick = (now) => {
      if (!startTime) {
        startTime = now;
      }

      const elapsedSeconds = (now - startTime) / 1000;
      setMotionPhase(elapsedSeconds * 0.7);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [series.length]);

  const remainingDispatches = Math.max(0, dailyGoal - dailyAchieved);
  const averageDispatches = Math.max(0, Math.round(dailyAchieved / Math.max(series.length, 1)));
  const peakWindow = series.reduce((peak, current) =>
    current.delivered > peak.delivered ? current : peak
  , series[0] || { time: '--', delivered: 0 });
  const animatedSeries = useMemo(
    () => createAnimatedProgressSeries(series, motionPhase),
    [motionPhase, series]
  );
  const maxScale = Math.max(
    5,
    Math.ceil(
      Math.max(...series.flatMap((entry) => [entry.delivered, entry.baseline]), 1) / 5
    ) * 5
  );
  const deliveredPoints = createSeriesPoints(animatedSeries, 'delivered', maxScale);
  const baselinePoints = createSeriesPoints(animatedSeries, 'baseline', maxScale);
  const deliveredLinePath = buildSmoothPath(deliveredPoints);
  const deliveredAreaPath = buildAreaPath(deliveredPoints, chartHeight - chartPaddingBottom);
  const baselineLinePath = buildSmoothPath(baselinePoints);
  const guideLines = [0.12, 0.36, 0.6, 0.84];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Achieved</p>
          <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">{dailyAchieved}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">dispatch events tracked today</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Remaining</p>
          <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">{remainingDispatches}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">dispatch events still needed to hit goal</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Peak Window</p>
          <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">{peakWindow.time}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{peakWindow.delivered} tracked updates led the day</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] [background:var(--feature-chart-bg)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Dispatch Rhythm</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">A smooth view of today's tracked progress versus the current backend baseline.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#69d9ca]" />
              Today's dispatches
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-px w-5 border-t border-solid border-[rgba(105,217,202,0.45)]" />
              Baseline trend
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative overflow-hidden rounded-[30px] border border-[var(--surface-border-soft)] [background:var(--chart-shell-bg)] px-2 pt-2">
            <div className="pointer-events-none absolute inset-x-4 top-4 bottom-14 flex flex-col justify-between">
              {guideLines.map((guideLine) => (
                <div key={guideLine} className="border-t border-[var(--chart-grid-line)]" />
              ))}
            </div>

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="relative h-[260px] w-full"
              preserveAspectRatio="none"
              aria-label="Daily delivery progress graph"
            >
              <defs>
                <linearGradient id="delivery-area-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(105,217,202,0.52)" />
                  <stop offset="58%" stopColor="rgba(105,217,202,0.18)" />
                  <stop offset="100%" stopColor="rgba(105,217,202,0.02)" />
                </linearGradient>
                <linearGradient id="delivery-line-gradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#8be7da" />
                  <stop offset="100%" stopColor="#55bdc8" />
                </linearGradient>
              </defs>

              <path d={deliveredAreaPath} fill="url(#delivery-area-gradient)" />
              <path
                d={deliveredLinePath}
                fill="none"
                stroke="rgba(105,217,202,0.14)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="10"
              />
              <path
                d={baselineLinePath}
                fill="none"
                stroke="rgba(105,217,202,0.52)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d={deliveredLinePath}
                fill="none"
                stroke="url(#delivery-line-gradient)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />

              {deliveredPoints.map((point, index) => {
                const isPeakWindow = point.time === peakWindow.time;
                const isLastPoint = index === deliveredPoints.length - 1;

                if (!isPeakWindow && !isLastPoint) {
                  return null;
                }

                return (
                  <g key={`${point.time}-marker`}>
                    <circle cx={point.x} cy={point.y} fill="rgba(11,18,27,0.95)" r="8" />
                    <circle cx={point.x} cy={point.y} fill="#86e6da" r="4.5" />
                  </g>
                );
              })}
            </svg>

            <div className="grid grid-cols-7 gap-2 px-2 pb-4 pt-3">
              {series.map((entry) => (
                <div key={`label-${entry.time}`} className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {entry.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-[rgba(105,217,202,0.2)] bg-[rgba(105,217,202,0.08)] px-3 py-1.5 text-xs font-semibold text-[#95efe3]">
              Peak window {peakWindow.time}
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]">
              Average pace {averageDispatches} tracked events every two hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const summary = useDashboardStore((state) => state.summary);
  const error = useDashboardStore((state) => state.error);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  const safeSummary = summary || {
    activityLogEntries: [],
    dailyAchieved: 0,
    dailyGoal: 0,
    deliveryProgressSeries: [],
    dispatchQueue: [],
    fleetMix: [],
    recentActivity: [],
    stats: [],
  };

  const fleetMixBreakdown = useMemo(() => {
    const totalFleetUnits = safeSummary.fleetMix.reduce((total, item) => total + item.units, 0);

    return safeSummary.fleetMix.map((item) => {
      const share = totalFleetUnits ? (item.units / totalFleetUnits) * 100 : 0;

      return {
        ...item,
        share,
        shareLabel: `${Math.round(share)}%`,
      };
    });
  }, [safeSummary.fleetMix]);

  const totalFleetUnits = fleetMixBreakdown.reduce((total, item) => total + item.units, 0);
  const primaryFleetSegment = fleetMixBreakdown.reduce(
    (lead, item) => (item.units > lead.units ? item : lead),
    fleetMixBreakdown[0] || { label: 'No active mix', share: 0, units: 0 }
  );

  if (!summary && isLoading) {
    return (
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-5 w-40" />
              </CardContent>
            </Card>
          ))}
        </section>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-80 w-full rounded-[28px]" />
            <Skeleton className="h-48 w-full rounded-[28px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">
            Control Center
          </p>
          <h2 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Fleet Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
            Real-time visibility across dispatch, fleet health, and driver coverage for the active tenant workspace.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[var(--text)]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {safeSummary.stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Daily Delivery Progress</CardTitle>
              <CardDescription>Goal: {safeSummary.dailyGoal} dispatches. Achieved: {safeSummary.dailyAchieved}.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DeliveryProgressChart
              dailyAchieved={safeSummary.dailyAchieved}
              dailyGoal={safeSummary.dailyGoal}
              series={safeSummary.deliveryProgressSeries}
            />
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <div>
              <CardTitle>Fleet Distribution</CardTitle>
              <CardDescription>Current unit mix across the active network.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-6">
            <div className="space-y-5">
              {fleetMixBreakdown.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">{item.label}</span>
                      <p className="mt-1 text-xs text-[var(--text-dim)]">{item.focus}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-[var(--text)]">{item.units} units</span>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                        {item.shareLabel}
                      </p>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--progress-track)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.share}%`, background: item.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Deployment Spread</p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Unit mix balanced across corridor hauling, last-mile coverage, and field support.</p>
                </div>
                <div className="rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">
                  {totalFleetUnits} active
                </div>
              </div>

              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--progress-track)]">
                {fleetMixBreakdown.map((item) => (
                  <div
                    key={`${item.label}-segment`}
                    className="h-full"
                    style={{ width: `${item.share}%`, background: item.fill }}
                  />
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {fleetMixBreakdown.map((item) => (
                  <div key={`${item.label}-legend`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-[var(--text-muted)]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
                      {item.label}
                    </span>
                    <span className="font-medium text-[var(--text)]">{item.focus}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Active Units</p>
                <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">{totalFleetUnits}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">scheduled across the current operating network</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Primary Mix</p>
                <p className="mt-2 font-headline text-lg font-bold text-[var(--text)]">{primaryFleetSegment.label}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{Math.round(primaryFleetSegment.share || 0)}% of active units are in this category</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest dispatch and operations updates.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {safeSummary.recentActivity.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 transition duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--text)]">{item.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${toneClasses[item.tone]}`}>
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsActivityLogOpen(true)}
            >
              View Activity Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dispatch Queue</CardTitle>
              <CardDescription>Priority orders currently being monitored.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TableWrap className="border-none">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {safeSummary.dispatchQueue.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-semibold text-[var(--accent)]">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-[var(--text-muted)]">{order.route}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            order.status === 'Delayed'
                              ? toneClasses.danger
                              : order.status === 'Pending'
                                ? toneClasses.warning
                                : order.status === 'Delivered'
                                  ? toneClasses.success
                                  : toneClasses.info
                          }`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </CardContent>
        </Card>
      </section>

      <ActivityLogModal
        logs={safeSummary.activityLogEntries}
        open={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
      />
    </div>
  );
}
