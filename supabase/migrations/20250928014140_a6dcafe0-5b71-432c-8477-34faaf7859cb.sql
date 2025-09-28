-- Create a trigger function to auto-create posts when media is added to vitrine
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
        WHEN NEW.price IS NOT NULL AND jsonb_typeof(NEW.price) = 'object' AND (NEW.price->>'creditPrice') IS NOT NULL 
        THEN (NEW.price->>'creditPrice')::integer
        ELSE 0
      END,
      NEW.blur_settings,
      COALESCE(NEW.description, 'Nova mídia na vitrine')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create posts when media items are inserted
DROP TRIGGER IF EXISTS trigger_create_post_from_media ON public.media_items;
CREATE TRIGGER trigger_create_post_from_media
  AFTER INSERT ON public.media_items
  FOR EACH ROW
  EXECUTE FUNCTION public.create_post_from_media();