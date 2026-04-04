import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'framer-motion';
import { viewport } from './animations';

const stats = [
  { label: 'Fleets Tracked', value: 1240, suffix: '+' },
  { label: 'Operational Uptime', value: 99.98, suffix: '%' },
  { label: 'Daily Trips Optimized', value: 48800, suffix: '+' },
  { label: 'Avg. Dispatch Speed', value: 2.8, suffix: 'x' },
];

function formatValue(value) {
  if (value >= 1000) {
    return Math.round(value).toLocaleString();
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.00$/, '');
}

function CountUpStat({ label, value, suffix }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.45 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return undefined;

    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
  }, [isInView, value]);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center shadow-[0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <p className="text-4xl font-black text-slate-900 sm:text-5xl">
        {formatValue(display)}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">{label}</p>
    </motion.article>
  );
}

export default function StatsSection() {
  return (
    <section id="stats" className="scroll-mt-28 px-4 pb-20 pt-16 sm:px-6 lg:px-10 lg:pb-28 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-4xl font-black text-slate-900 sm:text-5xl"
        >
          Reliable infrastructure. Measurable outcomes.
        </motion.h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <CountUpStat key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
