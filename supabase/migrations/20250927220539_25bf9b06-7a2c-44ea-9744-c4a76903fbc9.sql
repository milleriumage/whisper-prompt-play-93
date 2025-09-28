-- Add gift_data column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS gift_data JSONB;