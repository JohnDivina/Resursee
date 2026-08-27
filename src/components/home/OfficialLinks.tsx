import React from 'react';
import { ArrowSquareOut, Buildings, Globe, BookOpen, GraduationCap, Lifebuoy } from '@phosphor-icons/react';
import { OfficialLink } from '@/types/database';
import { mockOfficialLinks } from '@/lib/mockData';

interface OfficialLinksProps {
  links?: OfficialLink[];
}

export default function OfficialLinks({ links = mockOfficialLinks }: OfficialLinksProps) {
  const getLinkIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'portals':
        return <Globe size={18} className="text-[var(--color-primary)]" />;
      case 'academic services':
        return <BookOpen size={18} className="text-indigo-600" />;
      case 'administrative services':
        return <Buildings size={18} className="text-emerald-600" />;
      case 'research & innovation':
        return <GraduationCap size={18} className="text-amber-600" />;
      case 'technical support':
        return <Lifebuoy size={18} className="text-rose-600" />;
      default:
        return <Globe size={18} className="text-[var(--color-primary)]" />;
    }
  };

  return (
    <section className="border-t border-[var(--color-rule)] bg-[var(--color-paper)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div>
          <span className="font-mono text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
            Campus Directory
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
            Official University Online Portals
          </h2>
          <p className="mt-2 text-xs text-[var(--color-ink-muted)] sm:text-sm">
            Quick direct gateways to university digital portals, enrollment systems, online libraries, and faculty services.
          </p>
        </div>

        {/* Links Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 shadow-xs transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-surface)] hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] group-hover:border-[var(--color-primary-subtle)] group-hover:bg-[var(--color-paper-card)]">
                {getLinkIcon(link.category)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="truncate font-display text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors">
                    {link.title}
                  </h3>
                  <ArrowSquareOut
                    size={14}
                    className="shrink-0 text-[var(--color-ink-muted)] opacity-50 group-hover:opacity-100 group-hover:text-[var(--color-primary)] transition-all"
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)] line-clamp-2">
                  {link.description}
                </p>
                <div className="mt-2 flex items-center gap-1 font-mono text-[10.5px] text-[var(--color-ink-muted)]">
                  <span>{link.category}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
