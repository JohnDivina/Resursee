'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import {
  IconBrandApple,
  IconBrandWindows,
  IconBrandUbuntu,
  IconDownload,
  IconDeviceDesktop,
  IconShieldCheck,
  IconTerminal2,
  IconCheck,
  IconExternalLink,
  IconHelpCircle,
  IconCpu,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export default function DownloadPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [userOS, setUserOS] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [activeTab, setActiveTab] = useState<'macos' | 'windows' | 'linux'>('macos');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('win')) {
        setUserOS('windows');
        setActiveTab('windows');
      } else if (ua.includes('linux')) {
        setUserOS('linux');
        setActiveTab('linux');
      } else {
        setUserOS('macos');
        setActiveTab('macos');
      }
    }
  }, []);

  const downloadLinks = {
    macos: 'https://github.com/JohnDivina/Resursee/releases/download/v0.1.0/Resursee_0.1.0_aarch64.dmg',
    windows: 'https://github.com/JohnDivina/Resursee/releases/latest',
    linux: 'https://github.com/JohnDivina/Resursee/releases/latest',
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
      />

      <main className="flex-1 py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header Banner */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              <IconDeviceDesktop size={14} />
              <span>v0.1.0 • Official Desktop Releases</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-ink)]">
              Download Resursee for Desktop
            </h1>

            <p className="text-xs sm:text-base text-[var(--color-ink-muted)] leading-relaxed">
              Standalone native application built with Tauri 2.0. Run AI Studio, PDF tools, and media converters 100% offline with zero cloud data egress and Apple Silicon hardware acceleration.
            </p>

            {/* Primary Detected OS 1-Click Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={downloadLinks[userOS]}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-3.5 text-sm font-bold shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-95 cursor-pointer"
              >
                <IconDownload size={18} />
                <span>
                  {userOS === 'macos' && 'Download for Mac (Apple Silicon .dmg • 2.1 MB)'}
                  {userOS === 'windows' && 'Download for Windows (64-bit .exe)'}
                  {userOS === 'linux' && 'Download for Linux (.AppImage)'}
                </span>
              </a>

              <a
                href="https://github.com/JohnDivina/Resursee/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-5 py-3.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-2xs"
              >
                <span>GitHub Releases</span>
                <IconExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* 3 OS Selection Tabs & Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-strong)] pb-4">
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                All Supported Platforms
              </h2>
              <div className="flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('macos')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                    activeTab === 'macos'
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  <IconBrandApple size={15} />
                  <span>macOS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('windows')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                    activeTab === 'windows'
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  <IconBrandWindows size={15} />
                  <span>Windows</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('linux')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                    activeTab === 'linux'
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  <IconBrandUbuntu size={15} />
                  <span>Linux</span>
                </button>
              </div>
            </div>

            {/* Tab Details Card */}
            <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs space-y-6">
              {activeTab === 'macos' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                        <IconBrandApple size={26} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--color-ink)]">
                          Resursee for macOS (Apple Silicon)
                        </h3>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          Version 0.1.0 • macOS 11.0 Big Sur or later • Apple M1, M2, M3, M4
                        </p>
                      </div>
                    </div>

                    <a
                      href={downloadLinks.macos}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-2.5 text-xs font-bold shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all cursor-pointer"
                    >
                      <IconDownload size={15} />
                      <span>Download .dmg (2.1 MB)</span>
                    </a>
                  </div>

                  {/* macOS Setup Instructions & Gatekeeper Notice */}
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-4 sm:p-5 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                      <IconHelpCircle size={16} />
                      <span>Installation & First Launch on macOS</span>
                    </div>

                    <ol className="list-decimal list-inside space-y-1.5 text-neutral-700 dark:text-neutral-300">
                      <li>Download and double-click <code className="font-mono font-bold">Resursee_0.1.0_aarch64.dmg</code>.</li>
                      <li>Drag the <code className="font-mono font-bold">Resursee.app</code> icon into your <code className="font-mono font-bold">/Applications</code> folder.</li>
                      <li>Launch Resursee from Launchpad or Spotlight.</li>
                    </ol>

                    {/* 1-Line Zero-Warning Terminal Install */}
                    <div className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-200/60 dark:bg-neutral-800/80 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <IconTerminal2 size={13} />
                          <span>1-Line Direct Terminal Install (Zero Warnings)</span>
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">Bypasses Gatekeeper</span>
                      </div>
                      <pre className="rounded-lg bg-neutral-900 text-neutral-100 p-2.5 font-mono text-[11px] overflow-x-auto select-all">
