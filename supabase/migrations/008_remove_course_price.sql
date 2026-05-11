-- ============================================
-- Remove price/currency from courses
-- ============================================
-- Course pricing has been removed from the LMS. Payments are now
-- recorded directly against the `payments` table with an explicit
-- amount/currency supplied by the caller.

ALTER TABLE public.courses
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS currency;
