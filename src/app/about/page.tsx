'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import GitHubContributionsGraph from '@/components/about/GitHubContributionsGraph';
import {
  Code,
  Cpu,
  Sparkle,
  GithubLogo,
  EnvelopeSimple,
  ArrowSquareOut,
  TerminalWindow,
  CheckCircle,
  Lightning,
  TreeStructure,
  ShieldCheck,
  Globe,
  Database,
  BracketsAngle,
} from '@phosphor-icons/react';
import Link from 'next/link';

type TechGroup = 'all' | 'frontend' | 'embedded' | 'ai';

export default function AboutPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedTechGroup, setSelectedTechGroup] = useState<TechGroup>('all');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('divina.johnreyl@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const techStack = [
    { name: 'Next.js 16 (App Router)', category: 'Frontend & Architecture', group: 'frontend', icon: Globe, highlight: true },
    { name: 'TypeScript', category: 'Language', group: 'frontend', icon: BracketsAngle, highlight: true },
    { name: 'React 19', category: 'UI Framework', group: 'frontend', icon: Code, highlight: false },
    { name: 'Tailwind CSS', category: 'Styling & Design System', group: 'frontend', icon: Sparkle, highlight: false },
    { name: 'Supabase & PostgreSQL', category: 'Database & Realtime', group: 'frontend', icon: Database, highlight: true },
    { name: 'ESP32 & C/C++', category: 'Embedded & IoT Systems', group: 'embedded', icon: Cpu, highlight: true },
    { name: 'Google Gemini & AI SDK', category: 'Multimodal AI & Vision', group: 'ai', icon: Lightning, highlight: true },
    { name: 'Python', category: 'Data & Automation', group: 'ai', icon: TerminalWindow, highlight: false },
    { name: 'WebSockets & MQTT', category: 'Real-time Telemetry', group: 'embedded', icon: TreeStructure, highlight: false },
    { name: 'Security & RLS', category: 'Hardening & RLS', group: 'frontend', icon: ShieldCheck, highlight: false },
  ];

  const filteredTechStack = techStack.filter((tech) => {
    if (selectedTechGroup === 'all') return true;
    return tech.group === selectedTechGroup;
  });

  const works = [
    {
      title: 'Resursee Productivity Toolbox',
      badge: 'Live Tool Suite',
      description: 'Client-side image compression, PDF extractors, dimension scalers, and format converters running with 100% privacy in browser memory.',
      link: '/tools',
      actionText: 'Launch Tools',
    },
    {
      title: 'Plant Doctor AI Vision',
      badge: 'In Development',
      description: 'Computer vision diagnostics for plant health, leaf disease detection, and cultivation insights powered by Google Gemini.',
      link: '/apps/plant-doctor',
      actionText: 'Explore App',
    },
    {
      title: 'Resursee IoT Cloud Platform',
      badge: 'Live Hardware Telemetry',
      description: 'Real-time telemetry, relay controller, and analytics dashboard engineered for custom ESP32 / Arduino sensor networks.',
      link: '/apps/iot-cloud',
      actionText: 'Launch IoT Cloud',
    },
    {
      title: 'Autonomous Multi-Agent Systems',
      badge: 'Research',
      description: 'Architecting self-correcting agent swarms, semantic indexers, and local LLM pipelines for hardware automation.',
      link: '#',
      actionText: 'Coming Soon',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette isOpen={searchPaletteOpen} onClose={() => setSearchPaletteOpen(false)} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-16">
        {/* 1. Hero Profile Header (Mobile-First Reorganization) */}
        <section className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 rounded-[24px] sm:rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          {/* Identity & Bio */}
          <div className="space-y-3.5 sm:space-y-4 max-w-2xl order-2 md:order-1">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Master&apos;s Student & Developer</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-ink)]">
              Hi, I&apos;m <span className="text-[var(--color-ink)]">John Rey Divina</span>.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[var(--color-ink-muted)] leading-relaxed">
              I am a Master&apos;s student passionate about building software, Internet of Things (IoT), running and experimenting with LLMs, and engineering embedded systems.
            </p>

            {/* Social & Contact Bar */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              <a
                href="https://github.com/JohnDivina"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2 text-xs font-bold text-[var(--color-ink)] shadow-2xs transition-all hover:bg-[var(--color-paper-card)] hover:border-[var(--color-rule-strong)] active:scale-95 cursor-pointer"
              >
                <GithubLogo size={15} weight="bold" />
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
                    <CheckCircle size={15} weight="bold" className="text-white" />
                    <span>Email Copied!</span>
                  </>
                ) : (
                  <>
                    <EnvelopeSimple size={15} weight="bold" />
                    <span>Get in Touch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Avatar: Top on mobile, right on desktop */}
          <div className="order-1 md:order-2 self-start md:self-auto relative flex h-24 w-24 sm:h-36 sm:w-36 md:h-40 md:w-40 shrink-0 items-center justify-center overflow-hidden rounded-[22px] sm:rounded-[28px] border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-xl">
            <img
              src="/avatar.png"
              alt="John Rey Divina"
              className="h-full w-full object-cover object-center select-none"
              onError={(e) => {
                e.currentTarget.src = 'https://github.com/JohnDivina.png';
              }}
            />
          </div>
        </section>

        {/* 2. Live GitHub Activity & Contributions Dot Matrix (Mobile-Responsive) */}
        <GitHubContributionsGraph />

        {/* 3. Tech Stack Matrix (Responsive List on Mobile, Grid on Tablet/Desktop) */}
        <section className="mt-12 sm:mt-16 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
                Technical Stack & Tooling
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-[var(--color-ink-muted)]">
                Frameworks, embedded toolchains, and languages I use to build scalable products.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-paper-muted)] border border-[var(--color-rule)] shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setSelectedTechGroup('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  selectedTechGroup === 'all'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                All ({techStack.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTechGroup('frontend')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  selectedTechGroup === 'frontend'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                Web & Cloud
              </button>
              <button
                type="button"
                onClick={() => setSelectedTechGroup('embedded')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  selectedTechGroup === 'embedded'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                IoT & Embedded
              </button>
              <button
                type="button"
                onClick={() => setSelectedTechGroup('ai')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  selectedTechGroup === 'ai'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                AI & Systems
              </button>
            </div>
          </div>

          {/* Responsive Card Matrix: 1-col horizontal on mobile, multi-col on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {filteredTechStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center sm:flex-col justify-start sm:justify-center rounded-[18px] sm:rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4 text-left sm:text-center shadow-xs transition-all hover:border-[var(--color-rule-strong)] hover:scale-[1.01] sm:hover:scale-105 gap-3 sm:gap-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-paper-muted)] text-[var(--color-primary)]">
                    <Icon size={20} weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0 sm:mt-2.5">
                    <div className="flex items-center gap-1.5 sm:justify-center">
                      <span className="text-xs font-bold text-[var(--color-ink)] leading-snug">
                        {tech.name}
                      </span>
                      {tech.highlight && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                      )}
                    </div>
                    <span className="mt-0.5 text-[10.5px] sm:text-[10px] font-mono text-[var(--color-ink-muted)] block">
                      {tech.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Applications & Platform Ecosystem (Symmetrical 2x2 Grid) */}
        <section className="mt-12 sm:mt-16 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
                The Resursee Ecosystem
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-[var(--color-ink-muted)]">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {works.map((work, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-[20px] sm:rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-xs transition-all hover:border-[var(--color-rule-strong)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-mono text-[10px] sm:text-[10.5px] font-bold text-[var(--color-ink-secondary)]">
                      {work.badge}
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-base font-bold text-[var(--color-ink)]">
                    {work.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    {work.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[var(--color-rule-subtle)] flex items-center justify-between">
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
    </div>
  );
}
