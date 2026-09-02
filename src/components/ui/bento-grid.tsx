'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import Link from 'next/link';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'grid md:auto-rows-[20rem] grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  href,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
}) => {
  const content = (
    <div
      data-thock="card"
      className={cn(
        'row-span-1 rounded-[26px] group/bento transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] p-5 sm:p-6 bg-white/85 dark:bg-slate-950/80 border border-black/10 dark:border-white/15 backdrop-blur-xl justify-between flex flex-col space-y-4 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-black/20 dark:hover:border-white/25 relative overflow-hidden h-full',
        className
      )}
    >
      <div className="flex-1 w-full overflow-hidden rounded-[18px] bg-slate-50/80 dark:bg-slate-900/60 border border-black/5 dark:border-white/10 p-3 flex items-center justify-center">
        {header}
      </div>
      <div className="group-hover/bento:translate-x-1 transition-transform duration-200">
        <div className={cn("flex items-center gap-2", description ? "mb-1.5" : "mb-0")}>
          {icon && <span>{icon}</span>}
          <h3 className="font-bold text-[var(--color-ink)] text-base tracking-tight group-hover/bento:text-[var(--color-primary)] transition-colors">
            {title}
          </h3>
        </div>
        {description && (
          <div className="font-normal text-[var(--color-ink-muted)] text-xs leading-relaxed">
            {description}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group cursor-pointer h-full">
        {content}
      </Link>
    );
  }

  return content;
};
