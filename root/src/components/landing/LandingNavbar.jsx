import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50 bg-transparent px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between bg-transparent px-4 py-3 sm:px-6">
        <button
          type="button"
          className={`text-xl font-black tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}
          onClick={() => scrollToSection('hero')}
        >
          <span className="italic">FleetTrack</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={`hidden rounded-full px-4 py-2 text-sm font-medium transition duration-200 sm:inline-flex ${
              scrolled
                ? 'text-slate-700 hover:text-slate-900'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex rounded-full bg-[#316bff] px-5 py-2 text-sm font-bold text-white transition duration-300 hover:scale-[1.03] hover:bg-[#2d5ff0] hover:shadow-[0_14px_30px_rgba(49,107,255,0.32)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
