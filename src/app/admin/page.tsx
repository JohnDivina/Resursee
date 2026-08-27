'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  UploadSimple,
  Plus,
  Trash,
  CheckCircle,
  XCircle,
  Eye,
  ClockCounterClockwise,
  Megaphone,
  ChartBar,
  Buildings,
  HouseLine,
  UserCircle,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import {
  mockResources,
  mockCategories,
  mockDepartments,
  mockNewsArticles,
  mockActivityLogs,
  mockSubmissions,
} from '@/lib/mockData';
import { Resource, NewsArticle, DocumentType, ResourceSubmission } from '@/types/database';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'resources' | 'submissions' | 'news' | 'categories' | 'logs'>('resources');
  const [resourcesList, setResourcesList] = useState<Resource[]>(mockResources);
  const [newsList, setNewsList] = useState<NewsArticle[]>(mockNewsArticles);
  const [submissionsList, setSubmissionsList] = useState<ResourceSubmission[]>(mockSubmissions);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ResourceSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Adding a New Resource
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState(mockCategories[0].id);
  const [newDepartment, setNewDepartment] = useState(mockDepartments[0].id);
  const [newDocType, setNewDocType] = useState<DocumentType>('form');
  const [newFormat, setNewFormat] = useState('PDF');
  const [newVersion, setNewVersion] = useState('2026.1');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newIsFeatured, setNewIsFeatured] = useState(false);

  // Metrics
  const totalDownloads = resourcesList.reduce((acc, curr) => acc + curr.download_count, 0);
  const pendingSubmissions = submissionsList.filter((s) => s.status === 'pending');
  const pendingNews = newsList.filter((n) => n.status === 'pending');
  const approvedNews = newsList.filter((n) => n.status === 'approved');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const selectedCatObj = mockCategories.find((c) => c.id === newCategory);
    const selectedDeptObj = mockDepartments.find((d) => d.id === newDepartment);

    const newResourceItem: Resource = {
      id: `res-${Date.now()}`,
      title: newTitle,
      slug,
      description: newDescription || null,
      category_id: newCategory,
      department_id: newDepartment,
      document_type: newDocType,
      file_path: `/documents/${slug}.${newFormat.toLowerCase()}`,
      file_name: `${slug}.${newFormat.toLowerCase()}`,
      file_format: newFormat,
      file_size: 480000,
      current_version: newVersion,
      status: 'active',
      source_name: newSourceName || selectedDeptObj?.name || 'Official Office',
      source_url: newSourceUrl || null,
      is_featured: newIsFeatured,
      download_count: 0,
      created_by: 'admin-master',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: selectedCatObj,
      department: selectedDeptObj,
    };

    setResourcesList([newResourceItem, ...resourcesList]);
    setIsAddModalOpen(false);
    showToast(`Successfully published "${newTitle}"`);

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewSourceName('');
    setNewSourceUrl('');
    setNewIsFeatured(false);
  };

  const handleDeleteResource = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      setResourcesList(resourcesList.filter((r) => r.id !== id));
      showToast(`Deleted "${title}"`);
    }
  };

  const handleApproveSubmission = (submission: ResourceSubmission) => {
    if (submission.submission_type === 'update_existing' && submission.existing_resource_id) {
      setResourcesList(
        resourcesList.map((r) =>
          r.id === submission.existing_resource_id
            ? {
                ...r,
                current_version: submission.version_label,
                file_format: submission.file_format,
                file_name: submission.file_name,
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );
      showToast(`Updated "${submission.title}" to version ${submission.version_label}`);
    } else {
      const slug = submission.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const newRes: Resource = {
        id: `res-${Date.now()}`,
        title: submission.title,
        slug,
        description: submission.description,
        category_id: submission.category_id,
        department_id: submission.department_id,
        document_type: submission.document_type,
        file_path: submission.file_path || `/documents/${submission.file_name}`,
        file_name: submission.file_name,
        file_format: submission.file_format,
        file_size: submission.file_size,
        current_version: submission.version_label,
        status: 'active',
        source_name: submission.source_name,
        source_url: submission.source_url,
        is_featured: false,
        download_count: 0,
        created_by: `user-${submission.submitter_name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: submission.category || mockCategories.find((c) => c.id === submission.category_id),
        department: submission.department || mockDepartments.find((d) => d.id === submission.department_id),
      };

      setResourcesList([newRes, ...resourcesList]);
      showToast(`Approved & published "${submission.title}" to the live catalog!`);
    }

    setSubmissionsList(
      submissionsList.map((s) =>
        s.id === submission.id
          ? { ...s, status: 'approved', reviewed_by: 'master-admin', reviewed_at: new Date().toISOString() }
          : s
      )
    );
    setSelectedSubmission(null);
  };

  const handleRejectSubmission = (id: string) => {
    setSubmissionsList(
      submissionsList.map((s) => (s.id === id ? { ...s, status: 'rejected', reviewed_by: 'master-admin' } : s))
    );
    showToast('Submission rejected.');
    setSelectedSubmission(null);
  };

  const handleApproveNews = (id: string) => {
    setNewsList(
      newsList.map((n) => (n.id === id ? { ...n, status: 'approved', published_at: new Date().toISOString() } : n))
    );
    showToast('News article approved and published to the live campus hub!');
  };

  const handleRejectNews = (id: string) => {
    setNewsList(newsList.map((n) => (n.id === id ? { ...n, status: 'rejected' } : n)));
    showToast('Article marked as rejected.');
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper-muted)]/30">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 border-b border-black/[0.08] dark:border-white/[0.1] bg-[#0f172a] px-4 py-3.5 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-blue-600 text-white font-bold">
                🦦
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-white">
                    Resursee
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 uppercase">
                    Master Admin
                  </span>
                </div>
                <span className="block font-mono text-[10px] text-gray-400">
                  master_admin@university.edu
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <HouseLine size={14} />
              <span>Back to Public Hub</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Metrics Strip (Apple Squircle Solid White Cards) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
                Active Resources
              </span>
              <FileText size={20} className="text-[var(--color-primary)]" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[var(--color-ink)]">
              {resourcesList.length}
            </p>
            <span className="mt-1 block text-xs text-emerald-600 font-semibold">
              ● All documents live & verified
            </span>
          </div>

          <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
                Submissions Queue
              </span>
              <UploadSimple size={20} className="text-amber-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[var(--color-ink)]">
              {pendingSubmissions.length}{' '}
              <span className="text-xs font-normal text-amber-700">pending review</span>
            </p>
            <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">
              {submissionsList.filter((s) => s.status === 'approved').length} approved community items
            </span>
          </div>

          <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
                Total Downloads
              </span>
              <ChartBar size={20} className="text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[var(--color-ink)]">
              {totalDownloads.toLocaleString()}
            </p>
            <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">
              Verified campus downloads
            </span>
          </div>

          <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
                News Feed Queue
              </span>
              <Megaphone size={20} className="text-indigo-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[var(--color-ink)]">
              {pendingNews.length}{' '}
              <span className="text-xs font-normal text-indigo-600">pending RSS</span>
            </p>
            <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">
              {approvedNews.length} articles published
            </span>
          </div>
        </div>

        {/* Tab Selector & Primary Actions */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-5 sm:flex-row sm:items-center">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-1.5 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold transition-all ${
                activeTab === 'resources'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <FileText size={15} />
              <span>Catalog ({resourcesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold transition-all ${
                activeTab === 'submissions'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <UploadSimple size={15} />
              <span>Submissions</span>
              {pendingSubmissions.length > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                  {pendingSubmissions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold transition-all ${
                activeTab === 'news'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Megaphone size={15} />
              <span>News</span>
              {pendingNews.length > 0 && (
                <span className="rounded-full bg-indigo-500 px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                  {pendingNews.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold transition-all ${
                activeTab === 'categories'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Buildings size={15} />
              <span>Categories</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold transition-all ${
                activeTab === 'logs'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <ClockCounterClockwise size={15} />
              <span>Logs</span>
            </button>
          </div>

          {/* Action Trigger */}
          {activeTab === 'resources' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95"
            >
              <Plus size={16} weight="bold" />
              <span>Upload New Resource</span>
            </button>
          )}
        </div>

        {/* TAB 1: Resources Management Table */}
        {activeTab === 'resources' && (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--color-rule-subtle)] bg-[var(--color-paper-muted)]/50 font-mono font-bold uppercase text-[var(--color-ink-muted)]">
                  <tr>
                    <th className="px-6 py-4">Format / Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Version</th>
                    <th className="px-6 py-4">Downloads</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule-subtle)] text-[var(--color-ink)]">
                  {resourcesList.map((res) => (
                    <tr key={res.id} className="hover:bg-[var(--color-paper-muted)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                              res.file_format === 'PDF'
                                ? 'badge-pdf'
                                : res.file_format === 'DOCX'
                                ? 'badge-docx'
                                : res.file_format === 'XLSX'
                                ? 'badge-xlsx'
                                : 'badge-pptx'
                            }`}
                          >
                            {res.file_format}
                          </span>
                          <div>
                            <p className="font-bold text-[var(--color-ink)]">{res.title}</p>
                            <p className="text-[11px] text-[var(--color-ink-muted)] line-clamp-1">{res.file_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--color-ink-secondary)]">
                        {res.category?.name || 'General'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-1 font-mono text-[10.5px]">
                          {res.department?.abbreviation || 'UNIV'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-[var(--color-ink-muted)]">
                        {res.current_version}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--color-primary)]">
                        {res.download_count}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/resources/${res.slug}`}
                            className="rounded-full p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
                            title="Preview Public Page"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteResource(res.id, res.title)}
                            className="rounded-full p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete Resource"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Submissions Queue */}
        {activeTab === 'submissions' && (
          <div className="mt-6 space-y-6">
            <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="border-b border-[var(--color-rule-subtle)] pb-4">
                <h3 className="text-base font-bold text-[var(--color-ink)]">
                  Community Submissions Queue ({pendingSubmissions.length} Pending)
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Forms, syllabus templates, and document revisions submitted by faculty and students awaiting verification.
                </p>
              </div>

              {pendingSubmissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-ink-muted)]">
                  ✓ All community submissions have been reviewed and processed!
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {pendingSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-5 shadow-xs transition-all hover:border-[var(--color-primary)]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                                sub.file_format === 'PDF'
                                  ? 'badge-pdf'
                                  : sub.file_format === 'DOCX'
                                  ? 'badge-docx'
                                  : 'badge-xlsx'
                              }`}
                            >
                              {sub.file_format}
                            </span>

                            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              {sub.submission_type === 'update_existing'
                                ? '● Revision'
                                : '● New Resource'}
                            </span>

                            <span className="font-mono text-[10.5px] text-[var(--color-ink-muted)]">
                              Version {sub.version_label}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-[var(--color-ink)]">
                            {sub.title}
                          </h4>

                          <p className="text-xs leading-relaxed text-[var(--color-ink-secondary)]">
                            {sub.description || 'No description provided.'}
                          </p>

                          <div className="rounded-[16px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] p-3.5 text-xs">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-ink-muted)]">
                              <div className="flex items-center gap-1 font-bold text-[var(--color-ink)]">
                                <UserCircle size={15} className="text-[var(--color-primary)]" />
                                <span>{sub.submitter_name}</span>
                                <span className="font-mono font-normal uppercase text-[10px]">
                                  ({sub.submitter_role})
                                </span>
                              </div>
                              <span>·</span>
                              <div className="flex items-center gap-1">
                                <EnvelopeSimple size={14} />
                                <span>{sub.submitter_email}</span>
                              </div>
                            </div>
                            {sub.submission_notes && (
                              <p className="mt-2 text-[11px] italic text-[var(--color-ink-secondary)] border-t border-[var(--color-rule-subtle)] pt-1.5">
                                &quot;{sub.submission_notes}&quot;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={() => handleApproveSubmission(sub)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                          >
                            <CheckCircle size={15} weight="bold" />
                            <span>Approve & Publish</span>
                          </button>

                          <button
                            onClick={() => handleRejectSubmission(sub.id)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <XCircle size={15} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: News Queue */}
        {activeTab === 'news' && (
          <div className="mt-6 space-y-6">
            <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="text-base font-bold text-[var(--color-ink)]">
                Pending News Ingestion ({pendingNews.length})
              </h3>
              {pendingNews.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-ink-muted)]">
                  ✓ Ingestion queue is clear. No pending articles awaiting review.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {pendingNews.map((article) => (
                    <div
                      key={article.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[20px] border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 p-4"
                    >
                      <div className="space-y-1">
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 font-mono text-[9px] font-bold text-white uppercase">
                          Pending Review
                        </span>
                        <h4 className="text-sm font-bold text-[var(--color-ink)]">
                          {article.title}
                        </h4>
                        <p className="text-xs text-[var(--color-ink-secondary)]">
                          {article.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleApproveNews(article.id)}
                          className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                        >
                          <CheckCircle size={15} weight="bold" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectNews(article.id)}
                          className="flex items-center gap-1 rounded-full border border-gray-300 bg-[var(--color-paper-surface)] px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <XCircle size={15} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Categories & Departments */}
        {activeTab === 'categories' && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="text-base font-bold text-[var(--color-ink)]">
                Academic Categories ({mockCategories.length})
              </h3>
              <div className="mt-4 space-y-2">
                {mockCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-[16px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3 text-xs">
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{cat.name}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">{cat.slug}</p>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-primary)] font-bold">
                      Order: {cat.sort_order}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="text-base font-bold text-[var(--color-ink)]">
                University Departments ({mockDepartments.length})
              </h3>
              <div className="mt-4 space-y-2">
                {mockDepartments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between rounded-[16px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3 text-xs">
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{dept.name}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">{dept.slug}</p>
                    </div>
                    <span className="rounded-full bg-[var(--color-primary-subtle)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--color-primary)]">
                      {dept.abbreviation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Audit Logs */}
        {activeTab === 'logs' && (
          <div className="mt-6 rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h3 className="text-base font-bold text-[var(--color-ink)]">
              Master System Activity & Audit Trail
            </h3>
            <div className="mt-4 divide-y divide-[var(--color-rule-subtle)] text-xs">
              {mockActivityLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{log.action}</span>
                    <p className="mt-0.5 text-[var(--color-ink)] font-bold">{log.details?.title || log.entity_type}</p>
                    <span className="font-mono text-[10.5px] text-[var(--color-ink-muted)]">
                      Performed by {log.admin_email}
                    </span>
                  </div>
                  <span className="font-mono text-[10.5px] text-[var(--color-ink-muted)]">
                    {log.created_at.split('T')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Upload New Resource */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-ink)]">
                Add New University Resource
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddResource} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--color-ink)]">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Leave of Absence Application"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--color-ink)]">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief summary of requirements or procedures..."
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--color-ink)]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    {mockCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)]">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    {mockDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.abbreviation} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--color-rule-subtle)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)]"
                >
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
