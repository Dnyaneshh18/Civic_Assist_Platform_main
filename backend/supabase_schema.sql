-- CivicAssist Supabase (PostgreSQL) Schema
-- Run this script in your Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard/project/ngkywlqshiujyvrssimn/sql/new)

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Officers Table
CREATE TABLE IF NOT EXISTS public.officers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'Field Officer',
  zone TEXT DEFAULT 'North Zone',
  initials TEXT DEFAULT '',
  color TEXT DEFAULT '#2563eb',
  cases INTEGER DEFAULT 0,
  resolved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Issues Table (matches MongoDB Issue schema with JSONB)
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  complaint_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  coordinates JSONB DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
  image_url TEXT DEFAULT '',
  reporter JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  supporters JSONB DEFAULT '[]'::jsonb,
  shares INTEGER DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  assigned_to TEXT DEFAULT NULL,
  timeline JSONB DEFAULT '[]'::jsonb,
  ai_analysis JSONB DEFAULT '{"textScore": null, "imageScore": null, "finalScore": null, "authenticity": "unknown", "isSpam": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Helper trigger to auto-generate complaint_id if not provided (e.g. #C4F81A)
CREATE OR REPLACE FUNCTION set_complaint_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.complaint_id IS NULL OR NEW.complaint_id = '' THEN
    NEW.complaint_id := '#C' || UPPER(SUBSTRING(MD5(NEW.id || RANDOM()::text) FROM 1 FOR 5));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_complaint_id ON public.issues;
CREATE TRIGGER trigger_set_complaint_id
BEFORE INSERT ON public.issues
FOR EACH ROW
EXECUTE FUNCTION set_complaint_id();

-- Disable RLS on these tables so backend API service has full read/write access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues DISABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues (status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);
CREATE INDEX IF NOT EXISTS idx_officers_created_at ON public.officers (created_at DESC);
