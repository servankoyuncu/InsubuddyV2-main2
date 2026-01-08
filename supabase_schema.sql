-- InsuBuddy Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Policies Table
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  type TEXT NOT NULL,
  premium TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  coverage TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'ok',
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  file_data TEXT, -- Base64 encoded file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valuable Items Table
CREATE TABLE IF NOT EXISTS valuable_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  purchase_date DATE,
  image_name TEXT,
  image_type TEXT,
  image_size INTEGER,
  image_data TEXT, -- Base64 encoded image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications JSONB DEFAULT '{"enabled": true, "reminderDays": 30}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Insurances Table
CREATE TABLE IF NOT EXISTS partner_insurances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  affiliate_link TEXT,
  features TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, published
  display_order INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Snapshots Table
CREATE TABLE IF NOT EXISTS financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  total_annual NUMERIC NOT NULL,
  total_monthly NUMERIC NOT NULL,
  by_category JSONB DEFAULT '{}',
  by_company JSONB DEFAULT '{}',
  policy_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_limit NUMERIC DEFAULT 0,
  annual_limit NUMERIC DEFAULT 0,
  alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_expiry_date ON policies(expiry_date);
CREATE INDEX IF NOT EXISTS idx_valuable_items_user_id ON valuable_items(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_user_month ON financial_snapshots(user_id, month);
CREATE INDEX IF NOT EXISTS idx_partner_insurances_status ON partner_insurances(status, display_order);

-- Row Level Security (RLS) Policies

-- Policies Table RLS
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own policies" ON policies;
CREATE POLICY "Users can view own policies"
  ON policies FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own policies" ON policies;
CREATE POLICY "Users can insert own policies"
  ON policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own policies" ON policies;
CREATE POLICY "Users can update own policies"
  ON policies FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own policies" ON policies;
CREATE POLICY "Users can delete own policies"
  ON policies FOR DELETE
  USING (auth.uid() = user_id);

-- Valuable Items Table RLS
ALTER TABLE valuable_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own items" ON valuable_items;
CREATE POLICY "Users can view own items"
  ON valuable_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own items" ON valuable_items;
CREATE POLICY "Users can insert own items"
  ON valuable_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own items" ON valuable_items;
CREATE POLICY "Users can update own items"
  ON valuable_items FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own items" ON valuable_items;
CREATE POLICY "Users can delete own items"
  ON valuable_items FOR DELETE
  USING (auth.uid() = user_id);

-- User Settings Table RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Financial Snapshots Table RLS
ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own snapshots" ON financial_snapshots;
CREATE POLICY "Users can view own snapshots"
  ON financial_snapshots FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own snapshots" ON financial_snapshots;
CREATE POLICY "Users can insert own snapshots"
  ON financial_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own snapshots" ON financial_snapshots;
CREATE POLICY "Users can update own snapshots"
  ON financial_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

-- Budgets Table RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own budget" ON budgets;
CREATE POLICY "Users can view own budget"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own budget" ON budgets;
CREATE POLICY "Users can insert own budget"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own budget" ON budgets;
CREATE POLICY "Users can update own budget"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin Notifications - Public read, admin write
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active notifications" ON admin_notifications;
CREATE POLICY "Anyone can view active notifications"
  ON admin_notifications FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins can manage notifications" ON admin_notifications;
CREATE POLICY "Admins can manage notifications"
  ON admin_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Partner Insurances - Public read published, admin manage
ALTER TABLE partner_insurances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published partners" ON partner_insurances;
CREATE POLICY "Anyone can view published partners"
  ON partner_insurances FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage partners" ON partner_insurances;
CREATE POLICY "Admins can manage partners"
  ON partner_insurances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Admins Table RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own admin status" ON admins;
CREATE POLICY "Users can view own admin status"
  ON admins FOR SELECT
  USING (auth.uid() = id);

-- Functions for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON admin_notifications;
CREATE TRIGGER update_admin_notifications_updated_at
  BEFORE UPDATE ON admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_insurances_updated_at ON partner_insurances;
CREATE TRIGGER update_partner_insurances_updated_at
  BEFORE UPDATE ON partner_insurances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_snapshots_updated_at ON financial_snapshots;
CREATE TRIGGER update_financial_snapshots_updated_at
  BEFORE UPDATE ON financial_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
