"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    duration: "",
    level: "beginner",
    category: "",
    audience: "young",
    landing_category: "core",
    rating: "4",
    display_order: "0",
    status: "draft",
    thumbnail_url: "",
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "teacher")
        .order("full_name");
      setTeachers((data as Teacher[]) || []);
    };
    fetchTeachers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        duration: form.duration || null,
        level: form.level,
        category: form.category || null,
        audience: form.audience as "young" | "adult",
        landing_category: form.landing_category as "core" | "specialized" | "exam" | "professional" | "academic",
        rating: parseFloat(form.rating) || 4,
        display_order: parseInt(form.display_order, 10) || 0,
        status: form.status as "draft" | "published" | "archived",
        thumbnail_url: form.thumbnail_url || null,
        created_by: user.id,
      } as any)
      .select("id")
      .single() as { data: { id: string } | null; error: any };

    if (courseError) {
      setError(courseError.message);
      setLoading(false);
      return;
    }

    if (course && selectedTeachers.length > 0) {
      const teacherAssignments = selectedTeachers.map((teacherId) => ({
        course_id: course.id,
        teacher_id: teacherId,
      }));
      await supabase.from("course_teachers").insert(teacherAssignments as any);
    }

    setLoading(false);
    router.push("/dashboard/admin/courses");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin/courses"
          className="p-2 text-[#4D4D4D] hover:text-[#1C1C28] hover:bg-gray-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-poppins font-bold text-[#1C1C28]">Create Course</h1>
          <p className="text-sm text-[#4D4D4D]">Add a new course to the platform</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Course Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Advanced Mathematics"
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what students will learn..."
              rows={4}
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Thumbnail URL</label>
            <input
              name="thumbnail_url"
              value={form.thumbnail_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">Course Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Price *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Currency</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Duration</label>
              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="e.g. 12 weeks"
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Level</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Audience</label>
              <select
                name="audience"
                value={form.audience}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              >
                <option value="young">Young Learners</option>
                <option value="adult">Adult Learners</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Landing Category</label>
              <select
                name="landing_category"
                value={form.landing_category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
              >
                <option value="core">Core Academics</option>
                <option value="specialized">Specialized Programs</option>
                <option value="exam">Exam Preparation</option>
                <option value="professional">Professional Development</option>
                <option value="academic">Academic Support</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Landing Rating</label>
              <input
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Display Order</label>
              <input
                name="display_order"
                type="number"
                min="0"
                value={form.display_order}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1F4FD8] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C28] mb-1.5">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#D4D4D4] rounded-xl bg-white text-[#1C1C28] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4FD8]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Assign Teachers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-poppins font-semibold text-[#1C1C28]">Assign Teachers</h2>
          {teachers.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No teachers available. Add teachers from the Teachers section first.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teachers.map((teacher) => (
                <label
                  key={teacher.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTeachers.includes(teacher.id)
                      ? "border-[#1F4FD8] bg-[#1F4FD8]/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeachers.includes(teacher.id)}
                    onChange={() => toggleTeacher(teacher.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1F4FD8] focus:ring-[#1F4FD8]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1C1C28]">{teacher.full_name}</p>
                    <p className="text-xs text-[#9CA3AF]">{teacher.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/dashboard/admin/courses"
            className="px-6 py-2.5 text-sm font-medium text-[#4D4D4D] bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] disabled:opacity-60 transition-all shadow-md"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
