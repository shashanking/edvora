"use client";

import { course } from "@/sanity/schemaTypes/course";
import React, { useEffect, useState } from "react";

type AgeGroup = "young" | "adult";
type ProgramCategory = "core" | "specialized" | "exam";

type Course = {
  _id: string;
  coverImageUrl: string;
  subject: string;
  description: string;
  duration: string;
  rating: number;
};
type OverviewContent = {
  heading: string;
  description: string;
};

const FALL_BACK_CONTENT: OverviewContent = {
  heading: "PROGRAMS OVERVIEW",
  description: "Building Strong Academic Foundations",
};

const ProgrammeCard = ({ card }: { card: Course }) => {
  return (
    <div className="group bg-white rounded-3xl border-2 border-[#1F4FD8] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      {/* Image placeholder */}
      <div className="overflow-hidden px-6 pt-6">
        <img src={card?.coverImageUrl} alt="" className="rounded-xl" />
      </div>

      {/* Card Content */}
      <div className="p-6">
        <h3
          className="text-[#1C1C28] mb-3 font-poppins font-semibold text-[24px] leading-7.5 tracking-normal
"
        >
          {card?.subject}
        </h3>
        <p
          className="text-[#4D4D4D] mb-6 font-nunito font-normal text-[18px] leading-none tracking-normal
"
        >
          {card?.description}
        </p>

        {/* Duration and Rating */}
        <div className="flex justify-between items-center mb-4 ">
          <div>
            <p className="text-[#1C1C28] mb-1 font-nunito font-normal text-[12px] leading-none tracking-normal">
              Duration
            </p>
            <p
              className="text-[#1C1C28] font-poppins font-semibold text-[20px] leading-none tracking-normal
"
            >
              {card?.duration}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[#1C1C28] mb-1 font-nunito font-normal text-[12px] leading-none tracking-normal">
              Rating
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${star <= card?.rating ? "fill-[#EEBF18]" : "fill-gray-300"}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
              {/* <svg className="w-4 h-4 fill-gray-300" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg> */}
            </div>
          </div>
        </div>

        {/* Enroll Button */}
        <button className="w-full bg-[#1F4FD8] hover:bg-[#1D4ED8] text-white font-semibold py-3.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl font-poppins text-[20px] leading-7.5 tracking-normal">
          Enroll Now!
        </button>
      </div>
    </div>
  );
};

const ProgramsOverviewSection: React.FC = () => {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("young");
  const [selectedCategory, setSelectedCategory] =
    useState<ProgramCategory>("core");
  const [content, setContent] = useState<OverviewContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [Courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const contentRes = await fetch("/api/overview");
        if (!contentRes.ok) {
          throw new Error("Failed to load Overview content");
        }

        const contentData = (await contentRes.json()) as OverviewContent;

        if (!mounted) return;
        setContent(contentData);
      } catch (e: any) {
        if (!mounted) return;
        setContent(null);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const contentRes = await fetch("/api/course");
        if (!contentRes.ok) {
          throw new Error("Failed to load Overview content");
        }

        const contentData = (await contentRes.json()) as Course;

        if (!mounted) return;
        setCourses(Array?.isArray(contentData) ? contentData : []);
      } catch (e: any) {
        if (!mounted) return;
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-6 lg:px-12 overflow-hidden">
      {/* Decorative yellow swirl - left */}
      <div className="absolute top-20 md:top-40 left-0 opacity-60">
        <img src="./overviewSpiral.png" alt="" className="h-10 w-10 md:h-[145px] md:w-[145px]" />
      </div>

      {/* Decorative yellow swirl - right */}
      <div className="absolute bottom-10 md:bottom-10 -right-5 md:-right-15 opacity-60">
        <img src="./Cloud 1.png" alt="" className="w-15 h-10 md:w-[175px] md:h-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 py-3">
          {/* Left - Title */}
          <div>
            <h2
              className="md:mb-3 font-poppins font-extrabold text-[20px]  md:text-[48px] leading-15 tracking-normal flex gap-4
"
            >
              {content?.heading?.split(" ")?.map((word, index) => (
                <span
                  key={index}
                  className={`${index == 0 ? "text-[#1F4FD8]" : "text-[#2B2B2B]"}`}
                >
                  {word}{" "}
                </span>
              )) ??
                FALL_BACK_CONTENT?.heading?.split(" ")?.map((word, index) => (
                  <span
                    key={index}
                    className={`${index == 0 ? "text-[#1F4FD8]" : "text-[#2B2B2B]"}`}
                  >
                    {word}{" "}
                  </span>
                ))}
            </h2>
            <p
              className="text-[#4D4D4D] font-nunito font-semibold text-[12px] md:text-[20px] leading-none tracking-normal
"
            >
              {content?.description ?? FALL_BACK_CONTENT?.description}
            </p>
          </div>

          {/* Right - Tabs Navigation */}
          <div className="w-full lg:w-auto flex flex-col items-center justify-center md:py-3">
            {/* Age Group Toggle */}
            <div className="flex bg-black rounded-full p-1 mb-3">
              <button
                onClick={() => setSelectedAge("young")}
                className={`flex-1 lg:flex-none px-3 py-2.5 rounded-full transition-all duration-300 font-nunito font-semibold text-[12px] md:text-[18px] leading-none tracking-normal
 ${
   selectedAge === "young"
     ? "bg-[#FFC83D] text-[#2B2B2B] shadow-lg"
     : "bg-transparent text-[#FFFFFF] hover:bg-yellow-100/50"
 }`}
              >
                FOR YOUNG LEARNERS (Ages 4-15)
              </button>
              <button
                onClick={() => setSelectedAge("adult")}
                className={`flex-1 lg:flex-none px-3 py-2.5 rounded-full transition-all duration-300 font-nunito font-semibold text-[12px] md:text-[18px] leading-none tracking-normal ${
                  selectedAge === "adult"
                    ? "bg-[#FFC83D] text-[#2B2B2B] shadow-lg"
                    : "bg-transparent text-[#FFFFFF] hover:bg-yellow-100/50"
                }`}
              >
                FOR ADULT LEARNERS (Ages 16+)
              </button>
            </div>

            {/* Program Category Tabs */}
            <div className="flex md:gap-2 px-8 -mt-3">
              <button
                onClick={() => setSelectedCategory("core")}
                className={`px-6 py-2.5 rounded-br-[8px] rounded-bl-[8px] md:rounded-br-[24px] md:rounded-bl-[24px] transition-all duration-300 font-nunito font-semibold text-[8px] md:text-[18px] leading-none tracking-normal ${
                  selectedCategory === "core"
                    ? "bg-[#1F4FD8] text-white shadow-lg"
                    : "bg-white text-[#2B2B2B] hover:bg-gray-100"
                }`}
              >
                CORE ACADEMICS
              </button>
              <button
                onClick={() => setSelectedCategory("specialized")}
                className={`px-6 py-2.5 rounded-br-[8px] rounded-bl-[8px] md:rounded-br-[24px] md:rounded-bl-[24px] transition-all duration-300 font-nunito font-semibold text-[8px] md:text-[18px] leading-none tracking-normal ${
                  selectedCategory === "specialized"
                    ? "bg-[#1F4FD8] text-white shadow-lg"
                    : "bg-white text-[#2B2B2B] hover:bg-gray-100"
                }`}
              >
                SPECIALIZED PROGRAMS
              </button>
              <button
                onClick={() => setSelectedCategory("exam")}
                className={`px-6 py-2.5 rounded-br-[8px] rounded-bl-[8px] md:rounded-br-[24px] md:rounded-bl-[24px] transition-all duration-300 font-nunito font-semibold text-[8px] md:text-[18px] leading-none tracking-normal ${
                  selectedCategory === "exam"
                    ? "bg-[#1F4FD8] text-white shadow-lg"
                    : "bg-white text-[#2B2B2B] hover:bg-gray-100"
                }`}
              >
                EXAM PREPARATION
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="w-full flex items-center justify-center text-[#2B2B2B]">
            Courses are Loading....
          </div>
        )}

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Cards */}
          {Courses &&
            Courses?.map((course) => (
              <ProgrammeCard key={course?._id} card={course} />
            ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center w-full">
          <button
            className="w-full md:w-auto px-12 py-4 bg-[#FFC83D] hover:bg-[#FBBF24] text-[#2B2B2B] text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-poppins font-semibold text-[20px] leading-none tracking-normal
"
          >
            View All
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProgramsOverviewSection;
