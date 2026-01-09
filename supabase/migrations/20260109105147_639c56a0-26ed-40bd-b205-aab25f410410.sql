-- Table for WebRTC signaling
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  callee_id UUID NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'video',
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 minute')
);

-- Enable RLS
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Policies for call signals
CREATE POLICY "Users can view their own call signals"
ON public.call_signals
FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create call signals"
ON public.call_signals
FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can delete their own call signals"
ON public.call_signals
FOR DELETE
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Enable realtime for call signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;

-- Cleanup old signals with a function
CREATE OR REPLACE FUNCTION public.cleanup_expired_call_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM public.call_signals WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;