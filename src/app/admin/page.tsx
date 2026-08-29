'use client';

import React, { useState, useEffect } from 'react';
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
  Users,
  UserPlus,
  UserMinus,
  Hourglass,
  List,
  X,
  Sparkle,
  ArrowsClockwise,
  BellRinging,
  ArrowSquareOut,
  Folder,
  PencilSimple,
} from '@phosphor-icons/react';
import {
  mockNewsArticles,
  mockActivityLogs,
  mockSubmissions,
} from '@/lib/mockData';
import { Resource, NewsArticle, DocumentType, ResourceSubmission, Category, Department } from '@/types/database';
import {
  getLiveResources,
  deleteResourceById,
  addCustomResource,
  updateExistingResource,
} from '@/lib/resourceStore';
import {
  getLiveCategories,
  addCategory,
  deleteCategoryById,
  updateCategory,
} from '@/lib/categoryStore';
import {
  getLiveDepartments,
  addDepartment,
  deleteDepartmentById,
  updateDepartment,
} from '@/lib/departmentStore';
import {
  getLiveSubmissions,
  updateSubmissionStatus,
  deleteSubmissionById,
  clearReviewedSubmissions,
} from '@/lib/submissionStore';
import {
  getLiveNewsArticles,
  deleteNewsArticleById,
  updateNewsStatus,
} from '@/lib/newsStore';

interface AdminUserSession {
  email: string;
  name: string;
  picture?: string | null;
  role: 'master_admin' | 'moderator' | 'pending';
  authenticated: boolean;
}

interface StaffMember {
  email: string;
  name: string;
  picture?: string | null;
  approvedAt?: string;
  requestedAt?: string;
}

