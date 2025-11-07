-- Migration: Add Admin Panel and User Plans
-- Date: 2025-11-07
-- Description: Adds admin functionality and user subscription plans

-- ============================================
-- 1. Create user_profiles table
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 2. Enable RLS on user_profiles
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON user_profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Admins can delete any profile
CREATE POLICY "Admins can delete any profile"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 3. Create audit_logs table for admin actions
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'delete_user', 'delete_site', 'update_plan', etc.
  target_type TEXT NOT NULL, -- 'user', 'site'
  target_id UUID NOT NULL,
  details JSONB, -- Additional context about the action
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON audit_logs;

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 4. Create function to sync user profiles
-- ============================================

-- This function automatically creates a user_profile when a new user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, plan, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================
-- 5. Create admin helper functions
-- ============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to get all users with their site counts (admin only)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  plan TEXT,
  is_admin BOOLEAN,
  site_count BIGINT,
  total_pageviews BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin only.';
  END IF;

  RETURN QUERY
  SELECT
    up.id as user_id,
    up.email,
    up.plan,
    up.is_admin,
    COUNT(DISTINCT s.id) as site_count,
    COUNT(p.id) as total_pageviews,
    up.created_at
  FROM user_profiles up
  LEFT JOIN sites s ON s.user_id = up.id
  LEFT JOIN pageviews p ON p.site_id = s.id
  GROUP BY up.id, up.email, up.plan, up.is_admin, up.created_at
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system stats (admin only)
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_sites BIGINT,
  total_pageviews BIGINT,
  total_cod_conversions BIGINT,
  free_users BIGINT,
  pro_users BIGINT,
  enterprise_users BIGINT
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin only.';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_profiles) as total_users,
    (SELECT COUNT(*) FROM sites) as total_sites,
    (SELECT COUNT(*) FROM pageviews) as total_pageviews,
    (SELECT COUNT(*) FROM cod_conversions WHERE purchased = true) as total_cod_conversions,
    (SELECT COUNT(*) FROM user_profiles WHERE plan = 'free') as free_users,
    (SELECT COUNT(*) FROM user_profiles WHERE plan = 'pro') as pro_users,
    (SELECT COUNT(*) FROM user_profiles WHERE plan = 'enterprise') as enterprise_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Backfill user_profiles for existing users
-- ============================================

-- Insert profiles for all existing auth.users that don't have profiles yet
INSERT INTO user_profiles (id, email, plan, is_admin)
SELECT
  id,
  email,
  'free' as plan,
  false as is_admin
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_stats() TO authenticated;

-- ============================================
-- Migration Complete
-- ============================================

-- IMPORTANT: After running this migration, you need to manually set your first admin:
-- UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';
