-- 0006: reminders_log table for tracking WhatsApp reminder messages sent to customers

CREATE TABLE IF NOT EXISTS public.reminders_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_at_reminder DECIMAL(10, 2) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reminders_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders log" ON public.reminders_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders log" ON public.reminders_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);