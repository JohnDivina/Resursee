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
  IconTerminal2,
  IconCheck,
  IconCopy,
  IconHelpCircle,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export default function DownloadPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [userOS, setUserOS] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [activeTab, setActiveTab] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [copiedBrew, setCopiedBrew] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleCopyBrew = () => {
    navigator.clipboard.writeText('brew install --cask johndivina/tap/resursee');
    setCopiedBrew(true);
    setTimeout(() => setCopiedBrew(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText('curl -fsSL https://resursee.vercel.app/install.sh | bash');
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

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

            {/* Primary Detected OS Action */}
            <div className="pt-4 flex flex-col items-center justify-center gap-3">
              {userOS === 'macos' ? (
                <div className="w-full max-w-xl mx-auto space-y-2">
                  <div className="flex items-center justify-between rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-2 sm:p-2.5 shadow-sm">
                    <div className="flex items-center gap-2 pl-3 font-mono text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 overflow-x-auto select-all">
                      <span className="text-neutral-400 select-none">$</span>
                      <span>brew install --cask johndivina/tap/resursee</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBrew}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-xs font-bold transition-all hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 cursor-pointer shrink-0 shadow-xs"
                    >
                      {copiedBrew ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      <span>{copiedBrew ? 'Copied!' : 'Copy Command'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-center text-[11px] text-neutral-500">
                    <a href={downloadLinks.macos} className="underline hover:text-neutral-900 dark:hover:text-white">
                      Download .dmg instead
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={downloadLinks[userOS]}
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-3.5 text-sm font-bold shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-95 cursor-pointer"
                  >
                    <IconDownload size={18} />
                    <span>
                      {userOS === 'windows' && 'Download for Windows (64-bit .exe)'}
                      {userOS === 'linux' && 'Download for Linux (.AppImage)'}
                    </span>
                  </a>
                </div>
              )}
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
                          Resursee for macOS (Homebrew Cask)
                        </h3>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          Version 0.1.0 • Apple Silicon (M1, M2, M3, M4) • macOS 11.0+
                        </p>
                      </div>
                    </div>

                    <a
                      href={downloadLinks.macos}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-4 py-2 text-xs font-bold shadow-2xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                    >
                      <IconDownload size={14} />
                      <span>Direct .dmg (2.1 MB)</span>
                    </a>
                  </div>

                  {/* Primary Method: Homebrew Cask */}
                  <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                        <span className="flex h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
                        <span>Recommended: Install via Homebrew Cask</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Homebrew installs directly into <code className="font-mono">/Applications/Resursee.app</code>, automatically bypasses Gatekeeper quarantine, and supports 1-command updates.
                    </p>

                    <div className="flex items-center justify-between rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-200/70 dark:bg-neutral-800 p-2 sm:p-2.5">
                      <div className="flex items-center gap-2 pl-2 font-mono text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 overflow-x-auto select-all">
                        <span className="text-neutral-400 select-none">$</span>
                        <span>brew install --cask johndivina/tap/resursee</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyBrew}
                        className="flex items-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold transition-all hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 cursor-pointer shrink-0 shadow-xs"
                      >
                        {copiedBrew ? <IconCheck size={13} /> : <IconCopy size={13} />}
                        <span>{copiedBrew ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] font-mono text-neutral-500 pt-1">
                      To update later: <code className="text-neutral-800 dark:text-neutral-200">brew upgrade --cask resursee</code>
                    </p>
                  </div>

                  {/* Secondary Terminal Method: Curl Script */}
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <IconTerminal2 size={14} />
                        <span>No Homebrew? 1-Line Direct Terminal Install</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-200/50 dark:bg-neutral-800/80 p-2">
                      <div className="font-mono text-[11px] text-neutral-900 dark:text-neutral-100 select-all overflow-x-auto">
                        curl -fsSL https://resursee.vercel.app/install.sh | bash
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCurl}
                        className="text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2 cursor-pointer"
                      >
                        {copiedCurl ? 'Copied!' : 'Copy'}
                      </button>
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


        </div>
      </main>

      <Footer />
    </div>
  );
}
