-- Payment methods configuration
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  method_type TEXT NOT NULL, -- 'paystack', 'crypto', 'bank_transfer', 'grey_account'
  available_regions TEXT[] NOT NULL, -- ['nigeria', 'africa', 'international']
  config JSONB DEFAULT '{}', -- API keys, wallet addresses, account details
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Country-based pricing
CREATE TABLE country_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  region TEXT NOT NULL, -- 'nigeria', 'africa', 'international'
  currency TEXT NOT NULL,
  student_fee NUMERIC NOT NULL,
  investor_fee NUMERIC NOT NULL,
  allowed_payment_methods TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment transactions (deposits, withdrawals, registrations)
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'registration_fee'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  screenshot_url TEXT,
  payment_reference TEXT,
  payment_proof_verified BOOLEAN DEFAULT false,
  verification_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Withdrawal requests
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  withdrawal_method TEXT NOT NULL,
  destination_address TEXT NOT NULL, -- wallet address or account number
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'rejected'
  admin_notes TEXT,
  transaction_id UUID REFERENCES payment_transactions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Update profiles table with country and payment info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS detected_region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_tier TEXT; -- 'student', 'investor'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registration_payment_id UUID REFERENCES payment_transactions(id);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Everyone can view active payment methods"
  ON payment_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage payment methods"
  ON payment_methods FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for country_pricing
CREATE POLICY "Everyone can view country pricing"
  ON country_pricing FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage country pricing"
  ON country_pricing FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all transactions"
  ON payment_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all withdrawal requests"
  ON withdrawal_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_country_pricing_updated_at
  BEFORE UPDATE ON country_pricing
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert default payment methods
INSERT INTO payment_methods (name, method_type, available_regions, config) VALUES
  ('Paystack', 'paystack', ARRAY['nigeria'], '{"description": "Pay with card or bank transfer via Paystack"}'),
  ('Crypto (USDT)', 'crypto', ARRAY['africa', 'international'], '{"networks": ["ERC20", "TRC20"], "wallet_address": ""}'),
  ('Bank Transfer', 'bank_transfer', ARRAY['nigeria'], '{"account_name": "BlackPAL Academy", "account_number": "", "bank_name": ""}'),
  ('Grey Account', 'grey_account', ARRAY['africa'], '{"username": "", "instructions": "Contact support for grey account details"}');

-- Insert default country pricing (examples)
INSERT INTO country_pricing (country_code, country_name, region, currency, student_fee, investor_fee, allowed_payment_methods) VALUES
  ('NG', 'Nigeria', 'nigeria', 'NGN', 35000, 60000, ARRAY['paystack', 'bank_transfer', 'crypto']),
  ('GH', 'Ghana', 'africa', 'USD', 100, 150, ARRAY['crypto', 'grey_account']),
  ('KE', 'Kenya', 'africa', 'USD', 100, 150, ARRAY['crypto', 'grey_account']),
  ('ZA', 'South Africa', 'africa', 'USD', 100, 150, ARRAY['crypto', 'grey_account']),
  ('US', 'United States', 'international', 'USD', 200, 300, ARRAY['crypto']),
  ('GB', 'United Kingdom', 'international', 'USD', 200, 300, ARRAY['crypto']),
  ('CA', 'Canada', 'international', 'USD', 200, 300, ARRAY['crypto']),
  ('DE', 'Germany', 'international', 'USD', 200, 300, ARRAY['crypto']),
  ('FR', 'France', 'international', 'USD', 200, 300, ARRAY['crypto']),
  ('DEFAULT', 'International', 'international', 'USD', 200, 300, ARRAY['crypto']);