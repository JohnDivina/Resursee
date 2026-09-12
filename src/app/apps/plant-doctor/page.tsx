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
import { PlantDiagnosisResult } from '@/types/plantDoctor';
import { QuotaStatus } from '@/lib/quotaManager';
import { LoaderFive } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import {
  detectLocalVisionModel,
  diagnosePlantOfflineLocal,
  LocalVisionDetectionResult,
} from '@/lib/plantVisionLocal';
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
  const [cachedPayload, setCachedPayload] = useState<{ imageBase64?: string; mimeType?: string } | null>(null);

  // Local Vision Engine & Offline Fallback State (Phase 3)
  const [localEngine, setLocalEngine] = useState<LocalVisionDetectionResult | null>(null);
  const [isCheckingLocalEngine, setIsCheckingLocalEngine] = useState<boolean>(true);
  const [enginePreference, setEnginePreference] = useState<'auto' | 'local' | 'cloud'>('auto');
  const [selectedLocalModel, setSelectedLocalModel] = useState<string>('');

  // Load Session, Quota & Local Vision Engine
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

    async function probeLocalVision() {
      setIsCheckingLocalEngine(true);
      try {
        const res = await detectLocalVisionModel();
        setLocalEngine(res);
        if (res.preferredModel) {
          setSelectedLocalModel(res.preferredModel);
        }
      } catch (err) {
        console.error('Local vision detection failed:', err);
      } finally {
        setIsCheckingLocalEngine(false);
      }
    }
    probeLocalVision();

    const savedPref = localStorage.getItem('resursee_plant_engine_pref');
    if (savedPref === 'auto' || savedPref === 'local' || savedPref === 'cloud') {
      setEnginePreference(savedPref);
    }

    try {
      const saved = localStorage.getItem('resursee-plant-doctor-history');
      if (saved) {
        setScanHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    // Silent pre-warm of AI vision serverless container to prevent cold starts
    fetch('/api/ai/diagnose-plant').catch(() => {});
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

  /**
   * Resizes large images (e.g. 12MP-48MP mobile photos) down to max 1600px
   * and exports a lightweight base64 JPEG to avoid network timeouts.
   */
  const optimizeImageForScan = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve({ base64: optimizedDataUrl, mimeType: 'image/jpeg' });
        };
        img.onerror = () => {
          resolve({ base64: reader.result as string, mimeType: file.type || 'image/jpeg' });
        };
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const runDiagnosis = async (options: {
    file?: File;
    retryPayload?: { imageBase64?: string; mimeType?: string };
  }) => {
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
      let payload: { imageBase64?: string; mimeType?: string } = {};

      if (options.retryPayload) {
        payload = options.retryPayload;
      } else if (options.file) {
        const { base64, mimeType } = await optimizeImageForScan(options.file);
        setCurrentImagePreview(base64);
        payload = {
          imageBase64: base64,
          mimeType,
        };
        setCachedPayload(payload);
      }

      // Phase 3: Check if User explicitly selected Local Engine OR if offline with local vision ready
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const shouldUseLocalDirectly =
        enginePreference === 'local' || (!isOnline && localEngine?.hasVisionModel);

      if (shouldUseLocalDirectly && localEngine?.preferredModel && payload.imageBase64) {
        const activeModel = selectedLocalModel || localEngine.preferredModel;
        setScanStepText(`Connecting to Local Vision Engine (${activeModel})...`);
        const localResult = await diagnosePlantOfflineLocal({
          model: activeModel,
          imageBase64: payload.imageBase64,
          onStepChange: (step) => setScanStepText(step),
        });

        const result: PlantDiagnosisResult = {
          ...localResult,
          imageUrl: currentImagePreview || undefined,
        };

        setDiagnosisResult(result);
        saveToHistory(result);
        setCachedPayload(null);
        return;
      }

      // Execute with automatic retry on cold-start / timeout
      let response: Response | null = null;
      let data: any = null;
      let attempt = 1;
      const maxAttempts = 2;
      let cloudError: Error | null = null;

      while (attempt <= maxAttempts) {
        try {
          if (attempt > 1) {
            setScanStepText('Vision engine warming up... Retrying analysis automatically...');
            await new Promise((r) => setTimeout(r, 400));
          }

          response = await fetch('/api/ai/diagnose-plant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(45000), // 45 seconds timeout
          });

          if (!response.ok && (response.status >= 500 || response.status === 429) && attempt < maxAttempts) {
            attempt++;
            continue;
          }

          data = await response.json();
          break;
        } catch (fetchErr: any) {
          cloudError = fetchErr;
          if (attempt < maxAttempts) {
            attempt++;
            continue;
          }
          break;
        }
      }

      // If cloud failed (network down, timeout, 502/503/504, or 429 quota reached)
      // Check if we can fallback to local Ollama vision!
      if (!response || !response.ok) {
        const isQuotaExceeded = data?.isGuestQuotaExceeded || response?.status === 429;

        // Auto Fallback: If local vision model is available in Ollama, rescue the diagnosis!
        if (
          enginePreference !== 'cloud' &&
          localEngine?.hasVisionModel &&
          localEngine.preferredModel &&
          payload.imageBase64
        ) {
          const activeModel = selectedLocalModel || localEngine.preferredModel;
          setScanStepText(
            `Cloud unavailable (${isQuotaExceeded ? 'quota limit reached' : 'offline/timeout'}). Routing to Local Vision Engine (${activeModel})...`
          );

          const localResult = await diagnosePlantOfflineLocal({
            model: activeModel,
            imageBase64: payload.imageBase64,
            onStepChange: (step) => setScanStepText(step),
          });

          const result: PlantDiagnosisResult = {
            ...localResult,
            imageUrl: currentImagePreview || undefined,
          };

          setDiagnosisResult(result);
          saveToHistory(result);
          setCachedPayload(null);
          return;
        }

        if (data?.quota) {
          setQuota(data.quota);
        }
        if (data?.isGuestQuotaExceeded) {
          setIsGuestExceeded(true);
        }
        throw new Error(data?.error || cloudError?.message || 'Failed to complete leaf diagnosis.');
      }

      if (data?.quota) {
        setQuota(data.quota);
      }

      const result: PlantDiagnosisResult = {
        ...data.result,
        imageUrl: currentImagePreview || undefined,
      };

      setDiagnosisResult(result);
      saveToHistory(result);
      setCachedPayload(null); // Success, clear retry payload
    } catch (err: unknown) {
      console.error('Diagnosis failed:', err);
      if (
        err instanceof Error &&
        (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'))
      ) {
        setErrorMessage(
          'Diagnosis request timed out. The server or image analysis took too long. Please try again.'
        );
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'An error occurred during scanning. Please try again.'
        );
      }
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
    setCachedPayload(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
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
              <span className="font-semibold text-[var(--color-ink)]">Plant Vision</span>
            </nav>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Engine Mode / Offline Status Pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3 py-1 text-xs font-mono font-bold text-[var(--color-ink)] shadow-2xs">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    localEngine?.hasVisionModel
                      ? 'bg-neutral-900 dark:bg-white'
                      : 'bg-neutral-400 dark:bg-neutral-600'
                  )}
                />
                <span className="text-[11px] text-[var(--color-ink-muted)]">Engine:</span>
                <select
                  value={enginePreference}
                  onChange={(e) => {
                    const val = e.target.value as 'auto' | 'local' | 'cloud';
                    setEnginePreference(val);
                    localStorage.setItem('resursee_plant_engine_pref', val);
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden cursor-pointer"
                >
                  <option value="auto">
                    Auto Fallback {localEngine?.hasVisionModel ? `(Local ${localEngine.preferredModel})` : '(Cloud Primary)'}
                  </option>
                  {localEngine?.hasVisionModel && (
                    <option value="local">
                      100% Offline ({selectedLocalModel || localEngine.preferredModel})
                    </option>
                  )}
                  <option value="cloud">Cloud Only (Gemini 2.5)</option>
                </select>
                {localEngine?.hasVisionModel ? (
                  <span className="rounded-full bg-neutral-200 dark:bg-neutral-800 text-[9px] px-1.5 py-0.2 font-mono text-neutral-700 dark:text-neutral-300">
                    Offline Ready
                  </span>
                ) : (
                  <Link
                    href="/apps/ai-hub"
                    className="text-[10px] text-[var(--color-ink-muted)] hover:underline ml-0.5"
                    title="Visit AI Hub to pull a local vision model"
                  >
                    (Get Vision Model)
                  </Link>
                )}
              </div>

              {/* Quota Indicator */}
              {quota && (
                <div className="flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3.5 py-1 text-xs font-mono font-bold text-[var(--color-ink)] shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                  <span>
                    {quota.maxQuota > 100
                      ? 'Admin Access: Unlimited Scans'
                      : quota.isGuest
                      ? `Guest Preview: ${quota.remaining} / ${quota.maxQuota} scans left`
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
          </div>

          {/* 2. Platform Heading Header */}
          <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Plant Vision
              </h1>
              <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] sm:text-sm leading-relaxed max-w-2xl">
                AI-powered crop diagnostics. Upload or snap a leaf photo to instantly detect plant diseases, assess foliar health, and receive actionable treatment plans. Supports automatic offline fallback via local Ollama vision models.
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
            <div className="rounded-[28px] border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-6 sm:p-8 text-center space-y-4 shadow-md animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                <LockSimple size={28} weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--color-ink)]">
                  Guest Preview Limit Reached
                </h3>
                <p className="mt-1 max-w-md mx-auto text-xs text-[var(--color-ink-muted)]">
                  You&apos;ve used your 2 free guest preview scans. Sign in with your Google account to get **10 free AI vision scans every single day**, or switch Engine to **100% Offline** via local Ollama!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a
                  href="/api/auth/google?returnTo=/apps/plant-doctor"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all"
                >
                  <GoogleLogo size={16} weight="bold" />
                  <span>Sign in with Google (10 Daily Scans)</span>
                </a>
                {localEngine?.hasVisionModel && (
                  <button
                    type="button"
                    onClick={() => {
                      setEnginePreference('local');
                      localStorage.setItem('resursee_plant_engine_pref', 'local');
                      setIsGuestExceeded(false);
                      if (cachedPayload) {
                        runDiagnosis({ retryPayload: cachedPayload });
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-6 py-3 text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Switch to Offline Vision ({localEngine.preferredModel})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Error Alert with 1-Click Retry & Offline Tip */}
          {errorMessage && !isGuestExceeded && (
            <div className="rounded-[20px] border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 text-xs font-medium text-[var(--color-ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span>{errorMessage}</span>
                {!localEngine?.hasVisionModel && (
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    💡 Tip: For 100% offline crop diagnostics when internet is down, install a vision model in local Ollama (e.g. <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded font-mono">ollama run qwen2.5vl:7b</code> or <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded font-mono">ollama run llava:7b</code>) or visit the <Link href="/apps/ai-hub" className="underline font-bold">AI Hub Model Library</Link>.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                {cachedPayload && (
                  <button
                    type="button"
                    onClick={() => runDiagnosis({ retryPayload: cachedPayload })}
                    className="font-bold underline cursor-pointer hover:text-neutral-900 dark:hover:text-white"
                  >
                    Retry Diagnosis
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="underline font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* 5. Scanning Animated State with Aceternity LoaderFive */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="relative overflow-hidden rounded-[32px] border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-10 sm:p-14 text-center shadow-md flex flex-col items-center justify-center min-h-80 space-y-4"
              >
                {currentImagePreview && (
                  <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-neutral-300 dark:border-neutral-700 shadow-sm mb-2">
                    <img
                      src={currentImagePreview}
                      alt="Uploaded leaf specimen"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="text-base sm:text-xl text-neutral-900 dark:text-neutral-100">
                  <LoaderFive text="Analyzing image - generating report" />
                </div>

                <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 max-w-md">
                  {scanStepText}
                </p>
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
                  className="flex items-center gap-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2.5 text-xs font-bold shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer"
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
