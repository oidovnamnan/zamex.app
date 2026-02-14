'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package, Shield, Star, Truck, Zap,
  ArrowRight, Globe, BarChart3, Clock,
  CheckCircle2, MapPin, Smartphone,
  Search, UserCheck, ChevronRight,
  Boxes, LayoutGrid, Receipt, HeartHandshake,
  Activity, Terminal, Database, LineChart,
  Menu, X, Plus, Warehouse,
  Twitter, Linkedin, Facebook, Github
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import MobileNav from '@/components/MobileNav';

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

export default function Home() {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const runAnimation = (step: number) => {
      setActiveStep(step);
      // Determine duration based on step: 0 and 5 get extra time (holding)
      const duration = (step === 0 || step === 5) ? 6000 : 3500;
      timeout = setTimeout(() => {
        runAnimation((step + 1) % 6);
      }, duration);
    };

    runAnimation(0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-slate-200 overflow-x-hidden">
      {/* 
        =========================================
        DESKTOP LAYOUT (Classic Landing Page)
        =========================================
      */}
      <div className="hidden md:block">
        {/* Navigation - Ultra Minimal */}
        <nav className="fixed top-0 w-full z-50 bg-slate-100/90 backdrop-blur-xl border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#283480] flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <img src="/logo.png" alt="Zamex Logo" className="h-6 w-auto brightness-0 invert" />
                  </div>
                  <span className="text-xl font-black tracking-tighter text-slate-950 uppercase italic">ZAMEX</span>
                </div>
              </Link>

              <div className="hidden lg:flex items-center gap-8 text-[13px] font-bold text-slate-400">
                <Link href="#features" className="hover:text-slate-950 transition-colors">{t.nav.features}</Link>
                <Link href="/companies" className="hover:text-slate-950 transition-colors">{t.nav.carriers}</Link>
                <Link href="/pricing" className="hover:text-slate-100 transition-colors">{t.nav.pricing}</Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div className="flex items-center gap-2">
                <Link href="/auth" className="btn-ghost px-4">{t.nav.login}</Link>
                <Link href="/auth?mode=register" className="btn-primary">
                  {t.nav.getStarted}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-subtle-grid opacity-20 pointer-events-none" />

          {/* Animated Glow Backgrounds */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="max-w-7xl mx-auto px-10 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="badge-minimal mb-10 mx-auto bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-sm px-6 py-2"
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {t.hero.badge}
            </motion.div>

            <motion.h1
              variants={fadeInUp} initial="initial" animate="animate"
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-8xl lg:text-[110px] font-black tracking-[-0.05em] leading-[0.85] mb-12 text-[#283480] text-balance"
            >
              {t.hero.title} <br />
              <span className="text-[#F9BE4A] text-glow">{t.hero.titleAccent}</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp} initial="initial" animate="animate"
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-2xl text-slate-500 font-semibold max-w-2xl mx-auto mb-16 leading-relaxed"
            >
              {t.hero.subtext}
            </motion.p>

            <motion.div
              variants={fadeInUp} initial="initial" animate="animate"
              transition={{ delay: 0.25, duration: 0.8 }}
              className="max-w-3xl mx-auto mb-20 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-amber-500/20 rounded-[32px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
              <div className="relative bg-white/70 backdrop-blur-2xl border border-white rounded-[32px] p-2 shadow-2xl shadow-slate-200/50 flex items-center transition-all duration-500 group-focus-within:border-blue-500/50 group-focus-within:bg-white">
                <div className="flex-1 flex items-center pl-8">
                  <Search className="w-6 h-6 text-slate-400 group-focus-within:text-[#283480] transition-colors" />
                  <input type="text" placeholder={t.hero.trackingPlaceholder}
                    className="w-full bg-transparent h-16 pl-6 rounded-none text-xl font-bold focus:outline-none placeholder:text-slate-300 text-slate-900" />
                </div>
                <button className="h-16 px-12 bg-[#283480] text-white rounded-[26px] text-sm font-black uppercase tracking-[0.2em] hover:bg-[#F9BE4A] hover:text-[#283480] transition-all active:scale-95 shadow-xl shadow-blue-900/20">
                  {t.hero.trackButton}
                </button>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp} initial="initial" animate="animate"
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex gap-6 justify-center"
            >
              <Link href="/auth?mode=register" className="btn-primary h-16 px-12 text-base rounded-[20px] shadow-2xl shadow-blue-900/20 transform hover:-translate-y-1">
                {t.hero.startShipping} <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/companies" className="bg-white/80 backdrop-blur-md text-[#283480] border border-slate-200 h-16 px-12 text-base rounded-[20px] flex items-center justify-center font-extrabold hover:bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1">
                {t.hero.browseNetwork}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="pb-24">
          <div className="max-w-7xl mx-auto px-10">
            <div className="grid grid-cols-4 gap-12 p-12 bg-white/50 backdrop-blur-sm rounded-[40px] border border-white shadow-sm">
              {[
                { label: t.metrics.carriersLabel, value: '60+', desc: t.metrics.carriersDesc, color: 'text-indigo-600' },
                { label: t.metrics.successLabel, value: '99.9%', desc: t.metrics.successDesc, color: 'text-emerald-600' },
                { label: t.metrics.volumeLabel, value: '250k+', desc: t.metrics.volumeDesc, color: 'text-amber-600' },
                { label: t.metrics.transitLabel, value: '4.8d', desc: t.metrics.transitDesc, color: 'text-blue-600' },
              ].map((m, i) => (
                <div key={i} className="text-center group">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-slate-600 transition-colors">{m.label}</div>
                  <div className={`text-5xl font-black mb-2 tracking-tighter ${m.color}`}>{m.value}</div>
                  <div className="text-[11px] font-bold text-slate-400/80">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="pb-16">
          <div className="max-w-7xl mx-auto px-10">
            <div className="max-w-3xl mb-12">
              <h2 className="text-[#283480] text-7xl font-black tracking-[-0.04em] leading-[0.9] text-balance">
                {t.features.title} <br /> <span className="text-[#F9BE4A]">{t.features.titleAccent}</span>
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="grid-card p-12 col-span-2 group">
                <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center mb-10 transition-transform group-hover:scale-110"><Activity className="w-6 h-6" /></div>
                <h3 className="text-3xl font-black text-slate-950 mb-6 tracking-tight">{t.features.realtimeTitle}</h3>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg mb-10">{t.features.realtimeDesc}</p>
                <div className="h-64 bg-slate-50 rounded-[24px] overflow-hidden relative p-6 mt-8">
                  <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                        <div className="text-xs font-bold text-slate-900 tracking-tight">Erlian-Zamiin Uud Port</div>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.features.liveStatus}</div>
                    </div>
                    <div className="relative pt-4">
                      {/* Progress Track Container */}
                      <div className="absolute top-8 left-4 right-4 h-0.5">
                        {/* Background Line */}
                        <div className="absolute inset-0 bg-slate-100" />

                        {/* Animated Progress Line */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(Math.min(activeStep, 5) / 5) * 100}%`,
                            backgroundColor: activeStep >= 5 ? '#10b981' : '#2563eb'
                          }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="absolute inset-0 z-0 origin-left"
                        />
                      </div>

                      <div className="flex justify-between relative z-10">
                        {[
                          { label: t.features.steps.origin, icon: <Boxes className="w-4 h-4" /> },
                          { label: t.features.steps.warehouse, icon: <LayoutGrid className="w-4 h-4" /> },
                          { label: t.features.steps.customs, icon: <Activity className="w-4 h-4" /> },
                          { label: t.features.steps.transit, icon: <Truck className="w-4 h-4" /> },
                          { label: t.features.steps.terminal, icon: <Database className="w-4 h-4" /> },
                          { label: t.features.steps.dest, icon: <MapPin className="w-4 h-4" /> }
                        ].map((step, idx) => {
                          const isDone = idx < activeStep;
                          const isActive = idx === activeStep;
                          const isSuccess = activeStep >= 5; // Define 'isSuccess' as 'activeStep >= 5'
                          const isStepCompleted = idx < 5 ? isDone : activeStep >= 5;

                          return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                              <motion.div
                                animate={{
                                  scale: isActive ? [1, 1.15, 1] : 1,
                                  boxShadow: isActive
                                    ? (isSuccess ? "0px 0px 20px rgba(16, 185, 129, 0.4)" : "0px 0px 15px rgba(37, 99, 235, 0.3)")
                                    : "0px 0px 0px rgba(0,0,0,0)",
                                  backgroundColor: isSuccess
                                    ? "#10B981"
                                    : (isDone ? "#0F172A" : "#FFFFFF"),
                                  borderColor: isSuccess
                                    ? "#10B981"
                                    : (isDone ? "#0F172A" : (isActive ? "#2563EB" : "#E2E8F0")),
                                  color: isSuccess
                                    ? "#FFFFFF"
                                    : (isDone ? "#FFFFFF" : (isActive ? "#2563EB" : "#94A3B8"))
                                }}
                                transition={{
                                  duration: isActive ? 2 : 0.5,
                                  repeat: isActive ? Infinity : 0,
                                  ease: "easeInOut"
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 relative z-10"
                              >
                                {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                              </motion.div>
                              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-500 ${isSuccess ? 'text-emerald-600' : (isActive ? 'text-blue-600' : isDone ? 'text-slate-950' : 'text-slate-400')
                                }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid-card p-12 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-950 flex items-center justify-center mb-10 group-hover:bg-slate-950 group-hover:text-white transition-all"><Shield className="w-6 h-6" /></div>
                  <h3 className="text-3xl font-black text-slate-950 mb-6 tracking-tight">{t.features.customsTitle}</h3>
                  <p className="text-slate-500 text-sm font-semibold leading-relaxed">{t.features.customsDesc}</p>
                </div>
                <div className="mt-8 bg-slate-900/5 rounded-2xl p-5 relative overflow-hidden ring-1 ring-slate-200 group-hover:ring-slate-300 transition-all">
                  {/* Scanning Light Effect */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-20 pointer-events-none"
                  />

                  {/* API Active Header */}
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <motion.div
                          animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-emerald-500"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-800 tracking-tighter uppercase leading-none">CUSTOMS API ACTIVE</span>
                        <span className="text-[8px] font-bold text-emerald-600/70 mt-0.5">LATENCY: 14ms</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-slate-400">HKG-SERVER-01</div>
                      <div className="text-[7px] font-bold text-slate-300 uppercase">Last Sync: Just Now</div>
                    </div>
                  </div>

                  {/* Document List */}
                  <div className="flex flex-col gap-2.5 relative z-10">
                    {[
                      { country: "MN", id: "MN-7702-88", label: "Customs Decl.", status: "SYNCED", time: "12:04:01" },
                      { country: "CN", id: "CN-8890-X1", label: "Export Perm.", status: "VERIFIED", time: "12:03:58" }
                    ].map((doc, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        key={idx}
                        className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-default"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${doc.country === 'MN' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {doc.country}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-400 leading-none">{doc.label}</span>
                              <span className="text-[7px] font-mono text-slate-300 italic">{doc.time}</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-900 mt-1">{doc.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[8px] font-black text-emerald-600 tracking-widest">{doc.status}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid-card p-12 bg-[#1e275f] text-white border-0 group relative overflow-hidden flex flex-col justify-between min-h-[500px]">
                {/* Dynamic Security Background */}
                <div className="absolute inset-0 z-0">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.2, 0.1],
                      x: [0, 50, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/4 -right-1/4 w-full h-full bg-blue-400 rounded-full blur-[100px]"
                  />
                  <motion.div
                    animate={{
                      scale: [1.2, 1, 1.2],
                      opacity: [0.05, 0.15, 0.05],
                      x: [0, -30, 0]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-1/4 -left-1/4 w-full h-full bg-indigo-500 rounded-full blur-[100px]"
                  />
                </div>

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-10 group-hover:bg-[#F9BE4A] group-hover:text-[#1e275f] transition-all shadow-lg"
                  >
                    <Shield className="w-6 h-6" />
                  </motion.div>
                  <h3 className="text-3xl font-black mb-6 tracking-tight text-white/90">{t.features.assetTitle}</h3>
                  <p className="text-white/60 text-sm font-semibold leading-relaxed mb-12">{t.features.assetDesc}</p>
                </div>

                {/* Premium Security Monitor */}
                <div className="relative mt-auto">
                  <div className="bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden ring-1 ring-white/5 shadow-2xl">
                    {/* Scanning Light */}
                    <motion.div
                      animate={{ y: ['-100%', '200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 h-1/3 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent z-20 pointer-events-none"
                    />

                    {/* Monitor Header */}
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                          <motion.div
                            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-emerald-500"
                          />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">ENCRYPTION ACTIVE</span>
                      </div>
                      <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">SECURE-NODE-24</span>
                    </div>

                    {/* Data Stream */}
                    <div className="flex flex-col gap-2 relative z-10 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-blue-400/80">$ auth_handshake --v2</span>
                        <span className="text-[8px] text-white/20 uppercase font-bold">SHA-256</span>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="flex flex-col gap-1">
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 0.5 }}
                            className="text-[9px] text-[#45B69F] truncate leading-none uppercase"
                          >
                            f3b8a1c92e7d4f5g6h7i8j9k0l1m2n3o4p5q6r
                          </motion.div>
                          <motion.div
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 0.7 }}
                            className="text-[9px] text-[#45B69F]/60 truncate leading-none uppercase"
                          >
                            8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid-card p-12 col-span-2 flex flex-col md:flex-row gap-12 group">
                <div className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-xl bg-blue-50 text-[#007AFF] flex items-center justify-center mb-10 shadow-sm"
                  >
                    <LineChart className="w-6 h-6" />
                  </motion.div>
                  <h3 className="text-3xl font-black text-slate-950 mb-6 tracking-tight">{t.features.pricingTitle}</h3>
                  <p className="text-slate-500 text-sm font-semibold leading-relaxed max-w-xs mb-8">{t.features.pricingDesc}</p>

                  {/* Market Stats Mini-tiles */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 italic transition-transform hover:scale-105">
                      <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Index Low (m³)</div>
                      <div className="text-sm font-black text-slate-950">¥380 <span className="text-[10px] text-slate-400">/ m³</span></div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 italic transition-transform hover:scale-105">
                      <div className="text-[8px] font-black text-blue-400 uppercase mb-1">Current (Kg/m³)</div>
                      <div className="text-sm font-black text-blue-600">¥450 <span className="text-[10px] text-blue-400">/ m³</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex-[1.5] bg-white rounded-[32px] p-8 relative overflow-hidden ring-1 ring-slate-100 shadow-xl">
                  {/* Price Indicator Pulse */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl pointer-events-none"
                  />

                  <div className="h-full flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest italic">Live Market Index</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[8px] font-black text-emerald-600 uppercase italic">Market Optimal</span>
                      </div>
                    </div>

                    {/* SVG Line Chart */}
                    <div className="flex-1 relative mt-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
                        {/* Grid Lines */}
                        {[0, 40, 80, 120, 160].map((y) => (
                          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        ))}

                        {/* Area Gradient */}
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Animated Area */}
                        <motion.path
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 1.5 }}
                          d="M0,160 L0,120 C40,110 60,140 100,130 C140,120 160,40 200,60 C240,80 260,100 300,70 C340,40 360,30 400,20 L400,160 Z"
                          fill="url(#priceGradient)"
                        />

                        {/* Animated Path */}
                        <motion.path
                          d="M0,120 C40,110 60,140 100,130 C140,120 160,40 200,60 C240,80 260,100 300,70 C340,40 360,30 400,20"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                        />

                        {/* Current Value Point */}
                        <motion.circle
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 2, duration: 0.5 }}
                          cx="400" cy="20" r="5"
                          fill="#2563eb"
                          stroke="white"
                          strokeWidth="2"
                          className="shadow-xl"
                        />
                        <motion.circle
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: [1, 3], opacity: [0.5, 0] }}
                          transition={{ delay: 2, duration: 2, repeat: Infinity }}
                          cx="400" cy="20" r="5"
                          fill="#2563eb"
                        />
                      </svg>

                      {/* Floating Data Point Badge */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.2 }}
                        className="absolute top-[-40px] right-0 bg-slate-950 text-white px-3 py-1.5 rounded-xl shadow-2xl flex flex-col items-center pointer-events-none"
                      >
                        <span className="text-[10px] font-black italic">¥450 / m³</span>
                        <div className="w-1.5 h-1.5 bg-slate-950 absolute bottom-[-4px] rotate-45" />
                      </motion.div>
                    </div>

                    {/* Timeline Labels */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                      {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Live'].map((label, i) => (
                        <span key={i} className={`text-[8px] font-black uppercase tracking-widest ${label === 'Live' ? 'text-blue-600' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - Super & Categorized */}
        <section className="pb-24 pt-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-10 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#283480] rounded-[48px] p-12 md:p-20 overflow-hidden relative shadow-[0_30px_80px_-15px_rgba(40,52,128,0.3)]"
            >
              {/* Internal Background Pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

              <div className="relative z-10 text-center">
                <div className="max-w-3xl mb-16 mx-auto">
                  <motion.div
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{(t.cta as any).ready}</span>
                  </motion.div>

                  <h2 className="text-4xl md:text-7xl font-black tracking-[-0.04em] leading-[0.9] text-white mb-8 italic uppercase">
                    {t.cta.title} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F9BE4A] via-[#ffe083] to-[#F9BE4A] animate-gradient-x text-glow">
                      {t.cta.titleAccent}
                    </span>
                  </h2>

                  <p className="text-base md:text-xl text-white/50 font-medium max-w-lg leading-relaxed mx-auto">
                    {(t.cta as any).description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 text-center">
                  {/* Customer Path */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <Package className="w-6 h-6 text-amber-400" />
                      </div>
                      <h4 className="text-xl font-black text-white mb-3">{(t.cta as any).customerTitle}</h4>
                      <p className="text-white/40 text-sm font-medium leading-relaxed mb-10">{(t.cta as any).customerDesc}</p>
                    </div>
                    <Link href="/auth?mode=login&role=customer" className="h-14 bg-white text-[#283480] rounded-2xl flex items-center justify-center font-black text-sm uppercase tracking-widest hover:bg-amber-400 transition-all w-full">
                      {(t.cta as any).customerAction}
                    </Link>
                  </motion.div>

                  {/* Cargo Path */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <Warehouse className="w-6 h-6 text-blue-400" />
                      </div>
                      <h4 className="text-xl font-black text-white mb-3">{(t.cta as any).cargoTitle}</h4>
                      <p className="text-white/40 text-sm font-medium leading-relaxed mb-10">{(t.cta as any).cargoDesc}</p>
                    </div>
                    <Link href="/auth?mode=login&role=cargo" className="h-14 bg-white/10 text-white border border-white/20 rounded-2xl flex items-center justify-center font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all w-full">
                      {(t.cta as any).cargoAction}
                    </Link>
                  </motion.div>

                  {/* Transport Path */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <Truck className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4 className="text-xl font-black text-white mb-3">{(t.cta as any).driverTitle}</h4>
                      <p className="text-white/40 text-sm font-medium leading-relaxed mb-10">{(t.cta as any).driverDesc}</p>
                    </div>
                    <Link href="/auth?mode=login&role=driver" className="h-14 bg-white/10 text-white border border-white/20 rounded-2xl flex items-center justify-center font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all w-full">
                      {(t.cta as any).driverAction}
                    </Link>
                  </motion.div>
                </div>

                <div className="pt-12 border-t border-white/10 flex flex-col items-center gap-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#283480] bg-slate-200 overflow-hidden shadow-md">
                        <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="user" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-white/30 font-bold text-[10px] uppercase tracking-[0.2em]">
                    {(t.cta as any).joinedCount}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Compact Super Footer */}
        <footer className="pt-12 pb-8 bg-[#0F172A] text-white relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          <div className="max-w-7xl mx-auto px-10 relative z-10">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Brand & Social */}
              <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                    <img src="/logo.png" alt="Zamex Logo" className="h-5 w-auto brightness-0 invert" />
                  </div>
                  <span className="text-xl font-black tracking-tighter text-white uppercase italic">ZAMEX</span>
                </div>
                <p className="text-white/40 font-medium text-xs leading-relaxed max-w-xs">
                  {t.footer.description}
                </p>
                <div className="flex items-center gap-3">
                  {[Twitter, Linkedin, Facebook, Github].map((Icon, i) => (
                    <button key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#F9BE4A] hover:bg-white/10 hover:border-[#F9BE4A]/30 transition-all">
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Links Sections */}
              <div className="space-y-4">
                <h5 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{t.footer.platform}</h5>
                <ul className="space-y-2">
                  {[
                    { label: t.footer.carrierSearch, href: "#" },
                    { label: t.footer.liveTracking, href: "#" }
                  ].map((link, i) => (
                    <li key={i}>
                      <Link href={link.href} className="text-[11px] font-bold text-white/40 hover:text-[#F9BE4A] transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h5 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{t.footer.resources}</h5>
                <ul className="space-y-2">
                  {[
                    { label: t.footer.apiDocs, href: "#" },
                    { label: t.footer.security, href: "#" }
                  ].map((link, i) => (
                    <li key={i}>
                      <Link href={link.href} className="text-[11px] font-bold text-white/40 hover:text-[#F9BE4A] transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h5 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{t.footer.company}</h5>
                <ul className="space-y-2">
                  {[
                    { label: t.footer.about, href: "#" },
                    { label: t.footer.contact, href: "#" }
                  ].map((link, i) => (
                    <li key={i}>
                      <Link href={link.href} className="text-[11px] font-bold text-white/40 hover:text-[#F9BE4A] transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Centered Newsletter */}
            <div className="max-w-md mx-auto mb-16 space-y-6 pt-12 border-t border-white/5 text-center">
              <div className="space-y-2">
                <h5 className="text-[9px] font-black text-[#F9BE4A] uppercase tracking-[0.2em]">{(t.footer as any).newsletterTitle}</h5>
                <p className="text-[10px] font-bold text-white/30 leading-tight">
                  {(t.footer as any).newsletterDesc}
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={(t.footer as any).newsletterPlaceholder}
                  className="flex-1 h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-[10px] font-bold text-white focus:outline-none focus:border-[#F9BE4A]/30 transition-all min-w-0"
                />
                <button className="whitespace-nowrap px-6 bg-[#F9BE4A] text-[#283480] rounded-lg text-[9px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all">
                  {(t.footer as any).newsletterAction}
                </button>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">{t.footer.copyright}</span>
              <div className="flex items-center gap-6">
                <Link href="#" className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors">{(t.footer as any).privacy}</Link>
                <Link href="#" className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors">{(t.footer as any).terms}</Link>
                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* 
        =========================================
        MOBILE APP LAYOUT (One Screen Dashboard)
        =========================================
      */}
      <div className="block md:hidden h-screen flex flex-col pt-safe bg-slate-100">
        {/* Mobile App Header */}
        <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#283480] flex items-center justify-center shadow-lg shadow-blue-900/10">
              <img src="/logo.png" alt="Zamex Logo" className="h-5 w-auto brightness-0 invert" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#283480] uppercase italic">ZAMEX</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="w-10 h-10 rounded-full bg-[#F9BE4A] flex items-center justify-center font-black text-[#283480] text-sm">S</div>
          </div>
        </header>

        {/* Content Area - Scrollable but tight */}
        <main className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-6">
          {/* Main Action: Tracking */}
          <section>
            <div className="bg-[#283480] rounded-[32px] p-6 shadow-2xl shadow-[#283480]/20 text-white relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-2xl font-black mb-1 tracking-tight">{t.mobile.activeTracking}</h2>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-6">{t.mobile.enterShipmentId}</p>

                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="ZMX-7729..."
                    className="w-full bg-white/10 border border-white/20 h-14 pl-12 pr-4 rounded-2xl text-white placeholder:text-white/20 font-bold focus:outline-none focus:ring-4 focus:ring-white/10"
                  />
                </div>
                <button className="w-full bg-[#F9BE4A] text-[#283480] h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all">
                  {t.mobile.locateButton}
                </button>
              </div>
            </div>
          </section>

          {/* Service Cards - Grid */}
          <section className="grid grid-cols-2 gap-4">
            <Link href="/companies" className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex flex-col gap-4 active:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#283480] flex items-center justify-center border border-slate-100"><Truck className="w-6 h-6" /></div>
              <div>
                <h4 className="text-sm font-black text-[#283480]">{t.mobile.carriers}</h4>
                <p className="text-[10px] font-bold text-slate-400">{t.mobile.carriersDesc}</p>
              </div>
            </Link>
            <Link href="/pricing" className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex flex-col gap-4 active:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#F9BE4A] flex items-center justify-center border border-slate-100"><LineChart className="w-6 h-6" /></div>
              <div>
                <h4 className="text-sm font-black text-[#283480]">{t.mobile.marketPrices}</h4>
                <p className="text-[10px] font-bold text-slate-400">{t.mobile.marketPricesDesc}</p>
              </div>
            </Link>
            <Link href="/insurance" className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex flex-col gap-4 active:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#45B69F] flex items-center justify-center border border-slate-100"><Shield className="w-6 h-6" /></div>
              <div>
                <h4 className="text-sm font-black text-[#283480]">{t.mobile.insurance}</h4>
                <p className="text-[10px] font-bold text-slate-400">{t.mobile.insuranceDesc}</p>
              </div>
            </Link>
            <button className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex flex-col gap-4 active:bg-slate-50 transition-colors text-left w-full">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-100"><LayoutGrid className="w-6 h-6" /></div>
              <div>
                <h4 className="text-sm font-black text-[#283480]">{t.mobile.allServices}</h4>
                <p className="text-[10px] font-bold text-slate-400">{t.mobile.allServicesDesc}</p>
              </div>
            </button>
          </section>

          {/* Stats Bar */}
          <section className="bg-white rounded-[28px] border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-[#283480] uppercase tracking-[0.2em]">{t.mobile.metricSnapshot}</h4>
              <Activity className="w-4 h-4 text-[#45B69F]" />
            </div>
            <div className="space-y-4">
              {[
                { label: t.mobile.successRate, value: "99.9%", color: "bg-[#45B69F]" },
                { label: t.mobile.transitAvg, value: "5.2d", color: "bg-[#283480]" }
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{stat.label}</span>
                  <span className="text-sm font-black text-[#283480]">{stat.value}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
