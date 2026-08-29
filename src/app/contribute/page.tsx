'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import {
  UploadSimple,
  FileText,
  ShieldCheck,
  CheckCircle,
  ClockCounterClockwise,
  CloudArrowUp,
  FileArrowUp,
} from '@phosphor-icons/react';
import { mockCategories, mockDepartments } from '@/lib/mockData';
import { DocumentType, SubmissionType, Resource, ResourceSubmission } from '@/types/database';
import { getLiveResources } from '@/lib/resourceStore';
import { addSubmission } from '@/lib/submissionStore';

export default function ContributePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [liveResources, setLiveResources] = useState<Resource[]>([]);

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setLiveResources(getLiveResources());
    const handleUpdate = () => setLiveResources(getLiveResources());
    window.addEventListener('resursee_catalog_updated', handleUpdate);
    return () => window.removeEventListener('resursee_catalog_updated', handleUpdate);
  }, []);

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    if (['PDF', 'DOCX', 'XLSX', 'PPTX'].includes(ext)) {
      setFileFormat(ext);
    }
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleExistingResourceSelect = (resId: string) => {
    setExistingResourceId(resId);
    const existing = liveResources.find((r) => r.id === resId);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !submitterName.trim() || !submitterEmail.trim()) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    setIsSubmitting(true);

    let fileDataUrl: string | undefined = undefined;
    let serverFilePath: string | undefined = undefined;

    if (selectedFile) {
      try {
        fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(selectedFile);
        });

        const uploadForm = new FormData();
        uploadForm.append('file', selectedFile);
        const uploadRes = await fetch('/api/documents/upload', {
          method: 'POST',
          body: uploadForm,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.filePath) {
            serverFilePath = uploadData.filePath;
          }
        }
      } catch {
        // continue
      }
    }

    const generatedId = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSub: ResourceSubmission = {
      id: generatedId,
      title,
      description: description || null,
      category_id: categoryId,
      department_id: departmentId,
      document_type: docType,
      file_name: fileName || (selectedFile ? selectedFile.name : `${title.toLowerCase().replace(/\s+/g, '-')}.${fileFormat.toLowerCase()}`),
      file_format: fileFormat,
      file_size: selectedFile ? selectedFile.size : 350000,
      file_path: serverFilePath || (selectedFile ? `/documents/${selectedFile.name}` : undefined),
      file_data: fileDataUrl || undefined,
      version_label: versionLabel,
      source_name: sourceName || null,
      source_url: sourceUrl || null,
      submission_type: submissionType,
      existing_resource_id: existingResourceId || null,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      submitter_role: submitterRole,
      submission_notes: submissionNotes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      category: mockCategories.find((c) => c.id === categoryId),
      department: mockDepartments.find((d) => d.id === departmentId),
    };

    // 1. Save to Client Submission Store for immediate Admin dashboard display
    addSubmission(newSub);

    // 2. Post to API route for persistence
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newSub }),
      });
    } catch {
      // ignore
    }

    // 3. Post to Netlify Forms (multipart/form-data)
    try {
      const formData = new FormData();
      formData.append('form-name', 'resource-submissions');
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', categoryId);
      formData.append('department', departmentId);
      formData.append('documentType', docType);
      formData.append('versionLabel', versionLabel);
      formData.append('sourceName', sourceName);
      formData.append('sourceUrl', sourceUrl);
      formData.append('submitterName', submitterName);
      formData.append('submitterEmail', submitterEmail);
      formData.append('submitterRole', submitterRole);
      formData.append('submissionNotes', submissionNotes);
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      await fetch('/', {
        method: 'POST',
        body: formData,
      });
    } catch {
      // Netlify handles form submission gracefully
    }

    setSubmissionId(generatedId);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setTitle('');
    setDescription('');
    setFileName('');
    setSelectedFile(null);
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
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--color-ink)] font-semibold">Contribute Document</span>
          </nav>

          {/* Page Header */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Community Repository
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                Submit a University Resource
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[var(--color-ink-muted)]">
                Help fellow students and faculty by uploading verified forms, memo templates, and documents.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 text-xs">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-[var(--color-ink)] block">Admin Verified</span>
                <span className="text-[11px] text-[var(--color-ink-muted)]">All uploads undergo staff review</span>
              </div>
            </div>
          </div>

          {/* SUCCESS SCREEN */}
          {isSubmitted ? (
            <div className="mt-8 rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-8 sm:p-12 text-center shadow-lg space-y-5 animate-in fade-in zoom-in-95">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={40} weight="fill" />
              </div>

              <div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 font-mono text-xs font-bold uppercase">
                  Submission Queued
                </span>
                <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-ink)]">
                  Thank You for Your Contribution!
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
                  Your submission for <strong className="text-[var(--color-ink)]">"{title}"</strong> has been queued for review. You can track this submission using your ID.
                </p>
              </div>

              <div className="mx-auto max-w-xs rounded-[16px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3 text-center">
                <span className="font-mono text-xs font-bold text-[var(--color-ink-muted)] uppercase block">
                  Submission Tracking ID
                </span>
                <span className="font-mono text-lg font-black text-[var(--color-primary)]">
                  {submissionId}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                >
                  Submit Another Resource
                </button>
                <Link
                  href="/resources"
                  className="w-full sm:w-auto rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-6 py-2.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-all text-center"
                >
                  Browse Document Catalog
                </Link>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* SECTION 1: Submission Type */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <h2 className="text-base font-bold text-[var(--color-ink)]">
                  1. Contribution Type
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmissionType('new_resource')}
                    className={`flex items-start gap-3 rounded-[18px] border p-4 text-left transition-all cursor-pointer ${
                      submissionType === 'new_resource'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/30 ring-2 ring-[var(--color-primary)]'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)]'
                    }`}
                  >
                    <FileText size={22} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-[var(--color-ink)] block">
                        New Document / Form
                      </span>
                      <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                        A document not yet cataloged on Resursee.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmissionType('update_existing')}
                    className={`flex items-start gap-3 rounded-[18px] border p-4 text-left transition-all cursor-pointer ${
                      submissionType === 'update_existing'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/30 ring-2 ring-[var(--color-primary)]'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)]'
                    }`}
                  >
                    <ClockCounterClockwise size={22} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-[var(--color-ink)] block">
                        Updated Revision / Superseded Form
                      </span>
                      <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                        A new revision of a document that already exists on Resursee.
                      </p>
                    </div>
                  </button>
                </div>

                {submissionType === 'update_existing' && (
                  <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                      Select Existing Document to Update *
                    </label>
                    <select
                      value={existingResourceId}
                      onChange={(e) => handleExistingResourceSelect(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-white dark:bg-[#1e293b] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="">-- Choose a document from the current directory --</option>
                      {liveResources.map((res) => (
                        <option key={res.id} value={res.id}>
                          [{res.file_format}] {res.title} (Current: {res.current_version})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* SECTION 2: Document Details */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <h2 className="text-base font-bold text-[var(--color-ink)]">
                  2. Document Details
                </h2>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Official Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Application for Academic Overload & Cross-Enrollment Form"
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Summary / Purpose of Document
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief summary of what this document is used for and who requires it..."
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Academic Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden"
                    >
                      {mockCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Issuing Department / Office *
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden"
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
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      File Format
                    </label>
                    <select
                      value={fileFormat}
                      onChange={(e) => setFileFormat(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 font-mono text-xs uppercase outline-hidden"
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOCX">DOCX (Word)</option>
                      <option value="XLSX">XLSX (Excel)</option>
                      <option value="PPTX">PPTX (PowerPoint)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Version Label
                    </label>
                    <input
                      type="text"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                      placeholder="e.g. 2026.1"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 font-mono text-xs text-[var(--color-ink)] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Document Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 font-mono text-xs uppercase outline-hidden"
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

              {/* SECTION 3: Drag and Drop File Attachment */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <h2 className="text-base font-bold text-[var(--color-ink)]">
                  3. File Attachment & Official Source
                </h2>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)] mb-1">
                    Upload Document File (.pdf, .docx, .xlsx, .pptx)
                  </label>

                  {/* Drag and Drop Zone with Visual State */}
                  <div
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center rounded-[22px] border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40 scale-[1.01]'
                        : fileName
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      {fileName ? (
                        <div className="flex flex-col items-center">
                          <FileArrowUp size={36} weight="duotone" className="text-emerald-600 dark:text-emerald-400 animate-bounce" />
                          <span className="mt-2 text-sm font-bold text-[var(--color-ink)]">
                            {fileName}
                          </span>
                          <span className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            File attached successfully! Drag another or click to change.
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <CloudArrowUp size={36} weight="duotone" className="text-[var(--color-primary)]" />
                          <span className="mt-2 text-xs sm:text-sm font-bold text-[var(--color-ink)]">
                            Drag & drop your document here, or <span className="text-[var(--color-primary)] underline">browse</span>
                          </span>
                          <span className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                            Supports PDF, DOCX, XLSX, PPTX (up to 25MB)
                          </span>
                        </div>
                      )}

                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Official Source Webpage URL
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://university.edu/registrar/forms"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Source Bureau / Issuing Office Name
                    </label>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g. Office of the University Registrar"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Submitter Information */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <h2 className="text-base font-bold text-[var(--color-ink)]">
                  4. Submitter Information
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      University / Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      placeholder="e.g. juan.delacruz@clsu.edu.ph"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    University Affiliation Role
                  </label>
                  <select
                    value={submitterRole}
                    onChange={(e) => setSubmitterRole(e.target.value as any)}
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty / Instructor</option>
                    <option value="staff">Administrative Staff</option>
                    <option value="alumni">Alumni</option>
                    <option value="other">Other / Guest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Verification Notes for Reviewers
                  </label>
                  <textarea
                    rows={2}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="e.g. Received directly from the department head on August 2026..."
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Submission Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <UploadSimple size={18} weight="bold" />
                  <span>{isSubmitting ? 'Uploading & Queuing...' : 'Submit Document for Review'}</span>
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
