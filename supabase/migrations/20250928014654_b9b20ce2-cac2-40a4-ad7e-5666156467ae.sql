-- Migrate existing media_items to posts table for vitrine posts
INSERT INTO public.posts (
  user_id,
  post_type,
  media_type,
  media_url,
  is_blurred,
  is_locked,
  price,
  blur_settings,
  content,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'vitrine' as post_type,
  type as media_type,
  CASE 
    WHEN storage_path IS NOT NULL THEN 
      'https://lgstvoixptdcqohsxkvo.supabase.co/storage/v1/object/public/media/' || storage_path
    ELSE NULL
  END as media_url,
  is_blurred,
  is_locked,
  CASE 
    WHEN price IS NOT NULL AND price != '' THEN 
      COALESCE((price::jsonb->>'creditPrice')::integer, 0)
    ELSE 0
  END as price,
  blur_settings,
  COALESCE(description, 'Mídia da vitrine') as content,
  created_at,
  updated_at
FROM public.media_items 
WHERE type IN ('image', 'video')
  AND NOT EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.user_id = media_items.user_id 
    AND posts.media_url = 'https://lgstvoixptdcqohsxkvo.supabase.co/storage/v1/object/public/media/' || media_items.storage_path
  );