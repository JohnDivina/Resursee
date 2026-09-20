'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { FileUpload } from '@/components/ui/file-upload';
import CameraCapture from '@/components/plant-doctor/CameraCapture';
import DiagnosisReport from '@/components/plant-doctor/DiagnosisReport';
import FollowUpChat from '@/components/plant-doctor/FollowUpChat';
import ScanHistory from '@/components/plant-doctor/ScanHistory';
import { PlantDiagnosisResult } from '@/types/plantDoctor';
import { QuotaStatus } from '@/lib/quotaManager';
import { LoaderFive } from '@/components/ui/loader';
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
  ClockCounterClockwise,
  Cpu,
  BookOpen,
  Plus,
  Trash,
  X,
  ArrowRight,
  Info,
  WarningCircle,
  FirstAid,
  ArrowsClockwise,
} from '@phosphor-icons/react';

type PlantDoctorTab = 'diagnose' | 'history' | 'engine' | 'guide';

export default function PlantDoctorPage() {
  const [activeTab, setActiveTab] = useState<PlantDoctorTab>('diagnose');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scan & Camera State
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

  // Local Vision Engine & Offline Fallback State
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
      const updated = [result, ...scanHistory.filter((h) => h.id !== result.id)].slice(0, 15);
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
    setActiveTab('diagnose');

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

      // Check if User explicitly selected Local Engine OR if offline with local vision ready
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
            signal: AbortSignal.timeout(45000),
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
      setCachedPayload(null);
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
    setActiveTab('diagnose');
  };

  const mobileBrand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
        <Plant size={16} weight="bold" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xs text-neutral-900 dark:text-white">
          Plant Vision
        </span>
        <span className="font-mono text-[10px] text-neutral-400">
          AI Crop Diagnostics
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 font-sans antialiased">
      {/* 🧭 SIDEBAR NAVIGATION (Collapsible & Responsive) */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody brand={mobileBrand} className="justify-between gap-6 border-r border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-[#111111]/85 backdrop-blur-md">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Back to Resursee Hub */}
            <div className="mb-4">
              <SidebarLink
                link={{
                  label: 'Back to Hub',
                  href: '/#apps',
                  icon: (
                    <ArrowLeft
                      size={18}
                      weight="bold"
                      className="text-neutral-600 dark:text-neutral-400"
                    />
                  ),
                }}
              />
            </div>

            {/* App Brand Header */}
            <div className="mb-6 px-1">
              <div className="flex items-center gap-2.5 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                  <Plant size={16} weight="bold" />
                </div>
                <motion.div
                  animate={{
                    display: sidebarOpen ? 'flex' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="flex flex-col truncate min-w-0"
                >
                  <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                    Plant Vision
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400 truncate">
                    AI Crop Diagnostics
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-1">
              <SidebarLink
                link={{
                  label: 'Diagnose Leaf',
                  onClick: () => setActiveTab('diagnose'),
                  icon: (
                    <Scan
                      size={18}
                      weight={activeTab === 'diagnose' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'diagnose',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Scan History',
                  onClick: () => setActiveTab('history'),
                  icon: (
                    <ClockCounterClockwise
                      size={18}
                      weight={activeTab === 'history' ? 'bold' : 'regular'}
                    />
                  ),
                  badge: scanHistory.length || undefined,
                  isActive: activeTab === 'history',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Vision Engine',
                  onClick: () => setActiveTab('engine'),
                  icon: (
                    <Cpu
                      size={18}
                      weight={activeTab === 'engine' ? 'bold' : 'regular'}
                    />
                  ),
                  badge: localEngine?.hasVisionModel ? 'Offline' : undefined,
                  isActive: activeTab === 'engine',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Crop Care Guide',
                  onClick: () => setActiveTab('guide'),
                  icon: (
                    <BookOpen
                      size={18}
                      weight={activeTab === 'guide' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'guide',
                }}
              />
            </div>
          </div>

          {/* Sidebar Bottom Controls */}
          <div className="border-t border-neutral-200 pt-3 mt-auto space-y-2.5 dark:border-neutral-800">
            {/* Engine Status Strip */}
            <div
              onClick={() => setActiveTab('engine')}
              className={cn(
                'group flex cursor-pointer items-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 transition-all hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/80',
                sidebarOpen ? 'justify-between' : 'justify-center'
              )}
              title="Click to manage local vision models and engine settings"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    localEngine?.hasVisionModel
                      ? 'bg-neutral-900 dark:bg-white'
                      : isCheckingLocalEngine
                      ? 'bg-neutral-400 animate-pulse'
                      : 'bg-neutral-400'
                  )}
                />
                <motion.span
                  animate={{
                    display: sidebarOpen ? 'inline-block' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate"
                >
                  {localEngine?.hasVisionModel
                    ? `Offline Vision (${selectedLocalModel || localEngine.preferredModel})`
                    : 'Cloud Vision Primary'}
                </motion.span>
              </div>
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="font-mono text-[10px] text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
              >
                Config
              </motion.span>
            </div>

            {/* Quota Indicator */}
            {quota && (
              <motion.div
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="items-center justify-between px-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400"
              >
                <span>Daily Scans:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {quota.maxQuota > 100 ? 'Unlimited' : `${quota.remaining} / ${quota.maxQuota}`}
                </span>
              </motion.div>
            )}

            {/* Theme Toggle & New Scan Button */}
            <div
              className={cn(
                'flex items-center px-1',
                sidebarOpen ? 'justify-between' : 'justify-center'
              )}
            >
              <ThemeToggle />
              <motion.button
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                type="button"
                onClick={handleResetScan}
                className="items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                title="Start New Leaf Scan"
              >
                <Plus size={13} weight="bold" />
                <span>New Scan</span>
              </motion.button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* 🖥️ MAIN APPLICATION WORKSPACE */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* TOP APP BAR */}
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 sm:px-6 dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md min-w-0 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
              Plant Vision
            </span>
            <span className="hidden sm:inline font-mono text-xs text-neutral-400">/</span>
            <span className="hidden sm:inline font-mono text-xs text-neutral-500 dark:text-neutral-400 capitalize">
              {activeTab === 'diagnose'
                ? diagnosisResult
                  ? 'Diagnosis Report'
                  : 'Specimen Intake'
                : activeTab === 'history'
                ? 'Scan History'
                : activeTab === 'engine'
                ? 'Vision Engine & Offline'
                : 'Crop Care Guide'}
            </span>
          </div>

          {/* Top Actions: Engine Selector, Quota, Live Camera, New Scan */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Engine Mode Dropdown */}
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-mono font-medium dark:border-neutral-800 dark:bg-neutral-900">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  localEngine?.hasVisionModel
                    ? 'bg-neutral-900 dark:bg-white'
                    : 'bg-neutral-400'
                )}
              />
              <select
                value={enginePreference}
                onChange={(e) => {
                  const val = e.target.value as 'auto' | 'local' | 'cloud';
                  setEnginePreference(val);
                  localStorage.setItem('resursee_plant_engine_pref', val);
                }}
                className="bg-transparent text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="auto">
                  Auto {localEngine?.hasVisionModel ? `(Local ${localEngine.preferredModel})` : '(Cloud)'}
                </option>
                {localEngine?.hasVisionModel && (
                  <option value="local">
                    100% Offline ({selectedLocalModel || localEngine.preferredModel})
                  </option>
                )}
                <option value="cloud">Cloud Only (Gemini 2.5)</option>
              </select>
            </div>

            {/* Quota Badge */}
            {quota && (
              <span className="hidden lg:inline-flex rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-1 font-mono text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-[#1a1a1a] dark:text-neutral-300">
                {quota.maxQuota > 100
                  ? 'Admin: Unlimited'
                  : quota.isGuest
                  ? `Guest: ${quota.remaining} left`
                  : `Scans: ${quota.remaining} / ${quota.maxQuota}`}
              </span>
            )}

            {/* Camera Action */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('diagnose');
                setCameraModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
              title="Open Live Camera Viewfinder"
            >
              <Camera size={14} weight="bold" />
              <span className="hidden sm:inline">Camera</span>
            </button>

            {/* Reset / New Scan */}
            <button
              type="button"
              onClick={handleResetScan}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1 text-xs font-semibold shadow-2xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition cursor-pointer"
              title="Start a new leaf diagnosis"
            >
              <Plus size={13} weight="bold" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* ERROR BANNER */}
        {errorMessage && !isGuestExceeded && (
          <div className="flex items-center justify-between border-b border-neutral-300 bg-neutral-200/80 px-4 sm:px-6 py-2.5 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 shrink-0">
            <div className="flex items-center gap-2">
              <WarningCircle size={15} weight="bold" className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-3">
              {cachedPayload && (
                <button
                  type="button"
                  onClick={() => runDiagnosis({ retryPayload: cachedPayload })}
                  className="font-bold underline cursor-pointer hover:text-neutral-900 dark:hover:text-white"
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* TAB 1: DIAGNOSE LEAF */}
            {activeTab === 'diagnose' && (
              <div className="space-y-6">
                {/* Guest Quota Warning */}
                {isGuestExceeded && (
                  <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-150">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                      <LockSimple size={24} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        Guest Preview Limit Reached
                      </h3>
                      <p className="mt-1 max-w-md mx-auto text-xs text-neutral-500 dark:text-neutral-400">
                        You&apos;ve used your 2 free guest preview scans. Sign in with Google to get 10 free scans daily, or switch to 100% Offline mode via local Ollama!
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                      <a
                        href="/api/auth/google?returnTo=/apps/plant-doctor"
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2.5 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition"
                      >
                        <GoogleLogo size={15} weight="bold" />
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
                          className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-2.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 transition cursor-pointer"
                        >
                          <span>Switch to Offline Vision ({localEngine.preferredModel})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Animated Scanning State with LoaderFive */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="relative overflow-hidden rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121212] p-10 sm:p-14 text-center shadow-sm flex flex-col items-center justify-center min-h-80 space-y-4"
                    >
                      {currentImagePreview && (
                        <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs mb-2">
                          <img
                            src={currentImagePreview}
                            alt="Uploaded leaf specimen"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <div className="text-base sm:text-lg text-neutral-900 dark:text-neutral-100">
                        <LoaderFive text="Analyzing foliar morphology & symptoms..." />
                      </div>

                      <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 max-w-md">
                        {scanStepText}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload Studio Dropzone (When not scanning and no diagnosis result) */}
                {!diagnosisResult && !isScanning && (
                  <div className="space-y-6">
                    {/* Header Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                          Foliar Specimen Intake
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Upload or snap a high-resolution leaf photo for automated botanical disease diagnosis.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCameraModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition cursor-pointer"
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

                    {/* Quick Guidance Cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-4 space-y-1">
                        <span className="font-mono text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                          1. Clear Lighting
                        </span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                          Use natural indirect sunlight. Avoid heavy shadows or harsh camera flash glare.
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-4 space-y-1">
                        <span className="font-mono text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                          2. Close-up Framing
                        </span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                          Frame the transition area between healthy green tissue and diseased lesions.
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-4 space-y-1">
                        <span className="font-mono text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                          3. 100% Offline Ready
                        </span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                          {localEngine?.hasVisionModel
                            ? `Local vision model (${selectedLocalModel || localEngine.preferredModel}) detected in Ollama.`
                            : 'Install a local vision model via AI Studio for zero-internet field diagnostics.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Split Studio Diagnosis & Follow-Up Botanical AI */}
                {diagnosisResult && !isScanning && (
                  <div className="space-y-6">
                    <DiagnosisReport
                      diagnosis={diagnosisResult}
                      imageUrl={currentImagePreview}
                      onReset={handleResetScan}
                    />

                    <FollowUpChat diagnosis={diagnosisResult} />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCAN HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                      Diagnostic History ({scanHistory.length})
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Saved leaf diagnoses and pathogen treatment plans stored securely in your browser.
                    </p>
                  </div>

                  {scanHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      <Trash size={14} />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                <ScanHistory
                  history={scanHistory}
                  onSelect={(item) => {
                    setDiagnosisResult(item);
                    setCurrentImagePreview(item.imageUrl || null);
                    setActiveTab('diagnose');
                  }}
                  onClear={handleClearHistory}
                />
              </div>
            )}

            {/* TAB 3: VISION ENGINE & OFFLINE CONFIG */}
            {activeTab === 'engine' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Vision Neural Engine &amp; Offline Configuration
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Control how foliar specimens are processed. Resursee supports both cloud models and zero-latency local vision neural networks via Ollama.
                  </p>
                </div>

                {/* Engine Mode Selection */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div
                    onClick={() => {
                      setEnginePreference('auto');
                      localStorage.setItem('resursee_plant_engine_pref', 'auto');
                    }}
                    className={cn(
                      'cursor-pointer rounded-2xl border p-5 transition-all',
                      enginePreference === 'auto'
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-900'
                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414] hover:border-neutral-400'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        Auto Fallback
                      </span>
                      {enginePreference === 'auto' && (
                        <CheckCircle size={18} weight="fill" className="text-neutral-900 dark:text-white" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      Primary high-accuracy Gemini 2.5 cloud analysis. Automatically falls back to local Ollama vision if internet drops or quota is reached.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      if (localEngine?.hasVisionModel) {
                        setEnginePreference('local');
                        localStorage.setItem('resursee_plant_engine_pref', 'local');
                      }
                    }}
                    className={cn(
                      'rounded-2xl border p-5 transition-all',
                      localEngine?.hasVisionModel
                        ? 'cursor-pointer'
                        : 'opacity-50 cursor-not-allowed',
                      enginePreference === 'local'
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-900'
                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414] hover:border-neutral-400'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        100% Offline
                      </span>
                      {enginePreference === 'local' && (
                        <CheckCircle size={18} weight="fill" className="text-neutral-900 dark:text-white" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      Zero cloud telemetry. Processes every leaf directly on your local GPU/CPU via Ollama. Ideal for off-grid farm field inspections.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setEnginePreference('cloud');
                      localStorage.setItem('resursee_plant_engine_pref', 'cloud');
                    }}
                    className={cn(
                      'cursor-pointer rounded-2xl border p-5 transition-all',
                      enginePreference === 'cloud'
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-900'
                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414] hover:border-neutral-400'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        Cloud Only
                      </span>
                      {enginePreference === 'cloud' && (
                        <CheckCircle size={18} weight="fill" className="text-neutral-900 dark:text-white" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      Direct cloud inference via Gemini 2.5 Flash Vision. Requires active internet and uses your daily account quota.
                    </p>
                  </div>
                </div>

                {/* Local Vision Diagnostics Card */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#121212] space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
                        <Cpu size={18} weight="bold" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                          Local Ollama Vision Engine
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Endpoint: <code>http://127.0.0.1:11434</code>
                        </p>
                      </div>
                    </div>

                    <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-mono text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      {localEngine?.hasVisionModel ? 'Vision Ready' : 'Standby / No Vision Model'}
                    </span>
                  </div>

                  {localEngine?.hasVisionModel ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500 dark:text-neutral-400">Active Local Model:</span>
                        <select
                          value={selectedLocalModel || localEngine.preferredModel || ''}
                          onChange={(e) => setSelectedLocalModel(e.target.value)}
                          className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-mono font-semibold dark:border-neutral-800 dark:bg-neutral-900 cursor-pointer"
                        >
                          {localEngine.allVisionModels.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        When running in 100% Offline or Auto Fallback mode, leaf specimens will be evaluated directly through this local model with zero external network transmission.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        No local vision model was detected in your local Ollama daemon. You can install a recommended edge vision model using the command below or visit the Resursee AI Studio Model Library:
                      </p>
                      <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-3 font-mono text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 flex items-center justify-between">
                        <code>ollama run qwen2.5vl:7b</code>
                        <span className="text-[11px] text-neutral-400">Terminal Command</span>
                      </div>
                      <div className="pt-1">
                        <Link
                          href="/apps/ai-hub"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                        >
                          <span>Open AI Studio Model Library</span>
                          <ArrowRight size={13} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: CROP CARE GUIDE & PATHOLOGY REFERENCE */}
            {activeTab === 'guide' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Crop Pathology &amp; Diagnostic Guide
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Reference manual for identifying common plant diseases, physiological chlorosis, and best photography practices.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                    <div className="flex items-center gap-2">
                      <FirstAid size={18} weight="bold" className="text-neutral-900 dark:text-white" />
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Early &amp; Late Leaf Blight
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Characterized by dark brown concentric target-like rings (Early Blight - <em>Alternaria solani</em>) or water-soaked necrotic patches with pale yellow halos (Late Blight - <em>Phytophthora infestans</em>).
                    </p>
                    <div className="pt-2 font-mono text-[11px] text-neutral-400">
                      Treatment: Copper fungicide spray, remove infected bottom foliage, avoid overhead watering.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                    <div className="flex items-center gap-2">
                      <FirstAid size={18} weight="bold" className="text-neutral-900 dark:text-white" />
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Powdery Mildew
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Superficial white powdery talcum-like patches appearing on upper leaf surfaces, causing curling, yellowing, and premature foliage senescence.
                    </p>
                    <div className="pt-2 font-mono text-[11px] text-neutral-400">
                      Treatment: Organic neem oil spray, potassium bicarbonate wash, prune canopy for airflow.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                    <div className="flex items-center gap-2">
                      <FirstAid size={18} weight="bold" className="text-neutral-900 dark:text-white" />
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Leaf Rust Fungi
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Raised reddish-orange or rust-colored pustules predominantly clustered on the underside of leaves, releasing powdery spores when agitated.
                    </p>
                    <div className="pt-2 font-mono text-[11px] text-neutral-400">
                      Treatment: Wettable sulfur dust, destroy severely damaged leaves, keep foliage dry.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                    <div className="flex items-center gap-2">
                      <FirstAid size={18} weight="bold" className="text-neutral-900 dark:text-white" />
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Chlorosis &amp; Nutrient Deficiencies
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Uniform yellowing of older leaves indicates Nitrogen deficiency. Interveinal chlorosis (green veins with yellow intervening tissue) indicates Iron, Magnesium, or Zinc lockout due to soil pH.
                    </p>
                    <div className="pt-2 font-mono text-[11px] text-neutral-400">
                      Treatment: Chelated iron foliar drench, balanced N-P-K fertilizer, test soil runoff pH (6.0 - 6.8).
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Camera Capture Modal Viewfinder */}
      <CameraCapture
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(file) => runDiagnosis({ file })}
      />
    </div>
  );
}
