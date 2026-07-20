"use client";

import React, { useRef, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Upload, X, FileText, Video, Music, Image as ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface FileUploadProps {
  bucket: string; // e.g. "assignments", "materials"
  folder?: string; // e.g. "course-123/session-1"
  accept?: string; // e.g. "audio/*,video/*,.pdf,.doc,.docx"
  maxSizeMB?: number;
  onUpload: (url: string, fileName: string, fileType: string, fileSize: number) => void;
  label?: string;
  className?: string;
  multiple?: boolean; // allow selecting/uploading several files in one go
}

const FILE_ICON_MAP: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  doc: <FileText className="w-5 h-5 text-blue-500" />,
  docx: <FileText className="w-5 h-5 text-blue-500" />,
  mp4: <Video className="w-5 h-5 text-purple-500" />,
  mp3: <Music className="w-5 h-5 text-green-500" />,
  wav: <Music className="w-5 h-5 text-green-500" />,
  jpg: <ImageIcon className="w-5 h-5 text-amber-500" />,
  jpeg: <ImageIcon className="w-5 h-5 text-amber-500" />,
  png: <ImageIcon className="w-5 h-5 text-amber-500" />,
};

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return FILE_ICON_MAP[ext] || <FileText className="w-5 h-5 text-gray-500" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FileUpload({
  bucket,
  folder = "",
  accept = "*",
  maxSizeMB = 50,
  onUpload,
  label = "Upload File",
  className = "",
  multiple = false,
}: FileUploadProps) {
  const supabase = createClient() as any;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // Uploads a single File to the configured bucket/folder and resolves its
  // public URL. Shared by both the single- and multi-file paths below.
  const uploadOne = async (file: File) => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = folder ? `${folder}/${timestamp}_${safeName}` : `${timestamp}_${safeName}`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return urlData.publicUrl as string;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!multiple) {
      const file = files[0];
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File must be smaller than ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      try {
        const publicUrl = await uploadOne(file);
        const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
        setUploadedFile({ name: file.name, size: file.size, url: publicUrl });
        onUpload(publicUrl, file.name, ext, file.size);
      } catch (error: any) {
        toast.error("Upload failed: " + error.message);
      }
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Multiple files: upload one at a time (so "Uploading X of Y" progress
    // is meaningful) and keep going if one fails — a bad file shouldn't
    // block the rest of the batch. Successful uploads are reported to the
    // parent only after the whole batch finishes, in one synchronous pass,
    // so callers that remount this component on every onUpload (e.g. via a
    // `key` tied to their doc list length) only remount once at the end
    // instead of mid-batch.
    const fileList = Array.from(files);
    const uploaded: { url: string; name: string; ext: string; size: number }[] = [];
    setUploading(true);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setProgress({ current: i + 1, total: fileList.length });

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} is larger than ${maxSizeMB}MB — skipped`);
        continue;
      }

      try {
        const publicUrl = await uploadOne(file);
        const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
        uploaded.push({ url: publicUrl, name: file.name, ext, size: file.size });
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    uploaded.forEach((f) => onUpload(f.url, f.name, f.ext, f.size));
    if (uploaded.length > 0) {
      toast.success(
        `Uploaded ${uploaded.length} of ${fileList.length} file${fileList.length > 1 ? "s" : ""}`
      );
    }

    setProgress(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      {uploadedFile ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          {getFileIcon(uploadedFile.name)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1C1C28] truncate">{uploadedFile.name}</p>
            <p className="text-xs text-[#9CA3AF]">{formatFileSize(uploadedFile.size)}</p>
          </div>
          <button
            onClick={clearFile}
            type="button"
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[#4D4D4D]" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#1F4FD8] hover:bg-[#1F4FD8]/5 transition-all text-sm text-[#4D4D4D] disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#1F4FD8]" />
              {progress ? `Uploading ${progress.current} of ${progress.total}...` : "Uploading..."}
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              {label}
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
