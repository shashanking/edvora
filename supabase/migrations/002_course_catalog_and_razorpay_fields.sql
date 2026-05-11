ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS audience TEXT,
ADD COLUMN IF NOT EXISTS landing_category TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_provider TEXT,
ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
ADD COLUMN IF NOT EXISTS provider_signature TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_courses_audience ON public.courses(audience);
CREATE INDEX IF NOT EXISTS idx_courses_landing_category ON public.courses(landing_category);
CREATE INDEX IF NOT EXISTS idx_courses_display_order ON public.courses(display_order);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
