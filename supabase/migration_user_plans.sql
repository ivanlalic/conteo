-- ============================================
-- MIGRATION: USER PLANS
-- Add user subscription plans and limits
-- ============================================

-- Create user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Plan information
  plan_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'business')),

  -- Limits
  sites_limit INT NOT NULL DEFAULT 1,
  events_limit_monthly INT NOT NULL DEFAULT 10000,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_tier ON user_plans(plan_tier);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can insert their own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update their own plan" ON user_plans;

-- Users can view their own plan
CREATE POLICY "Users can view their own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own plan (auto-created on signup)
CREATE POLICY "Users can insert their own plan"
  ON user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own plan
CREATE POLICY "Users can update their own plan"
  ON user_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS update_user_plans_updated_at ON user_plans;
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Get user plan with limits
-- ============================================
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TABLE (
  plan_tier VARCHAR,
  sites_limit INT,
  events_limit_monthly INT,
  current_sites_count BIGINT
) AS $$
  SELECT
    COALESCE(up.plan_tier, 'free') as plan_tier,
    COALESCE(up.sites_limit, 1) as sites_limit,
    COALESCE(up.events_limit_monthly, 10000) as events_limit_monthly,
    COALESCE(COUNT(s.id), 0) as current_sites_count
  FROM auth.users u
  LEFT JOIN user_plans up ON u.id = up.user_id
  LEFT JOIN sites s ON u.id = s.user_id
  WHERE u.id = user_uuid
  GROUP BY up.plan_tier, up.sites_limit, up.events_limit_monthly;
$$ LANGUAGE SQL STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_plan(UUID) TO authenticated;

-- ============================================
-- HELPER FUNCTION: Get monthly events count for a user
-- ============================================
CREATE OR REPLACE FUNCTION get_user_monthly_events(user_uuid UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*)
  FROM pageviews p
  WHERE p.site_id IN (
    SELECT id FROM sites WHERE user_id = user_uuid
  )
  AND p.timestamp >= DATE_TRUNC('month', NOW())
  AND p.timestamp < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
$$ LANGUAGE SQL STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_monthly_events(UUID) TO authenticated;

-- ============================================
-- TRIGGER: Auto-create user plan on signup
-- This ensures every new user gets a default free plan
-- ============================================
CREATE OR REPLACE FUNCTION create_default_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_plans (user_id, plan_tier, sites_limit, events_limit_monthly)
  VALUES (NEW.id, 'free', 1, 10000)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_plan();

-- ============================================
-- BACKFILL: Create plans for existing users
-- ============================================
INSERT INTO user_plans (user_id, plan_tier, sites_limit, events_limit_monthly)
SELECT
  id as user_id,
  'free' as plan_tier,
  1 as sites_limit,
  10000 as events_limit_monthly
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_plans)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE user_plans IS 'User subscription plans and usage limits';
COMMENT ON COLUMN user_plans.plan_tier IS 'Plan type: free, pro, or business';
COMMENT ON COLUMN user_plans.sites_limit IS 'Maximum number of sites allowed';
COMMENT ON COLUMN user_plans.events_limit_monthly IS 'Maximum pageviews/events per month';
