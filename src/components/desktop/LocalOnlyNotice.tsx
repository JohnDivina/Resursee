'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconShieldCheck, IconX, IconDeviceDesktop, IconArrowRight } from '@tabler/icons-react';
import { isLocalEnvironment } from '@/lib/envDetector';

export interface LocalOnlyNoticeProps {
  appName: string;
  sessionKey: string;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  badgeText?: string;
  description?: string;
  localFeatures?: string[];
  webFeatures?: string[];
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export default function LocalOnlyNotice({
  appName,
  sessionKey,
  isOpen,
  onClose,
  title,
  badgeText = 'Local AI Engine • 100% Private Offline Compute',
  description,
  localFeatures = [
    'Local LLM Copilot & AI Code Generation (via Ollama on localhost:11434)',
    'Zero cloud data egress and zero recurring API fees',
    'Full hardware acceleration using your device GPU/CPU',
  ],
  webFeatures = [
    'Interactive UI, local file parsing, and in-memory calculations work in your browser',
  ],
  secondaryAction,
}: LocalOnlyNoticeProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLocal, setIsLocal] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const local = isLocalEnvironment();
    setIsLocal(local);

    // If running in local environment (Tauri desktop app, localhost, or dev server),
    // automatically detect it and NEVER display the popup
    if (!local) {
      const dismissed = sessionStorage.getItem(sessionKey);
      if (!dismissed) {
        setInternalOpen(true);
      }
    }
  }, [sessionKey]);

  // Combined visibility state (can be triggered by auto-detection or manual click)
  const isVisible = (internalOpen || Boolean(isOpen)) && !isLocal;

  const handleDismiss = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, 'true');
    }
    setInternalOpen(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-5 sm:p-6 shadow-2xl space-y-4 text-left"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs">
                  <IconShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                    {title || `${appName} AI Notice`}
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-500">
                    {badgeText}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Explanatory Body */}
            <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <p>
                {description || (
                  <>
                    You are accessing <strong>{appName}</strong> via the remote web version. The core application interface runs in your browser, but <strong>AI inference features</strong> require Resursee to be running on your local device or desktop app.
                  </>
                )}
              </p>

              {/* Local vs Web capabilities */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-3.5 space-y-2.5 font-mono text-[11px] text-neutral-800 dark:text-neutral-200">
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <IconDeviceDesktop size={14} />
                    <span>Requires Local Device / Desktop App:</span>
                  </div>
                  <ul className="space-y-1 pl-1">
                    {localFeatures.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0 mt-1.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {webFeatures.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="font-bold text-neutral-900 dark:text-white mb-1">
                      Works on Website Preview:
                    </div>
                    <ul className="space-y-1 pl-1 text-neutral-600 dark:text-neutral-400">
                      {webFeatures.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Checkbox: Don't show again */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id={`dontShowAgain-${sessionKey}`}
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white cursor-pointer"
              />
              <label
                htmlFor={`dontShowAgain-${sessionKey}`}
                className="text-xs text-neutral-500 cursor-pointer select-none"
              >
                Don&apos;t show again this session
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:flex-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black py-2.5 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer text-center shadow-2xs"
              >
                Explore in Web Preview
              </button>

              {secondaryAction && (
                secondaryAction.href ? (
                  <a
                    href={secondaryAction.href}
                    onClick={() => {
                      if (dontShowAgain && typeof window !== 'undefined') {
                        sessionStorage.setItem(sessionKey, 'true');
                      }
                      setInternalOpen(false);
                      onClose?.();
                    }}
                    className="w-full sm:flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 py-2.5 text-xs font-bold transition-colors cursor-pointer text-center shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <span>{secondaryAction.label}</span>
                    <IconArrowRight size={13} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (dontShowAgain && typeof window !== 'undefined') {
                        sessionStorage.setItem(sessionKey, 'true');
                      }
                      setInternalOpen(false);
                      onClose?.();
                      secondaryAction.onClick?.();
                    }}
                    className="w-full sm:flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 py-2.5 text-xs font-bold transition-colors cursor-pointer text-center shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <span>{secondaryAction.label}</span>
                    <IconArrowRight size={13} />
                  </button>
                )
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
