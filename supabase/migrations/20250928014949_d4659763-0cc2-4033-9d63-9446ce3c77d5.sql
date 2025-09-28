-- Fix the trigger function to handle text price field correctly
CREATE OR REPLACE FUNCTION public.create_post_from_media()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create posts for media that should appear in feed
  IF NEW.type IN ('image', 'video') THEN
    INSERT INTO public.posts (
      user_id,
      post_type,
      media_type,
      media_url,
      is_blurred,
      is_locked,
      price,
      blur_settings,
      content
    ) VALUES (
      NEW.user_id,
      'vitrine',
      NEW.type,
      CASE 
        WHEN NEW.storage_path IS NOT NULL THEN 
          'https://lgstvoixptdcqohsxkvo.supabase.co/storage/v1/object/public/media/' || NEW.storage_path
        ELSE NULL
      END,
      NEW.is_blurred,
      NEW.is_locked,
      CASE 
        WHEN NEW.price IS NOT NULL AND NEW.price ~ '^[0-9]+$' 
        THEN NEW.price::integer
        ELSE 0
      END,
      NEW.blur_settings,
      COALESCE(NEW.description, 'Nova mídia na vitrine')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix functions that don't have search_path set
CREATE OR REPLACE FUNCTION public.clean_expired_guest_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.guest_profiles 
  WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.clean_expired_unlocks()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.user_unlocks 
  WHERE expires_at < now();
END;
$$;