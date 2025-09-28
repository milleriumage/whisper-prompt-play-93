-- Add new columns to wishlist_items table for enhanced gift display options
ALTER TABLE public.wishlist_items 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'card' CHECK (display_mode IN ('card', 'icon')),
ADD COLUMN IF NOT EXISTS show_thumbnail BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_custom_button BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS button_text TEXT;

-- Create index for better performance on display_mode queries
CREATE INDEX IF NOT EXISTS idx_wishlist_items_display_mode ON public.wishlist_items(display_mode);

-- Update RLS policies to include new columns (policies should already cover all columns by default)
-- No additional RLS policies needed as existing policies cover all columns