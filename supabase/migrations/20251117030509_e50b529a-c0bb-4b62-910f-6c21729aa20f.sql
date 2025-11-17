-- Fix search_path for new functions
DROP FUNCTION IF EXISTS public.complete_mission(UUID, UUID);
DROP FUNCTION IF EXISTS public.update_wallet_balance(UUID, TEXT, NUMERIC, TEXT, TEXT);

-- Recreate complete_mission with proper search_path
CREATE OR REPLACE FUNCTION public.complete_mission(
  p_user_id UUID,
  p_mission_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission RECORD;
  v_token_id UUID;
  v_result JSONB;
BEGIN
  SELECT * INTO v_mission FROM missions WHERE id = p_mission_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found or inactive';
  END IF;
  
  UPDATE user_missions
  SET status = 'completed',
      progress_percent = 100,
      completed_at = now()
  WHERE user_id = p_user_id AND mission_id = p_mission_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User mission not found or already completed';
  END IF;
  
  IF v_mission.xp_reward > 0 THEN
    PERFORM award_xp(p_user_id, v_mission.xp_reward, 'mission_completion', p_mission_id, v_mission.title);
  END IF;
  
  IF v_mission.coin_reward > 0 THEN
    SELECT id INTO v_token_id FROM tokens WHERE symbol = 'NGN' LIMIT 1;
    
    IF v_token_id IS NOT NULL THEN
      INSERT INTO user_wallets (user_id, token_id, balance)
      VALUES (p_user_id, v_token_id, v_mission.coin_reward)
      ON CONFLICT (user_id, token_id)
      DO UPDATE SET balance = user_wallets.balance + v_mission.coin_reward,
                    updated_at = now();
      
      INSERT INTO transactions (user_id, token_id, amount, transaction_type, reference_id, description)
      VALUES (p_user_id, v_token_id, v_mission.coin_reward, 'mission_reward', p_mission_id, v_mission.title);
    END IF;
  END IF;
  
  INSERT INTO user_activities (user_id, activity_type, title, description, metadata)
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

-- Recreate update_wallet_balance with proper search_path
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_token_symbol TEXT,
  p_amount NUMERIC,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id UUID;
  v_new_balance NUMERIC;
BEGIN
  SELECT id INTO v_token_id FROM tokens WHERE symbol = p_token_symbol AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token not found or inactive';
  END IF;
  
  INSERT INTO user_wallets (user_id, token_id, balance)
  VALUES (p_user_id, v_token_id, p_amount)
  ON CONFLICT (user_id, token_id)
  DO UPDATE SET balance = user_wallets.balance + p_amount,
                updated_at = now()
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO transactions (user_id, token_id, amount, transaction_type, description)
  VALUES (p_user_id, v_token_id, p_amount, p_transaction_type, p_description);
  
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;