-- Add whisper functionality to messages
ALTER TABLE public.messages 
ADD COLUMN whisper_target_id uuid NULL,
ADD COLUMN is_whisper boolean DEFAULT false;

-- Add index for whisper queries
CREATE INDEX idx_messages_whisper_target ON public.messages(whisper_target_id);

-- Add RLS policy for whispers
DROP POLICY IF EXISTS "Anyone can view all messages for shared chat" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages from their own sessions" ON public.messages;

-- New policy: Users can view public messages OR whispers directed to them OR their own messages
CREATE POLICY "Users can view public messages and whispers"
ON public.messages 
FOR SELECT 
USING (
  (is_whisper = false) OR 
  (is_whisper = true AND (whisper_target_id = auth.uid() OR auth.uid() = user_id))
);

-- Allow anonymous users to view non-whisper messages
CREATE POLICY "Anonymous can view public messages"
ON public.messages 
FOR SELECT 
USING (auth.uid() IS NULL AND is_whisper = false);