export default function AdminDashboardPage() {
  // Authentication & RBAC State
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Staff Management State (Master Admin Only)
  const [pendingStaffRequests, setPendingStaffRequests] = useState<StaffMember[]>([]);
  const [approvedModerators, setApprovedModerators] = useState<StaffMember[]>([]);

  // Settings State for Updating Passkey
  const [currentPasskeyInput, setCurrentPasskeyInput] = useState('');
  const [newPasskeyInput, setNewPasskeyInput] = useState('');
  const [confirmPasskeyInput, setConfirmPasskeyInput] = useState('');
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'resources' | 'submissions' | 'categories' | 'offices' | 'news' | 'staff' | 'logs' | 'settings'>('resources');
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [newsFilter, setNewsFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [submissionsList, setSubmissionsList] = useState<ResourceSubmission[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ResourceSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Adding a New Resource
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentType>('form');
  const [newFormat, setNewFormat] = useState('PDF');
  const [newVersion, setNewVersion] = useState('2026.1');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newIsFeatured, setNewIsFeatured] = useState(false);

  // Category Creation & Editing Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catSlug, setCatSlug] = useState('');

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatDescription, setEditCatDescription] = useState('');
  const [editCatSortOrder, setEditCatSortOrder] = useState(1);

  // Office Creation & Editing Modal State
  const [isAddOfficeOpen, setIsAddOfficeOpen] = useState(false);
  const [officeName, setOfficeName] = useState('');
  const [officeAbbreviation, setOfficeAbbreviation] = useState('');
  const [officeSlug, setOfficeSlug] = useState('');
  const [officeWebsite, setOfficeWebsite] = useState('');
  const [officeDescription, setOfficeDescription] = useState('');

  const [editingOffice, setEditingOffice] = useState<Department | null>(null);
  const [editOfficeName, setEditOfficeName] = useState('');
  const [editOfficeAbbreviation, setEditOfficeAbbreviation] = useState('');
  const [editOfficeSlug, setEditOfficeSlug] = useState('');
  const [editOfficeWebsite, setEditOfficeWebsite] = useState('');
  const [editOfficeDescription, setEditOfficeDescription] = useState('');

  const isMasterAdmin = adminUser?.role === 'master_admin' || (!adminUser && isAuthenticated);
  const isModerator = adminUser?.role === 'moderator';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load persistent live data
  const refreshResources = () => {
    setResourcesList(getLiveResources());
  };

  const refreshSubmissions = () => {
    setSubmissionsList(getLiveSubmissions());
  };

  const refreshNews = () => {
    setNewsList(getLiveNewsArticles());
  };

  const refreshCategories = () => {
    const cats = getLiveCategories();
    setCategoriesList(cats);
    if (cats.length > 0 && !newCategory) setNewCategory(cats[0].id);
  };

  const refreshDepartments = () => {
    const depts = getLiveDepartments();
    setDepartmentsList(depts);
    if (depts.length > 0 && !newDepartment) setNewDepartment(depts[0].id);
  };

  useEffect(() => {
    refreshResources();
    refreshSubmissions();
    refreshNews();
    refreshCategories();
    refreshDepartments();

    // Listen to cross-component and cross-tab updates
    const handleCatalogUpdate = () => refreshResources();
    const handleSubmissionsUpdate = () => refreshSubmissions();
    const handleNewsUpdate = () => refreshNews();
    const handleCategoryUpdate = () => refreshCategories();
    const handleDeptUpdate = () => refreshDepartments();

    window.addEventListener('resursee_catalog_updated', handleCatalogUpdate);
    window.addEventListener('resursee_submissions_updated', handleSubmissionsUpdate);
    window.addEventListener('resursee_news_updated', handleNewsUpdate);
    window.addEventListener('resursee_categories_updated', handleCategoryUpdate);
    window.addEventListener('resursee_departments_updated', handleDeptUpdate);
    window.addEventListener('storage', () => {
      handleCatalogUpdate();
      handleSubmissionsUpdate();
      handleNewsUpdate();
      handleCategoryUpdate();
      handleDeptUpdate();
    });

    return () => {
      window.removeEventListener('resursee_catalog_updated', handleCatalogUpdate);
      window.removeEventListener('resursee_submissions_updated', handleSubmissionsUpdate);
      window.removeEventListener('resursee_news_updated', handleNewsUpdate);
      window.removeEventListener('resursee_categories_updated', handleCategoryUpdate);
      window.removeEventListener('resursee_departments_updated', handleDeptUpdate);
    };
  }, [newCategory, newDepartment]);

  // Fetch session
  const checkSession = async (manual = false) => {
    if (typeof window === 'undefined') return;

    if (manual) setIsCheckingStatus(true);

    try {
      const res = await fetch(`/api/auth/session?t=${Date.now()}`);
      const data = await res.json();

      if (data.authenticated && data.user) {
        if (data.user.role === 'pending') {
          setIsPendingApproval(true);
          setIsAuthenticated(false);
          setAdminUser(data.user);
          if (manual) showToast('Status: Still pending approval from Master Admin.');
        } else {
          // Successfully authorized / upgraded!
          setIsAuthenticated(true);
          setIsPendingApproval(false);
          setAdminUser(data.user);
          // Clean URL parameters
          window.history.replaceState({}, '', '/admin');
          if (manual) showToast(`Welcome back, ${data.user.name}! Access verified.`);
        }
      } else {
        const stored = sessionStorage.getItem('resursee_admin_session');
        if (stored === 'authenticated') {
          setIsAuthenticated(true);
          setIsPendingApproval(false);
          setAdminUser({
            email: 'master.admin@university.edu',
            name: 'Master Admin',
            role: 'master_admin',
            authenticated: true,
          });
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const authParam = urlParams.get('auth');
          if (authParam === 'pending_approval') {
            setIsPendingApproval(true);
            setIsAuthenticated(false);
          }
        }
      }
    } catch {
      // Fallback
    } finally {
      if (manual) setIsCheckingStatus(false);
      setIsLoadingSession(false);
    }
  };

  // Fetch pending and approved staff members
  const fetchStaffData = async () => {
    try {
      const res = await fetch(`/api/admin/staff?t=${Date.now()}`);
      const data = await res.json();
      if (data.approvedModerators) setApprovedModerators(data.approvedModerators);
      if (data.pendingRequests) setPendingStaffRequests(data.pendingRequests);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkSession();
    fetchStaffData();

    // Poll staff requests every 10 seconds for real-time notification
    const interval = setInterval(() => {
      fetchStaffData();
    }, 10000);

    return () => clearInterval(interval);
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
      setIsPendingApproval(false);
      setAdminUser({
        email: 'master.admin@university.edu',
        name: 'Master Administrator',
        role: 'master_admin',
        authenticated: true,
      });
      setAuthError('');
      setPasskeyInput('');
      window.history.replaceState({}, '', '/admin');
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
    setIsPendingApproval(false);
    setAdminUser(null);
    window.history.replaceState({}, '', '/admin');
    showToast('Signed out of Administrator Portal.');
  };

  const handleApproveStaff = async (member: StaffMember) => {
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', email: member.email, name: member.name, picture: member.picture }),
      });
      const data = await res.json();
      if (data.approvedModerators) setApprovedModerators(data.approvedModerators);
      if (data.pendingRequests) setPendingStaffRequests(data.pendingRequests);
      showToast(`Approved ${member.name} as Staff Moderator!`);
    } catch {
      showToast('Failed to approve moderator.');
    }
  };

  const handleRejectStaff = async (email: string) => {
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', email }),
      });
      const data = await res.json();
      if (data.pendingRequests) setPendingStaffRequests(data.pendingRequests);
      showToast('Rejected staff request.');
    } catch {
      showToast('Failed to reject staff request.');
    }
  };

  const handleRevokeStaff = async (email: string) => {
    if (!confirm(`Are you sure you want to revoke moderator access for ${email}?`)) return;
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', email }),
      });
      const data = await res.json();
      if (data.approvedModerators) setApprovedModerators(data.approvedModerators);
      showToast(`Revoked moderator access for ${email}.`);
    } catch {
      showToast('Failed to revoke access.');
    }
  };

  const handleUpdatePasskey = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsFeedback(null);

    const isGoogleMaster = isMasterAdmin;
    const customPasskey = typeof window !== 'undefined' ? localStorage.getItem('resursee_custom_passkey') : null;
    const currentValidKeys = [customPasskey, 'resursee2026', 'resursee_admin_2026', 'admin123', 'resursee'].filter(Boolean) as string[];

    // If not authenticated via Google Master session, verify current passkey
    if (!isGoogleMaster && customPasskey) {
      if (!currentValidKeys.includes(currentPasskeyInput.trim())) {
        setSettingsFeedback({ type: 'error', message: 'Current administrator passkey is incorrect.' });
        return;
      }
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
    showToast('Administrator passkey saved successfully.');
  };

  // Metrics
  const totalDownloads = resourcesList.reduce((acc, curr) => acc + curr.download_count, 0);
  const pendingSubmissions = submissionsList.filter((s) => s.status === 'pending');
  const pendingNews = newsList.filter((n) => n.status === 'pending');
  const approvedNews = newsList.filter((n) => n.status === 'approved');

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const selectedCatObj = categoriesList.find((c) => c.id === newCategory);
    const selectedDeptObj = departmentsList.find((d) => d.id === newDepartment);

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
      created_by: adminUser?.email || 'admin-master',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: selectedCatObj,
      department: selectedDeptObj,
    };

    const updated = addCustomResource(newResourceItem);
    setResourcesList(updated);
    setIsAddModalOpen(false);
    showToast(`Successfully published "${newTitle}"`);

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewSourceName('');
    setNewSourceUrl('');
    setNewIsFeatured(false);
  };

  // Persistent Deletion Handler (Master Admin Only)
  const handleDeleteResource = (id: string, title: string) => {
    if (!isMasterAdmin) {
      alert('Permission Denied: Only the Master Administrator can delete documents from the catalog.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${title}"? This will permanently remove it from the public catalog.`)) {
      const updated = deleteResourceById(id);
      setResourcesList(updated);
      showToast(`Deleted "${title}" from catalog.`);
    }
  };

  const handleApproveSubmission = (submission: ResourceSubmission) => {
    if (submission.submission_type === 'update_existing' && submission.existing_resource_id) {
      const target = resourcesList.find((r) => r.id === submission.existing_resource_id);
      if (target) {
        const updated = updateExistingResource(target.id, {
          current_version: submission.version_label,
          file_format: submission.file_format,
          file_name: submission.file_name,
          file_size: submission.file_size,
          file_path: submission.file_path || target.file_path,
          file_data: submission.file_data || target.file_data,
          updated_at: new Date().toISOString(),
        });
        setResourcesList(updated);
      }
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
        file_data: submission.file_data,
        current_version: submission.version_label,
        status: 'active',
        source_name: submission.source_name,
        source_url: submission.source_url,
        is_featured: false,
        download_count: 0,
        created_by: `user-${submission.submitter_name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: submission.category || categoriesList.find((c) => c.id === submission.category_id),
        department: submission.department || departmentsList.find((d) => d.id === submission.department_id),
      };

      const updated = addCustomResource(newRes);
      setResourcesList(updated);
      showToast(`Approved & published "${submission.title}" to the live catalog!`);
    }

    const updatedSubmissions = updateSubmissionStatus(
      submission.id,
      'approved',
      adminUser?.name || 'Administrator'
    );
    setSubmissionsList(updatedSubmissions);
    setSelectedSubmission(null);
  };

  const handleRejectSubmission = (id: string) => {
    const updatedSubmissions = updateSubmissionStatus(
      id,
      'rejected',
      adminUser?.name || 'Administrator'
    );
    setSubmissionsList(updatedSubmissions);
    showToast('Submission rejected.');
    setSelectedSubmission(null);
  };

  const handleDeleteSingleSubmission = (id: string, title: string) => {
    if (confirm(`Remove "${title}" from the contribution review history?`)) {
      const updated = deleteSubmissionById(id);
      setSubmissionsList(updated);
      showToast(`Removed "${title}" from history.`);
    }
  };

  const handleClearReviewedSubmissions = () => {
    const reviewedCount = submissionsList.filter((s) => s.status !== 'pending').length;
    if (reviewedCount === 0) {
      showToast('No reviewed or rejected submissions to clear.');
      return;
    }
    if (
      confirm(
        `Are you sure you want to clear all ${reviewedCount} reviewed and rejected submissions from history? Active pending submissions will remain intact.`
      )
    ) {
      const updated = clearReviewedSubmissions();
      setSubmissionsList(updated);
      showToast(`Cleared ${reviewedCount} reviewed submissions.`);
    }
  };

  const handleApproveNews = (id: string) => {
    const updated = updateNewsStatus(id, 'approved', adminUser?.name || 'Administrator');
    setNewsList(updated);
    showToast('News article approved and published to the live campus hub!');
  };

  const handleRejectNews = (id: string) => {
    const updated = updateNewsStatus(id, 'rejected', adminUser?.name || 'Administrator');
    setNewsList(updated);
    showToast('Article marked as rejected.');
  };

  const handleDeleteNews = (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete the bulletin "${title}"?`)) {
      const updated = deleteNewsArticleById(id);
      setNewsList(updated);
      showToast(`Deleted bulletin "${title}".`);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const slug = catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catName.trim(),
      slug,
      description: catDescription.trim() || null,
      icon_name: 'folder',
      sort_order: categoriesList.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updated = addCategory(newCat);
    setCategoriesList(updated);
    setIsAddCategoryOpen(false);
    setCatName('');
    setCatDescription('');
    setCatSlug('');
    showToast(`Created category "${newCat.name}" successfully!`);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"? Documents in this category will remain intact.`)) {
      const updated = deleteCategoryById(id);
      setCategoriesList(updated);
      showToast(`Category "${name}" deleted.`);
    }
  };

  const handleCreateOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeName.trim() || !officeAbbreviation.trim()) return;

    const slug = officeSlug.trim() || officeAbbreviation.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: officeName.trim(),
      slug,
      abbreviation: officeAbbreviation.trim().toUpperCase(),
      description: officeDescription.trim() || null,
      website_url: officeWebsite.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updated = addDepartment(newDept);
    setDepartmentsList(updated);
    setIsAddOfficeOpen(false);
    setOfficeName('');
    setOfficeAbbreviation('');
    setOfficeSlug('');
    setOfficeWebsite('');
    setOfficeDescription('');
    showToast(`Added campus office "${newDept.name}" (${newDept.abbreviation}) successfully!`);
  };

  const handleDeleteOffice = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove the campus office "${name}"?`)) {
      const updated = deleteDepartmentById(id);
      setDepartmentsList(updated);
      showToast(`Office "${name}" removed.`);
    }
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug);
    setEditCatDescription(cat.description || '');
    setEditCatSortOrder(cat.sort_order || 1);
  };

  const handleSaveEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    const updated = updateCategory(editingCategory.id, {
      name: editCatName.trim(),
      slug: editCatSlug.trim() || editCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: editCatDescription.trim() || null,
      sort_order: Number(editCatSortOrder) || 1,
    });
    setCategoriesList(updated);
    setEditingCategory(null);
    showToast(`Updated category "${editCatName.trim()}" successfully!`);
  };

  const openEditOffice = (dept: Department) => {
    setEditingOffice(dept);
    setEditOfficeName(dept.name);
    setEditOfficeAbbreviation(dept.abbreviation);
    setEditOfficeSlug(dept.slug);
    setEditOfficeWebsite(dept.website_url || '');
    setEditOfficeDescription(dept.description || '');
  };

  const handleSaveEditOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice || !editOfficeName.trim() || !editOfficeAbbreviation.trim()) return;

    const updated = updateDepartment(editingOffice.id, {
      name: editOfficeName.trim(),
      abbreviation: editOfficeAbbreviation.trim().toUpperCase(),
      slug: editOfficeSlug.trim() || editOfficeAbbreviation.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      website_url: editOfficeWebsite.trim() || null,
      description: editOfficeDescription.trim() || null,
    });
    setDepartmentsList(updated);
    setEditingOffice(null);
    showToast(`Updated campus office "${editOfficeName.trim()}" successfully!`);
  };

  // --- ⌛ INITIAL SESSION VERIFICATION SCREEN (Prevents login screen flash on refresh) ---
  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-paper)]">
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-150">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--color-primary)] text-white shadow-lg text-2xl font-bold animate-pulse select-none">
            🦦
          </div>
          <div className="flex items-center gap-2">
            <ArrowsClockwise size={14} className="animate-spin text-[var(--color-primary)]" />
            <span className="font-mono text-xs font-bold text-[var(--color-ink-muted)]">
              Verifying security session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- ⏳ PENDING MASTER ADMIN APPROVAL GATE SCREEN ---
  if (isPendingApproval) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-paper)] p-4 sm:p-6">
        <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-7 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.08)] text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Hourglass size={32} weight="bold" />
          </div>

          <div>
            <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 font-mono text-xs font-bold uppercase">
              Approval Pending
            </span>
            <h1 className="mt-3 text-xl font-extrabold text-[var(--color-ink)]">
              Staff Moderator Request Sent
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
              Your Google account <strong className="text-[var(--color-ink)]">{adminUser?.email}</strong> is awaiting authorization from the <strong>Master Administrator</strong>.
            </p>
          </div>

          <div className="rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-4 text-xs text-left space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-ink)] font-bold">
              <ShieldCheck size={16} className="text-[var(--color-primary)]" />
              <span>What happens next?</span>
            </div>
            <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
              Once approved by the Master Admin, you will be granted <strong>Document Moderator</strong> permissions to verify student contributions and publish bulletins. You will not have permissions to delete directory files.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              disabled={isCheckingStatus}
              onClick={() => checkSession(true)}
              className="flex items-center justify-center gap-2 w-full rounded-[14px] bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowsClockwise size={16} className={isCheckingStatus ? 'animate-spin' : ''} />
              <span>{isCheckingStatus ? 'Checking Authorization...' : 'Check Approval Status'}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] py-3 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] active:scale-95 transition-all cursor-pointer"
            >
              Sign Out
            </button>
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
            Restricted portal for Master Administrators and approved Document Moderators.
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
              Role-Based Access
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
      {/* 🚨 Master Admin Floating Notification Banner for Pending Staff Requests */}
      {isMasterAdmin && pendingStaffRequests.length > 0 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRinging size={18} weight="fill" className="animate-bounce" />
              <span>
                <strong>Action Required:</strong> {pendingStaffRequests.length} user(s) requested Staff Moderator permissions.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('staff')}
              className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
            >
              Review Requests →
            </button>
          </div>
        </div>
      )}

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
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    isMasterAdmin
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-500/30'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {isMasterAdmin ? '👑 Master Admin' : '🛡️ Staff Moderator'}
                </span>
              </div>
              <span className="text-[11px] text-[var(--color-ink-muted)]">
                {isMasterAdmin ? 'Full Governance & Deletion Controls' : 'Document Review & Verification Only'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
              <span className="hidden sm:inline">Public Site</span>
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-[12px] border border-rose-200 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer"
            >
              <SignOut size={15} weight="bold" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
            <div className="rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                <span className="text-xs font-medium">Directory Files</span>
                <FileText size={18} className="text-[var(--color-primary)]" />
              </div>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                {resourcesList.length}
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                <span className="text-xs font-medium">Pending Contributions</span>
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
                <span className="text-xs font-medium">Staff Moderators</span>
                <Users size={18} className="text-blue-500" />
              </div>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--color-ink)]">
                {approvedModerators.length + 1}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Responsive scrollable) */}
          <div className="mt-6 sm:mt-8 flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'resources'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <FileText size={16} />
              <span>Catalog ({resourcesList.length})</span>
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
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <Folder size={16} />
              <span>Categories ({categoriesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('offices')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'offices'
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
              }`}
            >
              <Buildings size={16} />
              <span>Offices ({departmentsList.length})</span>
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
              <span>Campus News</span>
            </button>

            {/* MASTER ADMIN ONLY: STAFF & PERMISSIONS TAB */}
            {isMasterAdmin && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 relative ${
                  activeTab === 'staff'
                    ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                }`}
              >
                <Users size={16} />
                <span>Staff & Permissions</span>
                {pendingStaffRequests.length > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold animate-pulse">
                    {pendingStaffRequests.length} Pending
                  </span>
                )}
              </button>
            )}

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

            {/* MASTER ADMIN ONLY: SETTINGS & PASSKEYS */}
            {isMasterAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                }`}
              >
                <Gear size={16} />
                <span>Settings</span>
              </button>
            )}
          </div>

          {/* TAB 1: RESOURCES CATALOG */}
          {activeTab === 'resources' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink)]">
                    Directory Documents ({resourcesList.length})
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {isMasterAdmin ? 'Full creation and deletion permissions enabled.' : 'Moderator view: Deletions restricted.'}
                  </p>
                </div>
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
                        {isMasterAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
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
                          {isMasterAdmin && (
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleDeleteResource(res.id, res.title)}
                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete document permanently"
                              >
                                <Trash size={16} weight="bold" />
                              </button>
                            </td>
                          )}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink)]">
                    Community Contributed Files ({submissionsList.length})
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Review and verify documents submitted by students and faculty before publishing.
                  </p>
                </div>

                {/* Clear Reviewed & Rejected History Button */}
                {submissionsList.some((s) => s.status !== 'pending') && (
                  <button
                    type="button"
                    onClick={handleClearReviewedSubmissions}
                    className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer shadow-2xs"
                  >
                    <Trash size={14} weight="bold" />
                    <span>Clear Reviewed & Rejected ({submissionsList.filter((s) => s.status !== 'pending').length})</span>
                  </button>
                )}
              </div>

              {/* Sub-Filters: All · Pending · Approved · Rejected */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('all')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    submissionFilter === 'all'
                      ? 'bg-[var(--color-ink)] text-white dark:bg-white dark:text-black shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  All ({submissionsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('pending')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    submissionFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Pending ({submissionsList.filter((s) => s.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('approved')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    submissionFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Approved ({submissionsList.filter((s) => s.status === 'approved').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('rejected')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    submissionFilter === 'rejected'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Rejected ({submissionsList.filter((s) => s.status === 'rejected').length})
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {submissionsList
                  .filter((s) => submissionFilter === 'all' || s.status === submissionFilter)
                  .map((sub) => (
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
                          {sub.reviewed_by && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400">Reviewed by {sub.reviewed_by}</span>
                            </>
                          )}
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
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[var(--color-ink-muted)] italic">
                              {sub.status === 'approved' ? 'Published' : 'Rejected'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleSubmission(sub.id, sub.title)}
                              className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete from history"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                {submissionsList.filter((s) => submissionFilter === 'all' || s.status === submissionFilter).length === 0 && (
                  <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-8 text-center text-xs text-[var(--color-ink-muted)] italic">
                    No {submissionFilter === 'all' ? '' : submissionFilter} submissions found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink)]">
                    Document Categories ({categoriesList.length})
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Manage taxonomy categories (e.g. DOST, Financial Forms, Clearance, Academic Guidelines).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                >
                  <Plus size={16} weight="bold" />
                  <span>Create New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesList.map((cat) => {
                  const docCount = resourcesList.filter((r) => r.category_id === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="flex flex-col justify-between rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-2xs hover:border-[var(--color-primary)] transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                              <Folder size={18} weight="bold" />
                            </div>
                            <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
                              {cat.slug}
                            </span>
                          </div>
                          <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-[var(--color-ink)]">
                            {docCount} {docCount === 1 ? 'Doc' : 'Docs'}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-[var(--color-ink)]">{cat.name}</h3>
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)] line-clamp-2">
                          {cat.description || 'General administrative document category.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--color-rule-subtle)] flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">Sort Order: #{cat.sort_order}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEditCategory(cat)}
                            className="flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                          >
                            <PencilSimple size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="flex items-center gap-1 font-semibold text-rose-600 hover:underline cursor-pointer"
                          >
                            <Trash size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CAMPUS OFFICES & PARTNER AGENCIES */}
          {activeTab === 'offices' && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink)]">
                    Campus Offices & Partner Agencies ({departmentsList.length})
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Configure issuing departments, colleges, and external agencies (e.g. DOST, CHED, Registrar).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOfficeOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                >
                  <Plus size={16} weight="bold" />
                  <span>Add Campus Office / Agency</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentsList.map((dept) => {
                  const docCount = resourcesList.filter((r) => r.department_id === dept.id).length;
                  return (
                    <div
                      key={dept.id}
                      className="flex flex-col justify-between rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-2xs hover:border-[var(--color-primary)] transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {dept.abbreviation.slice(0, 3)}
                            </div>
                            <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
                              {dept.abbreviation}
                            </span>
                          </div>
                          <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-[var(--color-ink)]">
                            {docCount} {docCount === 1 ? 'Doc' : 'Docs'}
                          </span>
                        </div>

                        <h3 className="mt-3 text-sm font-bold text-[var(--color-ink)]">{dept.name}</h3>
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)] line-clamp-2">
                          {dept.description || `Official administrative office and issuing department.`}
                        </p>

                        {dept.website_url && (
                          <a
                            href={dept.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
                          >
                            <span>Visit Portal</span>
                            <ArrowSquareOut size={11} />
                          </a>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--color-rule-subtle)] flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">Slug: {dept.slug}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEditOffice(dept)}
                            className="flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                          >
                            <PencilSimple size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOffice(dept.id, dept.name)}
                            className="flex items-center gap-1 font-semibold text-rose-600 hover:underline cursor-pointer"
                          >
                            <Trash size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: NEWS & BULLETINS */}
          {activeTab === 'news' && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink)]">
                    Campus News & Bulletins ({newsList.length})
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Review, approve, and manage official university circulars and announcements.
                  </p>
                </div>
              </div>

              {/* Sub-Filters: All · Approved · Pending · Rejected */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setNewsFilter('all')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    newsFilter === 'all'
                      ? 'bg-[var(--color-ink)] text-white dark:bg-white dark:text-black shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  All ({newsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNewsFilter('approved')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    newsFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Live / Approved ({newsList.filter((n) => n.status === 'approved').length})
                </button>
                <button
                  type="button"
                  onClick={() => setNewsFilter('pending')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    newsFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Pending Review ({newsList.filter((n) => n.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setNewsFilter('rejected')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    newsFilter === 'rejected'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  Rejected ({newsList.filter((n) => n.status === 'rejected').length})
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {newsList
                  .filter((art) => newsFilter === 'all' || art.status === newsFilter)
                  .map((art) => (
                    <div
                      key={art.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-2xs hover:border-[var(--color-primary)] transition-all"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                              art.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : art.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {art.status === 'approved' ? 'Live on Campus Feed' : art.status}
                          </span>

                          <span className="font-mono text-xs font-bold text-[var(--color-primary)] uppercase">
                            {art.department?.name || art.source?.name || 'Official Office'}
                          </span>

                          <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                            • {art.published_at ? new Date(art.published_at).toLocaleDateString() : 'Draft'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-[var(--color-ink)]">{art.title}</h3>
                        <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">{art.summary}</p>

                        {art.content_url && (
                          <div className="pt-1">
                            <a
                              href={art.content_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--color-primary)] hover:underline"
                            >
                              <span>View Source URL</span>
                              <ArrowSquareOut size={12} />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {art.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveNews(art.id)}
                              className="flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-all cursor-pointer"
                            >
                              <CheckCircle size={15} weight="bold" />
                              <span>Approve & Publish</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRejectNews(art.id)}
                              className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              <XCircle size={15} weight="bold" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* Delete Bulletin Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteNews(art.id, art.title)}
                          className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Bulletin"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}

                {newsList.filter((art) => newsFilter === 'all' || art.status === newsFilter).length === 0 && (
                  <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-8 text-center text-xs text-[var(--color-ink-muted)] italic">
                    No {newsFilter === 'all' ? '' : newsFilter} news bulletins found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MASTER ADMIN STAFF & PERMISSIONS */}
          {activeTab === 'staff' && isMasterAdmin && (
            <div className="mt-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-ink)]">
                  Staff & Moderator Role Management
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Approve new moderator access requests and manage review permissions.
                </p>
              </div>

              {/* Pending Requests Section */}
              <div className="rounded-[24px] border-2 border-amber-400 dark:border-amber-600/70 bg-amber-50/60 dark:bg-amber-950/30 p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserPlus size={22} className="text-amber-600 dark:text-amber-400" />
                    <h3 className="text-base font-bold text-amber-950 dark:text-amber-100">
                      Pending Moderator Access Requests ({pendingStaffRequests.length})
                    </h3>
                  </div>
                  <button
                    onClick={fetchStaffData}
                    className="flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    <ArrowsClockwise size={14} />
                    <span>Refresh</span>
                  </button>
                </div>

                {pendingStaffRequests.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-muted)] italic py-2">
                    No pending staff requests. When someone logs in with an unapproved Google account, their request will appear here with an alert banner.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingStaffRequests.map((req) => (
                      <div
                        key={req.email}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[18px] border border-amber-300 dark:border-amber-700 bg-[var(--color-paper-card)] p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          {req.picture ? (
                            <img src={req.picture} alt={req.name} className="h-10 w-10 rounded-full" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center font-bold text-amber-800">
                              {req.name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-bold text-[var(--color-ink)] block">{req.name}</span>
                            <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">{req.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleApproveStaff(req)}
                            className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                          >
                            <Check size={14} weight="bold" />
                            <span>Approve as Moderator</span>
                          </button>
                          <button
                            onClick={() => handleRejectStaff(req.email)}
                            className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                          >
                            <X size={14} weight="bold" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved Staff Moderators Section */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <Users size={20} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--color-ink)]">
                    Active Staff Moderators ({approvedModerators.length})
                  </h3>
                </div>

                <div className="divide-y divide-[var(--color-rule-subtle)]">
                  {/* Master Admin Entry */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-sm">
                        👑
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--color-ink)] block">
                          Master Administrator (You)
                        </span>
                        <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                          {adminUser?.email || 'admin@resursee.com'}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                      Owner
                    </span>
                  </div>

                  {/* Approved Moderators */}
                  {approvedModerators.map((mod) => (
                    <div key={mod.email} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        {mod.picture ? (
                          <img src={mod.picture} alt={mod.name} className="h-9 w-9 rounded-full" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            {mod.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-[var(--color-ink)] block">{mod.name}</span>
                          <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">{mod.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase">
                          Moderator (Review Only)
                        </span>
                        <button
                          onClick={() => handleRevokeStaff(mod.email)}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
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

          {/* TAB 6: SETTINGS & PASSKEY MANAGEMENT (MASTER ADMIN ONLY) */}
          {activeTab === 'settings' && isMasterAdmin && (
            <div className="mt-6 max-w-3xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-ink)]">
                  Master Administrator Settings & Passkeys
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
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">Change Master Passkey</h3>
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
                  {isMasterAdmin ? (
                    <div className="rounded-[16px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                      <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Authenticated with Master Google Workspace</span>
                        <span className="text-[11px] text-blue-800 dark:text-blue-300">
                          Signed in as <strong>{adminUser?.email || 'Master Administrator'}</strong>. You do not need an existing passkey. Set your custom emergency passkey below.
                        </span>
                      </div>
                    </div>
                  ) : (
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
                  )}

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
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Two-Tier RBAC</span>
                    <span className="text-[11px] text-[var(--color-ink-muted)]">Master Admin & Moderator</span>
                  </div>
                  <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Encrypted Session</span>
                    <span className="text-[11px] text-[var(--color-ink-muted)]">HTTP-Only / SameSite Lax</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Publish New Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)]">Publish Directory Document</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Issuing Office / Agency</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    {departmentsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Format</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden"
                  >
                    <option value="PDF">PDF (.pdf)</option>
                    <option value="DOCX">Word Document (.docx)</option>
                    <option value="DOC">Word 97-2003 (.doc)</option>
                    <option value="XLSX">Excel (.xlsx)</option>
                    <option value="XLS">Excel 97-2003 (.xls)</option>
                    <option value="PPTX">PowerPoint (.pptx)</option>
                    <option value="CSV">CSV (.csv)</option>
                    <option value="ZIP">ZIP (.zip)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Version Label</label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="2026.1"
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden"
                  />
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

      {/* Create Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Folder size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-ink)]">Create New Document Category</h2>
              </div>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!catSlug) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }
                  }}
                  placeholder="e.g. DOST Grants & Compliance"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Category Slug (URL identifier)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. dost-grants"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Description / Scope</label>
                <textarea
                  rows={3}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Brief description of documents falling under this category..."
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-xs cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Campus Office / Partner Agency Modal */}
      {isAddOfficeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Buildings size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-ink)]">Add Campus Office or Agency</h2>
              </div>
              <button onClick={() => setIsAddOfficeOpen(false)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateOffice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Office / Agency Full Name *</label>
                <input
                  type="text"
                  required
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="e.g. Department of Science and Technology - Regional Office"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Abbreviation / Acronym *</label>
                  <input
                    type="text"
                    required
                    value={officeAbbreviation}
                    onChange={(e) => {
                      setOfficeAbbreviation(e.target.value);
                      if (!officeSlug) {
                        setOfficeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    placeholder="e.g. DOST"
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-bold outline-hidden focus:border-[var(--color-primary)] uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Slug (URL tag)</label>
                  <input
                    type="text"
                    value={officeSlug}
                    onChange={(e) => setOfficeSlug(e.target.value)}
                    placeholder="e.g. dost"
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Official Website / Portal URL</label>
                <input
                  type="url"
                  value={officeWebsite}
                  onChange={(e) => setOfficeWebsite(e.target.value)}
                  placeholder="https://dost.gov.ph"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Description</label>
                <textarea
                  rows={2}
                  value={officeDescription}
                  onChange={(e) => setOfficeDescription(e.target.value)}
                  placeholder="Mandate and document issuance role..."
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddOfficeOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-xs cursor-pointer"
                >
                  Add Office / Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <PencilSimple size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-ink)]">Edit Document Category</h2>
              </div>
              <button onClick={() => setEditingCategory(null)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="e.g. DOST Grants & Compliance"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Category Slug</label>
                  <input
                    type="text"
                    required
                    value={editCatSlug}
                    onChange={(e) => setEditCatSlug(e.target.value)}
                    placeholder="e.g. dost-grants"
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Display Sort Order</label>
                  <input
                    type="number"
                    value={editCatSortOrder}
                    onChange={(e) => setEditCatSortOrder(Number(e.target.value))}
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Description / Scope</label>
                <textarea
                  rows={3}
                  value={editCatDescription}
                  onChange={(e) => setEditCatDescription(e.target.value)}
                  placeholder="Brief description of documents falling under this category..."
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campus Office Modal */}
      {editingOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <PencilSimple size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-ink)]">Edit Campus Office / Agency</h2>
              </div>
              <button onClick={() => setEditingOffice(null)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditOffice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Office / Agency Full Name *</label>
                <input
                  type="text"
                  required
                  value={editOfficeName}
                  onChange={(e) => setEditOfficeName(e.target.value)}
                  placeholder="e.g. Department of Science and Technology - Regional Office"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Abbreviation / Acronym *</label>
                  <input
                    type="text"
                    required
                    value={editOfficeAbbreviation}
                    onChange={(e) => setEditOfficeAbbreviation(e.target.value)}
                    placeholder="e.g. DOST"
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-bold outline-hidden focus:border-[var(--color-primary)] uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink)]">Slug (URL tag)</label>
                  <input
                    type="text"
                    required
                    value={editOfficeSlug}
                    onChange={(e) => setEditOfficeSlug(e.target.value)}
                    placeholder="e.g. dost"
                    className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Official Website / Portal URL</label>
                <input
                  type="url"
                  value={editOfficeWebsite}
                  onChange={(e) => setEditOfficeWebsite(e.target.value)}
                  placeholder="https://dost.gov.ph"
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] font-mono outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)]">Description</label>
                <textarea
                  rows={2}
                  value={editOfficeDescription}
                  onChange={(e) => setEditOfficeDescription(e.target.value)}
                  placeholder="Mandate and document issuance role..."
                  className="mt-1 w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingOffice(null)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-xs cursor-pointer"
                >
                  Save Changes
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
