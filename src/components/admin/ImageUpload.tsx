"use client";

import React, { useState, useRef } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  bucket = "assets",
  folder = "courses" 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extract file path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.findIndex(part => part === bucket);
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join("/");
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (err) {
      console.error("Error removing file:", err);
    }

    onChange("");
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
            <img
              src={value}
              alt="Course thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#1F4FD8] hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-3 text-[#4D4D4D] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-[#1F4FD8]/30 border-t-[#1F4FD8] rounded-full animate-spin" />
              <p className="text-sm font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#1C1C28]">Click to upload image</p>
                <p className="text-xs text-[#9CA3AF] mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
