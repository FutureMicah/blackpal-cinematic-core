-- Segment 1 Infrastructure: Admin Settings, Premium, Widgets, Demo Mode

-- Admin UI Settings (NCF - Non-Code Features)
CREATE TABLE IF NOT EXISTS admin_ui_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  category text NOT NULL, -- 'theme_tokens', 'layout', 'features', 'monetization'
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Premium Plans & Tiers
CREATE TABLE IF NOT EXISTS premium_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'Free', 'Elite', etc.
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  price_ngn numeric(10,2) NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'yearly', -- 'monthly', 'yearly', 'lifetime'
  features jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of feature keys
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Premium Purchases
CREATE TABLE IF NOT EXISTS premium_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES premium_plans(id),
  amount_paid numeric(10,2) NOT NULL,
  currency text NOT NULL, -- 'USD', 'NGN'
  payment_method text, -- 'card', 'wallet', 'bank_transfer'
  payment_reference text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Layouts (personalized dashboard)
CREATE TABLE IF NOT EXISTS user_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Widget Registry
CREATE TABLE IF NOT EXISTS widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL, -- 'portfolio_snapshot', 'growth_chart', etc.
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'core', 'premium', 'analytics'
  is_premium boolean DEFAULT false,
  data_endpoint text, -- '/api/user/{id}/portfolio'
  refresh_interval integer DEFAULT 30, -- seconds
  default_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  cohort_filter jsonb, -- target specific user groups
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- NCF Action Logs (audit trail for admin actions)
CREATE TABLE IF NOT EXISTS ncf_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL, -- 'theme_update', 'widget_config', 'plan_change'
  table_name text,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  can_undo boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Demo Mode Configuration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo_mode boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_balance numeric(15,2) DEFAULT 200000.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'unverified'; -- 'unverified', 'pending', 'verified', 'rejected'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_completed_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_goal text; -- 'trade', 'save', 'learn', 'test'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency_preference text DEFAULT 'NGN';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Africa/Lagos';

-- Enable RLS
ALTER TABLE admin_ui_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncf_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin UI Settings
CREATE POLICY "Admins can manage UI settings" ON admin_ui_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view UI settings" ON admin_ui_settings FOR SELECT USING (true);

-- RLS Policies: Premium Plans
CREATE POLICY "Admins can manage plans" ON premium_plans FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view active plans" ON premium_plans FOR SELECT USING (is_active = true);

-- RLS Policies: Premium Purchases
CREATE POLICY "Users can view own purchases" ON premium_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON premium_purchases FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert purchases" ON premium_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies: User Layouts
CREATE POLICY "Users can manage own layout" ON user_layouts FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: Widgets
CREATE POLICY "Admins can manage widgets" ON widgets FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view active widgets" ON widgets FOR SELECT USING (is_active = true);

-- RLS Policies: Feature Flags
CREATE POLICY "Admins can manage flags" ON feature_flags FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view flags" ON feature_flags FOR SELECT USING (true);

-- RLS Policies: NCF Action Logs
CREATE POLICY "Admins can view logs" ON ncf_action_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert logs" ON ncf_action_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_admin_ui_settings_key ON admin_ui_settings(key);
CREATE INDEX idx_admin_ui_settings_category ON admin_ui_settings(category);
CREATE INDEX idx_premium_purchases_user ON premium_purchases(user_id);
CREATE INDEX idx_premium_purchases_active ON premium_purchases(is_active);
CREATE INDEX idx_user_layouts_user ON user_layouts(user_id);
CREATE INDEX idx_widgets_key ON widgets(key);
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_ncf_logs_admin ON ncf_action_logs(admin_user_id);
CREATE INDEX idx_ncf_logs_created ON ncf_action_logs(created_at DESC);

-- Insert Default Premium Plans
INSERT INTO premium_plans (name, price_usd, price_ngn, billing_period, features, order_index) VALUES
('Free', 0, 0, 'lifetime', '["basic_dashboard", "portfolio_view", "market_ticker", "academy_access"]'::jsonb, 1),
('Elite', 200, 80000, 'yearly', '["all_free_features", "pro_order_book", "copy_trade", "launchpad_access", "advanced_analytics", "premium_themes", "priority_support"]'::jsonb, 2);

-- Insert Default Widgets
INSERT INTO widgets (key, name, description, category, is_premium, data_endpoint, order_index) VALUES
('portfolio_snapshot', 'Portfolio Snapshot', 'Total balance and quick actions', 'core', false, '/api/user/{id}/portfolio', 1),
('growth_chart', 'Investment Growth Chart', 'Interactive portfolio growth chart', 'core', false, '/api/user/{id}/growth', 2),
('wallets_carousel', 'Wallets Carousel', 'Token balances with quick actions', 'core', false, '/api/user/{id}/wallets', 3),
('quick_actions', 'Quick Actions', 'Deposit, Withdraw, Trade shortcuts', 'core', false, null, 4),
('market_ticker', 'Market Ticker', 'Live price updates', 'core', false, '/ws/market-ticker', 5),
('leaderboard_snapshot', 'Leaderboard', 'Top traders this week', 'core', false, '/api/leaderboard', 6),
('activity_feed', 'Activity Feed', 'Recent transactions and alerts', 'core', false, '/api/user/{id}/activity', 7),
('ai_advisor', 'AI Advisor', 'Smart trading suggestions', 'core', false, '/api/user/{id}/advisor', 8),
('pro_order_book', 'Pro Order Book', 'Advanced trading with depth chart', 'premium', true, '/api/orderbook', 9),
('copy_trade', 'Copy Trade', 'Follow pro traders', 'premium', true, '/api/copy-trade', 10),
('launchpad_widget', 'Launchpad Access', 'Whitelist and allocations', 'premium', true, '/api/launchpad', 11),
('advanced_analytics', 'Advanced Analytics', 'Cohort analysis and tax reports', 'premium', true, '/api/analytics', 12);

-- Insert Default Theme Tokens
INSERT INTO admin_ui_settings (key, value, category) VALUES
('theme_tokens', '{
  "primary_bg": "#0a0a0f",
  "surface": "rgba(17, 24, 39, 0.8)",
  "accent_gradient": ["#06b6d4", "#8b5cf6"],
  "premium_gold": "#fbbf24",
  "glass_blur": 16,
  "font_body": "Inter, system-ui, sans-serif",
  "font_head": "Space Grotesk, sans-serif",
  "floating_coins": true,
  "coin_count": {"desktop": 30, "mobile": 15},
  "motion_intensity": 80,
  "glass_opacity": 0.8,
  "spacing_scale": [4, 8, 12, 16, 20, 24, 32, 48, 64],
  "border_radius": {"sm": 8, "md": 16, "lg": 24}
}'::jsonb, 'theme_tokens'),
('demo_mode_config', '{
  "enabled": true,
  "initial_balance": 200000,
  "demo_only_features": ["simulated_trading", "test_deposits"],
  "show_demo_ribbon": true
}'::jsonb, 'features'),
('kyc_rules', '{
  "required_for": ["withdrawals", "launchpad", "premium_trades"],
  "auto_verify_threshold": 0.95,
  "docs_by_country": {
    "NG": ["national_id", "passport"],
    "default": ["government_id"]
  }
}'::jsonb, 'features');

-- Triggers for updated_at
CREATE TRIGGER update_admin_ui_settings_updated_at BEFORE UPDATE ON admin_ui_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_premium_plans_updated_at BEFORE UPDATE ON premium_plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_user_layouts_updated_at BEFORE UPDATE ON user_layouts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();