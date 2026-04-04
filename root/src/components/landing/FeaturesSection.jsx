import React from 'react';
import { motion } from 'framer-motion';
import driverSafetyImg from '../../assets/driver-safety.png';
import fleetManagementImg from '../../assets/fleet-management.png';
import equipmentMonitoringImg from '../../assets/equipment-monitoring.png';
import workforceManagementImg from '../../assets/workforce-management.png';
import { slideInLeft, slideInRight, viewport } from './animations';

const features = [
  {
    id: 'feature-ops',
    title: 'Operational Clarity Across Every Route',
    body: 'Track fleet status, delays, and routing quality in one adaptive command surface designed for rapid decision-making.',
    image: fleetManagementImg,
    icon: 'local_shipping',
    kpi: '94.6% route adherence',
  },
  {
    id: 'feature-safety',
    title: 'Safety Intelligence That Prevents Incidents',
    body: 'Analyze driver behavior, vehicle signals, and risk patterns continuously to reduce incidents before they happen.',
    image: driverSafetyImg,
    icon: 'shield',
    kpi: '31% fewer safety alerts',
  },
  {
    id: 'feature-assets',
    title: 'Asset Monitoring for High-Value Equipment',
    body: 'Use geofences, utilization models, and service health to protect and optimize every moving asset in your network.',
    image: equipmentMonitoringImg,
    icon: 'precision_manufacturing',
    kpi: '18% lower downtime',
  },
  {
    id: 'feature-workforce',
    title: 'Workforce Control at Scale',
    body: 'Coordinate shifts, certifications, and productivity with modern team workflows your operators can actually use.',
    image: workforceManagementImg,
    icon: 'groups',
    kpi: '98.7% compliance',
  },
];

function FeatureRow({ feature, reverse }) {
  return (
    <article className="grid items-center gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:grid-cols-2 lg:gap-16 lg:p-12">
      <motion.div
        variants={reverse ? slideInRight : slideInLeft}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className={reverse ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}
      >
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-100 to-indigo-100">
          <span className="material-symbols-outlined text-[22px] text-cyan-700">{feature.icon}</span>
        </div>
        <h3 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">{feature.title}</h3>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">{feature.body}</p>
        <p className="mt-6 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-sm font-bold text-cyan-700">
          {feature.kpi}
        </p>
      </motion.div>

      <motion.div
        variants={reverse ? slideInLeft : slideInRight}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className={reverse ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}
      >
        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 shadow-[0_20px_40px_rgba(15,23,42,0.1)]">
          <img src={feature.image} alt={feature.title} className="h-[300px] w-full object-cover sm:h-[380px]" />
        </div>
      </motion.div>
    </article>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-700"
        >
          Product Story
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-4 max-w-3xl text-center text-4xl font-black leading-tight text-slate-900 sm:text-5xl"
        >
          Built as a smooth, scroll-first command experience.
        </motion.h2>

        <div className="mt-14 space-y-10">
          {features.map((feature, index) => (
            <FeatureRow key={feature.id} feature={feature} reverse={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
