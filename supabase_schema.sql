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

-- =====================================================
-- ADVISORS TABLE - Versicherungsberater
-- =====================================================

-- Advisors Table
CREATE TABLE IF NOT EXISTS advisors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT, -- z.B. "Versicherungsberater", "Senior Consultant"
  company TEXT, -- z.B. "InsuBuddy", "Freiberuflich"
  photo TEXT, -- URL zum Profilbild
  bio TEXT, -- Kurze Beschreibung
  -- Fachgebiete
  topics TEXT[] DEFAULT '{}', -- Hauptthemen: Sachversicherung, Auto, KMU, Leben, Krankenkasse
  specializations TEXT[] DEFAULT '{}', -- Detaillierte Spezialisierungen
  -- Standort
  city TEXT, -- z.B. "Zürich", "Bern"
  canton TEXT, -- z.B. "ZH", "BE"
  radius_km INTEGER DEFAULT 50, -- Einzugsgebiet in km
  -- Kontakt
  email TEXT,
  phone TEXT, -- Format: +41 79 123 45 67
  whatsapp TEXT, -- WhatsApp Nummer (kann gleich wie phone sein)
  languages TEXT[] DEFAULT '{"Deutsch"}', -- Sprachen
  -- Bewertungen
  rating NUMERIC DEFAULT 0, -- Durchschnitt aus Reviews (0 = noch keine)
  reviews_count INTEGER DEFAULT 0,
  -- Status
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false, -- Hervorgehobener Berater
  verified BOOLEAN DEFAULT false, -- Verifizierter Berater
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADVISOR REVIEWS TABLE - Bewertungen
-- =====================================================

CREATE TABLE IF NOT EXISTS advisor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  -- Was wurde bewertet
  topics_consulted TEXT[] DEFAULT '{}', -- Welche Themen wurden beraten
  would_recommend BOOLEAN DEFAULT true,
  -- Moderation
  is_approved BOOLEAN DEFAULT true, -- Admin kann Reviews moderieren
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ein User kann einen Berater nur einmal bewerten
  UNIQUE(advisor_id, user_id)
);

