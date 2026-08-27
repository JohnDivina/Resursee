'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import {
  UploadSimple,
  FileText,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Info,
  Buildings,
  Tag,
  ClockCounterClockwise,
  ArrowLeft,
  Sparkle,
  Paperclip,
} from '@phosphor-icons/react';
import { mockCategories, mockDepartments, mockResources } from '@/lib/mockData';
import { DocumentType, SubmissionType } from '@/types/database';

export default function ContributePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  // Form Fields
  const [submissionType, setSubmissionType] = useState<SubmissionType>('new_resource');
  const [existingResourceId, setExistingResourceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(mockCategories[0].id);
  const [departmentId, setDepartmentId] = useState(mockDepartments[0].id);
  const [docType, setDocType] = useState<DocumentType>('form');
  const [fileFormat, setFileFormat] = useState('PDF');
  const [versionLabel, setVersionLabel] = useState('2026.1');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitterRole, setSubmitterRole] = useState<'student' | 'faculty' | 'staff' | 'alumni' | 'other'>('student');
  const [submissionNotes, setSubmissionNotes] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      if (['PDF', 'DOCX', 'XLSX', 'PPTX'].includes(ext)) {
        setFileFormat(ext);
      }
      if (!title) {
        // Auto populate title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleExistingResourceSelect = (resId: string) => {
    setExistingResourceId(resId);
    const existing = mockResources.find((r) => r.id === resId);
    if (existing) {
      setTitle(existing.title);
      setCategoryId(existing.category_id);
      if (existing.department_id) setDepartmentId(existing.department_id);
      setDocType(existing.document_type);
      setFileFormat(existing.file_format);
      setVersionLabel(`2026.${parseInt(existing.current_version.split('.')[1] || '0') + 1}`);
      if (existing.source_name) setSourceName(existing.source_name);
      if (existing.source_url) setSourceUrl(existing.source_url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !submitterName.trim() || !submitterEmail.trim()) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    setIsSubmitting(true);

    // Simulate server submission
    setTimeout(() => {
      const newId = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmissionId(newId);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setTitle('');
    setDescription('');
    setFileName('');
    setSubmissionNotes('');
    setSourceUrl('');
    setSourceName('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        resources={mockResources}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">Contribute Resource</span>
          </nav>

          {/* Header Banner */}
          <div className="mt-4 border-b border-[var(--color-rule)] pb-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)] text-base">
                🦦
              </span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                Community Document Repository
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Submit a University Resource or Update
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)] sm:text-sm">
              Found an official form, updated syllabus template, or new policy circular? Submit it here to help keep our central campus hub comprehensive and accurate.
            </p>
          </div>

          {/* Submission Process Notice Banner */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[var(--color-primary-subtle)] bg-[var(--color-primary-subtle)]/40 p-4 text-xs text-[var(--color-ink)]">
            <ShieldCheck size={20} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Editorial Review Policy:</span> All community submissions are queued for verification by university department administrators before appearing publicly. Submissions with verified university sources or official email addresses are expedited.
            </div>
          </div>

          {/* SUCCESS STATE */}
          {isSubmitted ? (
            <div className="mt-8 rounded-2xl border-2 border-emerald-500/30 bg-[var(--color-paper-card)] p-8 text-center shadow-lg animate-in zoom-in-95">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={32} weight="fill" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-[var(--color-ink)]">
                Submission Received for Review!
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[var(--color-ink-muted)] sm:text-sm">
                Thank you, <span className="font-semibold text-[var(--color-ink)]">{submitterName}</span>. Your submission has been securely queued in the Master Admin Review Queue.
              </p>

              <div className="mx-auto mt-6 max-w-sm rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3 font-mono text-xs">
                <span className="text-[var(--color-ink-muted)]">Tracking Reference:</span>{' '}
                <span className="font-bold text-[var(--color-primary)]">{submissionId}</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]"
                >
                  Submit Another Resource
                </button>
                <Link
                  href="/resources"
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)]"
                >
                  Browse Public Directory
                </Link>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
              {/* SECTION 1: Submission Type */}
              <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs">
                <h2 className="font-display text-base font-bold text-[var(--color-ink)]">
                  1. What are you submitting?
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionType('new_resource');
                      setExistingResourceId('');
                    }}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                      submissionType === 'new_resource'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/60 ring-2 ring-[var(--color-primary)]'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-card)]'
                    }`}
                  >
                    <FileText size={22} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-display text-xs font-bold text-[var(--color-ink)]">
                        Brand New Resource
                      </span>
                      <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                        A form, template, or policy not currently available in the directory.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmissionType('update_existing')}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                      submissionType === 'update_existing'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/60 ring-2 ring-[var(--color-primary)]'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-card)]'
                    }`}
                  >
                    <ClockCounterClockwise size={22} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-display text-xs font-bold text-[var(--color-ink)]">
                        Updated Revision / Superseded Form
                      </span>
                      <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                        A new revision of a document that already exists on Resursee.
                      </p>
                    </div>
                  </button>
                </div>

                {/* If updating existing, show dropdown of current resources */}
                {submissionType === 'update_existing' && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <label className="block text-xs font-bold text-amber-900">
                      Select Existing Document to Update *
                    </label>
                    <select
                      value={existingResourceId}
                      onChange={(e) => handleExistingResourceSelect(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-md border border-[var(--color-rule-strong)] bg-white p-2 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="">-- Choose a document from the current directory --</option>
                      {mockResources.map((res) => (
                        <option key={res.id} value={res.id}>
                          [{res.file_format}] {res.title} (Current: {res.current_version})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* SECTION 2: Document Details */}
              <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs space-y-4">
                <h2 className="font-display text-base font-bold text-[var(--color-ink)]">
                  2. Document Details
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)]">
                    Official Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Application for Academic Overload & Cross-Enrollment Form"
                    className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)]">
                    Summary / Purpose of Document
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief summary of what this document is used for and who requires it..."
                    className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Academic Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                    >
                      {mockCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Issuing Department / Office *
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                    >
                      {mockDepartments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.abbreviation} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      File Format
                    </label>
                    <select
                      value={fileFormat}
                      onChange={(e) => setFileFormat(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2 font-mono text-xs uppercase outline-hidden"
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOCX">DOCX</option>
                      <option value="XLSX">XLSX</option>
                      <option value="PPTX">PPTX</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Version Label
                    </label>
                    <input
                      type="text"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                      placeholder="2026.1"
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2 font-mono text-xs outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Document Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2 font-mono text-xs uppercase outline-hidden"
                    >
                      <option value="form">Form</option>
                      <option value="template">Template</option>
                      <option value="policy">Policy</option>
                      <option value="memorandum">Memorandum</option>
                      <option value="academic">Academic</option>
                      <option value="research">Research</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: File Attachment or Source Link */}
              <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs space-y-4">
                <h2 className="font-display text-base font-bold text-[var(--color-ink)]">
                  3. File Attachment & Official Source
                </h2>

                {/* Upload box */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)]">
                    Upload Document File (.pdf, .docx, .xlsx, .pptx)
                  </label>
                  <label className="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-6 text-center cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]/30">
                    <UploadSimple size={28} className="text-[var(--color-primary)]" />
                    <span className="mt-2 text-xs font-semibold text-[var(--color-ink)]">
                      {fileName ? fileName : 'Click to select a file from your computer'}
                    </span>
                    <span className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
                      Max file size: 25 MB
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Official Source Webpage URL
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://university.edu/registrar/forms"
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Source Bureau / Issuing Office Name
                    </label>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g. Office of the University Registrar"
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Submitter Information */}
              <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs space-y-4">
                <h2 className="font-display text-base font-bold text-[var(--color-ink)]">
                  4. Submitter Information
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      University Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      placeholder="jdelacruz@university.edu"
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Affiliation / Role
                    </label>
                    <select
                      value={submitterRole}
                      onChange={(e) => setSubmitterRole(e.target.value as any)}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty Member</option>
                      <option value="staff">Administrative Staff</option>
                      <option value="alumni">Alumni</option>
                      <option value="other">Other Campus Personnel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink)]">
                    Notes for the Reviewing Administrator
                  </label>
                  <textarea
                    rows={2}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Provide any additional context, effective dates, or verification notes..."
                    className="mt-1.5 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between border-t border-[var(--color-rule)] pt-6">
                <Link
                  href="/"
                  className="text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  Cancel and return
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <ClockCounterClockwise size={16} className="animate-spin" />
                      <span>Submitting for Review...</span>
                    </>
                  ) : (
                    <>
                      <UploadSimple size={16} weight="bold" />
                      <span>Submit Document for Admin Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
