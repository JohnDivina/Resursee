-- ============================================================================
-- Resursee: Central University Resource Hub
-- Initial Database Schema, Indexes, RLS Policies, Triggers & Seed Data
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Custom Types / Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'form', 'template', 'memorandum', 'policy', 'guideline',
    'report', 'certificate', 'request', 'administrative',
    'academic', 'research', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_status AS ENUM ('draft', 'active', 'archived', 'deprecated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('rss', 'api', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  icon TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Departments / Offices table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Resources table (with tsvector full-text search)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  document_type document_type NOT NULL DEFAULT 'form',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_data TEXT,
  current_version TEXT NOT NULL DEFAULT '2026.1',
  status resource_status NOT NULL DEFAULT 'active',
  source_name TEXT,
  source_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  download_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(source_name, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(file_format, '')), 'D')
  ) STORED
);

-- 8. Resource Tags junction table
CREATE TABLE IF NOT EXISTS public.resource_tags (
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- 9. Resource Versions table
CREATE TABLE IF NOT EXISTS public.resource_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  change_notes TEXT,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Resource Downloads tracking table
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. News Sources table
CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  feed_url TEXT,
  source_type source_type NOT NULL DEFAULT 'rss',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. News Articles table
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content_url TEXT NOT NULL,
  image_url TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  status article_status NOT NULL DEFAULT 'pending',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  external_id TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Official Links table
CREATE TABLE IF NOT EXISTS public.official_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Admin Activity Log table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Resource Submissions table (Community / Faculty Contributions)
CREATE TABLE IF NOT EXISTS public.resource_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  document_type document_type NOT NULL DEFAULT 'form',
  file_path TEXT,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_data TEXT,
  version_label TEXT NOT NULL DEFAULT '2026.1',
  source_name TEXT,
  source_url TEXT,
  submission_type TEXT NOT NULL DEFAULT 'new_resource',
  existing_resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_role TEXT,
  submission_notes TEXT,
  status article_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 15. Performance Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_resources_search ON public.resources USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources (category_id);
CREATE INDEX IF NOT EXISTS idx_resources_department ON public.resources (department_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources (status);
CREATE INDEX IF NOT EXISTS idx_resources_downloads ON public.resources (download_count DESC);
CREATE INDEX IF NOT EXISTS idx_news_status_published ON public.news_articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_resource ON public.resource_downloads (resource_id);

-- ============================================================================
-- 16. Helper Functions & Triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT coalesce(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'user'::user_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger to increment download count
CREATE OR REPLACE FUNCTION public.increment_resource_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.resources
  SET download_count = download_count + 1
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_download ON public.resource_downloads;
CREATE TRIGGER trg_increment_download
AFTER INSERT ON public.resource_downloads
FOR EACH ROW
EXECUTE FUNCTION public.increment_resource_download_count();

-- Auto create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 17. Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view own profile; Admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Categories: Public read active; Admin full control
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Departments: Public read active; Admin full control
CREATE POLICY "Public can view active departments" ON public.departments
  FOR SELECT USING (is_active = TRUE OR public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Tags: Public read; Admin full control
CREATE POLICY "Public can view tags" ON public.tags FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage tags" ON public.tags FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Resources: Public read active; Admin full control
CREATE POLICY "Public can view active resources" ON public.resources
  FOR SELECT USING (status = 'active' OR public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Resource Tags: Public read; Admin manage
CREATE POLICY "Public can view resource tags" ON public.resource_tags FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage resource tags" ON public.resource_tags FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Resource Versions: Public read current; Admin full control
CREATE POLICY "Public can view resource versions" ON public.resource_versions FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage resource versions" ON public.resource_versions FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Resource Downloads: Public insert; Admin view
CREATE POLICY "Anyone can record download" ON public.resource_downloads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can view download logs" ON public.resource_downloads FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'));

-- News Articles: Public read approved; Admin full control
CREATE POLICY "Public can view approved news" ON public.news_articles
  FOR SELECT USING (status = 'approved' OR public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage news articles" ON public.news_articles
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- News Sources: Admin only
CREATE POLICY "Admins can manage news sources" ON public.news_sources
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Official Links: Public read active; Admin manage
CREATE POLICY "Public can view active official links" ON public.official_links
  FOR SELECT USING (is_active = TRUE OR public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage official links" ON public.official_links
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Activity Log: Admin read only; System insert
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_log
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

-- Resource Submissions: Anyone can submit; Admins manage
ALTER TABLE public.resource_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit resource for review" ON public.resource_submissions
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can manage resource submissions" ON public.resource_submissions
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

