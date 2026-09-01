'use client';

import { cn } from '@/lib/utils';
import React, { useState, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { List, X } from '@phosphor-icons/react';

export interface Links {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  isActive?: boolean;
  badge?: number | string;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        'h-screen sticky top-0 px-3.5 py-4 hidden md:flex md:flex-col border-r border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)]/95 backdrop-blur-md w-[260px] shrink-0 z-30',
        className
      )}
      animate={{
        width: animate ? (open ? '260px' : '72px') : '260px',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        'h-14 px-4 flex flex-row md:hidden items-center justify-between border-b border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] w-full sticky top-0 z-40'
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white font-bold text-sm">
          🦦
        </div>
        <span className="font-extrabold text-sm text-[var(--color-ink)]">Resursee Admin</span>
      </div>

      <div className="flex justify-end z-20">
        <button
          type="button"
          aria-label="Open sidebar menu"
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-[var(--color-paper-muted)]"
        >
          <List size={22} weight="bold" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: 'easeInOut',
            }}
            className={cn(
              'fixed h-full w-full inset-0 bg-[var(--color-paper-card)] p-6 z-[100] flex flex-col justify-between overflow-y-auto',
              className
            )}
          >
            <div
              className="absolute right-6 top-6 z-50 p-2 text-neutral-600 dark:text-neutral-400 hover:bg-[var(--color-paper-muted)] rounded-full cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <X size={22} weight="bold" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();

  const content = (
    <>
      <div className={cn(
        'shrink-0 flex items-center justify-center transition-colors',
        link.isActive
          ? 'text-neutral-900 dark:text-neutral-100'
          : 'text-neutral-500 dark:text-neutral-400 group-hover/sidebar:text-neutral-800 dark:group-hover/sidebar:text-neutral-200'
      )}>
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          'text-xs font-semibold transition-transform duration-150 whitespace-pre inline-block !p-0 !m-0 truncate flex-1 text-left',
          link.isActive
            ? 'text-neutral-900 dark:text-neutral-100 font-bold'
            : 'text-neutral-600 dark:text-neutral-400 group-hover/sidebar:text-neutral-900 dark:group-hover/sidebar:text-neutral-100'
        )}
      >
        {link.label}
      </motion.span>

      {link.badge !== undefined && (
        <motion.span
          animate={{
            display: animate ? (open ? 'inline-flex' : 'none') : 'inline-flex',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className={cn(
            'ml-auto rounded-full font-mono text-[9px] font-bold px-1.5 py-0.2 shrink-0 transition-colors',
            link.isActive
              ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
          )}
        >
          {link.badge}
        </motion.span>
      )}
    </>
  );

  const containerClasses = cn(
    'flex items-center justify-start gap-3 group/sidebar py-2 px-2.5 rounded-xl transition-all duration-150 cursor-pointer w-full text-left',
    link.isActive
      ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold shadow-2xs'
      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100',
    className
  );

  if (link.onClick) {
    return (
      <button
        type="button"
        onClick={link.onClick}
        className={containerClasses}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={link.href || '#'}
      className={containerClasses}
      {...props}
    >
      {content}
    </a>
  );
};
