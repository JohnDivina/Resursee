export type UserRole = 'user' | 'admin' | 'super_admin';

export type DocumentType =
  | 'form'
  | 'template'
  | 'memorandum'
  | 'policy'
  | 'guideline'
  | 'report'
  | 'certificate'
  | 'request'
  | 'administrative'
  | 'academic'
  | 'research'
  | 'other';

export type ResourceStatus = 'draft' | 'active' | 'archived' | 'deprecated';

export type ArticleStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export type SourceType = 'rss' | 'api' | 'manual';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type SubmissionType = 'new_resource' | 'update_existing';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  icon?: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string;
  department_id: string | null;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  file_format: string; // e.g. "PDF", "DOCX", "XLSX"
  file_size: number; // in bytes
  current_version: string;
  status: ResourceStatus;
  source_name: string | null;
  source_url: string | null;
  is_featured: boolean;
  download_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields for display
  category?: Category;
  department?: Department;
  tags?: Tag[];
  versions?: ResourceVersion[];
}

export interface ResourceTag {
  resource_id: string;
  tag_id: string;
}

export interface ResourceVersion {
  id: string;
  resource_id: string;
  version_label: string;
  file_path: string;
  file_name: string;
  file_format: string;
  file_size: number;
  change_notes: string | null;
  is_current: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export interface ResourceDownload {
  id: string;
  resource_id: string;
  ip_hash: string | null;
  user_agent: string | null;
  downloaded_at: string;
}

export interface ResourceSubmission {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  department_id: string | null;
  document_type: DocumentType;
  file_name: string;
  file_format: string;
  file_size: number;
  file_path?: string;
  version_label: string;
  source_name: string | null;
  source_url: string | null;
  submission_type: SubmissionType;
  existing_resource_id?: string | null;
  submitter_name: string;
  submitter_email: string;
  submitter_role?: 'student' | 'faculty' | 'staff' | 'alumni' | 'other';
  submission_notes: string | null;
  status: SubmissionStatus;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  // Joined relations
  category?: Category;
  department?: Department;
  existing_resource?: Resource;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  feed_url: string | null;
  source_type: SourceType;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  source_id: string | null;
  title: string;
  summary: string | null;
  content_url: string;
  image_url: string | null;
  department_id: string | null;
  status: ArticleStatus;
  is_featured: boolean;
  external_id: string | null;
  reviewed_by: string | null;
  published_at: string | null;
  fetched_at: string;
  reviewed_at: string | null;
  created_at: string;
  // Joined fields
  source?: NewsSource;
  department?: Department;
}

export interface OfficialLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  admin_email?: string;
}

export interface DashboardStats {
  totalResources: number;
  totalCategories: number;
  totalDownloads: number;
  pendingNewsCount: number;
  pendingSubmissionsCount: number;
  publishedNewsCount: number;
  recentResources: Resource[];
  mostDownloaded: Resource[];
  recentActivity: AdminActivityLog[];
}
