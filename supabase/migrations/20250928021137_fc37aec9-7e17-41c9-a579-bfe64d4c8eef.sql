-- Criar função RPC para processar compra de presentes de forma atômica
CREATE OR REPLACE FUNCTION public.process_gift_purchase(
  p_buyer_id uuid,
  p_creator_id uuid,
  p_media_id uuid,
  p_credit_price integer,
  p_media_title text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  buyer_credits INTEGER;
  creator_credits INTEGER;
  creator_share INTEGER;
  result JSON;
BEGIN
  -- Verificar se o comprador tem créditos suficientes
  SELECT credits INTO buyer_credits 
  FROM profiles 
  WHERE user_id = p_buyer_id;
  
  IF buyer_credits IS NULL OR buyer_credits < p_credit_price THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Créditos insuficientes'
    );
  END IF;
  
  -- Calcular comissão do criador (70%)
  creator_share := FLOOR(p_credit_price * 0.7);
  
  -- Deduzir créditos do comprador
  UPDATE profiles 
  SET credits = credits - p_credit_price, updated_at = now()
  WHERE user_id = p_buyer_id;
  
  -- Creditar o criador se existir
  IF p_creator_id IS NOT NULL THEN
    UPDATE profiles 
    SET credits = credits + creator_share, updated_at = now()
    WHERE user_id = p_creator_id;
    
    -- Criar notificação para o criador
    INSERT INTO notifications (user_id, type, title, message, credits_amount)
    VALUES (
      p_creator_id,
      'gift_received',
      '🎁 Presente Recebido!',
      'Você recebeu ' || creator_share || ' créditos por ' || p_media_title || '!',
      creator_share
    );
  END IF;
  
  -- Desbloquear mídia para o comprador
  INSERT INTO user_unlocks (
    user_id, media_id, unlock_type, expires_at, credits_spent
  ) VALUES (
    p_buyer_id, p_media_id, 'gift_purchase', 
    now() + interval '7 days', p_credit_price
  );
  
  -- Criar notificação para o comprador
  INSERT INTO notifications (user_id, type, title, message, credits_amount)
  VALUES (
    p_buyer_id,
    'gift_purchased',
    '✅ Presente Desbloqueado!',
    'Você desbloqueou ' || p_media_title || ' por ' || p_credit_price || ' créditos!',
    -p_credit_price
  );
  
  RETURN json_build_object(
    'success', true,
    'creator_credits', creator_share,
    'credits_spent', p_credit_price
  );
END;
$$;