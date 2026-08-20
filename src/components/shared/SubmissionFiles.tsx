"use client";

import React from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { resolveFileType } from "@/src/lib/submission-types";

/**
 * Renders the files a student handed in, each with the player or preview
 * that suits it — audio element, video element, inline image, or an
 * openable document link.
 *
 * Shared by the teacher's assignment review page and the student's own
 * "Submitted" panel so both show the same thing. Which renderer a file gets
 * comes from `resolveFileType`: the file's own extension first, the
 * student's declared `submission_type` (migration 017) as the fallback for
 * unrecognised extensions.
 */

interface SubmissionFilesProps {
  fileUrls: string[];
  /** `assignment_submissions.submission_type`; null on pre-017 rows. */
  submissionType?: string | null;
  className?: string;
}

/** Display name for a storage URL, minus FileUpload's timestamp prefix. */
export function submissionFileName(url: string) {
  try {
    const decoded = decodeURIComponent(url.split("?")[0].split("/").pop() || "file");
    return decoded.replace(/^\d+_/, "");
  } catch {
    return "file";
  }
}

function DocumentRow({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 hover:border-[#1F4FD8]/30 hover:bg-gray-50/50 transition-all"
    >
      <span className="w-9 h-9 flex-shrink-0 rounded-lg bg-[#1F4FD8]/10 flex items-center justify-center">
        <FileText className="w-4 h-4 text-[#1F4FD8]" />
      </span>
      <span className="flex-1 min-w-0 text-sm font-medium text-[#1C1C28] truncate">
        {submissionFileName(url)}
      </span>
      <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F4FD8] bg-[#1F4FD8]/10 rounded-lg">
        <ExternalLink className="w-3.5 h-3.5" />
        Open
      </span>
    </a>
  );
}

export default function SubmissionFiles({
  fileUrls,
  submissionType,
  className = "",
}: SubmissionFilesProps) {
  if (fileUrls.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {fileUrls.map((url, i) => {
        const type = resolveFileType(url, submissionType);
        const name = submissionFileName(url);

        if (type === "audio") {
          return (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
              <p className="text-xs text-[#4D4D4D] mb-2 truncate">{name}</p>
              {/* preload="metadata" so a page of submissions doesn't pull
                  down every recording before the teacher plays one. */}
              <audio controls preload="metadata" src={url} className="w-full">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Download audio
                </a>
              </audio>
            </div>
          );
        }

        if (type === "video") {
          return (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-black">
              <video
                controls
                preload="metadata"
                src={url}
                className="w-full max-h-[360px] bg-black"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Download video
                </a>
              </video>
              <p className="text-xs text-white/70 px-3 py-2 truncate bg-black/90">{name}</p>
            </div>
          );
        }

        if (type === "image") {
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-gray-200 rounded-xl overflow-hidden hover:border-[#1F4FD8]/30 transition-colors"
              title={`Open ${name} in a new tab`}
            >
              {/* Plain <img>: these are Supabase storage URLs from an
                  arbitrary project host, which next/image would need
                  configured in next.config remotePatterns. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
                className="w-full max-h-[360px] object-contain bg-gray-50"
              />
              <p className="flex items-center gap-1.5 text-xs text-[#4D4D4D] px-3 py-2 truncate">
                <Download className="w-3.5 h-3.5 text-[#1F4FD8]" />
                {name}
              </p>
            </a>
          );
        }

        return <DocumentRow key={i} url={url} />;
      })}
    </div>
  );
}
