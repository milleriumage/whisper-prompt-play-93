-- Create posts table for feed system
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image', 'video', 'audio', 'text'
  post_type TEXT NOT NULL DEFAULT 'feed', -- 'feed', 'vitrine'
  price INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  is_blurred BOOLEAN DEFAULT false,
  blur_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post interactions table
CREATE TABLE public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID,
  guest_session_id TEXT,
  interaction_type TEXT NOT NULL, -- 'like', 'share', 'view', 'purchase'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID,
  guest_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create post purchases table for credit system
CREATE TABLE public.post_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  credits_spent INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post_interactions
CREATE POLICY "Anyone can insert interactions" ON public.post_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view interactions" ON public.post_interactions FOR SELECT USING (true);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can like posts" ON public.post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can remove their own likes" ON public.post_likes FOR DELETE USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND guest_session_id IS NOT NULL)
);

-- RLS Policies for post_purchases
CREATE POLICY "Anyone can insert purchases" ON public.post_purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Buyers can view their purchases" ON public.post_purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Creators can view their sales" ON public.post_purchases FOR SELECT USING (auth.uid() = creator_id);

-- Create functions for post stats
CREATE OR REPLACE FUNCTION public.get_post_likes_count(post_uuid uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COUNT(*)
  FROM public.post_likes
  WHERE post_id = post_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_liked_post(post_uuid uuid, user_uuid uuid DEFAULT NULL, guest_session text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.post_likes
    WHERE post_id = post_uuid
    AND (
      (user_uuid IS NOT NULL AND user_id = user_uuid) OR
      (guest_session IS NOT NULL AND guest_session_id = guest_session)
    )
  );
$function$;