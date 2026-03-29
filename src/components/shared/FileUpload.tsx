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
}: FileUploadProps) {
  const supabase = createClient() as any;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be smaller than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = folder ? `${folder}/${timestamp}_${safeName}` : `${timestamp}_${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
    setUploadedFile({ name: file.name, size: file.size, url: publicUrl });
    onUpload(publicUrl, file.name, ext, file.size);
    setUploading(false);

    // Reset the input
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
              Uploading...
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
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