-- Index für Reviews
CREATE INDEX IF NOT EXISTS idx_advisor_reviews_advisor ON advisor_reviews(advisor_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_advisor_reviews_user ON advisor_reviews(user_id);

-- Reviews RLS
ALTER TABLE advisor_reviews ENABLE ROW LEVEL SECURITY;

-- Jeder kann genehmigte Reviews lesen
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON advisor_reviews;
CREATE POLICY "Anyone can view approved reviews"
  ON advisor_reviews FOR SELECT
  USING (is_approved = true);

-- User können eigene Reviews erstellen
DROP POLICY IF EXISTS "Users can create reviews" ON advisor_reviews;
CREATE POLICY "Users can create reviews"
  ON advisor_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User können eigene Reviews bearbeiten
DROP POLICY IF EXISTS "Users can update own reviews" ON advisor_reviews;
CREATE POLICY "Users can update own reviews"
  ON advisor_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- User können eigene Reviews löschen
DROP POLICY IF EXISTS "Users can delete own reviews" ON advisor_reviews;
CREATE POLICY "Users can delete own reviews"
  ON advisor_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Admins können alle Reviews verwalten
DROP POLICY IF EXISTS "Admins can manage all reviews" ON advisor_reviews;
CREATE POLICY "Admins can manage all reviews"
  ON advisor_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Trigger für updated_at
DROP TRIGGER IF EXISTS update_advisor_reviews_updated_at ON advisor_reviews;
CREATE TRIGGER update_advisor_reviews_updated_at
  BEFORE UPDATE ON advisor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function zum Aktualisieren der Advisor-Bewertung
CREATE OR REPLACE FUNCTION update_advisor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE advisors
  SET
    rating = COALESCE((
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM advisor_reviews
      WHERE advisor_id = COALESCE(NEW.advisor_id, OLD.advisor_id)
      AND is_approved = true
    ), 0),
    reviews_count = (
      SELECT COUNT(*)
      FROM advisor_reviews
      WHERE advisor_id = COALESCE(NEW.advisor_id, OLD.advisor_id)
      AND is_approved = true
    )
  WHERE id = COALESCE(NEW.advisor_id, OLD.advisor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für automatische Rating-Updates
DROP TRIGGER IF EXISTS trigger_update_advisor_rating ON advisor_reviews;
CREATE TRIGGER trigger_update_advisor_rating
  AFTER INSERT OR UPDATE OR DELETE ON advisor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_advisor_rating();

-- Index für Advisors
CREATE INDEX IF NOT EXISTS idx_advisors_active ON advisors(active, featured, display_order);

-- Advisors Table RLS
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active advisors" ON advisors;
CREATE POLICY "Anyone can view active advisors"
  ON advisors FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins can manage advisors" ON advisors;
CREATE POLICY "Admins can manage advisors"
  ON advisors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Trigger für updated_at
DROP TRIGGER IF EXISTS update_advisors_updated_at ON advisors;
CREATE TRIGGER update_advisors_updated_at
  BEFORE UPDATE ON advisors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADMIN STATS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_policies', (SELECT COUNT(*) FROM policies),
    'total_partners', (SELECT COUNT(*) FROM partner_insurances WHERE status = 'published'),
    'active_notifications', (SELECT COUNT(*) FROM admin_notifications WHERE active = true),
    'total_advisors', (SELECT COUNT(*) FROM advisors WHERE active = true),
    'total_reviews', (SELECT COUNT(*) FROM advisor_reviews WHERE is_approved = true),
    'total_referrals', (SELECT COUNT(*) FROM referrals),
    'successful_referrals', (SELECT COUNT(*) FROM referrals WHERE status = 'signed_up')
  ) INTO result;

  RETURN result;
END;
$$;

-- =====================================================
-- SHARED POLICIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS shared_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  policy_ids UUID[] NOT NULL DEFAULT '{}',
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE shared_policies ENABLE ROW LEVEL SECURITY;

-- User kann eigene geteilten Policen sehen und erstellen
CREATE POLICY "Users can insert own shared policies"
  ON shared_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own shared policies"
  ON shared_policies FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger für updated_at
DROP TRIGGER IF EXISTS update_shared_policies_updated_at ON shared_policies;
CREATE TRIGGER update_shared_policies_updated_at
  BEFORE UPDATE ON shared_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLICY SHARES (Temporäre Sharing-Links)
-- =====================================================

CREATE TABLE IF NOT EXISTS policy_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code VARCHAR(8) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_ids UUID[] NOT NULL,
  policy_data JSONB NOT NULL,
  advisor_name TEXT,
  message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_policy_shares_code ON policy_shares(share_code);
CREATE INDEX IF NOT EXISTS idx_policy_shares_expires ON policy_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_policy_shares_user ON policy_shares(user_id);

-- RLS
ALTER TABLE policy_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own shares" ON policy_shares;
CREATE POLICY "Users can create their own shares"
  ON policy_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view non-expired shares" ON policy_shares;
CREATE POLICY "Anyone can view non-expired shares"
  ON policy_shares FOR SELECT
  TO anon, authenticated
  USING (expires_at > NOW());

DROP POLICY IF EXISTS "Anyone can update view_count on non-expired shares" ON policy_shares;
CREATE POLICY "Anyone can update view_count on non-expired shares"
  ON policy_shares FOR UPDATE
  TO anon, authenticated
  USING (expires_at > NOW())
  WITH CHECK (expires_at > NOW());

DROP POLICY IF EXISTS "Users can delete their own shares" ON policy_shares;
CREATE POLICY "Users can delete their own shares"
  ON policy_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- SUPPORT TICKETS TABLE - Integriertes Ticketsystem
-- =====================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- User können eigene Tickets erstellen
DROP POLICY IF EXISTS "Users can create own tickets" ON support_tickets;
CREATE POLICY "Users can create own tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User können eigene Tickets lesen
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins können alle Tickets lesen und verwalten
DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;
CREATE POLICY "Admins can manage all tickets"
  ON support_tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Trigger für updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- REFERRALS TABLE (Empfehlungssystem)
-- =====================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(8) NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- RLS aktivieren
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- User können eigene Referrals sehen
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- User können Referrals erstellen
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- Jeder kann Referral-Code validieren (für Register-Seite)
DROP POLICY IF EXISTS "Anyone can validate referral code" ON referrals;
CREATE POLICY "Anyone can validate referral code"
  ON referrals FOR SELECT
  USING (true);

-- Jeder kann Referral aktualisieren (für Tracking nach Registrierung)
DROP POLICY IF EXISTS "Anyone can update referral on signup" ON referrals;
CREATE POLICY "Anyone can update referral on signup"
  ON referrals FOR UPDATE
  USING (true);

-- Admins koennen alle Referrals sehen und verwalten
DROP POLICY IF EXISTS "Admins can manage all referrals" ON referrals;
CREATE POLICY "Admins can manage all referrals"
  ON referrals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- ============================================================
-- PUSH NOTIFICATIONS
-- ============================================================

-- Device Push Tokens (iOS APNs Tokens pro User)
CREATE TABLE IF NOT EXISTS device_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE device_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User kann eigene Tokens verwalten" ON device_push_tokens;
CREATE POLICY "User kann eigene Tokens verwalten"
  ON device_push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service Role liest alle Tokens" ON device_push_tokens;
CREATE POLICY "Service Role liest alle Tokens"
  ON device_push_tokens FOR SELECT
  USING (true);

-- Log fuer gesendete Push-Notifications (fuer Admin-History)
CREATE TABLE IF NOT EXISTS push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins koennen Push Log verwalten" ON push_notification_log;
CREATE POLICY "Admins koennen Push Log verwalten"
  ON push_notification_log FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
  );
