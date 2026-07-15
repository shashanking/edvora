"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminCourseSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  useEffect(() => {
    router.replace(`/dashboard/admin/courses/${courseId}/content`);
  }, [courseId, router]);

  return null;
}
