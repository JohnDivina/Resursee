'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { WavyBackground } from '@/components/ui/wavy-background';
import {
  Code,
  Cpu,
  Sparkle,
  GithubLogo,
  EnvelopeSimple,
  ArrowSquareOut,
  TerminalWindow,
  RocketLaunch,
  CheckCircle,
  Lightning,
  TreeStructure,
  ShieldCheck,
  DeviceMobile,
  Globe,
  Database,
  BracketsAngle,
} from '@phosphor-icons/react';
import Link from 'next/link';

export default function AboutPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('divina.johnreyl@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const techStack = [
    { name: 'Next.js 16 (App Router)', category: 'Frontend & Architecture', icon: Globe, highlight: true },
    { name: 'TypeScript', category: 'Language', icon: BracketsAngle, highlight: true },
    { name: 'React 19', category: 'UI Framework', icon: Code, highlight: false },
    { name: 'Tailwind CSS', category: 'Styling & Design System', icon: Sparkle, highlight: false },
    { name: 'Supabase & PostgreSQL', category: 'Database & Realtime', icon: Database, highlight: true },
    { name: 'ESP32 & C/C++', category: 'Embedded & IoT Systems', icon: Cpu, highlight: true },
    { name: 'Google Gemini & AI SDK', category: 'Multimodal AI & Vision', icon: Lightning, highlight: true },
    { name: 'Python', category: 'Data & Backend Automation', icon: TerminalWindow, highlight: false },
    { name: 'WebSockets & MQTT', category: 'Real-time Telemetry', icon: TreeStructure, highlight: false },
    { name: 'Security & RLS', category: 'Row Level Security & Hardening', icon: ShieldCheck, highlight: false },
  ];

  const coreFocusAreas = [
    {
      title: 'Full-Stack Web & SaaS Ecosystems',
      description:
        'Building lightning-fast, high-performance web applications with Next.js, Supabase, and custom micro-interactions that feel alive and responsive.',
      icon: RocketLaunch,
      color: 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/20',
    },
    {
      title: 'Multimodal AI & Intelligent Vision',
      description:
        'Harnessing state-of-the-art vision models and LLMs to solve real-world problems—from botanical disease diagnostics to autonomous workflows.',
      icon: Sparkle,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'IoT & Real-Time Hardware Telemetry',
      description:
        'Bridging the physical and digital worlds with ESP32 microcontrollers, live sensor pipelines, cloud telemetry dashboards, and remote actuation.',
      icon: Cpu,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: 'Zero-Install Browser Utilities',
      description:
        'Engineering 100% private, client-side browser tools for image transformation, document manipulation, and instant developer productivity.',
      icon: DeviceMobile,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  ];

  const works = [
    {
      title: 'Resursee Productivity Toolbox',
      badge: 'Live Tool Suite',
      description: 'Client-side image processing, PDF extractors, dimension scalers, and format converters running with 100% privacy in browser memory.',
      link: '/tools',
      actionText: 'Launch Tools',
    },
    {
      title: 'Plant Doctor AI Vision',
      badge: 'In Development',
      description: 'Instant botanical disease, pest, and nutrient deficiency diagnosis with structured treatment recommendations via Gemini multimodal AI.',
      link: '#',
      actionText: 'Coming Soon',
    },
    {
      title: 'Resursee IoT Cloud Platform',
      badge: 'In Development',
      description: 'Arduino Cloud-style multi-tenant telemetry hub for ESP32 devices with zero-friction pairing, live graphs, and remote switches.',
      link: '#',
      actionText: 'Coming Soon',
    },
  ];

  return (
    <WavyBackground
      isFixed={true}
      colors={['#2563eb', '#38bdf8', '#1d4ed8', '#0284c7', '#60a5fa']}
      waveOpacity={0.32}
      blur={10}
      speed="fast"
      containerClassName="min-h-screen bg-[var(--color-paper)]"
    >
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette isOpen={searchPaletteOpen} onClose={() => setSearchPaletteOpen(false)} />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
        {/* 1. Hero Profile Header */}
        <section className="relative flex flex-col items-start md:flex-row md:items-center justify-between gap-8 rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)]/80 backdrop-blur-xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for collaborations & new builds</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-ink)]">
              Hi, I&apos;m <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">John Rey Divina</span>.
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-ink-muted)] leading-relaxed">
              Product Engineer, Full-Stack Developer & Embedded Systems Explorer. I design and build high-performance web applications, intelligent AI tools, and connected hardware platforms.
            </p>

            {/* Social & Contact Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://github.com/JohnDivina"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2 text-xs font-bold text-[var(--color-ink)] shadow-2xs transition-all hover:bg-[var(--color-paper-card)] hover:border-[var(--color-rule-strong)] active:scale-95 cursor-pointer"
              >
                <GithubLogo size={16} weight="bold" />
                <span>GitHub</span>
                <ArrowSquareOut size={12} className="opacity-60 group-hover:opacity-100" />
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="group flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <CheckCircle size={16} weight="bold" className="text-emerald-300" />
                    <span>Email Copied!</span>
                  </>
                ) : (
                  <>
                    <EnvelopeSimple size={16} weight="bold" />
                    <span>Get in Touch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Avatar / Visual Squircle */}
          <div className="relative flex h-32 w-32 sm:h-40 sm:w-40 shrink-0 items-center justify-center rounded-[28px] border-2 border-[var(--color-rule)] bg-gradient-to-br from-blue-600/10 via-sky-500/10 to-indigo-600/10 p-4 shadow-xl">
            <span className="text-6xl sm:text-7xl select-none">🦦</span>
            <div className="absolute -bottom-2 -right-2 rounded-full bg-[var(--color-paper-card)] border border-[var(--color-rule)] p-2 shadow-md text-sm">
              🚀
            </div>
          </div>
        </section>

        {/* 2. Core Focus Pillars */}
        <section className="mt-16 space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              What I Build & Explore
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Bridging modern web architectures, edge artificial intelligence, and physical IoT hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {coreFocusAreas.map((area, idx) => {
              const Icon = area.icon;
              return (
                <div
                  key={idx}
                  className="group flex flex-col justify-between rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)]/80 backdrop-blur-md p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 hover:border-[var(--color-rule-strong)] hover:shadow-lg"
                >
                  <div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] border ${area.color} shadow-xs`}>
                      <Icon size={24} weight="bold" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[var(--color-ink)] tracking-tight">
                      {area.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed">
                      {area.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Tech Stack Matrix */}
        <section className="mt-16 space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Technical Stack & Tooling
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              The frameworks, cloud services, and languages I use to build scalable products.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)]/80 backdrop-blur-xs p-4 text-center shadow-xs transition-all hover:border-[var(--color-rule-strong)] hover:scale-105"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--color-paper-muted)] text-[var(--color-primary)]">
                    <Icon size={20} weight="bold" />
                  </div>
                  <span className="mt-2.5 text-xs font-bold text-[var(--color-ink)] line-clamp-1">
                    {tech.name}
                  </span>
                  <span className="mt-0.5 text-[10px] font-mono text-[var(--color-ink-muted)] line-clamp-1">
                    {tech.category}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Applications & Platform Ecosystem */}
        <section className="mt-16 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                The Resursee Ecosystem
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                Unified suite of tools and applications built directly into this platform.
              </p>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-[var(--color-primary)] hover:underline"
            >
              Back to Hub
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {works.map((work, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)]/80 backdrop-blur-md p-6 shadow-xs transition-all hover:border-[var(--color-rule-strong)]"
              >
                <div>
                  <span className="rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-mono text-[10.5px] font-bold text-[var(--color-ink-secondary)]">
                    {work.badge}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[var(--color-ink)]">
                    {work.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    {work.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-rule-subtle)]">
                  <Link
                    href={work.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline"
                  >
                    <span>{work.actionText}</span>
                    <ArrowSquareOut size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </WavyBackground>
  );
}
