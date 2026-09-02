'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { FileUpload } from '@/components/ui/file-upload';
import CameraCapture from '@/components/plant-doctor/CameraCapture';
import DiagnosisReport from '@/components/plant-doctor/DiagnosisReport';
import FollowUpChat from '@/components/plant-doctor/FollowUpChat';
import ScanHistory from '@/components/plant-doctor/ScanHistory';
import { samplePlants } from '@/lib/plantDoctorSamples';
import { PlantDiagnosisResult, SamplePlant } from '@/types/plantDoctor';
import { QuotaStatus } from '@/lib/quotaManager';
import {
  Plant,
  Camera,
  Sparkle,
  ShieldCheck,
  ArrowLeft,
  Scan,
  Lightning,
  CheckCircle,
  GoogleLogo,
  LockSimple,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export default function PlantDoctorPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('Initializing Vision Neural Net...');
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<PlantDiagnosisResult | null>(null);
  const [scanHistory, setScanHistory] = useState<PlantDiagnosisResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isGuestExceeded, setIsGuestExceeded] = useState(false);

  // Load Session & Scan History
  useEffect(() => {
    async function loadSessionAndQuota() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.quota) {
            setQuota(data.quota);
          }
        }
      } catch (err) {
        console.error('Failed to load auth session:', err);
      }
    }
    loadSessionAndQuota();

    try {
      const saved = localStorage.getItem('resursee-plant-doctor-history');
      if (saved) {
        setScanHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToHistory = (result: PlantDiagnosisResult) => {
    try {
      const updated = [result, ...scanHistory.filter((h) => h.id !== result.id)].slice(0, 10);
      setScanHistory(updated);
      localStorage.setItem('resursee-plant-doctor-history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('resursee-plant-doctor-history');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const runDiagnosis = async (options: { file?: File; sample?: SamplePlant }) => {
    setIsScanning(true);
    setErrorMessage(null);
    setDiagnosisResult(null);
    setIsGuestExceeded(false);

    const stepMessages = [
      'Scanning foliage morphology & cellular structure...',
      'Analyzing leaf chlorosis, pustules & necrotic margins...',
      'Cross-referencing agricultural pathogen database...',
      'Formulating organic remedies & chemical protocols...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % stepMessages.length;
      setScanStepText(stepMessages[stepIndex]);
    }, 600);

    try {
      let payload: { imageBase64?: string; mimeType?: string; sampleId?: string } = {};

      if (options.file) {
        const base64 = await fileToBase64(options.file);
        setCurrentImagePreview(base64);
        payload = {
          imageBase64: base64,
          mimeType: options.file.type || 'image/jpeg',
        };
      } else if (options.sample) {
        setCurrentImagePreview(options.sample.imageUrl);
        payload = {
          sampleId: options.sample.id,
        };
      }

      const response = await fetch('/api/ai/diagnose-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isGuestQuotaExceeded) {
          setIsGuestExceeded(true);
        }
        throw new Error(data.error || 'Failed to complete leaf diagnosis.');
      }

      if (data.quota) {
        setQuota(data.quota);
      }

      const result: PlantDiagnosisResult = {
        ...data.result,
        imageUrl: currentImagePreview || (options.sample ? options.sample.imageUrl : undefined),
      };

      setDiagnosisResult(result);
      saveToHistory(result);
    } catch (err: unknown) {
      console.error('Diagnosis failed:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred during scanning. Please try again.'
      );
    } finally {
      clearInterval(interval);
      setIsScanning(false);
    }
  };

  const handleResetScan = () => {
    setDiagnosisResult(null);
    setCurrentImagePreview(null);
    setErrorMessage(null);
    setIsGuestExceeded(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette isOpen={searchPaletteOpen} onClose={() => setSearchPaletteOpen(false)} />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 1. Breadcrumb & Quota Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
              <Link href="/" className="hover:text-[var(--color-primary)]">
                Home
              </Link>
              <span>/</span>
              <Link href="/" className="hover:text-[var(--color-primary)]">
                Apps
              </Link>
              <span>/</span>
              <span className="font-semibold text-[var(--color-ink)]">Plant Doctor AI</span>
            </nav>

            {/* Quota Indicator */}
            {quota && (
              <div className="flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3.5 py-1 text-xs font-mono font-bold text-[var(--color-ink)] shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {quota.maxQuota > 100
                    ? 'Admin Access: Unlimited Scans'
                    : quota.isGuest
                    ? `Guest Preview: ${quota.remaining} / ${quota.maxQuota} scan left`
                    : `Daily AI Scans: ${quota.remaining} / ${quota.maxQuota} remaining`}
                </span>
                {quota.isGuest && (
                  <a
                    href="/api/auth/google?returnTo=/apps/plant-doctor"
                    className="ml-1 text-[11px] text-[var(--color-primary)] hover:underline"
                  >
                    (Sign in for 10)
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 2. Platform Heading Header */}
          <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-emerald-600 text-white shadow-xs">
                  <Plant size={20} weight="bold" />
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Multimodal AI Vision · App #1
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={12} weight="bold" />
                  <span>Google Gemini 3.6 Flash</span>
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Plant Doctor AI Vision Studio
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm max-w-2xl">
                Instant botanical pathology. Upload a leaf photo to identify diseases, fungal blights, and insect infestations with curated organic & chemical treatments.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]"
            >
              <ArrowLeft size={14} />
              <span>Back to Hub</span>
            </Link>
          </div>

          {/* 3. Guest Quota Prompt Card */}
          {isGuestExceeded && (
            <div className="rounded-[28px] border border-emerald-500/30 bg-emerald-500/[0.04] p-6 sm:p-8 text-center space-y-4 shadow-md animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <LockSimple size={28} weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--color-ink)]">
                  Guest Preview Limit Reached
                </h3>
                <p className="mt-1 max-w-md mx-auto text-xs text-[var(--color-ink-muted)]">
                  You&apos;ve used your free guest scan. Sign in with your Google account to get **10 free AI vision scans every single day**!
                </p>
              </div>
              <div>
                <a
                  href="/api/auth/google?returnTo=/apps/plant-doctor"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all"
                >
                  <GoogleLogo size={16} weight="bold" />
                  <span>Sign in with Google (10 Daily Scans)</span>
                </a>
              </div>
            </div>
          )}

          {/* 4. Error Alert */}
          {errorMessage && !isGuestExceeded && (
            <div className="rounded-[20px] border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="underline font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 5. Scanning Animated State */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative overflow-hidden rounded-[32px] border border-emerald-500/30 bg-neutral-950 p-10 text-white shadow-2xl flex flex-col items-center justify-center text-center min-h-80"
              >
                {/* Laser Scanning Line Animation */}
                <motion.div
                  animate={{ y: [-120, 120, -120] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981]"
                />

                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <Scan size={36} weight="bold" className="animate-pulse" />
                </div>

                <h3 className="mt-6 text-xl font-extrabold text-white tracking-tight">
                  Analyzing Botanical Pathology...
                </h3>

                <p className="mt-2 font-mono text-xs text-emerald-300 animate-pulse max-w-md">
                  {scanStepText}
                </p>

                <div className="mt-6 flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-mono text-white/80">
                  <Lightning size={13} className="text-amber-400" />
                  <span>Multimodal Neural Vision Engine Active</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6. Upload Studio & Sample Library */}
          {!diagnosisResult && !isScanning && (
            <div className="space-y-8">
              {/* Dual Action Bar: Camera Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
                    Upload or Capture Photo
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCameraModalOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Camera size={16} weight="bold" />
                  <span>Open Live Camera</span>
                </button>
              </div>

              {/* Aceternity FileUpload Dropzone */}
              <FileUpload
                accept="image/*"
                maxSizeMB={25}
                title="Choose a leaf photo or drop it here"
                description="Snap or upload a close-up photo of any damaged leaf, crop, or house plant."
                acceptedTypesLabel={['PNG (.png)', 'JPEG (.jpg, .jpeg)', 'WebP (.webp)', 'Camera Snapshots']}
                onChange={(files) => {
                  if (files && files[0]) {
                    runDiagnosis({ file: files[0] });
                  }
                }}
              />

              {/* 1-Click Sample Testing Gallery */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-rule-subtle)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--color-ink)]">
                      1-Click Instant Test Samples (0 Tokens Used)
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      Test our AI diagnostic studio immediately with pre-loaded botanical cases:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {samplePlants.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => runDiagnosis({ sample })}
                      className="group flex flex-col justify-between overflow-hidden rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 text-left shadow-2xs transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-md active:scale-98 cursor-pointer"
                    >
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-[14px] bg-neutral-900">
                        <img
                          src={sample.imageUrl}
                          alt={sample.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-mono font-bold text-white backdrop-blur-xs">
                          {sample.category}
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-xs font-bold text-[var(--color-ink)] group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {sample.name}
                        </h4>
                        <p className="mt-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold line-clamp-1">
                          {sample.issue}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-2 text-[10.5px] font-bold text-[var(--color-primary)]">
                        <span>Instant Test</span>
                        <Sparkle size={12} weight="fill" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Local Scan History */}
              <ScanHistory
                history={scanHistory}
                onSelect={(item) => setDiagnosisResult(item)}
                onClear={handleClearHistory}
              />
            </div>
          )}

          {/* 7. Redesigned Split Studio Diagnosis & Follow-Up AI */}
          {diagnosisResult && !isScanning && (
            <div className="space-y-8">
              <DiagnosisReport
                diagnosis={diagnosisResult}
                imageUrl={currentImagePreview}
                onReset={handleResetScan}
              />

              {/* Follow-Up Botanical AI Assistant */}
              <FollowUpChat diagnosis={diagnosisResult} />
            </div>
          )}
        </div>
      </main>

      {/* Camera Capture Modal Viewfinder */}
      <CameraCapture
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(file) => runDiagnosis({ file })}
      />

      <Footer />
    </div>
  );
}
