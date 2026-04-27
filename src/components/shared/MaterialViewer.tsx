"use client";

import React, { useEffect } from "react";
import { X, FileText, Loader2 } from "lucide-react";

interface MaterialViewerProps {
  open: boolean;
  title: string;
  fileUrl: string;
  fileType: string | null;
  onClose: () => void;
}

const IMAGE_TYPES = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const VIDEO_TYPES = new Set(["mp4", "webm", "mov", "ogg"]);
const AUDIO_TYPES = new Set(["mp3", "wav", "m4a", "aac", "flac"]);
const OFFICE_TYPES = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

function blockContext(e: React.MouseEvent | React.DragEvent) {
  e.preventDefault();
}

export default function MaterialViewer({
  open,
  title,
  fileUrl,
  fileType,
  onClose,
}: MaterialViewerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const ext = (fileType || "").toLowerCase();

  let body: React.ReactNode;

  if (ext === "pdf") {
    // #toolbar=0 hides the built-in download / print toolbar in Chrome/Edge.
    body = (
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        title={title}
        className="w-full h-full bg-white"
      />
    );
  } else if (IMAGE_TYPES.has(ext)) {
    body = (
      <div
        className="w-full h-full flex items-center justify-center bg-black/80 select-none"
        onContextMenu={blockContext}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={title}
          draggable={false}
          onDragStart={blockContext}
          onContextMenu={blockContext}
          className="max-w-full max-h-full object-contain pointer-events-none"
        />
      </div>
    );
  } else if (VIDEO_TYPES.has(ext)) {
    body = (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <video
          src={fileUrl}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={blockContext}
          className="max-w-full max-h-full"
        />
      </div>
    );
  } else if (AUDIO_TYPES.has(ext)) {
    body = (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
        <audio
          src={fileUrl}
          controls
          controlsList="nodownload"
          onContextMenu={blockContext}
          className="w-full max-w-md"
        />
      </div>
    );
  } else if (OFFICE_TYPES.has(ext)) {
    // Office Online Viewer — renders Word/Excel/PowerPoint inline, no download UI.
    const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      fileUrl
    )}`;
    body = <iframe src={officeSrc} title={title} className="w-full h-full bg-white" />;
  } else {
    // Unknown type — show metadata only, no download path.
    body = (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-[#1C1C28] font-medium">Preview not available</p>
          <p className="text-sm text-[#4D4D4D] mt-1">
            This file format can&apos;t be previewed inline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
      onContextMenu={blockContext}
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
          <h3 className="font-poppins font-semibold text-[#1C1C28] truncate pr-4">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-[#4D4D4D] hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] pointer-events-none">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="absolute inset-0">{body}</div>
        </div>
      </div>
    </div>
  );
}
