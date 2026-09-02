'use client';

import React, { useState } from 'react';
import { PlantDiagnosisResult } from '@/types/plantDoctor';
import {
  Plant,
  WarningCircle,
  CheckCircle,
  Bug,
  Drop,
  ShieldCheck,
  FirstAid,
  Flask,
  CalendarCheck,
  Printer,
  ArrowsClockwise,
  Sparkle,
  Info,
  Check,
  Virus,
  MagnifyingGlassPlus,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';

interface DiagnosisReportProps {
  diagnosis: PlantDiagnosisResult;
  imageUrl?: string | null;
  onReset: () => void;
}

export default function DiagnosisReport({ diagnosis, imageUrl, onReset }: DiagnosisReportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'organic' | 'chemical' | 'prevention'>('overview');
  const [isZoomed, setIsZoomed] = useState(false);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={14} weight="fill" />
            <span>Optimal Health</span>
          </span>
        );
      case 'mild':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <WarningCircle size={14} weight="fill" />
            <span>Mild Severity</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
            <WarningCircle size={14} weight="fill" />
            <span>Moderate Severity</span>
          </span>
        );
      case 'severe':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <WarningCircle size={14} weight="fill" />
            <span>High Severity / Urgent</span>
          </span>
        );
    }
  };

  const getPathogenIcon = (type: string) => {
    switch (type) {
      case 'pest':
        return <Bug size={16} weight="bold" className="text-amber-500" />;
      case 'fungal':
        return <Drop size={16} weight="bold" className="text-rose-500" />;
      case 'bacterial':
        return <Virus size={16} weight="bold" className="text-orange-500" />;
      case 'healthy':
      default:
        return <Plant size={16} weight="bold" className="text-emerald-500" />;
    }
  };

  const healthScore = diagnosis.isHealthy ? 98 : Math.max(20, 100 - (diagnosis.severity === 'severe' ? 65 : diagnosis.severity === 'moderate' ? 45 : 25));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Top Split Studio Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (5 Cols): Interactive Leaf Inspector & Specimen Card */}
        <div className="flex flex-col justify-between rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs lg:col-span-5 space-y-6">
          <div className="space-y-4">
            {/* Specimen Header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Botanical Specimen
              </span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-600 dark:text-sky-400">
                {diagnosis.confidenceScore}% AI Confidence
              </span>
            </div>

            {/* Image Preview with Interactive Zoom Lens */}
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-[24px] border border-[var(--color-rule)] bg-neutral-950 shadow-inner group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={diagnosis.plantName}
                  className={`h-full w-full object-cover transition-transform duration-500 ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'group-hover:scale-105 cursor-zoom-in'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-500/10 text-emerald-600">
                  <Plant size={64} weight="bold" />
                </div>
              )}

              {/* Status Chips Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-mono font-bold text-white backdrop-blur-md">
                  {diagnosis.plantName}
                </span>
                <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-mono text-white/90 backdrop-blur-md flex items-center gap-1">
                  <MagnifyingGlassPlus size={12} />
                  <span>Click to zoom</span>
                </span>
              </div>
            </div>

            {/* Plant Identification Details */}
            <div className="space-y-2 pt-2 border-t border-[var(--color-rule-subtle)]">
              <div className="flex flex-wrap items-center gap-2">
                {getSeverityBadge(diagnosis.severity)}
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-mono text-xs font-semibold text-[var(--color-ink-secondary)]">
                  {getPathogenIcon(diagnosis.pathogenType)}
                  <span className="capitalize">{diagnosis.pathogenType}</span>
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
                {diagnosis.primaryDiagnosis}
              </h2>

              <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                <span className="font-bold text-[var(--color-ink)]">{diagnosis.plantName}</span>
                <span>•</span>
                <span className="italic font-serif">{diagnosis.scientificName}</span>
              </div>
            </div>

            {/* Clinical Pathology Summary */}
            <div className="rounded-[20px] bg-[var(--color-paper-muted)]/70 p-4 text-xs leading-relaxed text-[var(--color-ink)] border border-[var(--color-rule-subtle)]">
              <p className="flex items-start gap-2">
                <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                <span>{diagnosis.summary}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] py-2.5 text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
            >
              <ArrowsClockwise size={15} weight="bold" />
              <span>New Scan</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Clinical Treatment Command Center */}
        <div className="flex flex-col justify-between rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs lg:col-span-7 space-y-6">
          {/* Header with Health Score Ring */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-5">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Clinical Pathology Analysis
              </span>
              <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-[var(--color-ink)]">
                Curative & Preventive Protocol
              </h3>
            </div>

            {/* Circular Health Meter */}
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-paper-muted)] px-3.5 py-2">
              <div className="relative h-10 w-10 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-black/5 dark:text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={diagnosis.isHealthy ? 'text-emerald-500' : healthScore > 50 ? 'text-amber-500' : 'text-rose-500'}
                    strokeDasharray={`${healthScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] font-black text-[var(--color-ink)]">
                  {healthScore}%
                </span>
              </div>
              <div className="text-left">
                <span className="block text-[10.5px] font-bold text-[var(--color-ink)]">
                  Foliage Vitality
                </span>
                <span className="block font-mono text-[9px] text-[var(--color-ink-muted)]">
                  {diagnosis.isHealthy ? 'Optimal' : 'Pathology Present'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Selection Bar */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Pathology & Symptoms', icon: WarningCircle },
              { id: 'organic', label: 'Organic Remedies', icon: FirstAid },
              { id: 'chemical', label: 'Chemical Solutions', icon: Flask },
              { id: 'prevention', label: 'Long-term GAP', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]'
                  }`}
                >
                  <Icon size={15} weight="bold" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Body */}
          <div className="flex-1 rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-5 sm:p-6 shadow-2xs">
            {/* Tab 1: Pathology & Symptoms */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)] font-mono">
                    Observed Visual Biomarkers
                  </h4>
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {diagnosis.visualSymptoms.map((symp, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-start gap-2 rounded-[14px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] p-3 text-xs font-medium text-[var(--color-ink)]"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{symp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-[var(--color-rule-subtle)]">
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Affected Organs
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {diagnosis.affectedParts.map((part, pIdx) => (
                        <span
                          key={pIdx}
                          className="rounded-md bg-[var(--color-paper-muted)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--color-ink)]"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Pathogen Vector / Root Causes
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-[var(--color-ink)]">
                      {diagnosis.causes.map((cause, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--color-primary)] shrink-0" />
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Organic Remedies */}
            {activeTab === 'organic' && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <FirstAid size={14} weight="fill" />
                  <span>Eco-Friendly & Non-Toxic Remedies</span>
                </div>

                <div className="space-y-3">
                  {diagnosis.organicTreatments.map((treat, tIdx) => (
                    <div
                      key={tIdx}
                      className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/[0.02] p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 pb-2">
                        <h5 className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                          {treat.title}
                        </h5>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          <CalendarCheck size={12} />
                          <span>{treat.timeline}</span>
                        </span>
                      </div>

                      <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                        {treat.instructions}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="font-mono text-[10.5px] font-bold text-[var(--color-ink-muted)]">
                          Materials:
                        </span>
                        {treat.materials.map((mat, mIdx) => (
                          <span
                            key={mIdx}
                            className="rounded-md border border-emerald-500/20 bg-white/60 dark:bg-neutral-900/60 px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink)]"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Chemical Solutions */}
            {activeTab === 'chemical' && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <Flask size={14} weight="fill" />
                  <span>Commercial Agricultural Controls</span>
                </div>

                {diagnosis.chemicalTreatments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--color-ink-muted)]">
                    No chemical intervention required for this condition. Organic cultural methods are sufficient.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnosis.chemicalTreatments.map((chem, cIdx) => (
                      <div
                        key={cIdx}
                        className="rounded-[18px] border border-sky-500/20 bg-sky-500/[0.02] p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-sky-500/10 pb-2">
                          <h5 className="text-xs sm:text-sm font-extrabold text-sky-950 dark:text-sky-200">
                            {chem.title}
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {chem.activeIngredients.map((ing, iIdx) => (
                              <span
                                key={iIdx}
                                className="rounded-full bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-700 dark:text-sky-300"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                          {chem.instructions}
                        </p>

                        <div className="rounded-[12px] bg-rose-500/5 border border-rose-500/20 p-2.5 text-[11.5px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                          <WarningCircle size={15} className="shrink-0 mt-0.5" />
                          <span>{chem.safetyPrecautions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Long-Term Prevention */}
            {activeTab === 'prevention' && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <ShieldCheck size={14} weight="fill" />
                  <span>Good Agricultural Practices (GAP)</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {diagnosis.preventionTips.map((tip, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-start gap-2.5 rounded-[16px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] p-3 shadow-2xs"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-mono text-[10px] font-bold">
                        {tIdx + 1}
                      </span>
                      <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
