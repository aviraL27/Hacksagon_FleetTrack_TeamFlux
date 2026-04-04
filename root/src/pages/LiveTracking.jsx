import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import DEMO_FLEETS from '../data/fleetRoutes';
import { buildTrail, haversineDistance, interpolateRoute } from '../utils/routeInterpolation';

// ── Map Constants ──────────────────────────────────────────────────────────────

const DEFAULT_CENTER = [22.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTRIBUTION = '&copy; Esri, HERE, Garmin, USGS, NGA';
const ANIMATION_DURATION_MS = 1_200_000; // 20 minutes per route
const UI_SYNC_INTERVAL_MS = 180;
const RESET_PAUSE_MS = 3000;

const REGION_LABELS = [
  { name: 'Delhi NCR', position: [28.6139, 77.209] },
  { name: 'Mumbai', position: [19.076, 72.8777] },
  { name: 'Bengaluru', position: [12.9716, 77.5946] },
  { name: 'Hyderabad', position: [17.385, 78.4867] },
  { name: 'Chennai', position: [13.0827, 80.2707] },
  { name: 'Kolkata', position: [22.5726, 88.3639] },
];

const CORRIDOR_CHIPS = [
  { label: 'North', detail: 'Delhi → Jaipur' },
  { label: 'West', detail: 'Mumbai → Pune' },
  { label: 'South', detail: 'Bengaluru → Chennai' },
  { label: 'Central', detail: 'Hyderabad → Nagpur' },
  { label: 'East', detail: 'Kolkata → Bhubaneswar' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFleetColor(tone) {
  if (tone === 'warning') return '#f3b85a';
  if (tone === 'success') return '#3fb68b';
  if (tone === 'info') return '#7db3ff';
  return '#d4c09a';
}

function createFleetIcon(tone, isSelected) {
  const activeTone = isSelected ? 'accent' : tone;
  const extra = isSelected ? 'tracking-marker--selected tracking-marker--pulse' : '';
  return L.divIcon({
    className: 'tracking-marker-shell',
    html: `<div class="tracking-marker tracking-marker--${activeTone} ${extra}"><span class="material-symbols-outlined">local_shipping</span></div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 48],
    popupAnchor: [0, -42],
  });
}

function createInitialStates() {
  const states = {};
  DEMO_FLEETS.forEach((fleet) => {
    const progress = 0.05 + Math.random() * 0.15;
    states[fleet.id] = {
      progress,
      position: interpolateRoute(fleet.waypoints, progress),
      status: 'Moving',
    };
  });
  return states;
}

// ── FleetInfoCard ──────────────────────────────────────────────────────────────

function FleetInfoCard({ fleet, progress, onClose }) {
  if (!fleet) return null;
  const status = progress >= 1 ? 'Reached' : 'Moving';
  const pct = Math.min(100, Math.round(progress * 100));

  return (
    <div className="pointer-events-auto absolute right-6 top-6 z-[600] w-72">
      <div className="fleet-info-card rounded-3xl border border-[var(--map-border)] bg-[var(--map-surface-muted)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--map-text-dim)]">Selected Fleet</p>
            <p className="mt-1 font-headline text-lg font-bold text-[var(--map-text)]">{fleet.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--map-border)] bg-[var(--map-chip-bg)] text-[var(--map-text-muted)] transition-colors hover:text-[var(--map-text)]"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {[
            ['Route', `${fleet.from} → ${fleet.to}`],
            ['Driver', fleet.driver],
            ['Vehicle', fleet.vehicle],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-[var(--map-text-muted)]">{label}</span>
              <span className="font-semibold text-[var(--map-text)]">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--map-text-muted)]">Status</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === 'Reached' ? 'status-chip--success' : 'status-chip--info'}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-[var(--map-text-muted)]">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--progress-track)]">
            <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FleetMap ───────────────────────────────────────────────────────────────────

function FleetMap({ isLightTheme, selectedFleetId, onSelectFleet, fleetStates }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const markerLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const regionLayerRef = useRef(null);
  const markersRef = useRef({});
  const routePolysRef = useRef({});
  const trailPolysRef = useRef({});
  const selectRef = useRef(onSelectFleet);
  selectRef.current = onSelectFleet;

  // Init map (once)
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return undefined;

    const map = L.map(mapElRef.current, {
      attributionControl: true,
      center: DEFAULT_CENTER,
      preferCanvas: true,
      scrollWheelZoom: true,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    tileRef.current = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 18,
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    regionLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    REGION_LABELS.forEach(({ name, position }) => {
      L.marker(position, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'tracking-region-shell',
          html: `<span class="tracking-region-badge">${name}</span>`,
          iconAnchor: [0, 0],
        }),
      }).addTo(regionLayerRef.current);
    });

    DEMO_FLEETS.forEach((fleet) => {
      const color = getFleetColor(fleet.markerTone);

      routePolysRef.current[fleet.id] = L.polyline(fleet.waypoints, {
        color,
        dashArray: '4 8',
        opacity: 0.3,
        weight: 2,
      }).addTo(routeLayerRef.current);

      trailPolysRef.current[fleet.id] = L.polyline([], {
        color,
        opacity: 0.85,
        weight: 4,
      }).addTo(routeLayerRef.current);

      const marker = L.marker(fleet.waypoints[0], {
        icon: createFleetIcon(fleet.markerTone, false),
        keyboard: false,
      });

      marker.on('click', () => selectRef.current(fleet.id));
      marker.addTo(markerLayerRef.current);
      markersRef.current[fleet.id] = marker;
    });

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapElRef.current);
    map.whenReady(() => requestAnimationFrame(() => map.invalidateSize()));

    return () => {
      ro.disconnect();
      markerLayerRef.current?.clearLayers();
      routeLayerRef.current?.clearLayers();
      regionLayerRef.current?.clearLayers();
      map.off();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Theme swap — tiles are the same for both modes; dark is handled via CSS filter

  // Sync Leaflet objects to React state
  useEffect(() => {
    DEMO_FLEETS.forEach((fleet) => {
      const st = fleetStates[fleet.id];
      if (!st) return;

      const marker = markersRef.current[fleet.id];
      if (marker) {
        marker.setLatLng(st.position);
        marker.setIcon(createFleetIcon(fleet.markerTone, selectedFleetId === fleet.id));
      }

      const trail = trailPolysRef.current[fleet.id];
      if (trail) trail.setLatLngs(buildTrail(fleet.waypoints, st.progress));

      const route = routePolysRef.current[fleet.id];
      if (route) {
        const sel = selectedFleetId === fleet.id;
        route.setStyle({ opacity: sel ? 0.6 : 0.25, weight: sel ? 4 : 2, dashArray: sel ? '8 12' : '4 8' });
      }
    });
  }, [fleetStates, selectedFleetId]);

  // FlyTo on selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedFleetId) {
      const st = fleetStates[selectedFleetId];
      if (st) map.flyTo(st.position, 8, { duration: 1.2 });
    } else {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1 });
    }
  }, [selectedFleetId]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)]">
      <div className="tracking-map-overlay pointer-events-none absolute inset-0 z-[350]" />
      <div ref={mapElRef} className="tracking-map-canvas h-[500px] w-full sm:h-[620px] xl:h-[720px]" />

      <div className="absolute bottom-6 left-6 z-[500] flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomIn()}>
          <span className="material-symbols-outlined text-base">add</span>
        </Button>
        <Button variant="secondary" size="icon" onClick={() => mapRef.current?.zoomOut()}>
          <span className="material-symbols-outlined text-base">remove</span>
        </Button>
        <Button variant="secondary" size="icon" onClick={() => { onSelectFleet(null); mapRef.current?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1 }); }}>
          <span className="material-symbols-outlined text-base">my_location</span>
        </Button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-6">
        <div className="pointer-events-auto z-[500] flex flex-wrap justify-center gap-2 rounded-full border border-[var(--map-border)] bg-[var(--map-surface-overlay)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur">
          {CORRIDOR_CHIPS.map((c) => (
            <div key={c.label} className="rounded-full border border-[var(--map-border)] bg-[var(--map-chip-bg)] px-3 py-1.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{c.label}</p>
              <p className="mt-1 text-xs text-[var(--map-text-muted)]">{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LiveTracking() {
  const { isLightTheme } = useTheme();
  const [selectedFleetId, setSelectedFleetId] = useState(null);
  const [fleetStates, setFleetStates] = useState(createInitialStates);
  const animRef = useRef(null);
  const rafRef = useRef(null);
  const lastSyncRef = useRef(0);

  // RAF animation loop
  useEffect(() => {
    animRef.current = {};
    DEMO_FLEETS.forEach((fleet) => {
      const s = fleetStates[fleet.id];
      animRef.current[fleet.id] = { progress: s.progress, status: s.status, resetAt: 0 };
    });

    let lastTime = performance.now();

    function tick(now) {
      const dt = now - lastTime;
      lastTime = now;
      let dirty = false;

      DEMO_FLEETS.forEach((fleet) => {
        const a = animRef.current[fleet.id];

        if (a.status === 'Reached') {
          if (!a.resetAt) a.resetAt = now;
          if (now - a.resetAt > RESET_PAUSE_MS) {
            a.progress = 0;
            a.status = 'Moving';
            a.resetAt = 0;
            dirty = true;
          }
          return;
        }

        a.progress = Math.min(1, a.progress + (fleet.speed * dt) / ANIMATION_DURATION_MS);
        if (a.progress >= 1) a.status = 'Reached';
        dirty = true;
      });

      if (dirty && now - lastSyncRef.current > UI_SYNC_INTERVAL_MS) {
        lastSyncRef.current = now;
        const snap = {};
        DEMO_FLEETS.forEach((fleet) => {
          const a = animRef.current[fleet.id];
          snap[fleet.id] = {
            progress: a.progress,
            position: interpolateRoute(fleet.waypoints, a.progress),
            status: a.status,
          };
        });
        setFleetStates(snap);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const handleSelect = useCallback((id) => {
    setSelectedFleetId((prev) => (prev === id ? null : id));
  }, []);

  const selectedFleet = DEMO_FLEETS.find((f) => f.id === selectedFleetId);
  const selectedProgress = selectedFleetId ? fleetStates[selectedFleetId]?.progress ?? 0 : 0;
  const movingCount = Object.values(fleetStates).filter((s) => s.status === 'Moving').length;
  const reachedCount = Object.values(fleetStates).filter((s) => s.status === 'Reached').length;

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Telemetry</p>
        <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Live Tracking</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          Monitor 5 fleet vehicles moving across India in real time. Click any marker to zoom in and track its animated journey.
        </p>
      </section>

      {/* ── Map Card ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-5 border-b border-[var(--border)] lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Fleet Map</CardTitle>
              <CardDescription>All fleet vehicles animate in real time. Click a marker to zoom in and view details.</CardDescription>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-[540px]">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Moving</p>
                <p className="mt-2 font-headline text-2xl font-bold text-[var(--info)]">{movingCount}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Reached</p>
                <p className="mt-2 font-headline text-2xl font-bold text-[var(--success)]">{reachedCount}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">Total</p>
                <p className="mt-2 font-headline text-2xl font-bold text-[var(--text)]">5</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="mx-auto w-full max-w-[1360px]">
              <div className="relative">
                <FleetMap isLightTheme={isLightTheme} selectedFleetId={selectedFleetId} onSelectFleet={handleSelect} fleetStates={fleetStates} />

                {/* Map status overlay */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-start p-6">
                  <div className="pointer-events-auto w-full max-w-sm rounded-3xl border border-[var(--map-border)] bg-[var(--map-surface-muted)] p-4 shadow-[var(--shadow-soft)] backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--map-text-dim)]">Map Status</p>
                    <p className="mt-2 text-sm text-[var(--map-text-muted)]">{movingCount} fleets moving across the India network</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--signal-success)]">● Live Animation Active</p>
                  </div>
                </div>

                {selectedFleet && <FleetInfoCard fleet={selectedFleet} progress={selectedProgress} onClose={() => setSelectedFleetId(null)} />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Fleet Cards ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Fleet Overview</CardTitle>
              <CardDescription>Click any fleet card to track it on the map above.</CardDescription>
            </div>
            {selectedFleetId && (
              <Button variant="ghost" onClick={() => setSelectedFleetId(null)}>
                <span className="material-symbols-outlined mr-1 text-base">close</span>
                Deselect
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {DEMO_FLEETS.map((fleet) => {
                const st = fleetStates[fleet.id];
                const isSel = selectedFleetId === fleet.id;
                const pct = Math.round((st?.progress ?? 0) * 100);

                return (
                  <button
                    key={fleet.id}
                    onClick={() => handleSelect(fleet.id)}
                    className={`cursor-pointer rounded-2xl border p-4 text-left transition-all duration-300 ${
                      isSel
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-lg shadow-[var(--accent-glow)]'
                        : 'border-[var(--border)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--accent)]">{fleet.name}</p>
                        <p className="mt-1 text-sm text-[var(--text)]">{fleet.driver}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st?.status === 'Reached' ? 'status-chip--success' : 'status-chip--info'}`}>
                        {st?.status ?? 'Moving'}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-[var(--text-muted)]">
                      <div className="flex items-center justify-between">
                        <span>Route</span>
                        <span className="font-semibold text-[var(--text)]">{fleet.from} → {fleet.to}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Vehicle</span>
                        <span className="font-semibold text-[var(--text)]">{fleet.vehicle}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Progress</span>
                          <span className="font-semibold text-[var(--text)]">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--progress-track)]">
                          <div
                            className="h-full rounded-full transition-all duration-200"
                            style={{ width: `${pct}%`, backgroundColor: st?.status === 'Reached' ? 'var(--success)' : 'var(--accent)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
