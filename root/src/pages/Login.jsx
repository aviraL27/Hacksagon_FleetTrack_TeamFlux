import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Field, Input } from '../components/ui';
import useAuth from '../hooks/useAuth';
import { DEFAULT_TENANT_ID, normalizeTenantSlug } from '../utils/auth';

const highlights = [
  ['15', 'Live units reporting with no gateway failures'],
  ['96', "Dispatches monitored in today's operating window"],
  ['99.4%', 'Telemetry uptime across the active India network'],
];

const workSignals = [
  ['Completion pace', 'Closed work is tracking ahead of the expected curve heading into the evening handoff.', 'query_stats'],
  ['Active load', 'Live tasks remain evenly distributed with no team saturation showing in the current window.', 'stacked_line_chart'],
  ['Review queue', 'A small exception batch is still waiting on dispatcher approval before final close-out.', 'rule'],
];

const workStatusSeries = [
  { time: '06:00', completed: 8, active: 18, planned: 10, attention: 1 },
  { time: '08:00', completed: 18, active: 26, planned: 18, attention: 2 },
  { time: '10:00', completed: 31, active: 32, planned: 28, attention: 2 },
  { time: '12:00', completed: 49, active: 38, planned: 40, attention: 4 },
  { time: '14:00', completed: 72, active: 34, planned: 56, attention: 6 },
  { time: '16:00', completed: 90, active: 28, planned: 74, attention: 5 },
  { time: '18:00', completed: 108, active: 22, planned: 94, attention: 4 },
  { time: '20:00', completed: 124, active: 18, planned: 118, attention: 6 },
];

const workChartWidth = 720;
const workChartHeight = 220;
const workChartPaddingX = 18;
const workChartPaddingTop = 18;
const workChartPaddingBottom = 30;

