'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowSquareOut, GithubLogo, EnvelopeSimple, Sparkle } from '@phosphor-icons/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--color-rule)] bg-[var(--color-paper-muted)]/60 pt-14 pb-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Column 1: Brand & Identity */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-primary)] text-white shadow-xs">
                <span className="text-base select-none">🦦</span>
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-[var(--color-ink)]">
                Resursee
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[var(--color-ink-muted)]">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All systems live & operational</span>
            </div>
          </div>

          {/* Column 2: Applications Suite */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold text-[var(--color-ink)] uppercase tracking-wider">
              Applications
            </h4>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-ink-muted)]">
              <li>
                <Link href="/tools" className="transition-colors hover:text-[var(--color-primary)]">
                  Productivity Toolbox
                </Link>
              </li>
              <li>
                <Link href="/apps/plant-doctor" className="transition-colors hover:text-emerald-500 font-medium text-[var(--color-ink)]">
                  Plant Doctor AI (App #1)
                </Link>
              </li>
              <li>
                <span className="text-[var(--color-ink-muted)] opacity-60">
                  Resursee IoT Cloud (App #2)
                </span>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-[var(--color-primary)]">
                  Developer Portfolio
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Browser Utilities */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold text-[var(--color-ink)] uppercase tracking-wider">
              Productivity Tools
            </h4>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-ink-muted)]">
              <li>
                <Link href="/tools/image-to-pdf" className="transition-colors hover:text-[var(--color-primary)]">
                  Image to PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-to-image" className="transition-colors hover:text-[var(--color-primary)]">
                  PDF to Image
                </Link>
              </li>
              <li>
                <Link href="/tools/resize-image" className="transition-colors hover:text-[var(--color-primary)]">
                  Resize Image
                </Link>
              </li>
              <li>
                <Link href="/tools/compress-image" className="transition-colors hover:text-[var(--color-primary)]">
                  Compress Image
                </Link>
              </li>
              <li>
                <Link href="/tools/crop-image" className="transition-colors hover:text-[var(--color-primary)]">
                  Crop Image
                </Link>
              </li>
              <li>
                <Link href="/tools/convert-image" className="transition-colors hover:text-[var(--color-primary)]">
                  Convert Formats
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect & Admin */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold text-[var(--color-ink)] uppercase tracking-wider">
              Connect & Admin
            </h4>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-ink-muted)]">
              <li>
                <Link href="/about" className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)] hover:underline">
                  <Sparkle size={13} />
                  <span>About John Rey</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/JohnDivina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                >
                  <GithubLogo size={13} />
                  <span>GitHub Profile</span>
                  <ArrowSquareOut size={11} />
                </a>
              </li>
              <li>
                <Link href="/admin" className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
                  <ShieldCheck size={13} />
                  <span>Platform Portal</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-rule)] pt-6 text-xs text-[var(--color-ink-muted)] sm:flex-row">
          <p>© {currentYear} Resursee · Developed by John Rey Divina. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
