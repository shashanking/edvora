"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type BlogCard = {
  _id: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  excerpt: string;
  imageUrl: string;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogCard[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/blog");
        if (!res.ok) throw new Error("Failed to load blogs");
        const data = (await res.json()) as BlogCard[];
        if (!mounted) return;
        setBlogs(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setBlogs([]);
      } finally {
        if (mounted) setLoaded(true);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="w-full bg-[#FAF9F8] py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-16">
      <div className="max-w-[1400px] mx-auto">
        {loaded && blogs && blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-poppins font-semibold text-[18px] md:text-[22px] text-[#1F4FD8]">
              No articles published yet.
            </p>
            <p className="font-nunito text-[#2B2B2B]/70 mt-2">
              Check back soon — fresh learning insights are on the way.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {(blogs ?? Array.from({ length: 6 })).map((blog, i) => {
              if (!blog) {
                // Skeleton while loading
                return (
                  <div
                    key={i}
                    className="bg-white rounded-[24px] border-2 border-[#0F3CB4]/10 p-5 animate-pulse"
                  >
                    <div className="w-full h-[200px] bg-[#D9E6FF] rounded-[12px]" />
                    <div className="h-4 bg-[#D9E6FF] rounded-full mt-5 w-1/3" />
                    <div className="h-5 bg-[#D9E6FF] rounded-full mt-4 w-3/4" />
                    <div className="h-3 bg-[#D9E6FF] rounded-full mt-4 w-full" />
                  </div>
                );
              }

              return (
                <Link
                  key={blog._id}
                  href={`/blogs/${blog.slug}`}
                  className="group bg-white rounded-[24px] border-2 border-[#0F3CB4]/15 p-5 flex flex-col gap-4 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 shadow-[0_20px_60px_rgba(15,60,180,0.10)]"
                >
                  <div className="w-full h-[200px] bg-[#D9E6FF] rounded-[12px] overflow-hidden">
                    {blog.imageUrl ? (
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 text-[12px] font-nunito text-[#1F4FD8] font-semibold">
                    {formatDate(blog.date)}
                    {blog.author ? (
                      <>
                        <span className="text-[#2B2B2B]/30">•</span>
                        <span className="text-[#2B2B2B]/60">{blog.author}</span>
                      </>
                    ) : null}
                  </div>

                  <h3 className="font-poppins font-semibold text-[20px] md:text-[22px] leading-tight text-[#082A6B] line-clamp-2">
                    {blog.title}
                  </h3>

                  {blog.excerpt ? (
                    <p className="font-nunito text-[14px] text-[#17315F]/80 leading-relaxed line-clamp-3">
                      {blog.excerpt}
                    </p>
                  ) : null}

                  <span className="mt-auto inline-flex items-center gap-2 font-poppins font-semibold text-[#1F4FD8] text-[15px]">
                    Read article
                    <span className="w-6 h-6 bg-[#FFC83D] rounded-full flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-[#2B2B2B] group-hover:rotate-45 transition-transform duration-300" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogList;
