import React from 'react';

const faqs = [
  'How fast can I get started?',
  'Can I track fleets in real time?',
  'Does FleetTrack support maintenance alerts?',
];

export default function FooterSection() {
  return (
    <footer className="border-t border-white/8 bg-[#07111f] px-4 pb-10 pt-16 text-white sm:px-6 lg:px-10 lg:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">FleetTrack</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
            Fleet operations software built for safer driving, smarter dispatch, and cleaner visibility across every trip.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">FAQ</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            {faqs.map((faq) => (
              <li key={faq}>{faq}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li>support@fleettrack.app</li>
            <li>+1 (555) 014-8824</li>
            <li>Mon - Fri, 9:00 AM - 6:00 PM</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Instagram</p>
          <p className="mt-4 text-sm text-slate-400">@fleettrackhq</p>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Daily updates, product previews, and fleet operations inspiration.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/8 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 FleetTrack. All rights reserved.</p>
        <p>Safety, productivity, and profitability in one place.</p>
      </div>
    </footer>
  );
}