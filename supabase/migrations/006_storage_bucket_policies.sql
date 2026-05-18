-- ============================================
-- Addify Academy LMS - Storage Bucket Policies
-- Fixes RLS for uploads to materials, assignments, and submissions buckets
-- ============================================

-- Materials bucket: admins and teachers can manage course materials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins and teachers can upload materials'
  ) THEN
    CREATE POLICY "Admins and teachers can upload materials"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'materials'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins and teachers can update materials'
  ) THEN
    CREATE POLICY "Admins and teachers can update materials"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'materials'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      )
      WITH CHECK (
        bucket_id = 'materials'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins and teachers can delete materials'
  ) THEN
    CREATE POLICY "Admins and teachers can delete materials"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'materials'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read materials'
  ) THEN
    CREATE POLICY "Public can read materials"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'materials');
  END IF;
END $$;

-- Assignments bucket: admins and teachers can manage assignment attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins and teachers can upload assignments'
  ) THEN
    CREATE POLICY "Admins and teachers can upload assignments"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'assignments'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins and teachers can update assignments'
  ) THEN
    CREATE POLICY "Admins and teachers can update assignments"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'assignments'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      )
      WITH CHECK (
        bucket_id = 'assignments'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins and teachers can delete assignments'
  ) THEN
    CREATE POLICY "Admins and teachers can delete assignments"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'assignments'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'teacher')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read assignments'
  ) THEN
    CREATE POLICY "Public can read assignments"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'assignments');
  END IF;
END $$;

-- Submissions bucket: students can upload their own submissions; admins/teachers can manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload submissions'
  ) THEN
    CREATE POLICY "Authenticated users can upload submissions"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'submissions');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update submissions'
  ) THEN
    CREATE POLICY "Authenticated users can update submissions"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'submissions')
      WITH CHECK (bucket_id = 'submissions');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete submissions'
  ) THEN
    CREATE POLICY "Authenticated users can delete submissions"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'submissions');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read submissions'
  ) THEN
    CREATE POLICY "Public can read submissions"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'submissions');
  END IF;
END $$;
