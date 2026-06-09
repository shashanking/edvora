-- Add pdf_url column to course_lessons
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create lesson-pdfs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pdfs', 'lesson-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Admins can upload lesson PDFs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can upload lesson PDFs'
  ) THEN
    CREATE POLICY "Admins can upload lesson PDFs"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'lesson-pdfs'
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can update lesson PDFs'
  ) THEN
    CREATE POLICY "Admins can update lesson PDFs"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'lesson-pdfs' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
      WITH CHECK (bucket_id = 'lesson-pdfs' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can delete lesson PDFs'
  ) THEN
    CREATE POLICY "Admins can delete lesson PDFs"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'lesson-pdfs' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Authenticated users can read lesson PDFs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can read lesson PDFs'
  ) THEN
    CREATE POLICY "Authenticated users can read lesson PDFs"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'lesson-pdfs');
  END IF;
END $$;
