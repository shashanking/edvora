'use client';

import React, { useEffect, useState } from 'react';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  imageUrl: string;
}

type BlogPage = {
  title: string;
  description: string;
};

const blogPosts: BlogPost[] = [
  {
    _id: "1",
    imageUrl: './IMG.png',
    author: 'Nick',
    date: 'Nov 14, 2025',
    title: "How to build your child's confidence in speaking English",
    slug: "",
    content:"",
    excerpt:
      'Helping your child gain confidence in speaking English starts with creating a positive and supportive environment. Encourage daily conversations, celebrate small progress, and make learning fun through stories, games, and videos. Avoid correcting mistakes harshly—instead, guide gently and praise effort. With consistent practice and encouragement, your child will gradually speak English fluently and confidently.',
  },
  {
    _id: "2",
    imageUrl: 'kids_class.png',
    author: 'Nick',
    date: 'Nov 14, 2025',
    title: 'Why one-to-one learning works best for kids',
    slug: "",
    content:"",
    excerpt:
      'Helping your child gain confidence in speaking English starts with creating a positive and supportive environment. Encourage daily conversations, celebrate small progress, and make learning fun through stories, games, and videos. Avoid correcting mistakes harshly—instead, guide gently and praise effort. With consistent practice and encouragement, your child will gradually speak English fluently and confidently.',
  },
  {
    _id: "3",
    imageUrl: './english_class.png',
    author: 'Nick',
    date: 'Nov 14, 2025',
    title: 'Common English mistakes children make & how to fix them',
    slug: "",
    content:"",
    excerpt:
      'Helping your child gain confidence in speaking English starts with creating a positive and supportive environment. Encourage daily conversations, celebrate small progress, and make learning fun through stories, games, and videos. Avoid correcting mistakes harshly—instead, guide gently and praise effort. With consistent practice and encouragement, your child will gradually speak English fluently and confidently.',
  },
  {
    _id: "4",
    imageUrl: './IMG.png',
    author: 'Nick',
    date: 'Nov 14, 2025',
    title: "How to build your child's confidence in speaking English",
    slug: "",
    content:"",
    excerpt:
      'Helping your child gain confidence in speaking English starts with creating a positive and supportive environment. Encourage daily conversations, celebrate small progress, and make learning fun through stories, games, and videos. Avoid correcting mistakes harshly—instead, guide gently and praise effort. With consistent practice and encouragement, your child will gradually speak English fluently and confidently.',
  },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const FALL_BACK_CONTENT = blogPosts;

export default function BlogSection() {
  const [pageContent, setPageContent] = useState<BlogPage | null>(null);
  const [blogs,setBlogs] = useState<BlogPost[] | null>(null);

  useEffect(() => {
        let mounted = true;
    
        const load = async () => {
          try {
            const contentRes = await fetch("/api/blogPage");
            if (!contentRes.ok) {
              throw new Error("Failed to load blogPage content");
            }
    
            const contentData = (await contentRes.json()) as BlogPage;
    
            if (!mounted) return;
            setPageContent(contentData);
          } catch (e: any) {
            if (!mounted) return;
            setPageContent(null);
          }
        };
    
        void load();
    
        return () => {
          mounted = false;
        };
      }, []);

  useEffect(() => {
        let mounted = true;
    
        const load = async () => {
          try {
            const contentRes = await fetch("/api/blog");
            if (!contentRes.ok) {
              throw new Error("Failed to load blogs content");
            }
    
            const contentData = (await contentRes.json()) as BlogPost[];
    
            if (!mounted) return;
            setBlogs(contentData);
          } catch (e: any) {
            if (!mounted) return;
            setBlogs(null);
          }
        };
    
        void load();
    
        return () => {
          mounted = false;
        };
      }, []);
  return (
    <div id="blog" className="w-full min-h-screen bg-gradient-to-b from-white to-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center md:mb-16">
          <h2 className="mb-4 font-poppins font-extrabold text-[20px] md:text-5xl leading-none tracking-normal text-center text-[#2B2B2B]">
            {
              pageContent?.title?.split(" ")?.map((word,index)=>(
                <span key={index} className={`${index==2 ? "text-[#1F4FD8]" : ""}`}>{word}{' '}</span>
              )) ?? <div>Tips & <span className="text-[#1F4FD8]">Insights</span> for Parents</div>
            }
          </h2>
          <p className="text-[#4D4D4D] max-w-4xl mx-auto font-nunito-sans font-normal text-[12px] md:text-base leading-100% tracking-normal text-center">
           {pageContent?.description ?? " Weekly articles on learning strategies,subject-specific tips, exam preparation, and career growth"}
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 justify-center items-center gap-6 md:mb-12 p-8 md:p-0">
          {blogs?.map((post) => (
            <div
              key={post?._id}
              className="bg-white p-5 flex flex-col gap-2.5 w-80 rounded-3xl border-2 border-[#D4D4D4] overflow-hidden hover:shadow-xl transition-shadow duration-300 shrink-0"
            >
              {/* Blog Image */}
              <div className="relative h-[170px] w-[280px] rounded-[12px] flex items-center justify-center text-6xl">
                <img
                  src={post?.imageUrl}
                  alt={post?.title}
                  className="w-full h-full object-cover rounded-[12px]"
                />
              </div>

              {/* Blog Content */}
              <div className="">
                {/* Meta Info */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#FFC83D] text-[#4D4D4D] px-3 py-1.5 rounded-full font-inter font-normal text-[10px] md:text-sm leading-cap leading-100% tracking-normal">
                    By {post?.author}
                  </span>
                  <span className="text-[#505050] font-inter font-normal text-[10px] md:text-sm leading-cap leading-100% tracking-normal">{formatDate(post?.date) || ""}</span>
                </div>

                {/* Title */}
                <h3 className="text-[#1C1C28] mb-3 min-h-[60px] font-poppins font-semibold text-[16px] md:text-xl leading-none tracking-normal">
                  {post?.title}
                </h3>

                {/* Excerpt */}
                <p className="text-[#4D4D4D] leading-relaxed mb-6 font-nunito-sans font-normal text-[12px] md:text-xl leading-100% tracking-normal line-clamp-3">
                  {post?.excerpt}
                </p>

                {/* Read More Button */}
                <button className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white py-3.5 rounded-full transition-colors duration-300 font-poppins font-semibold  text-[12px] md:text-xl leading-cap leading-100% tracking-normal">
                  Read More
                </button>
              </div>
            </div>
          )) ?? FALL_BACK_CONTENT?.map((post) => (
            <div
              key={post?._id}
              className="bg-white p-5 flex flex-col gap-2.5 w-80 rounded-3xl border-2 border-[#D4D4D4] overflow-hidden hover:shadow-xl transition-shadow duration-300 shrink-0"
            >
              {/* Blog Image */}
              <div className="relative h-[170px] w-[280px] rounded-[12px] flex items-center justify-center text-6xl">
                <img
                  src={post?.imageUrl}
                  alt={post?.title}
                  className="w-full h-full object-cover rounded-[12px]"
                />
              </div>

              {/* Blog Content */}
              <div className="">
                {/* Meta Info */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#FFC83D] text-[#4D4D4D] px-3 py-1.5 rounded-full font-inter font-normal text-sm leading-cap leading-100% tracking-normal">
                    By {post?.author}
                  </span>
                  <span className="text-[#505050] font-inter font-normal text-sm leading-cap leading-100% tracking-normal">{formatDate(post?.date) || ""}</span>
                </div>

                {/* Title */}
                <h3 className="text-[#1C1C28] mb-3 min-h-[60px] font-poppins font-semibold text-xl leading-none tracking-normal">
                  {post?.title}
                </h3>

                {/* Excerpt */}
                <p className="text-[#4D4D4D] leading-relaxed mb-6 font-nunito-sans font-normal text-xl leading-100% tracking-normal line-clamp-3">
                  {post?.excerpt}
                </p>

                {/* Read More Button */}
                <button className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white py-3.5 rounded-full transition-colors duration-300 font-poppins font-semibold text-xl leading-cap leading-100% tracking-normal">
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center px-8 md:px-0">
          <button className="bg-[#FFC83D] text-[#2B2B2B] w-full md:w-auto px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-poppins font-semibold text-[12px] md:text-xl leading-cap leading-100% tracking-normal">
            View All
          </button>
        </div>
      </div>
    </div>
  );
}