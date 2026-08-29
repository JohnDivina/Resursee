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
  Megaphone,
  Newspaper,
  Buildings,
} from '@phosphor-icons/react';
import { DocumentType, SubmissionType, Resource, ResourceSubmission, NewsArticle, Category, Department } from '@/types/database';
import { getLiveResources } from '@/lib/resourceStore';
import { getLiveCategories } from '@/lib/categoryStore';
import { getLiveDepartments } from '@/lib/departmentStore';
import { addSubmission } from '@/lib/submissionStore';
import { addNewsArticle } from '@/lib/newsStore';

export default function ContributePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'document' | 'news'>('document');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [liveResources, setLiveResources] = useState<Resource[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);

  // Form Fields for Documents
  const [submissionType, setSubmissionType] = useState<SubmissionType>('new_resource');
  const [existingResourceId, setExistingResourceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
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

  // Form Fields for Campus News & Bulletins
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsDepartmentId, setNewsDepartmentId] = useState('');
  const [newsUrl, setNewsUrl] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsSubmitterName, setNewsSubmitterName] = useState('');
  const [newsSubmitterEmail, setNewsSubmitterEmail] = useState('');
  const [newsSubmitterRole, setNewsSubmitterRole] = useState<'student' | 'faculty' | 'staff' | 'alumni' | 'other'>('student');
  const [newsNotes, setNewsNotes] = useState('');

  const refreshDynamicData = () => {
    setLiveResources(getLiveResources());
    const cats = getLiveCategories();
    setCategoriesList(cats);
    if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);

    const depts = getLiveDepartments();
    setDepartmentsList(depts);
    if (depts.length > 0 && !departmentId) {
      setDepartmentId(depts[0].id);
      setNewsDepartmentId(depts[0].id);
    }
  };

  useEffect(() => {
    refreshDynamicData();

    const handleCatalogUpdate = () => setLiveResources(getLiveResources());
    const handleCategoryUpdate = () => {
      const cats = getLiveCategories();
      setCategoriesList(cats);
      if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
    };
    const handleDeptUpdate = () => {
      const depts = getLiveDepartments();
      setDepartmentsList(depts);
      if (depts.length > 0 && !departmentId) {
        setDepartmentId(depts[0].id);
        setNewsDepartmentId(depts[0].id);
      }
    };

    window.addEventListener('resursee_catalog_updated', handleCatalogUpdate);
    window.addEventListener('resursee_categories_updated', handleCategoryUpdate);
    window.addEventListener('resursee_departments_updated', handleDeptUpdate);
    window.addEventListener('storage', refreshDynamicData);

    return () => {
      window.removeEventListener('resursee_catalog_updated', handleCatalogUpdate);
      window.removeEventListener('resursee_categories_updated', handleCategoryUpdate);
      window.removeEventListener('resursee_departments_updated', handleDeptUpdate);
      window.removeEventListener('storage', refreshDynamicData);
    };
  }, [categoryId, departmentId]);

  // Automated File Format Extraction & Mapping
  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);

    // Extract exact file extension without dot
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop()?.toUpperCase() || 'PDF' : 'PDF';
    
    // Automatically set the file format to the exact file type
    setFileFormat(ext);

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

  const handleDocumentSubmit = async (e: React.FormEvent) => {
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
      category_id: categoryId || (categoriesList[0]?.id ?? 'cat-1'),
      department_id: departmentId || (departmentsList[0]?.id ?? 'dept-1'),
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
      category: categoriesList.find((c) => c.id === categoryId),
      department: departmentsList.find((d) => d.id === departmentId),
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

    setSubmissionId(generatedId);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsSummary.trim() || !newsSubmitterName.trim() || !newsSubmitterEmail.trim()) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    setIsSubmitting(true);

    const generatedId = `NEWS-${Math.floor(100000 + Math.random() * 900000)}`;

    const targetDeptId = newsDepartmentId || (departmentsList[0]?.id ?? 'dept-1');

    const newArticle: NewsArticle = {
      id: generatedId,
      title: newsTitle,
      summary: newsSummary,
      department_id: targetDeptId,
      department: departmentsList.find((d) => d.id === targetDeptId),
      content_url: newsUrl || 'https://university.edu/news',
      image_url: newsImageUrl || null,
      status: 'pending',
      is_featured: false,
      external_id: null,
      source_id: null,
      reviewed_by: null,
      published_at: null,
      fetched_at: new Date().toISOString(),
      reviewed_at: null,
      created_at: new Date().toISOString(),
    };

    addNewsArticle(newArticle);

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
    setNewsTitle('');
    setNewsSummary('');
    setNewsUrl('');
    setNewsImageUrl('');
    setNewsNotes('');
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
            <span className="text-[var(--color-ink)] font-semibold">
              {activeMode === 'document' ? 'Contribute Document' : 'Submit Campus Bulletin'}
            </span>
          </nav>

          {/* Page Header */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Community Contributions
              </span>
              <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                {activeMode === 'document' ? 'Submit University Document' : 'Submit Campus News Circular'}
              </h1>
              <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Share official academic forms, syllabus templates, or campus bulletin circulars for administrative verification.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-1.5 shadow-2xs">
              <button
                type="button"
                onClick={() => { setActiveMode('document'); setIsSubmitted(false); }}
                className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'document'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <FileText size={16} weight="bold" />
                <span>Document / Form</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveMode('news'); setIsSubmitted(false); }}
                className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'news'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <Megaphone size={16} weight="bold" />
                <span>News & Bulletin</span>
              </button>
            </div>
          </div>

          {/* SUCCESS SCREEN */}
          {isSubmitted ? (
            <div className="mt-8 rounded-[28px] border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-8 sm:p-12 text-center shadow-lg animate-in fade-in zoom-in-95">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={40} weight="fill" />
              </div>
              <h2 className="mt-4 text-xl sm:text-2xl font-extrabold text-[var(--color-ink)]">
                {activeMode === 'document' ? 'Document Submission Queued!' : 'Campus News Bulletin Submitted!'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[var(--color-ink-secondary)]">
                Thank you for your contribution! Your submission has been securely queued and is now visible to the University Administration for review.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-[var(--color-paper-card)] px-4 py-1.5 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
                <span>Tracking ID:</span>
                <span className="font-extrabold text-[var(--color-primary)]">{submissionId}</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handleReset}
                  className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                >
                  Submit Another Entry
                </button>
                <Link
                  href={activeMode === 'document' ? '/resources' : '/news'}
                  className="rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] px-6 py-2.5 text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] transition-all"
                >
                  {activeMode === 'document' ? 'Browse Directory' : 'View Campus News'}
                </Link>
              </div>
            </div>
          ) : activeMode === 'document' ? (
            /* --- FORM 1: DOCUMENT / FORM CONTRIBUTION --- */
            <form onSubmit={handleDocumentSubmit} className="mt-8 space-y-8">
              {/* Submission Type Switcher */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-2xs space-y-4">
                <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider">
                  Contribution Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSubmissionType('new_resource'); setExistingResourceId(''); }}
                    className={`flex items-start gap-3 rounded-[18px] border p-4 text-left transition-all cursor-pointer ${
                      submissionType === 'new_resource'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40 shadow-xs'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] hover:border-[var(--color-rule-strong)]'
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">
                      +
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--color-ink)] block">New Document / Form</span>
                      <span className="text-[11px] text-[var(--color-ink-muted)]">Add a form not yet in the repository catalog</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmissionType('update_existing')}
                    className={`flex items-start gap-3 rounded-[18px] border p-4 text-left transition-all cursor-pointer ${
                      submissionType === 'update_existing'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40 shadow-xs'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] hover:border-[var(--color-rule-strong)]'
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-xs font-bold">
                      <ClockCounterClockwise size={15} weight="bold" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--color-ink)] block">Updated Revision</span>
                      <span className="text-[11px] text-[var(--color-ink-muted)]">Update an existing document to a newer 2026 revision</span>
                    </div>
                  </button>
                </div>

                {submissionType === 'update_existing' && (
                  <div className="pt-3 border-t border-[var(--color-rule-subtle)] animate-in fade-in">
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Select Document to Update <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={existingResourceId}
                      onChange={(e) => handleExistingResourceSelect(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="">-- Choose Existing Document --</option>
                      {liveResources.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.title} (Current: v{res.current_version})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Drag & Drop Dropzone with Automated File Format Detection */}
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
                  isDragging
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/50 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-muted)]/50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.zip,.txt"
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                />

                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] transition-transform group-hover:scale-110 ${
                  selectedFile
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                }`}>
                  {selectedFile ? <FileArrowUp size={36} weight="bold" /> : <CloudArrowUp size={36} weight="bold" />}
                </div>

                <h3 className="mt-4 text-base font-bold text-[var(--color-ink)]">
                  {selectedFile ? `Attached: ${selectedFile.name}` : 'Drag and Drop your document file here'}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)] max-w-sm">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB • Detected Format: .${fileFormat.toLowerCase()} • Click or drop again to replace`
                    : 'Supports PDF, Word (.docx, .doc), Excel (.xlsx, .xls), PowerPoint (.pptx, .ppt), CSV, and Archives up to 25MB'}
                </p>

                {selectedFile && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle size={14} weight="fill" />
                    <span>Automatically detected format: <strong>{fileFormat} (.{fileFormat.toLowerCase()})</strong></span>
                  </div>
                )}
              </div>

              {/* Document Details Grid */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xs space-y-5">
                <h3 className="text-sm font-bold text-[var(--color-ink)] border-b border-[var(--color-rule-subtle)] pb-3">
                  Document Specification
                </h3>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Document Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Application for Transcript of Records & Academic Certification"
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Department / Office</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.abbreviation})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as DocumentType)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="form">Official Form</option>
                      <option value="template">Template</option>
                      <option value="memorandum">Memorandum</option>
                      <option value="policy">Policy / Guideline</option>
                      <option value="report">Report / Publication</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      File Format (Auto-Detected)
                    </label>
                    <select
                      value={fileFormat}
                      onChange={(e) => setFileFormat(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs font-semibold text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="PDF">PDF (.pdf)</option>
                      <option value="DOCX">Word Document (.docx)</option>
                      <option value="DOC">Word 97-2003 (.doc)</option>
                      <option value="XLSX">Excel Workbook (.xlsx)</option>
                      <option value="XLS">Excel 97-2003 (.xls)</option>
                      <option value="PPTX">PowerPoint (.pptx)</option>
                      <option value="PPT">PowerPoint 97-2003 (.ppt)</option>
                      <option value="CSV">CSV Spreadsheet (.csv)</option>
                      <option value="ZIP">ZIP Archive (.zip)</option>
                      {!['PDF', 'DOCX', 'DOC', 'XLSX', 'XLS', 'PPTX', 'PPT', 'CSV', 'ZIP'].includes(fileFormat) && (
                        <option value={fileFormat}>{fileFormat} (.{fileFormat.toLowerCase()})</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Version Label</label>
                    <input
                      type="text"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                      placeholder="e.g. 2026.1"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Description / Purpose</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of what this document is used for..."
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Submitter Provenance */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-ink)] border-b border-[var(--color-rule-subtle)] pb-3">
                  Submitter Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Your Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      placeholder="juan@clsu.edu.ph"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Your Campus Role</label>
                    <select
                      value={submitterRole}
                      onChange={(e) => setSubmitterRole(e.target.value as any)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty Member</option>
                      <option value="staff">Administrative Staff</option>
                      <option value="alumni">Alumni</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-4 text-sm font-bold text-white shadow-md hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <UploadSimple size={18} weight="bold" />
                <span>{isSubmitting ? 'Uploading & Queuing Document...' : 'Submit Document for Review'}</span>
              </button>
            </form>
          ) : (
            /* --- FORM 2: CAMPUS NEWS & BULLETIN CONTRIBUTION --- */
            <form onSubmit={handleNewsSubmit} className="mt-8 space-y-8">
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-3">
                  <Megaphone size={20} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-[var(--color-ink)]">
                    Official Announcement Details
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Bulletin / Circular Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="e.g. Call for Applications: 2026 University Research Grants & Student Aid"
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Issuing Department / Office</label>
                    <select
                      value={newsDepartmentId}
                      onChange={(e) => setNewsDepartmentId(e.target.value)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.abbreviation})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Source Announcement Webpage URL</label>
                    <input
                      type="url"
                      value={newsUrl}
                      onChange={(e) => setNewsUrl(e.target.value)}
                      placeholder="https://university.edu/announcements/circular-2026"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Summary / Announcement Body <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newsSummary}
                    onChange={(e) => setNewsSummary(e.target.value)}
                    placeholder="Provide the complete summary, guidelines, dates, and instructions for the university community..."
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Featured Banner Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newsImageUrl}
                    onChange={(e) => setNewsImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)] font-mono"
                  />
                </div>
              </div>

              {/* Submitter Provenance */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-ink)] border-b border-[var(--color-rule-subtle)] pb-3">
                  Submitter Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newsSubmitterName}
                      onChange={(e) => setNewsSubmitterName(e.target.value)}
                      placeholder="Maria Santos"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Your Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newsSubmitterEmail}
                      onChange={(e) => setNewsSubmitterEmail(e.target.value)}
                      placeholder="maria@clsu.edu.ph"
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">Campus Organization / Role</label>
                    <select
                      value={newsSubmitterRole}
                      onChange={(e) => setNewsSubmitterRole(e.target.value as any)}
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="student">Student / Org Officer</option>
                      <option value="faculty">Faculty Member</option>
                      <option value="staff">Department Administrator</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-4 text-sm font-bold text-slate-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Megaphone size={18} weight="bold" />
                <span>{isSubmitting ? 'Submitting Bulletin...' : 'Submit News Bulletin for Verification'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
