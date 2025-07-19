-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor to create all necessary tables

-- Enable Row Level Security
-- Create tables

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'joinee')) DEFAULT 'joinee',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Onboarding Tasks table
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  estimated_hours DECIMAL(4,2),
  resources TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Task Progress table
CREATE TABLE IF NOT EXISTS public.user_task_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  task_id UUID REFERENCES onboarding_tasks(id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- 4. Knowledge Documents table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Chat Queries table
CREATE TABLE IF NOT EXISTS public.chat_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Onboarding Tasks: All authenticated users can view, admins can manage
CREATE POLICY "Everyone can view tasks" ON public.onboarding_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage tasks" ON public.onboarding_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Task Progress: Users can view/update their own progress
CREATE POLICY "Users can view own progress" ON public.user_task_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_task_progress
  FOR ALL USING (auth.uid() = user_id);

-- Knowledge Documents: All authenticated users can view, admins can manage
CREATE POLICY "Everyone can view documents" ON public.knowledge_documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage documents" ON public.knowledge_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Chat Queries: Users can view their own queries
CREATE POLICY "Users can view own queries" ON public.chat_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queries" ON public.chat_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_category ON public.onboarding_tasks(category);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_order ON public.onboarding_tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_id ON public.user_task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_task_id ON public.user_task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_type ON public.knowledge_documents(type);
CREATE INDEX IF NOT EXISTS idx_chat_queries_user_id ON public.chat_queries(user_id);

-- Insert sample onboarding tasks
INSERT INTO public.onboarding_tasks (title, description, category, required, order_index, estimated_hours, resources) VALUES
('Setup Development Environment', 'Install required tools and dependencies for development', 'Technical', true, 1, 2.0, ARRAY['Setup Guide', 'Installation Scripts']),
('Complete Security Training', 'Review security policies and best practices', 'Security', true, 2, 1.0, ARRAY['Security Handbook', 'Policy Documents']),
('Team Introduction Meeting', 'Meet with team members and understand roles', 'Administrative', true, 3, 1.0, ARRAY['Team Directory', 'Organization Chart']),
('Code Review Guidelines', 'Learn about code review process and standards', 'Technical', true, 4, 1.5, ARRAY['Code Review Guide', 'Style Guide']),
('Project Architecture Overview', 'Understand the overall system architecture', 'Technical', false, 5, 2.0, ARRAY['Architecture Docs', 'System Diagrams'])
ON CONFLICT DO NOTHING;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'joinee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user profile timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER handle_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_onboarding_tasks
  BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_task_progress
  BEFORE UPDATE ON public.user_task_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_knowledge_documents
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
