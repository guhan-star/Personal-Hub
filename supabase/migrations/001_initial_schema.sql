-- ==============================================================================
-- PERSONALHUB DATABASE SCHEMA (PostgreSQL / Supabase)
-- Robust Ledger-Based Personal Productivity & Financial Management Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'PersonalHub User',
    email TEXT,
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    date_format TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
    week_starts_on INTEGER NOT NULL DEFAULT 1 CHECK (week_starts_on IN (0, 1, 6)), -- 0=Sun, 1=Mon, 6=Sat
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    task_reminders BOOLEAN NOT NULL DEFAULT true,
    calendar_reminders BOOLEAN NOT NULL DEFAULT true,
    default_account_id UUID,
    demo_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. BRAINVAULT (KNOWLEDGE MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#7167E8',
    icon TEXT DEFAULT 'Folder',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#8E83F5',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('url', 'youtube', 'instagram', 'whatsapp', 'image', 'pdf', 'document', 'note', 'other')),
    url TEXT,
    description TEXT,
    personal_note TEXT,
    attachment_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    source_app TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.saved_item_tags (
    saved_item_id UUID NOT NULL REFERENCES public.saved_items(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (saved_item_id, tag_id)
);

-- ------------------------------------------------------------------------------
-- 3. SPENDWISE (FINANCIAL LEDGER SYSTEM)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'savings_bank', 'current_bank', 'upi_linked', 'digital_wallet', 'other')),
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    institution TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT DEFAULT 'Tag',
    color TEXT DEFAULT '#7167E8',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, name, type)
);

CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('lend', 'borrow')), -- lend: user gave money (receivable); borrow: user took money (payable)
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    repaid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (repaid_amount >= 0),
    outstanding_amount NUMERIC(14, 2) NOT NULL CHECK (outstanding_amount >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'forgiven')),
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.financial_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('income', 'expense', 'transfer', 'lend', 'borrow', 'loan_repayment', 'refund', 'cash_withdrawal', 'cash_deposit')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    notes TEXT,
    category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    to_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
    loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
    original_event_id UUID REFERENCES public.financial_events(id) ON DELETE SET NULL,
    payment_method TEXT NOT NULL DEFAULT 'upi' CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'wallet', 'other')),
    attachment_url TEXT,
    client_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT transfer_distinct_accounts CHECK (
        event_type NOT IN ('transfer', 'cash_withdrawal', 'cash_deposit') OR 
        (to_account_id IS NOT NULL AND account_id <> to_account_id)
    )
);

CREATE TABLE IF NOT EXISTS public.account_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.financial_events(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')), -- debit: decreases balance; credit: increases balance
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. PRODUCTIVITY MODULES: TASKS, STUDYSPACE, GOALS, WISHLIST, CALENDAR
-- ------------------------------------------------------------------------------

-- Task Manager
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    category TEXT DEFAULT 'General',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    is_calendar_synced BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- StudySpace
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    accent_color TEXT DEFAULT '#5599E8',
    icon TEXT DEFAULT 'BookOpen',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.study_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.study_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    linked_saved_item_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Goals
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Personal',
    target_value NUMERIC(14, 2) NOT NULL CHECK (target_value > 0),
    current_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (current_value >= 0),
    unit TEXT NOT NULL DEFAULT '%',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    is_financial BOOLEAN NOT NULL DEFAULT false,
    linked_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    product_url TEXT,
    expected_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (expected_price >= 0),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT DEFAULT 'Shopping',
    status TEXT NOT NULL DEFAULT 'want' CHECK (status IN ('want', 'planning', 'saving', 'purchased', 'cancelled')),
    linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    notes TEXT,
    purchased_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '10:00',
    location TEXT,
    category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('personal', 'work', 'study', 'finance', 'task', 'other')),
    reminder_minutes INTEGER DEFAULT 15,
    linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. AUDIT & BACKUP
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'reverse')),
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 6. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_saved_items_user_folder ON public.saved_items(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_url ON public.saved_items(user_id, url);
CREATE INDEX IF NOT EXISTS idx_financial_events_user_date ON public.financial_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_events_account ON public.financial_events(account_id);
CREATE INDEX IF NOT EXISTS idx_account_entries_account ON public.account_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_person ON public.loans(user_id, person_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due ON public.tasks(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_study_topics_subject ON public.study_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Helper RLS policy macro (standard auth.uid() check)
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own folders" ON public.folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tags" ON public.tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own saved items" ON public.saved_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own saved item tags" ON public.saved_item_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM public.saved_items WHERE saved_items.id = saved_item_tags.saved_item_id AND saved_items.user_id = auth.uid())
);
CREATE POLICY "Users can manage their own financial accounts" ON public.financial_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transaction categories" ON public.transaction_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own people" ON public.people FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own loans" ON public.loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own financial events" ON public.financial_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own account entries" ON public.account_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subjects" ON public.subjects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own study topics" ON public.study_topics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own study notes" ON public.study_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own wishlist items" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own calendar events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own audit events" ON public.audit_events FOR SELECT USING (auth.uid() = user_id);
