"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  Clock,
  FileText,
  GripVertical,
  X,
  Eye,
  Upload,
  FolderOpen,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import FileUpload from "@/src/components/shared/FileUpload";
import MaterialViewer from "@/src/components/shared/MaterialViewer";

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  material_id: string | null;
  duration_minutes: number | null;
  display_order: number;
  created_at: string;
}

interface CourseMaterialOption {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
}

// Homework/classwork/assessment attached to a lesson (see migration 012 —
// assignments already supported a session_id; this adds lesson_id so admin
// can attach one while adding a lesson, without needing a session first).
type AssignmentType = "homework" | "classwork" | "assessment";

interface AssignmentRow {
  id: string;
  lesson_id: string | null;
  type: AssignmentType;
  title: string;
  description: string;
  // Relative deadline (migration 013) — "submit within N days of the
  // student's own enrollment date", replacing the old fixed due_date. See
  // src/lib/assignment-deadline.ts for how it's turned into a per-student
  // date across admin/teacher/student views.
  duration_days: number | null;
  file_urls: string[] | null;
}

// Working copy of an assignment row inside the Add/Edit Lesson modal.
// `dbId` set = already exists in `assignments` (edit mode); null = new,
// gets inserted on save.
interface DraftAssignment {
  key: string;
  dbId: string | null;
  type: AssignmentType;
  title: string;
  description: string;
  duration_days: string; // free-text "N days" input; "" = no deadline
  file_urls: string[];
}

// A lesson can have any number of documents (see migration 011). Each row
// is either a direct upload (pdf_url) or a link to an existing
// course_materials row (material_id) — mutually exclusive per row, same as
// the old single-document columns, just no longer capped at one per lesson.
interface LessonDocumentRow {
  id: string;
  lesson_id: string;
  title: string | null;
  pdf_url: string | null;
  material_id: string | null;
  display_order: number;
}

// Working copy of a lesson-document row used inside the Add/Edit Lesson
// modal before it's persisted. `dbId` is set for rows that already exist in
// lesson_documents (edit mode); rows without it are new and get inserted on
// save.
interface DraftDocument {
  key: string; // stable client-side key for React list rendering
  dbId: string | null;
  pdf_url: string | null;
  material_id: string | null;
}

interface ModuleFormData {
  title: string;
  description: string;
}

interface LessonFormData {
  title: string;
  content: string;
  video_url: string;
  duration_minutes: string;
}

// Lesson document viewing/uploading is scoped to PDFs for now — the in-app
// viewer (MaterialViewer) hard-codes "pdf" for lesson content elsewhere in
// the app (student/teacher lesson views), so only PDF materials are offered
// in the "choose existing material" picker below to keep that consistent.
function isPdfMaterial(m: CourseMaterialOption) {
  return (m.file_type || "").toLowerCase() === "pdf";
}