function createSeriesPoints(series, key, maxValue) {
  const usableWidth = workChartWidth - workChartPaddingX * 2;
  const usableHeight = workChartHeight - workChartPaddingTop - workChartPaddingBottom;
  const stepX = usableWidth / Math.max(series.length - 1, 1);

  return series.map((entry, index) => ({
    ...entry,
    x: workChartPaddingX + stepX * index,
    y: workChartPaddingTop + (1 - entry[key] / maxValue) * usableHeight,
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

function WorkStatusChart() {
  const completedToday = workStatusSeries[workStatusSeries.length - 1].completed;
  const activeNow = workStatusSeries[workStatusSeries.length - 1].active;
  const reviewQueue = workStatusSeries[workStatusSeries.length - 1].attention;
  const plannedToday = workStatusSeries[workStatusSeries.length - 1].planned;
  const aheadOfPlan = completedToday - plannedToday;
  const peakAttention = workStatusSeries.reduce((peak, current) =>
    current.attention > peak.attention ? current : peak
  );
  const maxScale = Math.ceil(
    Math.max(...workStatusSeries.flatMap((entry) => [entry.completed, entry.active, entry.planned])) / 10
  ) * 10;
  const completedPoints = createSeriesPoints(workStatusSeries, 'completed', maxScale);
  const plannedPoints = createSeriesPoints(workStatusSeries, 'planned', maxScale);
  const activePoints = createSeriesPoints(workStatusSeries, 'active', maxScale);
  const completedPath = buildSmoothPath(completedPoints);
  const plannedPath = buildSmoothPath(plannedPoints);
  const areaPath = buildAreaPath(completedPoints, workChartHeight - workChartPaddingBottom);
  const baseY = workChartHeight - workChartPaddingBottom;
  const guideLines = [0.16, 0.38, 0.6, 0.82];
  const barWidth = ((workChartWidth - workChartPaddingX * 2) / workStatusSeries.length) * 0.52;

  return (
    <div className="relative flex h-[320px] flex-col p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--surface-border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Completed</p>
          <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">{completedToday}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">tasks closed in today&apos;s operating window</p>
        </div>

        <div className="rounded-2xl border border-[var(--surface-border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Active Now</p>
          <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">{activeNow}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">items still moving through the live queue</p>
        </div>

        <div className="rounded-2xl border border-[var(--surface-border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">Review Queue</p>
          <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">{reviewQueue}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">exceptions waiting for manual confirmation</p>
        </div>
      </div>

      <div className="relative mt-4 flex-1 overflow-hidden rounded-[24px] border border-[var(--surface-border-soft)] [background:var(--chart-shell-bg)] px-3 pt-3">
        <div className="absolute inset-0 [background:radial-gradient(circle_at_top_left,rgba(125,179,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(63,182,139,0.12),transparent_30%)]" />

        <div className="pointer-events-none absolute inset-x-4 top-4 bottom-14 flex flex-col justify-between">
          {guideLines.map((guideLine) => (
            <div key={guideLine} className="border-t border-[var(--chart-grid-line)]" />
          ))}
        </div>

        <div className="absolute right-4 top-4 rounded-full border border-[rgba(212,192,154,0.18)] bg-[rgba(212,192,154,0.12)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Ahead of plan +{aheadOfPlan}
        </div>

        <svg
          viewBox={`0 0 ${workChartWidth} ${workChartHeight}`}
          className="relative h-[190px] w-full"
          preserveAspectRatio="none"
          aria-label="Work status chart"
        >
          <defs>
            <linearGradient id="work-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(63,182,139,0.42)" />
              <stop offset="60%" stopColor="rgba(63,182,139,0.14)" />
              <stop offset="100%" stopColor="rgba(63,182,139,0.02)" />
            </linearGradient>
            <linearGradient id="work-line-gradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#86e7c1" />
              <stop offset="100%" stopColor="#67cbdc" />
            </linearGradient>
            <linearGradient id="work-bar-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(212,192,154,0.46)" />
              <stop offset="100%" stopColor="rgba(212,192,154,0.08)" />
            </linearGradient>
          </defs>

          {activePoints.map((point) => (
            <rect
              key={`${point.time}-active`}
              x={point.x - barWidth / 2}
              y={point.y}
              width={barWidth}
              height={Math.max(baseY - point.y, 12)}
              rx="14"
              fill="url(#work-bar-gradient)"
              stroke="rgba(212,192,154,0.12)"
            />
          ))}

          <path d={areaPath} fill="url(#work-area-gradient)" />
          <path
            d={completedPath}
            fill="none"
            stroke="rgba(63,182,139,0.14)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="10"
          />
          <path
            d={plannedPath}
            fill="none"
            stroke="#7DB3FF"
            strokeDasharray="8 10"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            opacity="0.9"
          />
          <path
            d={completedPath}
            fill="none"
            stroke="url(#work-line-gradient)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.5"
          />

          {completedPoints.map((point, index) => {
            const isPeakAttention = point.time === peakAttention.time;
            const isLastPoint = index === completedPoints.length - 1;

            if (!isPeakAttention && !isLastPoint) {
              return null;
            }

            return (
              <g key={`${point.time}-marker`}>
                <circle cx={point.x} cy={point.y} fill="rgba(11,18,27,0.95)" r="8" />
                <circle cx={point.x} cy={point.y} fill="#86e7c1" r="4.5" />
              </g>
            );
          })}

          {activePoints.map((point) => {
            if (point.attention < 4) {
              return null;
            }

            return (
              <g key={`${point.time}-attention`}>
                <circle cx={point.x} cy={point.y - 12} fill="rgba(243,184,90,0.18)" r="9" />
                <circle cx={point.x} cy={point.y - 12} fill="#f3b85a" r="3.5" />
              </g>
            );
          })}
        </svg>

        <div className="grid grid-cols-8 gap-2 px-2 pb-4 pt-3">
          {workStatusSeries.map((entry) => (
            <div key={`label-${entry.time}`} className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">{entry.time}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="rounded-full border border-[rgba(63,182,139,0.18)] bg-[rgba(63,182,139,0.12)] px-3 py-1.5 text-xs font-semibold text-[#9be6c8]">
          Output trend locked above plan
        </div>
        <div className="rounded-full border border-[rgba(125,179,255,0.18)] bg-[rgba(125,179,255,0.1)] px-3 py-1.5 text-xs font-semibold text-[#9dc4ff]">
          Peak review load {peakAttention.attention} at {peakAttention.time}
        </div>
        <div className="rounded-full border border-[var(--surface-border-soft)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]">
          Current active queue {activeNow}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const tenantSlug = normalizeTenantSlug(formData.get('subdomain') || DEFAULT_TENANT_ID) || DEFAULT_TENANT_ID;

    try {
      await login({
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
        rememberMe: formData.get('remember') === 'on',
        tenantSlug,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen w-full lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-[var(--border)] lg:flex">
        <div className="absolute inset-0 [background:var(--auth-hero-bg)]" />
        <div className="theme-grid-overlay absolute inset-0 opacity-40 [background-size:80px_80px]" />

        <div className="relative z-10 flex w-full flex-col p-10 xl:p-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              FleetTrack Command
            </div>
            <h1 className="mt-8 max-w-lg font-headline text-5xl font-bold leading-tight text-[var(--text)]">
              Precision control for high-volume fleet operations across India.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-muted)]">
              Dispatch, track, and manage your network from one shared operating surface designed for real-world logistics teams across Indian corridors.
            </p>
          </div>

          <div className="mt-10 flex-1">
            <div className="relative h-full min-h-[360px] overflow-hidden rounded-[32px] border border-[var(--hero-shell-border)] bg-[var(--hero-shell-bg)] p-4 shadow-[var(--hero-shell-shadow)]">
              <div className="absolute inset-0 [background:radial-gradient(circle_at_top_right,rgba(125,179,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,var(--accent-glow),transparent_28%)]" />

              <div className="relative grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-[26px] border border-[var(--hero-panel-border)] bg-[var(--hero-panel-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Work Status</p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">A live-style view of completed work, active load, and items needing attention.</p>
                    </div>
                    <span className="rounded-full border border-[rgba(63,182,139,0.24)] bg-[rgba(63,182,139,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8dd6b5]">
                      Status pulse
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[22px] border border-[var(--hero-panel-border)] [background:var(--feature-chart-bg)]">
                    <WorkStatusChart />
                  </div>
                </div>

                <div className="grid gap-3 content-start">
                  {workSignals.map(([title, detail, icon]) => (
                    <div key={title} className="rounded-[24px] border border-[var(--hero-panel-border)] bg-[var(--hero-panel-bg)] p-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-2 text-[18px] text-[var(--accent)]">
                          {icon}
                        </span>
                        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {highlights.map(([value, label]) => (
              <div key={label} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 backdrop-blur">
                <p className="font-headline text-3xl font-bold text-[var(--text)]">{value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text)] lg:hidden">
              <span className="material-symbols-outlined text-[18px] text-[var(--accent)]">hub</span>
              FleetTrack
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Welcome Back</p>
              <h2 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Sign in to your command center</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Use your organization subdomain to restore the saved tenant session and continue where your team left off.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form className="space-y-5" onSubmit={handleLogin}>
                <Field label="Organization Subdomain" hint="This is used to rejoin the correct tenant workspace.">
                  <Input name="subdomain" placeholder="saarthi-logistics" suffix=".fleettrack.io" />
                </Field>

                <Field label="Business Email">
                  <Input name="email" placeholder="name@company.com" type="email" />
                </Field>

                <Field label="Password">
                  <Input
                    name="password"
                    placeholder="Enter your password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    endAdornment={
                      <button
                        type="button"
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-dim)] transition duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isPasswordVisible ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    }
                  />
                </Field>

                {errorMessage ? (
                  <div className="rounded-2xl border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3">
                    <input
                      className="h-4 w-4 rounded border-[var(--border)] bg-[var(--panel-muted)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      id="remember"
                      name="remember"
                      type="checkbox"
                    />
                    Keep me signed in for 30 days
                  </label>
                  <Link className="font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)]" to="/">
                    Forgot password?
                  </Link>
                </div>

                <Button className="w-full justify-center" loading={isSubmitting} size="lg" type="submit">
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-subtle)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Secure Access</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['verified_user', 'Protected sessions'],
                ['encrypted', 'JWT-based auth'],
                ['policy', 'Tenant-aware access'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3">
                  <span className="material-symbols-outlined text-[18px] text-[var(--accent)]">{icon}</span>
                  <span className="text-sm text-[var(--text-muted)]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-[var(--text-muted)] lg:text-left">
            Don&apos;t have an account?
            <Link className="ml-1 font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)]" to="/register">
              Register your business
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
