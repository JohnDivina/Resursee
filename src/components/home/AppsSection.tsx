'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plant,
  Cpu,
  Wrench,
  ArrowRight,
  Sparkle,
  Lightning,
  ShieldCheck,
  CheckCircle,
  Clock,
} from '@phosphor-icons/react';

export default function AppsSection() {
  const apps = [
    {
      id: 'plant-doctor',
      title: 'Plant Doctor AI Vision',
      tagline: 'Instant Botanical Disease & Pest Diagnostics',
      description:
        'Upload or capture photos of crops and house plants. Multimodal AI identifies visual pathology, leaf blights, and pest damage, generating organic and actionable recovery plans.',
      badge: 'App #1 · Core AI',
      status: 'Live & Ready',
      statusColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: Plant,
      iconBg: 'bg-emerald-600 text-white',
      accentColor: 'group-hover:border-emerald-500/40',
      href: '/apps/plant-doctor',
      features: ['Multimodal AI Vision', 'Disease & Pest Detection', 'Actionable Cures', 'Offline Scan History'],
    },
    {
      id: 'iot-cloud',
      title: 'Resursee IoT Cloud Platform',
      tagline: 'Arduino Cloud-Style Telemetry for ESP32',
      description:
        'Connect ESP32 microcontrollers in seconds. Every user gets an isolated, real-time dashboard with auto-generated Arduino C++ firmware, live sensor graphs, and remote switch controls.',
      badge: 'App #2 · Core IoT',
      status: 'Live & Ready',
      statusColor: 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/20',
      icon: Cpu,
      iconBg: 'bg-blue-600 text-white',
      accentColor: 'group-hover:border-blue-500/40',
      href: '/apps/iot-cloud',
      features: ['Multi-Tenant RLS Dashboard', '1-Click ESP32 Pairing', 'Live WebSocket Streaming', 'Remote Actuation'],
    },
    {
      id: 'productivity-tools',
      title: 'Client-Side Productivity Toolbox',
      tagline: 'Zero-Install Document & Media Utilities',
      description:
        'High-speed image dimension scaling, aspect ratio croppers, PDF-to-image extractors, and image-to-PDF compilers that execute 100% locally in your browser with complete privacy.',
      badge: 'Active Utility Suite',
      status: 'Live & Ready',
      statusColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: Wrench,
      iconBg: 'bg-purple-600 text-white',
      accentColor: 'group-hover:border-purple-500/40',
      href: '/tools',
      features: ['100% In-Browser Privacy', 'Batch Image to PDF', 'Lossless Compressors', 'Dimension Presets'],
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 border-b border-[var(--color-rule-subtle)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end mb-12">
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
              Integrated Applications & Systems
            </h2>
          </div>

          <Link
            href="/about"
            className="group flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline shrink-0"
          >
            <span>Learn about the engineering</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3-Column Apps Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                className={`group flex flex-col justify-between rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)]/80 backdrop-blur-md p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-[var(--color-rule-strong)]`}
              >
                <div>
                  {/* Top Bar: Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${app.iconBg} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={28} weight="bold" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-mono text-[10.5px] font-bold text-[var(--color-ink-secondary)]">
                        {app.badge}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${app.statusColor}`}>
                        {app.status === 'Live & Ready' ? (
                          <CheckCircle size={11} weight="fill" />
                        ) : (
                          <Clock size={11} weight="bold" />
                        )}
                        <span>{app.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="mt-6 text-xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
                    {app.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs font-semibold text-[var(--color-primary)]">
                    {app.tagline}
                  </p>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    {app.description}
                  </p>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-2 border-t border-[var(--color-rule-subtle)] pt-4">
                    {app.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-xs font-medium text-[var(--color-ink)]">
                        <CheckCircle size={14} weight="fill" className="text-[var(--color-primary)] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Launch Action */}
                <div className="mt-8 pt-4 border-t border-[var(--color-rule-subtle)]">
                  {app.href === '/apps/plant-doctor' ? (
                    <Link
                      href={app.href}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                    >
                      <span>Launch Plant Doctor AI</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  ) : app.href === '/apps/iot-cloud' ? (
                    <Link
                      href={app.href}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-95"
                    >
                      <span>Launch IoT Cloud Hub</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  ) : (
                    <Link
                      href={app.href}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-95"
                    >
                      <span>Open Productivity Toolbox</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
