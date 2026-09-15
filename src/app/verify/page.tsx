'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CloudflareVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const domainParam = searchParams.get('domain');
  const redirectParam = searchParams.get('redirect') || '/';

  const [domain, setDomain] = useState<string>('resursee.com');
  const [rayId, setRayId] = useState<string>('a3b49e4ffff225d4');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize domain from query param or window.location.host
  useEffect(() => {
    if (domainParam) {
      setDomain(domainParam);
    } else if (typeof window !== 'undefined') {
      const host = window.location.host;
      if (host.includes('localhost')) {
        setDomain('resursee.local');
      } else {
        setDomain(host || 'resursee.com');
      }
    }

    // Fetch initial challenge & authentic Ray ID from the backend
    fetch('/api/verify/challenge')
      .then((res) => res.json())
      .then((data) => {
        if (data?.rayId) {
          setRayId(data.rayId);
        }
      })
      .catch(() => {
        // Fallback local random hex if offline
        const localHex = Array.from({ length: 16 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        setRayId(localHex);
      });
  }, [domainParam]);

  // Handle human verification click
  const handleVerify = async () => {
    if (status !== 'idle') return;

    setStatus('verifying');
    setErrorMessage(null);

    // Realistic human verification latency (1.1s - 1.6s)
    const verificationDelay = 1100 + Math.random() * 500;

    setTimeout(async () => {
      try {
        const response = await fetch('/api/verify/challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rayId,
            redirect: redirectParam,
          }),
        });

        if (!response.ok) {
          throw new Error('Verification request throttled or failed');
        }

        const data = await response.json();
        setStatus('success');

        // Allow user to see the green checkmark before redirection
        setTimeout(() => {
          const targetUrl = data.redirectUrl || redirectParam || '/';
          if (targetUrl.startsWith('/')) {
            router.push(targetUrl);
          } else {
            window.location.href = targetUrl;
          }
        }, 650);
      } catch (err: any) {
        setStatus('idle');
        setErrorMessage(err?.message || 'Verification failed. Please try again.');
      }
    }, verificationDelay);
  };

  return (
    <main className="fixed inset-0 z-[99999] flex flex-col justify-between bg-black text-white font-sans select-none overflow-y-auto">
      {/* Top Main Section */}
      <div className="w-full max-w-4xl px-6 pt-16 sm:px-12 sm:pt-24 md:px-20">
        {/* Domain Header */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white break-words">
          {domain}
        </h1>

        {/* Challenge Title */}
        <h2 className="mt-5 text-xl sm:text-2xl font-bold text-white tracking-tight">
          Performing security verification
        </h2>

        {/* Challenge Subtext */}
        <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          This website uses a security service to protect against malicious bots. This page is
          displayed while the website verifies you are not a bot.
        </p>

        {/* Cloudflare Turnstile Challenge Widget */}
        <div className="mt-8 sm:mt-10">
          <div
            onClick={status === 'idle' ? handleVerify : undefined}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleVerify();
              }
            }}
            aria-label="Verify you are human"
            className={`w-full max-w-[316px] rounded-md border border-neutral-700/80 bg-[#1c1c1c] p-3.5 sm:p-4 shadow-xl flex items-center justify-between transition-all ${
              status === 'idle'
                ? 'cursor-pointer hover:border-neutral-500 hover:bg-[#222222]'
                : 'cursor-default'
            }`}
          >
            {/* Left Column: Interactive Checkbox & Label */}
            <div className="flex items-center gap-3">
              <div
                className={`h-6 w-6 rounded border flex items-center justify-center transition-all ${
                  status === 'idle'
                    ? 'border-neutral-500 bg-[#141414]'
                    : status === 'verifying'
                    ? 'border-neutral-600 bg-[#141414]'
                    : 'border-white bg-white text-black'
                }`}
              >
                {status === 'idle' && <span className="sr-only">Unchecked</span>}

                {status === 'verifying' && (
                  <div className="h-4 w-4 rounded-full border-2 border-neutral-500 border-t-white animate-spin" />
                )}

                {status === 'success' && (
                  <svg
                    className="h-4 w-4 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <span className="text-sm font-medium text-neutral-200">
                {status === 'idle' && 'Verify you are human'}
                {status === 'verifying' && 'Verifying...'}
                {status === 'success' && 'Verification successful'}
              </span>
            </div>

            {/* Right Column: Cloudflare Cloud Logo & Legal Links */}
            <div className="flex flex-col items-end pl-2">
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-5 w-8"
                  viewBox="0 0 120 70"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M96.4 35.5c-.3-12.8-10.7-23.1-23.5-23.1-9.9 0-18.4 6.2-21.8 15C49 26.2 46.8 25.6 44.5 25.6c-9.2 0-16.7 7.5-16.7 16.7 0 1.2.1 2.3.4 3.4C21.6 46.7 16 52.8 16 60.3c0 8.3 6.7 15 15 15h64.7c11.2 0 20.3-9.1 20.3-20.3 0-10.5-8-19.1-18.3-19.5h-1.3z"
                    fill="#F38020"
                  />
                </svg>
                <span className="text-[10px] font-bold tracking-wider text-neutral-300 uppercase">
                  Cloudflare
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-neutral-400">
                <a
                  href="https://www.cloudflare.com/privacypolicy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-200 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy
                </a>
                <span>•</span>
                <a
                  href="https://support.cloudflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-200 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Help
                </a>
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="mt-3 inline-block rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 font-mono">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <footer className="w-full px-6 pb-8 pt-12 sm:px-12 md:px-20 mt-auto">
        <div className="w-full border-t border-neutral-800 pt-6">
          <p className="text-center font-mono text-xs text-neutral-400">
            Ray ID: <span className="font-semibold text-neutral-300">{rayId}</span>
          </p>
          <p className="mt-2 text-center text-xs text-neutral-500">
            Performance and Security by{' '}
            <a
              href="https://www.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cloudflare
            </a>
            {' '}|{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Privacy
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function SecurityVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black text-white">
          <div className="h-6 w-6 rounded-full border-2 border-neutral-600 border-t-white animate-spin" />
        </div>
      }
    >
      <CloudflareVerificationContent />
    </Suspense>
  );
}
