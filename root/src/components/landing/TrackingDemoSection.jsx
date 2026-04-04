import React from 'react';
import { motion } from 'framer-motion';
import { viewport } from './animations';

const routePaths = [
  {
    id: 'west-route',
    color: '#3b82f6',
    points: [
      { x: 12, y: 76 },
      { x: 20, y: 68 },
      { x: 30, y: 58 },
      { x: 40, y: 52 },
      { x: 47, y: 45 },
      { x: 56, y: 35 },
    ],
  },
  {
    id: 'central-route',
    color: '#22d3ee',
    points: [
      { x: 24, y: 80 },
      { x: 34, y: 69 },
      { x: 42, y: 60 },
      { x: 50, y: 50 },
      { x: 60, y: 40 },
      { x: 70, y: 30 },
    ],
  },
  {
    id: 'east-route',
    color: '#60a5fa',
    points: [
      { x: 44, y: 74 },
      { x: 54, y: 67 },
      { x: 62, y: 62 },
      { x: 72, y: 55 },
      { x: 81, y: 48 },
      { x: 90, y: 40 },
    ],
  },
];

const activePath = [
  { x: 20, y: 68 },
  { x: 30, y: 58 },
  { x: 41, y: 57 },
  { x: 51, y: 48 },
  { x: 60, y: 40 },
  { x: 70, y: 30 },
];

function polylinePoints(points) {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function vehicleFrames(points) {
  return {
    left: points.map((p) => `${p.x}%`),
    top: points.map((p) => `${p.y}%`),
  };
}

export default function TrackingDemoSection() {
  const vehicleTrack = vehicleFrames(activePath);

  return (
    <section id="tracking" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Live Tracking Demo</p>
          <h2 className="mt-3 text-4xl font-black text-slate-900 sm:text-5xl">
            Interactive fleet map with motion-driven detail.
          </h2>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.aside
            initial={{ opacity: 0, x: -26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3 rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Live Demo Preview</p>
            <h3 className="text-2xl font-black text-slate-900">Real-time visibility with smoother motion signals.</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              The preview now focuses on one active control stream instead of tabs, with clearer animation that makes route velocity and direction easier to read.
            </p>
            <div className="grid gap-3 pt-2 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">ETA Window</p>
                <p className="mt-1 text-xl font-black text-slate-900">03:18</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active Utilization</p>
                <p className="mt-1 text-xl font-black text-slate-900">96%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Route Stability</p>
                <p className="mt-1 text-xl font-black text-slate-900">High</p>
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, x: 26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6"
          >
            <div className="relative h-[400px] overflow-hidden rounded-[1.3rem] border border-white/15 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.18),transparent_32%),linear-gradient(145deg,#0a1220,#111b2f)]">
              <motion.div
                animate={{ scale: [1.08, 1.12, 1.08], x: [0, -10, 0], y: [-6, 6, -6] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[size:34px_34px] opacity-30" />

                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                  {routePaths.map((route) => {
                    return (
                      <g key={route.id}>
                        <polyline
                          points={polylinePoints(route.points)}
                          fill="none"
                          stroke={route.color}
                          strokeOpacity={0.42}
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {route.points.map((point, idx) => (
                          <circle
                            key={`${route.id}-${idx}`}
                            cx={point.x}
                            cy={point.y}
                            r="0.45"
                            fill={route.color}
                            fillOpacity="0.5"
                          />
                        ))}
                      </g>
                    );
                  })}

                  <motion.polyline
                    points={polylinePoints(activePath)}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="2 1"
                    initial={{ pathLength: 0.08, opacity: 0.4 }}
                    animate={{ pathLength: 1, opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </svg>

                <motion.div
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-cyan-300"
                  style={{
                    boxShadow: '0 0 18px rgba(34,211,238,0.9), 0 0 30px rgba(34,211,238,0.7)',
                    left: `${activePath[0].x}%`,
                    top: `${activePath[0].y}%`,
                  }}
                  animate={{ left: vehicleTrack.left, top: vehicleTrack.top }}
                  transition={{ duration: 7.6, repeat: Infinity, ease: 'linear' }}
                />

                <motion.div
                  className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70"
                  style={{ left: '70%', top: '30%' }}
                  animate={{ scale: [0.7, 1.7, 0.7], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="absolute bottom-4 left-4 right-4 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Live Demo Preview</p>
                    <p className="mt-1 text-lg font-black text-slate-900">Central Fleet Corridor</p>
                  </div>
                  <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">
                    ETA 03:18
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
