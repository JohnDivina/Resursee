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
} from '@phosphor-icons/react';

interface DiagnosisReportProps {
  diagnosis: PlantDiagnosisResult;
  imageUrl?: string | null;
  onReset: () => void;
}

export default function DiagnosisReport({ diagnosis, imageUrl, onReset }: DiagnosisReportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'organic' | 'chemical' | 'prevention'>('overview');

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
            <span>Mild Pathology</span>
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
        return <WarningCircle size={16} weight="bold" className="text-orange-500" />;
      case 'healthy':
      default:
        return <Plant size={16} weight="bold" className="text-emerald-500" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* 1. Primary Diagnosis Header Card */}
      <div className="relative overflow-hidden rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {imageUrl ? (
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-[22px] border-2 border-[var(--color-rule)] bg-neutral-900 shadow-md">
                <img
                  src={imageUrl}
                  alt={diagnosis.plantName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white backdrop-blur-xs">
                  Analyzed
                </div>
              </div>
            ) : (
              <div className="flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-[22px] bg-emerald-500/10 text-emerald-600 shadow-xs">
                <Plant size={44} weight="bold" />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {getSeverityBadge(diagnosis.severity)}
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-mono text-xs font-semibold text-[var(--color-ink-secondary)]">
                  {getPathogenIcon(diagnosis.pathogenType)}
                  <span className="capitalize">{diagnosis.pathogenType} Category</span>
                </span>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 font-mono text-xs font-bold text-blue-600 dark:text-sky-400">
                  {diagnosis.confidenceScore}% AI Confidence
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
                {diagnosis.primaryDiagnosis}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[var(--color-ink-muted)]">
                <span className="font-bold text-[var(--color-ink)]">{diagnosis.plantName}</span>
                <span>•</span>
                <span className="italic font-serif">{diagnosis.scientificName}</span>
                <span>•</span>
                <span className="rounded-md bg-[var(--color-paper-muted)] px-2 py-0.5 font-mono text-[11px]">
                  {diagnosis.plantType}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3 border-t border-[var(--color-rule-subtle)] pt-4 lg:border-t-0 lg:pt-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2.5 text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
            >
              <ArrowsClockwise size={15} weight="bold" />
              <span>New Scan</span>
            </button>
          </div>
        </div>

        {/* Clinical Summary Paragraph */}
        <div className="mt-6 rounded-[20px] bg-[var(--color-paper-muted)]/70 p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-[var(--color-ink)] border border-[var(--color-rule-subtle)]">
          <p className="flex items-start gap-2">
            <Info size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <span>{diagnosis.summary}</span>
          </p>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-rule-subtle)] pb-2">
        {[
          { id: 'overview', label: 'Pathology & Symptoms', icon: WarningCircle },
          { id: 'organic', label: 'Organic Remedies', icon: FirstAid },
          { id: 'chemical', label: 'Chemical Solutions', icon: Flask },
          { id: 'prevention', label: 'Long-term Prevention', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-paper-card)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-surface)] border border-[var(--color-rule)]'
              }`}
            >
              <Icon size={16} weight="bold" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Dynamic Tab Content */}
      <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs">
        {/* Tab 1: Pathology & Symptoms */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-[var(--color-ink)]">
                Observed Visual Biomarkers
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Key botanical anomalies and tissue degradation patterns identified by the vision model.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {diagnosis.visualSymptoms.map((symp, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-start gap-2.5 rounded-[16px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 text-xs font-medium text-[var(--color-ink)]"
                  >
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <span>{symp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4 border-t border-[var(--color-rule-subtle)]">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  Affected Plant Organs
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {diagnosis.affectedParts.map((part, pIdx) => (
                    <span
                      key={pIdx}
                      className="rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-mono text-xs font-semibold text-[var(--color-ink)]"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  Primary Vector / Causes
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-[var(--color-ink)]">
                  {diagnosis.causes.map((cause, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
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
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                <FirstAid size={14} weight="fill" />
                <span>Eco-Friendly & Non-Toxic Protocols</span>
              </div>
              <h3 className="text-base font-extrabold text-[var(--color-ink)]">
                Biological & Organic Treatments
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {diagnosis.organicTreatments.map((treat, tIdx) => (
                <div
                  key={tIdx}
                  className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/[0.02] p-5 sm:p-6 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/10 pb-3">
                    <h4 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                      {treat.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                      <CalendarCheck size={13} />
                      <span>{treat.timeline}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--color-ink)] leading-relaxed">
                    {treat.instructions}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-mono text-[11px] font-bold text-[var(--color-ink-muted)]">
                      Required Materials:
                    </span>
                    {treat.materials.map((mat, mIdx) => (
                      <span
                        key={mIdx}
                        className="rounded-md border border-emerald-500/20 bg-white/60 dark:bg-neutral-900/60 px-2 py-0.5 font-mono text-[10.5px] text-[var(--color-ink)]"
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
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 mb-2">
                <Flask size={14} weight="fill" />
                <span>Commercial Agricultural Formulations</span>
              </div>
              <h3 className="text-base font-extrabold text-[var(--color-ink)]">
                Targeted Fungicides & Insecticides
              </h3>
            </div>

            {diagnosis.chemicalTreatments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-ink-muted)]">
                No chemical intervention required for this condition. Organic cultural methods are sufficient.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {diagnosis.chemicalTreatments.map((chem, cIdx) => (
                  <div
                    key={cIdx}
                    className="rounded-[22px] border border-sky-500/20 bg-sky-500/[0.02] p-5 sm:p-6 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-500/10 pb-3">
                      <h4 className="text-sm font-extrabold text-sky-950 dark:text-sky-200">
                        {chem.title}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {chem.activeIngredients.map((ing, iIdx) => (
                          <span
                            key={iIdx}
                            className="rounded-full bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-sky-700 dark:text-sky-300"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--color-ink)] leading-relaxed">
                      {chem.instructions}
                    </p>

                    <div className="rounded-[14px] bg-rose-500/5 border border-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                      <WarningCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{chem.safetyPrecautions}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Prevention */}
        {activeTab === 'prevention' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">
                <ShieldCheck size={14} weight="fill" />
                <span>Good Agricultural Practices (GAP)</span>
              </div>
              <h3 className="text-base font-extrabold text-[var(--color-ink)]">
                Long-Term Disease Prevention Guide
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {diagnosis.preventionTips.map((tip, tIdx) => (
                <div
                  key={tIdx}
                  className="flex items-start gap-3 rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-4 shadow-2xs"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-mono text-xs font-bold">
                    {tIdx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-[var(--color-ink)] leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