curl -fsSL https://resursee.vercel.app/install.sh | bash
                      </pre>
                    </div>

                    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-200">
                        🛡️ If macOS shows &quot;Resursee is damaged and can&apos;t be opened&quot;:
                      </p>
                      <p>
                        This is macOS Gatekeeper for open-source apps downloaded from the web. To unlock in 1 second, run in Terminal:
                      </p>
                      <pre className="rounded-lg bg-neutral-900 text-neutral-100 p-2 font-mono text-[10.5px] select-all">
xattr -cr /Applications/Resursee.app
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'windows' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                        <IconBrandWindows size={26} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--color-ink)]">
                          Resursee for Windows (64-bit)
                        </h3>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          Version 0.1.0 • Windows 10 & Windows 11 (x64) • Microsoft WebView2
                        </p>
                      </div>
                    </div>

                    <a
                      href={downloadLinks.windows}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-2.5 text-xs font-bold shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all cursor-pointer"
                    >
                      <IconDownload size={15} />
                      <span>Download .exe / .msi</span>
                    </a>
                  </div>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-4 sm:p-5 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                      <IconHelpCircle size={16} />
                      <span>Installation on Windows</span>
                    </div>

                    <ol className="list-decimal list-inside space-y-1.5 text-neutral-700 dark:text-neutral-300">
                      <li>Download <code className="font-mono font-bold">Resursee_0.1.0_x64-setup.exe</code> or <code className="font-mono font-bold">.msi</code>.</li>
                      <li>Double-click the installer and follow the standard setup prompts.</li>
                      <li>If Windows SmartScreen prompts on first launch, click <span className="font-semibold text-neutral-900 dark:text-white">&quot;More info&quot;</span> then <span className="font-semibold text-neutral-900 dark:text-white">&quot;Run anyway&quot;</span>.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === 'linux' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                        <IconBrandUbuntu size={26} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--color-ink)]">
                          Resursee for Linux (x64)
                        </h3>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          Version 0.1.0 • Ubuntu, Debian, Fedora, Arch, and derivatives
                        </p>
                      </div>
                    </div>

                    <a
                      href={downloadLinks.linux}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-2.5 text-xs font-bold shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all cursor-pointer"
                    >
                      <IconDownload size={15} />
                      <span>Download .AppImage / .deb</span>
                    </a>
                  </div>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-4 sm:p-5 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                      <IconHelpCircle size={16} />
                      <span>Installation on Linux</span>
                    </div>

                    <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
                      <p><strong>AppImage (Portable zero-install):</strong></p>
                      <pre className="rounded-lg bg-neutral-200 dark:bg-neutral-800 p-2.5 font-mono text-[11px] overflow-x-auto">
chmod +x resursee_0.1.0_amd64.AppImage
./resursee_0.1.0_amd64.AppImage
                      </pre>
                      <p className="pt-1"><strong>Debian / Ubuntu Package:</strong></p>
                      <pre className="rounded-lg bg-neutral-200 dark:bg-neutral-800 p-2.5 font-mono text-[11px] overflow-x-auto">
sudo dpkg -i resursee_0.1.0_amd64.deb
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
                <IconShieldCheck size={18} />
                <span>100% Offline Privacy</span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Local AI inference, PDF processing, and image optimization run directly on your hardware without transmitting data to cloud servers.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
                <IconCpu size={18} />
                <span>Apple Silicon & GPU Native</span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Direct native bindings to system hardware, unified memory telemetry, and automated Ollama daemon control.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
                <IconDeviceDesktop size={18} />
                <span>Ultra-Lightweight</span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Powered by Tauri 2.0 with native OS web engines, keeping memory usage tiny and download size down to just 2.1 MB.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
