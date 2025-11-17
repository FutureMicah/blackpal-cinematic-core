-- Create missions table
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  coin_reward NUMERIC NOT NULL DEFAULT 0,
  est_minutes INTEGER NOT NULL DEFAULT 5,
  mission_type TEXT NOT NULL DEFAULT 'daily',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_missions table
CREATE TABLE IF NOT EXISTS public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  progress_percent NUMERIC DEFAULT 0,
  completed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  decimals INTEGER DEFAULT 8,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  locked_balance NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.tokens(id),
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON public.user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_status ON public.user_missions(status);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for missions
CREATE POLICY "Everyone can view active missions" ON public.missions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage missions" ON public.missions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_missions
CREATE POLICY "Users can view their own missions" ON public.user_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own missions" ON public.user_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions" ON public.user_missions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all missions" ON public.user_missions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for tokens
CREATE POLICY "Everyone can view active tokens" ON public.tokens
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tokens" ON public.tokens
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallets" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_activities
CREATE POLICY "Users can view their own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" ON public.user_activities
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to complete mission and award rewards
CREATE OR REPLACE FUNCTION public.complete_mission(
  p_user_id UUID,
  p_mission_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mission RECORD;
  v_token_id UUID;
  v_result JSONB;
BEGIN
  -- Get mission details
  SELECT * INTO v_mission FROM public.missions WHERE id = p_mission_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found or inactive';
  END IF;
  
  -- Update user_mission status
  UPDATE public.user_missions
  SET status = 'completed',
      progress_percent = 100,
      completed_at = now()
  WHERE user_id = p_user_id AND mission_id = p_mission_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User mission not found or already completed';
  END IF;
  
  -- Award XP using existing function
  IF v_mission.xp_reward > 0 THEN
    PERFORM award_xp(p_user_id, v_mission.xp_reward, 'mission_completion', p_mission_id, v_mission.title);
  END IF;
  
  -- Award coins (NGN token)
  IF v_mission.coin_reward > 0 THEN
    SELECT id INTO v_token_id FROM public.tokens WHERE symbol = 'NGN' LIMIT 1;
    
    IF v_token_id IS NOT NULL THEN
      -- Update or insert wallet balance
      INSERT INTO public.user_wallets (user_id, token_id, balance)
      VALUES (p_user_id, v_token_id, v_mission.coin_reward)
      ON CONFLICT (user_id, token_id)
      DO UPDATE SET balance = user_wallets.balance + v_mission.coin_reward,
                    updated_at = now();
      
      -- Record transaction
      INSERT INTO public.transactions (user_id, token_id, amount, transaction_type, reference_id, description)
      VALUES (p_user_id, v_token_id, v_mission.coin_reward, 'mission_reward', p_mission_id, v_mission.title);
    END IF;
  END IF;
  
  -- Log activity
  INSERT INTO public.user_activities (user_id, activity_type, title, description, metadata)
  VALUES (
    p_user_id,
    'mission_completed',
    'Mission Completed',
    v_mission.title,
    jsonb_build_object('mission_id', p_mission_id, 'xp', v_mission.xp_reward, 'coins', v_mission.coin_reward)
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'xp_awarded', v_mission.xp_reward,
    'coins_awarded', v_mission.coin_reward
  );
  
  RETURN v_result;
END;
$$;

-- Function to update wallet balance (server-side only)
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_token_symbol TEXT,
  p_amount NUMERIC,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_id UUID;
  v_new_balance NUMERIC;
BEGIN
  -- Get token ID
  SELECT id INTO v_token_id FROM public.tokens WHERE symbol = p_token_symbol AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token not found or inactive';
  END IF;
  
  -- Update wallet balance
  INSERT INTO public.user_wallets (user_id, token_id, balance)
  VALUES (p_user_id, v_token_id, p_amount)
  ON CONFLICT (user_id, token_id)
  DO UPDATE SET balance = user_wallets.balance + p_amount,
                updated_at = now()
  RETURNING balance INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO public.transactions (user_id, token_id, amount, transaction_type, description)
  VALUES (p_user_id, v_token_id, p_amount, p_transaction_type, p_description);
  
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Enable realtime for activity feed and missions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Insert default tokens
INSERT INTO public.tokens (symbol, name, decimals, is_active)
VALUES 
  ('NGN', 'Nigerian Naira', 2, true),
  ('BTC', 'Bitcoin', 8, true),
  ('ETH', 'Ethereum', 18, true),
  ('USDT', 'Tether USD', 6, true)
ON CONFLICT (symbol) DO NOTHING;

-- Insert sample missions
INSERT INTO public.missions (title, description, xp_reward, coin_reward, est_minutes, mission_type, order_index)
VALUES
  ('Complete First Lesson', 'Watch your first trading lesson to completion', 50, 100, 15, 'daily', 1),
  ('Daily Login Streak', 'Maintain your login streak for today', 25, 50, 1, 'daily', 2),
  ('Practice Trading', 'Execute 3 practice trades in demo mode', 75, 150, 20, 'daily', 3),
  ('Quiz Master', 'Score 80% or higher on any quiz', 100, 200, 10, 'daily', 4),
  ('Market Analysis', 'Review and analyze today''s market trends', 60, 120, 12, 'daily', 5)
ON CONFLICT DO NOTHING;