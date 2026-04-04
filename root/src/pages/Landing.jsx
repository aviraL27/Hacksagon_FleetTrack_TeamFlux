import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TrackingDemoSection from '../components/landing/TrackingDemoSection';
import StatsSection from '../components/landing/StatsSection';
import FooterSection from '../components/landing/FooterSection';

export default function Landing() {
  const { hasHydrated, isAuthenticated } = useAuth();

  if (!hasHydrated) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div
      className="min-h-screen bg-[#07111f] text-white"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <LandingNavbar />

      <main>
        <HeroSection />
        <section className="bg-white pb-6 pt-16 text-slate-900">
          <FeaturesSection />
          <TrackingDemoSection />
          <StatsSection />
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
