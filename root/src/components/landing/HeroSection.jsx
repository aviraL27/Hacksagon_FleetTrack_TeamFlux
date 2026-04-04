import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroVideo from '../../assets/herovideo.mp4';
import heroTruckImg from '../../assets/hero-truck.png';

export default function HeroSection() {
  return (
    <section id="hero" className="relative scroll-mt-28 overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-10 lg:pb-28 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(49,107,255,0.22),transparent_42%),radial-gradient(circle_at_70%_20%,rgba(45,212,191,0.12),transparent_28%)]" />
        <div className="absolute left-1/2 top-16 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#1c2d5f]/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#07111f] to-transparent" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <h1
            className="text-4xl font-bold leading-[1.18] text-white sm:text-5xl lg:text-[4.05rem]"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: '0' }}
          >
            App that makes your operations safer and more efficient.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
            One platform to help improve the <span className="font-semibold text-slate-100">Safety</span>, <span className="font-semibold text-slate-100">Productivity</span>, and <span className="font-semibold text-slate-100">Profitability</span> of your operations.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center rounded-xl bg-[#316bff] px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_36px_rgba(49,107,255,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#275bf0] hover:shadow-[0_20px_42px_rgba(49,107,255,0.42)]"
            >
              Get started
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[640px]"
        >
          <div className="absolute -inset-4 rounded-[2rem] border border-[#2d5ff0]/40 border-dashed opacity-70" />
          <div className="relative rounded-[1.9rem] border border-white/10 bg-[#08111d] p-3 shadow-[0_36px_80px_rgba(0,0,0,0.42)]">
            <div className="relative overflow-hidden rounded-[1.55rem] border border-white/8 bg-black">
              <video
                className="h-[360px] w-full object-cover sm:h-[430px] lg:h-[500px]"
                autoPlay
                loop
                muted
                playsInline
                poster={heroTruckImg}
              >
                <source src={heroVideo} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,30,0.04)_0%,rgba(7,16,30,0.2)_100%)]" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
