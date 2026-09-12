'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconBrandApple,
  IconBrandWindows,
  IconBrandUbuntu,
  IconDownload,
  IconDeviceDesktop,
  IconCpu,
  IconShieldCheck,
  IconArrowRight,
  IconCheck,
  IconCopy,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export default function DesktopDownloadSection() {
  const [userOS, setUserOS] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('curl -fsSL https://resursee.vercel.app/install.sh | bash');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('win')) {
        setUserOS('windows');
      } else if (ua.includes('linux')) {
        setUserOS('linux');
      } else {
        setUserOS('macos');
      }
    }
  }, []);

  const downloadLinks = {
    macos: 'https://github.com/JohnDivina/Resursee/releases/download/v0.1.0/Resursee_0.1.0_aarch64.dmg',
    windows: 'https://github.com/JohnDivina/Resursee/releases/latest',
    linux: 'https://github.com/JohnDivina/Resursee/releases/latest',
  };

  return (
    <section id="download" className="relative border-b border-[var(--color-rule-subtle)] bg-transparent py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <IconDeviceDesktop size={14} />
            <span>Native Desktop App • Tauri 2.0</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
            Download Resursee for Desktop
          </h2>

          <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] max-w-2xl mx-auto leading-relaxed">
            Experience ultra-lightweight performance (2.1 MB) with zero browser overhead. Run AI Studio, PDF tools, and media converters 100% offline with native system integration.
          </p>
        </div>

        {/* 3 OS Selection Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* macOS Card */}
          <div
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border p-6 transition-all",
              userOS === 'macos'
                ? "border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md"
                : "border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] text-[var(--color-ink)] hover:border-neutral-400 dark:hover:border-neutral-600"
            )}
          >
            {userOS === 'macos' && (
              <span className="absolute top-4 right-4 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                Detected OS
              </span>
            )}

            <div className="space-y-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl font-bold",
                  userOS === 'macos'
                    ? "bg-white/10 text-white dark:bg-neutral-900/10 dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                )}
              >
                <IconBrandApple size={28} />
              </div>

              <div>
                <h3 className="text-lg font-bold">macOS</h3>
                <p className={cn("text-xs mt-1", userOS === 'macos' ? "text-neutral-300 dark:text-neutral-600" : "text-[var(--color-ink-muted)]")}>
                  Apple Silicon (M1 / M2 / M3 / M4)
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs border-t border-current/10">
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Hardware acceleration</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Native Ollama daemon control</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Ultra-compact 2.1 MB .dmg installer</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-current/10 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-current/20 bg-current/5 p-2">
                <div className="font-mono text-[11px] select-all overflow-x-auto truncate mr-2 pl-1">
                  curl -fsSL https://resursee.vercel.app/install.sh | bash
                </div>
                <button
                  type="button"
                  onClick={handleCopyCmd}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs",
                    userOS === 'macos'
                      ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white"
                      : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  )}
                >
                  {copiedCmd ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] px-0.5">
                <span className={cn(userOS === 'macos' ? "text-neutral-300 dark:text-neutral-600" : "text-[var(--color-ink-muted)]")}>
                  Apple Silicon • macOS 11.0+
                </span>
                <Link
                  href="/download"
                  className="font-bold underline hover:opacity-80"
                >
                  View Details & .dmg →
                </Link>
              </div>
            </div>
          </div>

          {/* Windows Card */}
          <div
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border p-6 transition-all",
              userOS === 'windows'
                ? "border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md"
                : "border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] text-[var(--color-ink)] hover:border-neutral-400 dark:hover:border-neutral-600"
            )}
          >
            {userOS === 'windows' && (
              <span className="absolute top-4 right-4 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                Detected OS
              </span>
            )}

            <div className="space-y-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl font-bold",
                  userOS === 'windows'
                    ? "bg-white/10 text-white dark:bg-neutral-900/10 dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                )}
              >
                <IconBrandWindows size={28} />
              </div>

              <div>
                <h3 className="text-lg font-bold">Windows</h3>
                <p className={cn("text-xs mt-1", userOS === 'windows' ? "text-neutral-300 dark:text-neutral-600" : "text-[var(--color-ink-muted)]")}>
                  Windows 10 & 11 (64-bit)
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs border-t border-current/10">
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Native WebView2 engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Windows service process management</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Standard .exe / .msi installer wizard</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-current/10">
              <a
                href={downloadLinks.windows}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs",
                  userOS === 'windows'
                    ? "bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                    : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                )}
              >
                <IconDownload size={16} />
                <span>Download for Windows</span>
              </a>
            </div>
          </div>

          {/* Linux Card */}
          <div
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border p-6 transition-all",
              userOS === 'linux'
                ? "border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md"
                : "border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] text-[var(--color-ink)] hover:border-neutral-400 dark:hover:border-neutral-600"
            )}
          >
            {userOS === 'linux' && (
              <span className="absolute top-4 right-4 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                Detected OS
              </span>
            )}

            <div className="space-y-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl font-bold",
                  userOS === 'linux'
                    ? "bg-white/10 text-white dark:bg-neutral-900/10 dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                )}
              >
                <IconBrandUbuntu size={28} />
              </div>

              <div>
                <h3 className="text-lg font-bold">Linux</h3>
                <p className={cn("text-xs mt-1", userOS === 'linux' ? "text-neutral-300 dark:text-neutral-600" : "text-[var(--color-ink-muted)]")}>
                  Universal AppImage & Debian/Ubuntu
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs border-t border-current/10">
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Portable AppImage (zero install)</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Systemd Ollama daemon probe</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="shrink-0" />
                  <span>Native GTK3 / WebKit desktop window</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-current/10">
              <a
                href={downloadLinks.linux}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs",
                  userOS === 'linux'
                    ? "bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                    : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                )}
              >
                <IconDownload size={16} />
                <span>Download for Linux</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Link to Dedicated Download Page with Detailed Setup Instructions */}
        <div className="mt-10 text-center">
          <Link
            href="/download"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors group"
          >
            <span>Need installation instructions, Gatekeeper bypass guide, or checksums? View full download hub</span>
            <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
