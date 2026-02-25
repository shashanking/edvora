"use client";

import React, { useState } from "react";

type AdultCategory = "professional" | "academic";

type CourseItem = {
  program: string;
  duration: string;
  gain: string;
  image: string;
  rating: number;
};

const ADULT_PROFESSIONAL: CourseItem[] = [
  { program: "Spoken English & Personality Development", duration: "9 months", gain: "Speak fluently, command attention, and lead with charisma", image: "./DemoImage.png", rating: 4 },
  { program: "Business Communication", duration: "3 months", gain: "Write professional emails, reports, and presentations", image: "./Educators.png", rating: 4 },
  { program: "Interview Preparation", duration: "3 months", gain: "Land your dream job with proven interview strategies", image: "./About.jpg", rating: 4 },
];

const ADULT_ACADEMIC: CourseItem[] = [
  { program: "Advanced Mathematics", duration: "Flexible", gain: "Master calculus, statistics, and higher-level concepts", image: "./Mathematics.png", rating: 4 },
  { program: "Science Subjects", duration: "Flexible", gain: "University-level support in Biology, Chemistry, Physics", image: "./Image 01.png", rating: 4 },
  { program: "English Literature & Writing", duration: "Flexible", gain: "Critical analysis, essay writing, and academic communication", image: "./english_class.png", rating: 4 },
];

const CATEGORY_MAP: Record<AdultCategory, CourseItem[]> = {
  professional: ADULT_PROFESSIONAL,
  academic: ADULT_ACADEMIC,
};

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="24" height="25" viewBox="0 0 24 25" fill={filled ? "#EEBF18" : "none"} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5L15.09 8.76L22 9.77L17 14.64L18.18 21.52L12 18.27L5.82 21.52L7 14.64L2 9.77L8.91 8.76L12 2.5Z" stroke="#EEBF18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CourseCard = ({ item }: { item: CourseItem }) => (
  <div className="bg-white rounded-[24px] border-2 border-[#1F4FD8] p-5 flex flex-col gap-4 w-full max-w-[501px] mx-auto hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
    {/* Image */}
    <div className="w-full h-[240px] bg-[#E2E2E2] rounded-[12px] overflow-hidden relative">
      <img src={item.image} alt={item.program} className="w-full h-full object-cover" />
    </div>

    {/* Text Content */}
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-[#1C1C28] font-poppins font-semibold text-[20px] md:text-[24px] leading-[30px]">{item.program}</h3>
      <p className="text-[#4D4D4D] font-['Nunito_Sans'] font-normal text-[16px] md:text-[18px] leading-[25px]">{item.gain}</p>

      {/* Duration & Rating */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[#1C1C28] font-poppins font-normal text-[12px] leading-[18px]">Duration</span>
          <span className="text-[#1C1C28] font-poppins font-semibold text-[20px] leading-[30px]">{item.duration}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[#1C1C28] font-poppins font-normal text-[12px] leading-[18px]">Rating</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= item.rating} />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* CTA */}
    <a href="#contact" className="w-full h-[50px] bg-[#1F4FD8] hover:bg-[#1a45c2] text-[#F9FAFB] font-poppins font-semibold text-[20px] leading-[30px] rounded-[66px] transition-all duration-300 flex items-center justify-center">
      Enroll Now!
    </a>
  </div>
);

const AdultLearnersSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AdultCategory>("professional");
  const courses = CATEGORY_MAP[selectedCategory];

  return (
    <section id="adult-learners" className="relative w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-6 lg:px-12 overflow-hidden">
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
            <h2 className="md:mb-1 font-poppins font-extrabold text-[20px] md:text-[48px] leading-15 tracking-normal flex gap-4">
              <span className="text-[#1F4FD8]">FOR</span>
              <span className="text-[#2B2B2B]">ADULT LEARNERS</span>
            </h2>
            <p className="text-[#4D4D4D] font-poppins font-semibold text-[14px] md:text-[28px] leading-none tracking-normal mb-2">(Ages 16+)</p>
            <p className="text-[#4D4D4D] font-nunito font-semibold text-[12px] md:text-[20px] leading-none tracking-normal">
              Advancing Your Skills &amp; Career
            </p>
          </div>

          {/* Right - Category Tabs */}
          <div className="w-full lg:w-auto flex flex-col items-center justify-center md:py-3">
            <div className="flex md:gap-2">
              <button
                onClick={() => setSelectedCategory("professional")}
                className={`px-4 md:px-6 py-2.5 rounded-full transition-all duration-300 font-nunito font-semibold text-[10px] md:text-[16px] leading-none tracking-normal ${
                  selectedCategory === "professional"
                    ? "bg-[#1F4FD8] text-white shadow-lg"
                    : "bg-white text-[#2B2B2B] hover:bg-gray-100 border border-gray-200"
                }`}
              >
                PROFESSIONAL DEVELOPMENT
              </button>
              <button
                onClick={() => setSelectedCategory("academic")}
                className={`px-4 md:px-6 py-2.5 rounded-full transition-all duration-300 font-nunito font-semibold text-[10px] md:text-[16px] leading-none tracking-normal ${
                  selectedCategory === "academic"
                    ? "bg-[#1F4FD8] text-white shadow-lg"
                    : "bg-white text-[#2B2B2B] hover:bg-gray-100 border border-gray-200"
                }`}
              >
                ACADEMIC SUPPORT
              </button>
            </div>
          </div>
        </div>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {courses.map((course) => (
            <CourseCard key={course.program} item={course} />
          ))}
        </div>

        {/* Book Free Trial Button */}
        <div className="flex justify-center w-full">
          <a href="#contact" className="w-full md:w-auto px-12 py-4 bg-[#FFC83D] hover:bg-[#FBBF24] text-[#2B2B2B] text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-poppins font-semibold text-[20px] leading-none tracking-normal text-center inline-block">
            Book Free Trial
          </a>
        </div>
      </div>
    </section>
  );
};

export default AdultLearnersSection;
