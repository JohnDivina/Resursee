'use client';

import React, { useState } from 'react';
import { PlantDiagnosisResult } from '@/types/plantDoctor';
import { generateFormalPlantReport } from '@/lib/generatePlantReport';
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
  FileText,
  ArrowsClockwise,
  Info,
  Virus,
  MagnifyingGlassPlus,
} from '@phosphor-icons/react';

interface DiagnosisReportProps {
  diagnosis: PlantDiagnosisResult;
  imageUrl?: string | null;
  onReset: () => void;
}

export default function DiagnosisReport({ diagnosis, imageUrl, onReset }: DiagnosisReportProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'organic' | 'chemical' | 'prevention'>('overview');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
            <CheckCircle size={14} weight="fill" className="text-neutral-700 dark:text-neutral-300" />
            <span>Optimal Health</span>
          </span>
        );
      case 'mild':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
            <WarningCircle size={14} weight="fill" className="text-neutral-700 dark:text-neutral-300" />
            <span>Mild Severity</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
            <WarningCircle size={14} weight="fill" className="text-neutral-700 dark:text-neutral-300" />
            <span>Moderate Severity</span>
          </span>
        );
      case 'severe':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
            <WarningCircle size={14} weight="fill" className="text-neutral-700 dark:text-neutral-300" />
            <span>High Severity</span>
          </span>
        );
    }
  };

  const getPathogenIcon = (type: string) => {
    switch (type) {
      case 'pest':
        return <Bug size={15} weight="bold" className="text-neutral-700 dark:text-neutral-300" />;
      case 'fungal':
        return <Drop size={15} weight="bold" className="text-neutral-700 dark:text-neutral-300" />;
      case 'bacterial':
        return <Virus size={15} weight="bold" className="text-neutral-700 dark:text-neutral-300" />;
      case 'healthy':
      default:
        return <Plant size={15} weight="bold" className="text-neutral-700 dark:text-neutral-300" />;
    }
  };

  const healthScore = diagnosis.isHealthy ? 98 : Math.max(20, 100 - (diagnosis.severity === 'severe' ? 65 : diagnosis.severity === 'moderate' ? 45 : 25));

  const handleGenerateReport = () => {
    setIsGenerating(true);
    try {
      generateFormalPlantReport(diagnosis, imageUrl);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Top Split Studio Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (5 Cols): Leaf Specimen Card */}
        <div className="flex flex-col justify-between rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs lg:col-span-5 space-y-6">
          <div className="space-y-4">
            {/* Specimen Header with Solid Black Font */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-black dark:text-white">
                BOTANICAL SPECIMEN
              </span>
              <span className="rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 font-mono text-[11px] font-bold text-neutral-900 dark:text-neutral-100">
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
                <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-500">
                  <Plant size={64} weight="bold" />
                </div>
              )}

              {/* Status Chips Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-mono font-bold text-white backdrop-blur-md">
                  {diagnosis.plantName}
                </span>
                <span className="rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-mono text-white/90 backdrop-blur-md flex items-center gap-1">
                  <MagnifyingGlassPlus size={12} />
                  <span>Click to zoom</span>
                </span>
              </div>
            </div>

            {/* Plant Identification Details */}
            <div className="space-y-2 pt-2 border-t border-[var(--color-rule-subtle)]">
              <div className="flex flex-wrap items-center gap-2">
                {getSeverityBadge(diagnosis.severity)}
                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
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
            <div className="rounded-[20px] bg-neutral-50 dark:bg-neutral-900/40 p-4 text-xs leading-relaxed text-[var(--color-ink)] border border-neutral-200 dark:border-neutral-800">
              <p className="flex items-start gap-2">
                <Info size={16} className="text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                <span>{diagnosis.summary}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Generate Report & New Scan */}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2.5 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 cursor-pointer transition-all disabled:opacity-50"
            >
              <FileText size={15} weight="bold" />
              <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 py-2.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 shadow-2xs hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 cursor-pointer transition-all"
            >
              <ArrowsClockwise size={15} weight="bold" />
              <span>New Scan</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Clinical Treatment Command Center */}
        <div className="flex flex-col justify-between rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs lg:col-span-7 space-y-6">
          {/* Header with Solid Black Font */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-5">
            <div>
              <span className="font-mono text-xs font-black uppercase tracking-wider text-black dark:text-white">
                CLINICAL PATHOLOGY ANALYSIS
              </span>
              <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-[var(--color-ink)]">
                Curative & Preventive Protocol
              </h3>
            </div>

            {/* Circular Health Meter */}
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3.5 py-2">
              <div className="relative h-10 w-10 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-300 dark:text-neutral-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-neutral-800 dark:text-neutral-200"
                    strokeDasharray={`${healthScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] font-black text-neutral-900 dark:text-neutral-100">
                  {healthScore}%
                </span>
              </div>
              <div className="text-left">
                <span className="block text-[10.5px] font-bold text-neutral-900 dark:text-neutral-100">
                  Foliage Vitality
                </span>
                <span className="block font-mono text-[9px] text-neutral-600 dark:text-neutral-400">
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
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon size={15} weight="bold" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Body */}
          <div className="flex-1 rounded-[24px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 p-5 sm:p-6 shadow-2xs">
            {/* Tab 1: Pathology & Symptoms */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 font-mono">
                    Observed Visual Biomarkers
                  </h4>
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {diagnosis.visualSymptoms.map((symp, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-start gap-2 rounded-[14px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-xs font-medium text-[var(--color-ink)]"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-600 dark:bg-neutral-400 shrink-0" />
                        <span>{symp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Affected Organs
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {diagnosis.affectedParts.map((part, pIdx) => (
                        <span
                          key={pIdx}
                          className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Pathogen Vector / Root Causes
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-[var(--color-ink)]">
                      {diagnosis.causes.map((cause, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-neutral-600 dark:bg-neutral-400 shrink-0" />
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
                <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  <FirstAid size={14} weight="bold" />
                  <span>Non-Toxic & Cultural Interventions</span>
                </div>

                <div className="space-y-3">
                  {diagnosis.organicTreatments.map((treat, tIdx) => (
                    <div
                      key={tIdx}
                      className="rounded-[18px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        <h5 className="text-xs sm:text-sm font-extrabold text-[var(--color-ink)]">
                          {treat.title}
                        </h5>
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 font-mono text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
                          <CalendarCheck size={12} />
                          <span>{treat.timeline}</span>
                        </span>
                      </div>

                      <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                        {treat.instructions}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="font-mono text-[10.5px] font-bold text-neutral-500">
                          Materials:
                        </span>
                        {treat.materials.map((mat, mIdx) => (
                          <span
                            key={mIdx}
                            className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-800 dark:text-neutral-200"
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
                <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  <Flask size={14} weight="bold" />
                  <span>Commercial Chemical Formulations</span>
                </div>

                {diagnosis.chemicalTreatments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--color-ink-muted)]">
                    No chemical intervention required for this condition. Cultural methods are sufficient.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnosis.chemicalTreatments.map((chem, cIdx) => (
                      <div
                        key={cIdx}
                        className="rounded-[18px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                          <h5 className="text-xs sm:text-sm font-extrabold text-[var(--color-ink)]">
                            {chem.title}
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {chem.activeIngredients.map((ing, iIdx) => (
                              <span
                                key={iIdx}
                                className="rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-800 dark:text-neutral-200"
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                          {chem.instructions}
                        </p>

                        <div className="rounded-[12px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2.5 text-[11.5px] text-neutral-800 dark:text-neutral-200 flex items-start gap-1.5">
                          <WarningCircle size={15} className="shrink-0 mt-0.5 text-neutral-600 dark:text-neutral-400" />
                          <span>Precaution: {chem.safetyPrecautions}</span>
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
                <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  <ShieldCheck size={14} weight="bold" />
                  <span>Good Agricultural Practices (GAP)</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {diagnosis.preventionTips.map((tip, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-start gap-2.5 rounded-[16px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-2xs"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-[10px] font-bold">
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
