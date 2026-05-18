-- Email verification OTPs for custom EmailJS-driven signup flow.
-- Stores 6-digit codes — no UNIQUE on the code itself because collisions
-- across different users are possible; lookup is always (email, token).
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email_token ON public.email_verifications(email, token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
-- No public policies — only the service role (server routes) reads/writes this table.
