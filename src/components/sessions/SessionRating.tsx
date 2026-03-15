"use client";

import React, { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Star, Loader2 } from "lucide-react";

interface SessionRatingProps {
  sessionId: string;
  existingRating?: number | null;
  existingComment?: string | null;
  onRated?: () => void;
}

export default function SessionRating({
  sessionId,
  existingRating,
  existingComment,
  onRated,
}: SessionRatingProps) {
  const supabase = createClient() as any;
  const [rating, setRating] = useState(existingRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingComment || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingRating);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: upsertError } = await supabase
      .from("session_ratings")
      .upsert(
        {
          session_id: sessionId,
          student_id: user.id,
          rating,
          comment: comment.trim() || null,
        } as any,
        { onConflict: "session_id,student_id" }
      );

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSaved(true);
      onRated?.();
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-sm font-medium text-[#1C1C28] mb-2">Rate this session</p>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => { setRating(star); setSaved(false); }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoverRating || rating)
                  ? "fill-[#FFC83D] text-[#FFC83D]"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-[#4D4D4D] ml-2 self-center">{rating}/5</span>}
      </div>

      <textarea
        value={comment}
        onChange={(e) => { setComment(e.target.value); setSaved(false); }}
        placeholder="Optional feedback..."
        rows={2}
        className="w-full px-3 py-2 border border-[#D4D4D4] rounded-lg bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] mb-2"
      />

      <button
        onClick={handleSubmit}
        disabled={saving || (saved && rating === existingRating)}
        className="px-4 py-2 bg-[#1F4FD8] hover:bg-[#1a45c2] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-1.5"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "Saved" : "Submit Rating"}
      </button>
    </div>
  );
}
