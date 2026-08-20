// The four submission kinds an assignment author can tick under "Allowed
// Submission File Types" — audio, video, doc, image. The keys here are the
// exact strings stored in `assignments.allowed_file_types` (see
// FILE_TYPE_OPTIONS in the teacher assignment modal); changing one means
// migrating existing assignment rows.
//
// This module is the single source of truth shared by the student submit
// form (which renders one labelled upload slot per ticked type, with that
// type's accept filter and size cap) and the teacher review UI (which picks
// a player/preview per submitted file).
//
// The student's declared category is persisted on
// `assignment_submissions.submission_type` (migration 017). That migration
// is applied by hand, and submissions made before it exist have no stored
// category, so every consumer falls back to extension sniffing — see
// `resolveFileType`.

export type SubmissionType = "audio" | "video" | "doc" | "image";

export interface SubmissionTypeConfig {
  key: SubmissionType;
  /** Matches the author-side checkbox wording. */
  label: string;
  /** Call to action on the student's upload button. */
  uploadLabel: string;
  /** Shown under the label on the picker, e.g. "MP3, WAV, M4A". */
  hint: string;
  /** `accept` attribute for the file input. */
  accept: string;
  /**
   * Per-type cap in MB. These sit under Supabase's project-wide upload
   * limit (Storage -> Settings), which defaults to 50MB — the `submissions`
   * bucket itself sets no `file_size_limit` and no `allowed_mime_types`,
   * so the global limit is the real ceiling. Video is the one that gets
   * close to it.
   */
  maxSizeMB: number;
  /**
   * Extensions accepted for this type. Doubles as the client-side
   * validator (the browser's `accept` is only a filter — a student can
   * still pick "All Files" and choose anything) and as the classifier for
   * submissions with no stored category.
   */
  extensions: string[];
}

export const SUBMISSION_TYPES: SubmissionTypeConfig[] = [
  {
    key: "audio",
    label: "Audio",
    uploadLabel: "Upload audio",
    hint: "MP3, WAV, M4A, AAC, OGG",
    accept: "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.flac",
    maxSizeMB: 25,
    extensions: ["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac"],
  },
  {
    key: "video",
    label: "Video",
    uploadLabel: "Upload video",
    hint: "MP4, WebM, MOV",
    accept: "video/*,.mp4,.webm,.mov,.m4v,.avi",
    maxSizeMB: 50,
    extensions: ["mp4", "webm", "mov", "m4v", "avi"],
  },
  {
    key: "doc",
    label: "Documents",
    uploadLabel: "Upload document",
    hint: "PDF, Word, Excel, PowerPoint, text",
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.odp,.ods,.csv",
    maxSizeMB: 25,
    extensions: [
      "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
      "txt", "rtf", "odt", "odp", "ods", "csv",
    ],
  },
  {
    key: "image",
    label: "Images",
    uploadLabel: "Upload image",
    hint: "JPG, PNG, WebP, HEIC",
    accept: "image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif",
    maxSizeMB: 15,
    extensions: ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "bmp", "avif"],
  },
];

const TYPE_KEYS = SUBMISSION_TYPES.map((t) => t.key) as string[];

export function isSubmissionType(value: unknown): value is SubmissionType {
  return typeof value === "string" && TYPE_KEYS.includes(value);
}

export function getSubmissionTypeConfig(key: SubmissionType): SubmissionTypeConfig {
  // `doc` is the safe default — its preview is a plain link, which renders
  // something openable for any file, so a caller passing an unrecognised
  // key can never end up with a broken player.
  return SUBMISSION_TYPES.find((t) => t.key === key) || SUBMISSION_TYPES[2];
}

/**
 * The types a student may submit for an assignment, in the canonical order
 * above.
 *
 * Returns an empty array — meaning "no restriction, keep the single
 * generic uploader" — when the author ticked nothing, or when the stored
 * values are all unrecognised. Older rows predate the checkbox row and
 * hold raw extensions (sample data seeds `['pdf','doc','docx']`), and
 * locking those students out of assignments they can currently submit
 * would be worse than staying permissive.
 */
export function allowedSubmissionTypes(
  allowedFileTypes: string[] | null | undefined
): SubmissionTypeConfig[] {
  if (!allowedFileTypes || allowedFileTypes.length === 0) return [];
  const ticked = new Set(allowedFileTypes.map((t) => t.toLowerCase()));
  return SUBMISSION_TYPES.filter((t) => ticked.has(t.key));
}

/** File extension from a storage URL, lowercased, without the dot. */
export function extensionFromUrl(url: string): string {
  try {
    const path = decodeURIComponent(url.split("?")[0]);
    const last = path.split("/").pop() || "";
    if (!last.includes(".")) return "";
    return last.split(".").pop()?.toLowerCase() || "";
  } catch {
    return "";
  }
}

/** Best-effort category for a file, from its extension. Null if unknown. */
export function inferSubmissionType(url: string): SubmissionType | null {
  const ext = extensionFromUrl(url);
  if (!ext) return null;
  const match = SUBMISSION_TYPES.find((t) => t.extensions.includes(ext));
  return match ? match.key : null;
}

/**
 * How a single submitted file should be rendered.
 *
 * The file's own extension wins: a submission can carry more than one file
 * while `submission_type` holds only one value, so per-file sniffing is
 * more accurate than the stored column. The stored type is the fallback
 * for files whose extension we don't recognise, and "doc" — an openable
 * link — is the last resort.
 */
export function resolveFileType(
  url: string,
  storedType?: string | null
): SubmissionType {
  return inferSubmissionType(url) ?? (isSubmissionType(storedType) ? storedType : "doc");
}

/**
 * Whether `file` is acceptable for `type`. Returns an error message to show
 * the student, or null when the file is fine.
 *
 * Checked on the client because `accept` on a file input is a filter, not a
 * constraint — the student can switch the OS picker to "All Files" and
 * choose anything.
 */
export function validateFileForType(
  file: File,
  type: SubmissionTypeConfig
): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeGroup = file.type.split("/")[0];

  const extOk = ext !== "" && type.extensions.includes(ext);
  // MIME is the second opinion, for files whose extension is missing or
  // unusual but whose browser-reported type is unambiguous.
  const mimeOk =
    (type.key === "audio" && mimeGroup === "audio") ||
    (type.key === "video" && mimeGroup === "video") ||
    (type.key === "image" && mimeGroup === "image");

  if (extOk || mimeOk) return null;

  return `"${file.name}" is not a ${type.label.replace(/s$/, "").toLowerCase()} file. Accepted: ${type.hint}.`;
}
