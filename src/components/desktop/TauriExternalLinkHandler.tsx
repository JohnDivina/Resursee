'use client';

import { useEffect } from 'react';
import { isTauriDesktop } from '@/lib/envDetector';
import { openExternalUrl } from '@/lib/tauriBridge';

/**
 * Global handler for Tauri desktop application that intercepts clicks on external links
 * (e.g. GitHub profiles, repositories, external documentation, mailto) and routes them
 * to the operating system's default web browser instead of being blocked by Tauri's WKWebView.
 */
export function TauriExternalLinkHandler() {
  useEffect(() => {
    if (!isTauriDesktop()) return;

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore hash links or internal client-side navigation
      if (href.startsWith('#') || href.startsWith('/')) return;

      const isHttp = href.startsWith('http://') || href.startsWith('https://');
      const isMailto = href.startsWith('mailto:');

      if (isMailto || (isHttp && !href.includes(window.location.host))) {
        event.preventDefault();
        event.stopPropagation();
        openExternalUrl(href);
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  return null;
}
