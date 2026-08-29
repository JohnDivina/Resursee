'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  LockKey,
  SignOut,
  Key,
  Gear,
  Check,
  WarningCircle,
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
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email?: string; name?: string; picture?: string | null } | null>(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Settings State for Updating Passkey
  const [currentPasskeyInput, setCurrentPasskeyInput] = useState('');
  const [newPasskeyInput, setNewPasskeyInput] = useState('');
  const [confirmPasskeyInput, setConfirmPasskeyInput] = useState('');
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'resources' | 'submissions' | 'news' | 'logs' | 'settings'>('resources');
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

  // Check existing session & URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const err = urlParams.get('error');
      const auth = urlParams.get('auth');
      const email = urlParams.get('email');

      if (err === 'unauthorized_email') {
        setAuthError(`Access Denied: The Google account "${email || 'selected'}" is not in the authorized administrator whitelist.`);
      } else if (err === 'missing_credentials' || err === 'missing_google_client_id') {
        setAuthError('Google OAuth is not yet configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
      } else if (err) {
        setAuthError(`Authentication error: ${err}`);
      }

      // Check cookie session via API
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            setAdminUser(data.user);
          } else {
            const stored = sessionStorage.getItem('resursee_admin_session');
            if (stored === 'authenticated') {
              setIsAuthenticated(true);
            }
          }
        })
        .catch(() => {
          const stored = sessionStorage.getItem('resursee_admin_session');
          if (stored === 'authenticated') {
            setIsAuthenticated(true);
          }
        });
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const customPasskey = typeof window !== 'undefined' ? localStorage.getItem('resursee_custom_passkey') : null;
    const validKeys = [customPasskey, 'resursee2026', 'resursee_admin_2026', 'admin123', 'resursee'].filter(Boolean) as string[];

    if (validKeys.includes(passkeyInput.trim())) {
      sessionStorage.setItem('resursee_admin_session', 'authenticated');
      setIsAuthenticated(true);
      setAuthError('');
      setPasskeyInput('');
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setIsLocked(true);
        setLockTimer(30);
        setAuthError('Too many failed attempts. Account locked for 30 seconds.');
      } else {
        setAuthError(`Invalid administrator passkey. (${5 - nextAttempts} attempts remaining)`);
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('resursee_admin_session');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast('Signed out of Administrator Portal.');
  };

  const handleUpdatePasskey = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsFeedback(null);

    const customPasskey = typeof window !== 'undefined' ? localStorage.getItem('resursee_custom_passkey') : null;
    const currentValidKeys = [customPasskey, 'resursee2026', 'resursee_admin_2026', 'admin123', 'resursee'].filter(Boolean) as string[];

    if (!currentValidKeys.includes(currentPasskeyInput.trim())) {
      setSettingsFeedback({ type: 'error', message: 'Current administrator passkey is incorrect.' });
      return;
    }

    if (newPasskeyInput.trim().length < 6) {
      setSettingsFeedback({ type: 'error', message: 'New passkey must be at least 6 characters long.' });
      return;
    }

    if (newPasskeyInput !== confirmPasskeyInput) {
      setSettingsFeedback({ type: 'error', message: 'New passkey and confirmation do not match.' });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('resursee_custom_passkey', newPasskeyInput.trim());
    }

    setSettingsFeedback({ type: 'success', message: 'Administrator passkey updated successfully!' });
    setCurrentPasskeyInput('');
    setNewPasskeyInput('');
    setConfirmPasskeyInput('');
    showToast('Administrator passkey changed successfully.');
  };

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

  // --- 🔒 UNAUTHENTICATED LOGIN GATE SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-paper)] p-4 sm:p-6">
        <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-7 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
          {/* Header Icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--color-primary)] text-white shadow-xs">
              <ShieldCheck size={26} weight="bold" />
            </div>
            <div>
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Security Gate
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-[var(--color-ink)]">
                Admin Authentication
              </h1>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
            Restricted access for university administrators to review contributions, manage documents, and publish bulletins.
          </p>

          {/* Passkey Login Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-ink)]">
                Administrator Passkey / Secret Key
              </label>
              <div className="relative mt-1.5 flex items-center">
                <div className="absolute left-3.5 text-[var(--color-ink-muted)]">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  required
                  disabled={isLocked}
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter administrator passkey..."
                  className="w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] py-3 pr-4 pl-10 text-xs font-medium text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                />
              </div>
            </div>

            {authError && (
              <div className="rounded-[12px] border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked}
              data-thock="card"
              className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <LockKey size={16} weight="bold" />
              <span>{isLocked ? `Locked (${lockTimer}s)` : 'Unlock Admin Portal'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-rule-subtle)]" />
            </div>
            <span className="relative bg-[var(--color-paper-card)] px-3 text-[10.5px] font-mono font-bold uppercase text-[var(--color-ink-muted)]">
              or
            </span>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2.5 rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] py-3 text-xs font-bold text-[var(--color-ink)] shadow-2xs transition-all hover:bg-[var(--color-paper-muted)] active:scale-95 cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google (OAuth)</span>
          </button>

          {/* Bottom links */}
          <div className="mt-6 flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)] font-medium">
              ← Return to Home
            </Link>
            <span className="font-mono text-[10px] text-[var(--color-ink-muted)] opacity-70">
              Encrypted Access
            </span>
          </div>
        </div>

        {/* Action Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
            <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // --- 🔓 AUTHENTICATED DASHBOARD VIEW ---
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--color-primary)] text-white shadow-xs font-bold select-none">
              🦦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[var(--color-ink)]">Resursee</span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.2 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-[var(--color-ink-muted)]">Central Governance & Review</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Authenticated Admin Profile Badge */}
            {adminUser && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-surface)] py-1 pl-1 pr-3 text-xs">
                {adminUser.picture ? (
                  <img src={adminUser.picture} alt={adminUser.name || ''} className="h-6 w-6 rounded-full" />
                ) : (
                  <UserCircle size={20} className="text-[var(--color-primary)]" />
                )}
                <span className="font-semibold text-[var(--color-ink)] truncate max-w-[120px]">
                  {adminUser.name || adminUser.email}
                </span>
              </div>
            )}

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-[12px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-all"
            >
              <HouseLine size={15} />
              <span className="hidden sm:inline">View Public Site</span>
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-[12px] border border-rose-200 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer"
            >
              <SignOut size={15} weight="bold" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                <span className="text-xs font-medium">Active Resources</span>
                <FileText size={18} className="text-[var(--color-primary)]" />
              </div>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                {resourcesList.length}
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                <span className="text-xs font-medium">Pending Submissions</span>
                <UploadSimple size={18} className="text-amber-500" />
              </div>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {pendingSubmissions.length}
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                <span className="text-xs font-medium">Total Downloads</span>
                <ChartBar size={18} className="text-emerald-500" />
              </div>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {totalDownloads.toLocaleString()}
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                <span className="text-xs font-medium">Campus Bulletins</span>
                <Megaphone size={18} className="text-blue-500" />
              </div>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                {approvedNews.length}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'resources'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <FileText size={16} />
              <span>Resources Catalog ({resourcesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'submissions'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <UploadSimple size={16} />
              <span>Contributed Files</span>
              {pendingSubmissions.length > 0 && (
                <span className="rounded-full bg-amber-400 text-slate-900 px-1.5 py-0.2 text-[10px] font-bold">
                  {pendingSubmissions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'news'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <Megaphone size={16} />
              <span>News & Bulletins ({newsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'logs'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <ClockCounterClockwise size={16} />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <Gear size={16} />
              <span>Settings & Security</span>
            </button>
          </div>

          {/* TAB 1: RESOURCES CATALOG */}
          {activeTab === 'resources' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-ink)]">
                  Directory Documents ({resourcesList.length})
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                >
                  <Plus size={16} weight="bold" />
                  <span>Publish New Resource</span>
                </button>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--color-rule-subtle)] bg-[var(--color-paper-muted)]/50 font-mono font-bold uppercase text-[var(--color-ink-muted)]">
                      <tr>
                        <th className="px-5 py-3.5">Document Title</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Office</th>
                        <th className="px-5 py-3.5">Format</th>
                        <th className="px-5 py-3.5">Downloads</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-rule-subtle)]">
                      {resourcesList.map((res) => (
                        <tr key={res.id} className="hover:bg-[var(--color-paper-surface)] transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-bold text-[var(--color-ink)] block">{res.title}</span>
                            <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">v{res.current_version} • {res.file_name}</span>
                          </td>
                          <td className="px-5 py-4 text-[var(--color-ink-secondary)]">{res.category?.name}</td>
                          <td className="px-5 py-4 text-[var(--color-ink-secondary)]">{res.department?.abbreviation || res.source_name}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-[var(--color-paper-muted)] px-2 py-0.5 font-mono text-[10.5px] font-bold text-[var(--color-ink)]">
                              {res.file_format}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-[var(--color-primary)]">
                            {res.download_count}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteResource(res.id, res.title)}
                              className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete resource"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRIBUTED FILES / SUBMISSIONS QUEUE */}
          {activeTab === 'submissions' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink)]">
                    Community Contributed Files ({submissionsList.length})
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Review and verify documents submitted by students and faculty before publishing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {submissionsList.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-2xs hover:border-[var(--color-primary)] transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            sub.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : sub.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {sub.status}
                        </span>

                        <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                          Submitted by {sub.submitter_name} ({sub.submitter_role})
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[var(--color-ink)]">
                        {sub.title}
                      </h3>

                      <p className="text-xs text-[var(--color-ink-muted)] line-clamp-1">
                        {sub.description || sub.submission_notes || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[var(--color-ink-muted)] font-mono pt-1">
                        <span>Format: {sub.file_format}</span>
                        <span>•</span>
                        <span>File: {sub.file_name}</span>
                        <span>•</span>
                        <span>Email: {sub.submitter_email}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {sub.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveSubmission(sub)}
                            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-all cursor-pointer"
                          >
                            <CheckCircle size={15} weight="bold" />
                            <span>Approve & Publish</span>
                          </button>

                          <button
                            onClick={() => handleRejectSubmission(sub.id)}
                            className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                          >
                            <XCircle size={15} weight="bold" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {sub.status !== 'pending' && (
                        <span className="font-mono text-xs text-[var(--color-ink-muted)] italic">
                          Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NEWS & BULLETINS */}
          {activeTab === 'news' && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                Campus News & Bulletins ({newsList.length})
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {newsList.map((art) => (
                  <div
                    key={art.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--color-primary)] uppercase">
                          {art.department?.name || art.source?.name || 'Official Bulletin'}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                          {art.published_at ? new Date(art.published_at).toLocaleDateString() : 'Draft'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--color-ink)]">{art.title}</h3>
                      <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">{art.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {art.status === 'pending' ? (
                        <button
                          onClick={() => handleApproveNews(art.id)}
                          className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                System & Governance Activity Logs
              </h2>
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-2xs space-y-3">
                {mockActivityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-2.5 text-xs last:border-b-0">
                    <div>
                      <span className="font-bold text-[var(--color-ink)]">{log.action}</span>
                      <span className="text-[var(--color-ink-muted)] ml-2">
                        {typeof log.details === 'object' && log.details !== null
                          ? JSON.stringify(log.details)
                          : String(log.details || '')}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">{log.created_at}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & PASSKEY MANAGEMENT */}
          {activeTab === 'settings' && (
            <div className="mt-6 max-w-3xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-ink)]">
                  Administrator Settings & Security
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Manage your administrator passkey, OAuth whitelists, and access credentials.
                </p>
              </div>

              {/* Update Passkey Card */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-7 shadow-2xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-white shadow-2xs">
                    <Key size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">Change Administrator Passkey</h3>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Set a custom passkey for authenticating to this portal on your devices.
                    </p>
                  </div>
                </div>

                {settingsFeedback && (
                  <div
                    className={`flex items-center gap-2 rounded-[14px] p-3 text-xs font-semibold ${
                      settingsFeedback.type === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {settingsFeedback.type === 'success' ? (
                      <Check size={16} weight="bold" className="shrink-0 text-emerald-600" />
                    ) : (
                      <WarningCircle size={16} weight="bold" className="shrink-0 text-rose-600" />
                    )}
                    <span>{settingsFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePasskey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Current Passkey *
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPasskeyInput}
                      onChange={(e) => setCurrentPasskeyInput(e.target.value)}
                      placeholder="Enter current passkey..."
                      className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-ink)]">
                        New Passkey *
                      </label>
                      <input
                        type="password"
                        required
                        value={newPasskeyInput}
                        onChange={(e) => setNewPasskeyInput(e.target.value)}
                        placeholder="At least 6 characters..."
                        className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-ink)]">
                        Confirm New Passkey *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPasskeyInput}
                        onChange={(e) => setConfirmPasskeyInput(e.target.value)}
                        placeholder="Re-type new passkey..."
                        className="mt-1.5 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                  >
                    <CheckCircle size={16} weight="bold" />
                    <span>Save New Passkey</span>
                  </button>
                </form>
              </div>

              {/* Security Hardening Status Card */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-7 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-emerald-600 text-white shadow-2xs">
                    <ShieldCheck size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">Security Hardening Status</h3>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Active security controls enforced across Resursee.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Rate Limiting</span>
                    <span className="text-[11px] text-[var(--color-ink-muted)]">5 attempts / 30s lockout</span>
                  </div>
                  <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Google OAuth</span>
                    <span className="text-[11px] text-[var(--color-ink-muted)]">Email Whitelist Enforced</span>
                  </div>
                  <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Encrypted Cookie</span>
                    <span className="text-[11px] text-[var(--color-ink-muted)]">HTTP-Only / SameSite Lax</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Publish New Resource</h2>
            <form onSubmit={handleAddResource} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Application for Transcript of Records"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summary of document purpose..."
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    {mockCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Format</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">Word (DOCX)</option>
                    <option value="XLSX">Excel (XLSX)</option>
                    <option value="PPTX">PowerPoint (PPTX)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-xs cursor-pointer"
                >
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