export default function AdminCourseContentPage() {
  const params = useParams();
  const courseId = params.id as string;
  const supabase = createClient() as any;

  const [courseTitle, setCourseTitle] = useState("");
  const [totalSessionsTarget, setTotalSessionsTarget] = useState<number | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Record<string, CourseLesson[]>>({});
  const [materials, setMaterials] = useState<CourseMaterialOption[]>([]);
  const [lessonDocuments, setLessonDocuments] = useState<Record<string, LessonDocumentRow[]>>({});
  const [lessonAssignments, setLessonAssignments] = useState<Record<string, AssignmentRow[]>>({});
  const [courseTeacherId, setCourseTeacherId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);

  // Module modal state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({ title: "", description: "" });
  const [savingModule, setSavingModule] = useState(false);

  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: "",
    content: "",
    video_url: "",
    duration_minutes: "",
  });
  // Documents currently attached to the lesson being added/edited (working
  // copy — only written to lesson_documents when the lesson is saved).
  const [draftDocs, setDraftDocs] = useState<DraftDocument[]>([]);
  const [lessonDocMode, setLessonDocMode] = useState<"upload" | "material">("upload");
  const [pendingMaterialId, setPendingMaterialId] = useState("");
  // Homework/classwork attached to the lesson being added/edited — working
  // copy, only written to `assignments` when the lesson is saved.
  const [draftAssignments, setDraftAssignments] = useState<DraftAssignment[]>([]);
  const [removedAssignmentIds, setRemovedAssignmentIds] = useState<string[]>([]);
  const [savingLesson, setSavingLesson] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "module" | "lesson";
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Total lessons actually built across all modules, so admins can see at a
  // glance whether it matches the course's Total Sessions target (batch
  // Zoom session creation pairs sessions 1:1 with lessons, so a mismatch
  // here means some sessions won't have a lesson attached).
  const totalLessonsBuilt = Object.values(lessons).reduce((sum, arr) => sum + arr.length, 0);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch course title + total_sessions target (used below to show how
    // many lessons have actually been built against the session count the
    // course is configured for)
    const { data: course } = await supabase
      .from("courses")
      .select("title, total_sessions")
      .eq("id", courseId)
      .single() as { data: { title: string; total_sessions: number | null } | null };
    if (course) {
      setCourseTitle(course.title);
      setTotalSessionsTarget(course.total_sessions ?? null);
    }

    // Fetch modules
    const { data: modulesData } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("display_order", { ascending: true });

    const mods = (modulesData as CourseModule[]) || [];
    setModules(mods);

    // Fetch course materials for this course, for the "choose existing
    // material" lesson-document picker
    const { data: materialsData } = await supabase
      .from("course_materials")
      .select("id, title, file_url, file_type")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    setMaterials((materialsData as CourseMaterialOption[]) || []);

    // Assignments require a non-null teacher_id (FK to profiles). Admin
    // isn't a teacher, so lesson-attached assignments created from this
    // page are filed under the course's assigned teacher when one exists,
    // falling back to the logged-in admin's own id otherwise.
    const { data: courseTeacherData } = await supabase
      .from("course_teachers")
      .select("teacher_id")
      .eq("course_id", courseId)
      .limit(1)
      .maybeSingle();
    setCourseTeacherId((courseTeacherData as { teacher_id: string } | null)?.teacher_id ?? null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setAdminUserId(user?.id ?? null);

    // Fetch all lessons for these modules
    if (mods.length > 0) {
      const moduleIds = mods.map((m) => m.id);
      const { data: lessonsData } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("display_order", { ascending: true });

      const grouped: Record<string, CourseLesson[]> = {};
      const allLessons = (lessonsData as CourseLesson[]) || [];
      for (const lesson of allLessons) {
        if (!grouped[lesson.module_id]) grouped[lesson.module_id] = [];
        grouped[lesson.module_id].push(lesson);
      }
      setLessons(grouped);

      // Fetch multi-document attachments (migration 011). Tolerate the
      // table not existing yet in prod (manual migration, see CLAUDE.md
      // note in 011_lesson_documents.sql) — falls back to the legacy
      // single pdf_url/material_id columns on course_lessons when empty.
      if (allLessons.length > 0) {
        const { data: docsData } = await supabase
          .from("lesson_documents")
          .select("*")
          .in("lesson_id", allLessons.map((l) => l.id))
          .order("display_order", { ascending: true });

        const docsGrouped: Record<string, LessonDocumentRow[]> = {};
        for (const doc of (docsData as LessonDocumentRow[]) || []) {
          if (!docsGrouped[doc.lesson_id]) docsGrouped[doc.lesson_id] = [];
          docsGrouped[doc.lesson_id].push(doc);
        }
        setLessonDocuments(docsGrouped);

        // Fetch lesson-linked assignments (migration 012). Tolerate the
        // lesson_id column not existing yet in prod (manual migration) —
        // an error here just leaves lessonAssignments empty, same
        // graceful-degrade pattern as lesson_documents above.
        const { data: assignData } = await supabase
          .from("assignments")
          .select("id, lesson_id, type, title, description, duration_days, file_urls")
          .in("lesson_id", allLessons.map((l) => l.id));

        const assignGrouped: Record<string, AssignmentRow[]> = {};
        for (const a of (assignData as AssignmentRow[]) || []) {
          if (!a.lesson_id) continue;
          if (!assignGrouped[a.lesson_id]) assignGrouped[a.lesson_id] = [];
          assignGrouped[a.lesson_id].push(a);
        }
        setLessonAssignments(assignGrouped);
      } else {
        setLessonDocuments({});
        setLessonAssignments({});
      }
    } else {
      setLessons({});
      setLessonDocuments({});
      setLessonAssignments({});
    }

    setLoading(false);
  }, [courseId]);

  // A lesson's resolved document list: lesson_documents rows if any exist,
  // otherwise the legacy single pdf_url/material_id columns wrapped as a
  // one-item list (backward compat for lessons attached before this
  // migration, or before it's been applied to this environment).
  const getLessonDocs = useCallback(
    (lesson: CourseLesson): LessonDocumentRow[] => {
      const rows = lessonDocuments[lesson.id];
      if (rows && rows.length > 0) return rows;
      if (lesson.pdf_url || lesson.material_id) {
        return [
          {
            id: `legacy-${lesson.id}`,
            lesson_id: lesson.id,
            title: null,
            pdf_url: lesson.pdf_url,
            material_id: lesson.material_id,
            display_order: 0,
          },
        ];
      }
      return [];
    },
    [lessonDocuments]
  );

  const resolveDocUrl = useCallback(
    (doc: { pdf_url: string | null; material_id: string | null }): string => {
      if (doc.pdf_url) return doc.pdf_url;
      if (doc.material_id) return materials.find((m) => m.id === doc.material_id)?.file_url || "";
      return "";
    },
    [materials]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Module CRUD ---
  const openAddModule = () => {
    setEditingModule(null);
    setModuleForm({ title: "", description: "" });
    setShowModuleModal(true);
  };

  const openEditModule = (mod: CourseModule) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description || "" });
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Module title is required");
      return;
    }
    setSavingModule(true);

    if (editingModule) {
      const { error } = await supabase
        .from("course_modules")
        .update({
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingModule.id);

      if (error) {
        toast.error("Failed to update module");
      } else {
        toast.success("Module updated");
      }
    } else {
      const maxOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.display_order)) : 0;
      const { error } = await supabase.from("course_modules").insert({
        course_id: courseId,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || null,
        display_order: maxOrder + 1,
      });

      if (error) {
        toast.error("Failed to create module");
      } else {
        toast.success("Module created");
      }
    }

    setSavingModule(false);
    setShowModuleModal(false);
    fetchData();
  };

  const deleteModule = async (id: string) => {
    setDeleting(true);
    // Delete lessons first, then module
    await supabase.from("course_lessons").delete().eq("module_id", id);
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete module");
    } else {
      toast.success("Module deleted");
    }
    setDeleting(false);
    setDeleteTarget(null);
    fetchData();
  };

  // --- Lesson CRUD ---
  const openAddLesson = (moduleId: string) => {
    setEditingLesson(null);
    setLessonModuleId(moduleId);
    setLessonForm({ title: "", content: "", video_url: "", duration_minutes: "" });
    setDraftDocs([]);
    setLessonDocMode("upload");
    setPendingMaterialId("");
    setDraftAssignments([]);
    setRemovedAssignmentIds([]);
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    setLessonModuleId(lesson.module_id);
    setLessonForm({
      title: lesson.title,
      content: lesson.content || "",
      video_url: lesson.video_url || "",
      duration_minutes: lesson.duration_minutes?.toString() || "",
    });
    setDraftDocs(
      getLessonDocs(lesson).map((d) => ({
        key: d.id,
        dbId: d.id.startsWith("legacy-") ? null : d.id,
        pdf_url: d.pdf_url,
        material_id: d.material_id,
      }))
    );
    setLessonDocMode("upload");
    setPendingMaterialId("");
    setDraftAssignments(
      (lessonAssignments[lesson.id] || []).map((a) => ({
        key: a.id,
        dbId: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        duration_days: a.duration_days != null ? String(a.duration_days) : "",
        file_urls: a.file_urls || [],
      }))
    );
    setRemovedAssignmentIds([]);
    setShowLessonModal(true);
  };

  const addDraftAssignment = () => {
    setDraftAssignments((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${prev.length}`,
        dbId: null,
        type: "homework",
        title: "",
        description: "",
        duration_days: "",
        file_urls: [],
      },
    ]);
  };

  const updateDraftAssignment = (key: string, patch: Partial<DraftAssignment>) => {
    setDraftAssignments((prev) => prev.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  };

  const addDraftAssignmentFile = (key: string, url: string) => {
    setDraftAssignments((prev) =>
      prev.map((a) => (a.key === key ? { ...a, file_urls: [...a.file_urls, url] } : a))
    );
  };

  const removeDraftAssignmentFile = (key: string, index: number) => {
    setDraftAssignments((prev) =>
      prev.map((a) =>
        a.key === key ? { ...a, file_urls: a.file_urls.filter((_, i) => i !== index) } : a
      )
    );
  };

  // Existing (already-saved) assignments are deleted on save via
  // removedAssignmentIds rather than a blanket delete-and-reinsert like
  // lesson_documents uses — assignment_submissions cascades off
  // assignments.id, so re-inserting on every save would silently wipe a
  // student's submission/grade history for anything left untouched.
  const removeDraftAssignment = (key: string) => {
    setDraftAssignments((prev) => {
      const target = prev.find((a) => a.key === key);
      if (target?.dbId) setRemovedAssignmentIds((ids) => [...ids, target.dbId as string]);
      return prev.filter((a) => a.key !== key);
    });
  };

  // Add a freshly-uploaded PDF to the working document list (doesn't touch
  // the DB yet — persisted when the lesson is saved).
  const addDraftDocFromUpload = (url: string) => {
    setDraftDocs((prev) => [
      ...prev,
      { key: `new-${Date.now()}-${prev.length}`, dbId: null, pdf_url: url, material_id: null },
    ]);
  };

  const addDraftDocFromMaterial = () => {
    if (!pendingMaterialId) return;
    if (draftDocs.some((d) => d.material_id === pendingMaterialId)) {
      toast.error("That material is already attached to this lesson");
      return;
    }
    setDraftDocs((prev) => [
      ...prev,
      { key: `new-${Date.now()}-${prev.length}`, dbId: null, pdf_url: null, material_id: pendingMaterialId },
    ]);
    setPendingMaterialId("");
  };

  const removeDraftDoc = (key: string) => {
    setDraftDocs((prev) => prev.filter((d) => d.key !== key));
  };

  const saveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    // Assignments with a blank Title are silently dropped below (the
    // insert/update filters require a.title.trim()) — root cause of the
    // "I attached a document but it never shows up" reports (e.g. Digraphs
    // - WEEK 33): the Type dropdown right next to the title box already
    // reads "Classwork"/"Homework", so admins skip typing a separate title,
    // upload a file, hit Save, and the whole item — file reference
    // included — just never reaches `assignments` with no visible error.
    // A prior fix added a blocking toast here instead, but that still lost
    // the work (admin has to notice the toast, retype, and re-attach).
    // Default the title from the type instead of rejecting the save — an
    // admin can always rename it later, but an attached file should never
    // be able to silently vanish. Truly empty rows (no title, no
    // description, no file) are still dropped without complaint, same as
    // before.
    const draftAssignmentsToSave = draftAssignments.map((a) => {
      if (!a.title.trim() && (a.description.trim() || a.file_urls.length > 0)) {
        return { ...a, title: a.type.charAt(0).toUpperCase() + a.type.slice(1) };
      }
      return a;
    });
    if (draftAssignmentsToSave.some((a, i) => a.title !== draftAssignments[i].title)) {
      setDraftAssignments(draftAssignmentsToSave);
    }

    setSavingLesson(true);

    // Legacy pdf_url/material_id columns are kept in sync with the first
    // attached document as a fallback for any environment where migration
    // 011 (lesson_documents) hasn't been applied yet — see that file.
    const firstDoc = draftDocs[0];
    const payload = {
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim() || null,
      video_url: lessonForm.video_url.trim() || null,
      duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
      pdf_url: firstDoc?.pdf_url || null,
      material_id: firstDoc?.material_id || null,
    };

    let lessonId: string | null = editingLesson?.id ?? null;

    if (editingLesson) {
      const { error } = await supabase
        .from("course_lessons")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingLesson.id);

      if (error) {
        toast.error("Failed to update lesson");
        setSavingLesson(false);
        return;
      }
    } else {
      const currentLessons = lessons[lessonModuleId!] || [];
      const maxOrder =
        currentLessons.length > 0 ? Math.max(...currentLessons.map((l) => l.display_order)) : 0;

      const { data: inserted, error } = await supabase
        .from("course_lessons")
        .insert({
          ...payload,
          module_id: lessonModuleId,
          display_order: maxOrder + 1,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("Failed to create lesson");
        setSavingLesson(false);
        return;
      }
      lessonId = (inserted as { id: string } | null)?.id ?? null;
    }

    // Sync the full document list into lesson_documents: replace whatever
    // was there with the current working list. Best-effort — if the table
    // doesn't exist yet in this environment (migration 011 not applied),
    // the lesson itself is still saved with its first doc via the legacy
    // columns above, so this failure is non-fatal.
    if (lessonId) {
      await supabase.from("lesson_documents").delete().eq("lesson_id", lessonId);
      if (draftDocs.length > 0) {
        const { error: docsError } = await supabase.from("lesson_documents").insert(
          draftDocs.map((d, idx) => ({
            lesson_id: lessonId,
            pdf_url: d.pdf_url,
            material_id: d.material_id,
            display_order: idx,
          }))
        );
        if (docsError) {
          toast.error(
            "Lesson saved, but documents beyond the first couldn't be stored (" +
              docsError.message +
              ")"
          );
        }
      }
    }

    // Sync assignments: only touch what actually changed (new drafts +
    // explicit removals), never a blanket delete-and-reinsert — see
    // removeDraftAssignment for why (submission cascade).
    if (lessonId) {
      const newAssignments = draftAssignmentsToSave.filter((a) => !a.dbId && a.title.trim());
      if (newAssignments.length > 0) {
        const { error: assignError } = await supabase.from("assignments").insert(
          newAssignments.map((a) => ({
            course_id: courseId,
            lesson_id: lessonId,
            teacher_id: courseTeacherId || adminUserId,
            type: a.type,
            title: a.title.trim(),
            description: a.description.trim(),
            duration_days: a.duration_days.trim() ? parseInt(a.duration_days, 10) : null,
            file_urls: a.file_urls,
          }))
        );
        if (assignError) {
          toast.error("Lesson saved, but homework/classwork couldn't be stored (" + assignError.message + ")");
        }
      }
      // Existing assignments (dbId set) are edited in place — e.g. changing
      // the due date on homework opened via the Assignment badge — so push
      // their current draft values back to the row instead of leaving edits
      // stuck client-side.
      const existingAssignments = draftAssignmentsToSave.filter((a) => a.dbId && a.title.trim());
      for (const a of existingAssignments) {
        const { error: updateError } = await supabase
          .from("assignments")
          .update({
            type: a.type,
            title: a.title.trim(),
            description: a.description.trim(),
            duration_days: a.duration_days.trim() ? parseInt(a.duration_days, 10) : null,
            file_urls: a.file_urls,
          })
          .eq("id", a.dbId as string);
        if (updateError) {
          toast.error("Lesson saved, but an assignment update couldn't be stored (" + updateError.message + ")");
        }
      }
      if (removedAssignmentIds.length > 0) {
        await supabase.from("assignments").delete().in("id", removedAssignmentIds);
      }
    }

    toast.success(editingLesson ? "Lesson updated" : "Lesson created");
    setSavingLesson(false);
    setShowLessonModal(false);
    fetchData();
  };

  const deleteLesson = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("course_lessons").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete lesson");
    } else {
      toast.success("Lesson deleted");
    }
    setDeleting(false);
    setDeleteTarget(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <MaterialViewer
        open={!!viewingDoc}
        title={viewingDoc?.title || ""}
        fileUrl={viewingDoc?.url || ""}
        fileType="pdf"
        onClose={() => setViewingDoc(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/courses"
            className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Course Content</h1>
            <p className="text-[#4D4D4D] text-sm mt-0.5">{courseTitle || "Loading..."}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && totalSessionsTarget != null && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                totalLessonsBuilt >= totalSessionsTarget
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
              title="Live sessions are paired 1:1 with lessons when a student is enrolled. Build enough lessons to match Total Sessions before enrolling students."
            >
              {totalLessonsBuilt}/{totalSessionsTarget} lessons built
              {totalLessonsBuilt < totalSessionsTarget && " — add more before enrolling"}
            </span>
          )}
          <button
            onClick={openAddModule}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[#4D4D4D] font-medium">No modules yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Add your first module to start building course content</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, modIdx) => {
            const modLessons = lessons[mod.id] || [];
            const isExpanded = expandedModules.has(mod.id);

            return (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Module header */}
                <div
                  className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="text-[#9CA3AF]">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1F4FD8]/10 text-[#1F4FD8] text-sm font-bold font-poppins">
                    {modIdx + 1}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#4D4D4D]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#4D4D4D]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins font-semibold text-[#1C1C28] text-sm">{mod.title}</h3>
                    {mod.description && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{mod.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#9CA3AF] mr-2">
                    {modLessons.length} lesson{modLessons.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModule(mod)}
                      className="p-2 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: "module", id: mod.id, title: mod.title })}
                      className="p-2 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {modLessons.length === 0 ? (
                      <div className="px-6 py-6 text-center text-sm text-[#9CA3AF]">
                        No lessons in this module yet
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {modLessons.map((lesson, lesIdx) => {
                          const docs = getLessonDocs(lesson);
                          const lessonAssignmentCount = (lessonAssignments[lesson.id] || []).length;
                          return (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="w-5 text-center text-xs text-[#9CA3AF] font-medium">
                              {lesIdx + 1}
                            </div>
                            <FileText className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#1C1C28] font-medium truncate">{lesson.title}</p>
                            </div>
                            {lesson.video_url && (
                              <span className="flex items-center gap-1 text-xs text-[#1F4FD8] bg-[#1F4FD8]/10 px-2 py-0.5 rounded-full">
                                <Video className="w-3 h-3" /> Video
                              </span>
                            )}
                            {docs.length > 0 && (
                              <button
                                onClick={() =>
                                  setViewingDoc({
                                    title: docs.length > 1 ? `${lesson.title} (1 of ${docs.length})` : lesson.title,
                                    url: resolveDocUrl(docs[0]),
                                  })
                                }
                                className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
                                title={docs.length > 1 ? `Preview first of ${docs.length} documents` : "Preview document"}
                              >
                                <Eye className="w-3 h-3" /> {docs.length > 1 ? `Documents (${docs.length})` : "Document"}
                              </button>
                            )}
                            {lessonAssignmentCount > 0 && (
                              <button
                                onClick={() => openEditLesson(lesson)}
                                className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors"
                                title={lessonAssignmentCount > 1 ? `Edit ${lessonAssignmentCount} assignments` : "Edit assignment"}
                              >
                                <ClipboardList className="w-3 h-3" />
                                {lessonAssignmentCount > 1 ? `Assignments (${lessonAssignmentCount})` : "Assignment"}
                              </button>
                            )}
                            {lesson.duration_minutes && (
                              <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                                <Clock className="w-3 h-3" /> {lesson.duration_minutes} min
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditLesson(lesson)}
                                className="p-1.5 text-[#4D4D4D] hover:text-[#1F4FD8] hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Lesson"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({ type: "lesson", id: lesson.id, title: lesson.title })
                                }
                                className="p-1.5 text-[#4D4D4D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Lesson button */}
                    <div className="px-6 py-3 border-t border-gray-100">
                      <button
                        onClick={() => openAddLesson(mod.id)}
                        className="inline-flex items-center gap-1.5 text-sm text-[#1F4FD8] hover:text-[#1a45c2] font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-poppins font-bold text-[#1C1C28]">
                {editingModule ? "Edit Module" : "Add Module"}
              </h3>
              <button
                onClick={() => setShowModuleModal(false)}
                className="p-1.5 text-[#9CA3AF] hover:text-[#4D4D4D] hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to the Course"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Description</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this module"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowModuleModal(false)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveModule}
                disabled={savingModule}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-colors"
              >
                {savingModule ? "Saving..." : editingModule ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-poppins font-bold text-[#1C1C28]">
                {editingLesson ? "Edit Lesson" : "Add Lesson"}
              </h3>
              <button
                onClick={() => setShowLessonModal(false)}
                className="p-1.5 text-[#9CA3AF] hover:text-[#4D4D4D] hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Title *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. What is HTML?"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Content</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Lesson content or notes..."
                  rows={6}
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Video URL</label>
                <input
                  type="url"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Lesson Documents
                </label>
                <p className="text-xs text-[#9CA3AF] mb-2">
                  Attach any number of documents (e.g. a reading and a homework doc) — upload new
                  PDFs or pick ones already uploaded to this course&apos;s materials. Viewing is
                  in-app only — no download button.
                </p>

                {draftDocs.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {draftDocs.map((d, idx) => {
                      const label = d.pdf_url
                        ? `Uploaded PDF ${idx + 1}`
                        : materials.find((m) => m.id === d.material_id)?.title || "Material";
                      return (
                        <div
                          key={d.key}
                          className="flex items-center gap-2 px-3 py-2 bg-[#F8F9FB] rounded-lg border border-gray-100"
                        >
                          <FileText className="w-4 h-4 text-[#1F4FD8] flex-shrink-0" />
                          <span className="text-xs text-[#1C1C28] truncate flex-1">{label}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setViewingDoc({
                                title: label,
                                url: d.pdf_url || materials.find((m) => m.id === d.material_id)?.file_url || "",
                              })
                            }
                            className="p-1 text-[#9CA3AF] hover:text-[#1F4FD8] rounded flex-shrink-0"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDraftDoc(d.key)}
                            className="p-1 text-[#9CA3AF] hover:text-red-500 rounded flex-shrink-0"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setLessonDocMode("upload")}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      lessonDocMode === "upload"
                        ? "bg-[#1F4FD8] text-white"
                        : "bg-gray-100 text-[#4D4D4D] hover:bg-gray-200"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload New
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonDocMode("material")}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      lessonDocMode === "material"
                        ? "bg-[#1F4FD8] text-white"
                        : "bg-gray-100 text-[#4D4D4D] hover:bg-gray-200"
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Choose Existing Material
                  </button>
                </div>

                {lessonDocMode === "upload" ? (
                  <FileUpload
                    key={draftDocs.length}
                    bucket="lesson-pdfs"
                    folder={`course-${courseId}`}
                    accept=".pdf,application/pdf"
                    maxSizeMB={50}
                    multiple
                    onUpload={(url) => addDraftDocFromUpload(url)}
                    label="Click to upload PDF(s) — adds to the list above"
                  />
                ) : materials.filter(isPdfMaterial).length === 0 ? (
                  <p className="text-xs text-[#9CA3AF] px-4 py-3 bg-gray-50 rounded-xl">
                    No PDF materials uploaded for this course yet. Upload one from{" "}
                    <Link href="/dashboard/admin/materials" className="text-[#1F4FD8] hover:underline">
                      Course Materials
                    </Link>{" "}
                    first.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={pendingMaterialId}
                      onChange={(e) => setPendingMaterialId(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent"
                    >
                      <option value="">Select a material</option>
                      {materials.filter(isPdfMaterial).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addDraftDocFromMaterial}
                      disabled={!pendingMaterialId}
                      className="px-4 py-2.5 bg-[#1F4FD8]/10 text-[#1F4FD8] text-sm font-semibold rounded-xl hover:bg-[#1F4FD8]/20 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Homework / Classwork
                </label>
                <p className="text-xs text-[#9CA3AF] mb-2">
                  Attach gradable assignments to this lesson — students see these on their
                  Assignments tab and submit there, same flow teachers already use. Since the
                  course is self-paced, the deadline is a number of days from each student's
                  own enrollment date, not a fixed calendar date.
                </p>

                {draftAssignments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {draftAssignments.map((a) => (
                      <div
                        key={a.key}
                        className="p-3 bg-[#F8F9FB] rounded-lg border border-gray-100 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <select
                            value={a.type}
                            onChange={(e) =>
                              updateDraftAssignment(a.key, { type: e.target.value as AssignmentType })
                            }
                            className="px-2 py-1.5 border border-[#D4D4D4] rounded-lg bg-white text-xs text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                          >
                            <option value="homework">Homework</option>
                            <option value="classwork">Classwork</option>
                            <option value="assessment">Assessment</option>
                          </select>
                          <input
                            type="text"
                            value={a.title}
                            onChange={(e) => updateDraftAssignment(a.key, { title: e.target.value })}
                            placeholder="Title *"
                            title="Required — without a title this item won't be saved"
                            className="flex-1 px-3 py-1.5 border border-[#D4D4D4] rounded-lg bg-white text-xs text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input
                              type="number"
                              min={1}
                              value={a.duration_days}
                              onChange={(e) =>
                                updateDraftAssignment(a.key, { duration_days: e.target.value })
                              }
                              placeholder="No limit"
                              title="Days to submit, counted from each student's own enrollment date"
                              className="w-20 px-2 py-1.5 border border-[#D4D4D4] rounded-lg bg-white text-xs text-[#1C1C28] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                            />
                            <span className="text-xs text-[#9CA3AF]">days</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDraftAssignment(a.key)}
                            className="p-1.5 text-[#9CA3AF] hover:text-red-500 rounded flex-shrink-0"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          value={a.description}
                          onChange={(e) => updateDraftAssignment(a.key, { description: e.target.value })}
                          placeholder="Instructions for students"
                          rows={2}
                          className="w-full px-3 py-1.5 border border-[#D4D4D4] rounded-lg bg-white text-xs text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
                        />
                        {a.file_urls.length > 0 && (
                          <div className="space-y-1.5">
                            {a.file_urls.map((url, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-gray-200"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#1F4FD8] flex-shrink-0" />
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#1F4FD8] hover:underline truncate flex-1"
                                >
                                  {decodeURIComponent(url.split("/").pop() || "File")}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => removeDraftAssignmentFile(a.key, i)}
                                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <FileUpload
                          bucket="assignments"
                          folder={`course-${courseId}/lesson-${editingLesson?.id || "new"}`}
                          onUpload={(url) => addDraftAssignmentFile(a.key, url)}
                          label="Attach a document"
                          maxSizeMB={50}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addDraftAssignment}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F4FD8] bg-[#1F4FD8]/10 rounded-lg hover:bg-[#1F4FD8]/20 transition-colors"
                >
                  <ClipboardList className="w-3.5 h-3.5" /> Add homework / classwork
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={lessonForm.duration_minutes}
                  onChange={(e) => setLessonForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2.5 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLesson}
                disabled={savingLesson}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1F4FD8] rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-colors"
              >
                {savingLesson ? "Saving..." : editingLesson ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-poppins font-bold text-[#1C1C28] mb-2">
              Delete {deleteTarget.type === "module" ? "Module" : "Lesson"}?
            </h3>
            <p className="text-sm text-[#4D4D4D] mb-1">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
            </p>
            {deleteTarget.type === "module" && (
              <p className="text-sm text-red-500 mb-6">
                All lessons inside this module will also be deleted.
              </p>
            )}
            {deleteTarget.type === "lesson" && <div className="mb-6" />}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteTarget.type === "module"
                    ? deleteModule(deleteTarget.id)
                    : deleteLesson(deleteTarget.id)
                }
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
