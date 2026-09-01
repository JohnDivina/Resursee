'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlass,
  FileText,
  ShieldCheck,
  Command,
  UploadSimple,
  Wrench,
  Sparkle,
  Megaphone,
  HouseLine,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import SoundToggle from '@/components/sound/SoundToggle';
import {
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export default function Header({ onOpenSearch }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Tools', link: '/tools', icon: Wrench },
    { name: 'About', link: '/about', icon: Sparkle },
    { name: 'Contribute', link: '/contribute', icon: UploadSimple },
  ];

  return (
    <Navbar>
      <NavBody>
        {/* Brand Logo */}
        <NavbarLogo href="/" label="Resursee" emoji="🦦" />

        {/* Center Desktop Navigation with Floating Hover Pill */}
        <NavItems items={navItems} pathname={pathname} />

        {/* Right Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex h-9 items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] px-2.5 sm:px-3 text-xs font-semibold text-[var(--color-ink-muted)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-ink)] active:scale-98 cursor-pointer"
            aria-label="Search resources"
          >
            <MagnifyingGlass
              size={15}
              className="text-[var(--color-primary)] transition-transform group-hover:scale-110"
            />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-full border border-black/[0.1] dark:border-white/[0.15] bg-black/[0.03] dark:bg-white/[0.06] px-2 py-0.5 font-mono text-[9.5px] text-[var(--color-ink-secondary)]">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Sound Effect Toggle */}
          <SoundToggle />

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* Mobile Navigation Toggle */}
          <MobileNav>
            <MobileNavToggle
              isOpen={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </MobileNav>
        </div>
      </NavBody>

      {/* Mobile Navigation Drawer */}
      <MobileNavMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onOpenSearch?.();
          }}
          className="flex w-full items-center justify-between rounded-[20px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3.5 text-xs font-semibold text-[var(--color-ink-muted)] shadow-xs transition-all active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <MagnifyingGlass size={16} className="text-[var(--color-primary)]" />
            <span className="text-[var(--color-ink)] font-bold">Search documents & forms...</span>
          </div>
          <kbd className="rounded-full bg-[var(--color-paper-muted)] px-2 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <div className="space-y-1 pt-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-[16px] p-3 text-xs font-bold transition-all ${
              pathname === '/'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
            }`}
          >
            <HouseLine size={18} weight="bold" />
            <span>Home</span>
          </Link>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.link || (pathname && pathname.startsWith(`${item.link}/`));

            return (
              <Link
                key={item.link}
                href={item.link}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-[16px] p-3 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                }`}
              >
                {Icon && <Icon size={18} weight="bold" />}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[var(--color-rule-subtle)] flex flex-col gap-2">
          <NavbarButton
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            variant="secondary"
            className="w-full py-3"
          >
            <ShieldCheck size={16} weight="bold" />
            <span>Master Admin Portal</span>
          </NavbarButton>
        </div>
      </MobileNavMenu>
    </Navbar>
  );
}
