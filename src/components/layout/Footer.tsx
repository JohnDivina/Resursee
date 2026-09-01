import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowSquareOut } from '@phosphor-icons/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--color-rule)] bg-[var(--color-paper-muted)]/60 pt-14 pb-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Column 1: Brand & Status */}
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
              <span>System operational · Index updated live</span>
            </div>
          </div>

          {/* Column 2: Core Resources */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold text-[var(--color-ink)] uppercase tracking-wider">
              Document Index
            </h4>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-ink-muted)]">
              <li>
                <Link href="/resources?type=form" className="transition-colors hover:text-[var(--color-primary)]">
                  Official Application Forms
                </Link>
              </li>
              <li>
                <Link href="/resources?type=template" className="transition-colors hover:text-[var(--color-primary)]">
                  Standard Presentation & Word Templates
                </Link>
              </li>
              <li>
                <Link href="/resources?type=policy" className="transition-colors hover:text-[var(--color-primary)]">
                  Student & Faculty Handbooks
                </Link>
              </li>
              <li>
                <Link href="/resources?type=memorandum" className="transition-colors hover:text-[var(--color-primary)]">
                  Presidential Memorandums
                </Link>
              </li>
              <li>
                <Link href="/resources?type=academic" className="transition-colors hover:text-[var(--color-primary)]">
                  Academic Syllabi & Curriculum OBE
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Major Offices & Directory */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold text-[var(--color-ink)] uppercase tracking-wider">
              Key Offices
            </h4>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-ink-muted)]">
              <li>
                <Link href="/resources?dept=registrar" className="transition-colors hover:text-[var(--color-primary)]">
                  University Registrar (OUR)
                </Link>
              </li>
              <li>
                <Link href="/resources?dept=human-resources" className="transition-colors hover:text-[var(--color-primary)]">
                  Human Resources (HRMO)
                </Link>
              </li>
              <li>
                <Link href="/resources?dept=student-affairs" className="transition-colors hover:text-[var(--color-primary)]">
                  Student Affairs & Services (OSAS)
                </Link>
              </li>
              <li>
                <Link href="/resources?dept=research-center" className="transition-colors hover:text-[var(--color-primary)]">
                  Research & Ethics (URDC)
                </Link>
              </li>
              <li>
                <Link href="/resources?dept=ict-office" className="transition-colors hover:text-[var(--color-primary)]">
                  ICTO Technical Helpdesk
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Gateways & Admin */}
          <div>
            <h4 className="font-mono text-[11px] font-semibold text-[var(--color-ink)] uppercase tracking-wider">
              Access & Portals
            </h4>
            <ul className="mt-4 space-y-2 text-xs text-[var(--color-ink-muted)]">
              <li>
                <Link href="/admin" className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] hover:underline">
                  <ShieldCheck size={14} />
                  <span>Master Admin Portal</span>
                </Link>
              </li>
              <li>
                <a href="https://portal.university.edu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
                  <span>Student Portal (SIS)</span>
                  <ArrowSquareOut size={11} />
                </a>
              </li>
              <li>
                <a href="https://lms.university.edu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
                  <span>University LMS</span>
                  <ArrowSquareOut size={11} />
                </a>
              </li>
              <li>
                <a href="https://library.university.edu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
                  <span>Library OPAC</span>
                  <ArrowSquareOut size={11} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Clean Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-rule)] pt-6 text-xs text-[var(--color-ink-muted)] sm:flex-row">
          <p>© {currentYear} Resursee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
