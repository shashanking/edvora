"use client";
import React, { useEffect, useState } from "react";

type ourEducators = {
  heading: string;
  description: string;
  imageUrl: string;
  qualificationTitle: string;
  qualification: string[];
  criteriaTitle: string;
  criteria: string[];
};

const qualifications = [
  "Certified in their subject specialty",
  "Experienced in curriculum design",
  "Trained in personalized teaching methodologies",
  "Passionate about student success",
  "Continuously evaluated for quality",
];

const matchingCriteria = [
  "Your subject needs",
  "Learning style preferences",
  "Academic level and goals",
  "Schedule compatibility",
];

const FALL_BACK_CONTENT = {
  heading: "OUR EDUCATORS",
  description: "Learn from Subject-Matter Experts",
  imageUrl: "./educators.png",
  qualificationTitle: "Every Edvora instructor is",
  qualification: qualifications,
  criteriaTitle: "Matching Criteria",
  criteria: matchingCriteria,
};

const OurEducatorsSection: React.FC = () => {
  const [content, setContent] = useState<ourEducators | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const contentRes = await fetch("/api/ourEducators");
        if (!contentRes.ok) {
          throw new Error("Failed to load Overview content");
        }

        const contentData = (await contentRes.json()) as ourEducators;

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

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-gray-50 to-white py-20 px-6 lg:px-12 overflow-hidden">
      {/* Yellow decorative circle behind image */}
      <div className="absolute top-1/2 right-[15%] -translate-y-1/2 md:w-[500px] md:h-[500px] bg-[#FCD34D] rounded-full -z-10 hidden lg:block" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            {/* Title */}
            <div>
              <h2 className="md:mb-3 text-poppins font-bold text-[20px] md:text-5xl leading-15 tracking-normal">
                {content?.heading?.split(" ")?.map((word, index) => (
                  <span
                    key={index}
                    className={`${index === 0 ? "text-[#2B2B2B]" : "text-[#1F4FD8]"}`}
                  >
                    {word}{" "}
                  </span>
                )) ??
                  FALL_BACK_CONTENT?.heading?.split(" ")?.map((word, index) => (
                    <span
                      key={index}
                      className={`${index === 0 ? "text-[#2B2B2B]" : "text-[#1F4FD8]"}`}
                    >
                      {word}{" "}
                    </span>
                  ))}
              </h2>
              <p className="text-[#4D4D4D] text-nunito font-normal text-[12px] md:text-sm leading-none leading-100% tracking-normal">
                {content?.description ?? FALL_BACK_CONTENT?.description}
              </p>
            </div>

            {/* Qualifications Section */}
            <div>
              <h3 className="text-[#4D4D4D] mb-4 text-poppins font-bold text-[14px] md:text-lg leading-none leading-100% tracking-normal">
                {content?.qualificationTitle ??
                  FALL_BACK_CONTENT?.qualificationTitle}
              </h3>
              <div className="flex flex-wrap gap-3">
                {content?.qualification?.map((qual, index) => (
                  <span
                    key={index}
                    className="px-1.5 md:px-6 py-2 md:py-2.5 bg-[#1F4FD8] text-white rounded-full shadow-md hover:bg-[#1D4ED8] transition-colors duration-300 text-nunito font-normal text-[8px] md:text-sm leading-none leading-100% tracking-tight"
                  >
                    {qual}
                  </span>
                )) ??
                  FALL_BACK_CONTENT?.qualification?.map((qual, index) => (
                    <span
                      key={index}
                      className="px-1.5 md:px-6 py-2 md:py-2.5 bg-[#1F4FD8] text-white rounded-full shadow-md hover:bg-[#1D4ED8] transition-colors duration-300 text-nunito font-normal text-[8px] md:text-sm leading-none leading-100% tracking-tight"
                    >
                      {qual}
                    </span>
                  ))}
              </div>
            </div>

            {/* Matching Criteria Section */}
            <div>
              <h3 className="text-[#4D4D4D] mb-4 text-poppins font-bold text-[14px] md:text-lg leading-none leading-100% tracking-normal">
                {content?.criteriaTitle ?? FALL_BACK_CONTENT?.criteriaTitle}
              </h3>
              <div className="flex flex-wrap gap-3">
                {content?.criteria?.map((criterion, index) => (
                  <span
                    key={index}
                    className="px-1.5 md:px-6 py-2 md:py-2.5 bg-white border-2 border-[#1F4FD8] text-[#1F4FD8] rounded-full shadow-sm hover:bg-blue-50 transition-colors duration-300 text-nunito font-normal text-[8px] md:text-sm leading-none leading-100% tracking-tight"
                  >
                    {criterion}
                  </span>
                )) ??
                  FALL_BACK_CONTENT?.criteria?.map((criterion, index) => (
                    <span
                      key={index}
                      className="px-1.5 md:px-6 py-2 md:py-2.5 bg-white border-2 border-[#1F4FD8] text-[#1F4FD8] rounded-full shadow-sm hover:bg-blue-50 transition-colors duration-300 text-nunito font-normal text-[8px] md:text-sm leading-none leading-100% tracking-tight"
                    >
                      {criterion}
                    </span>
                  ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="md:pt-4 w-full">
              <button className="w-full md:w-auto px-10 py-4 bg-[#FFC83D] hover:bg-[#FBBF24] text-gray-900 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-poppins font-semibold text-sm leading-none leading-100% tracking-normal">
                Get Started Today
              </button>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="flex justify-center items-center h-full overflow-hidden">
            {/* Yellow background shape */}
            <div className="absolute -right-12 top-160 md:top-1/2 -translate-y-1/2 w-[430px] h-[125px] md:w-[700px] md:h-[344px] bg-[#FFC83D] rounded-bl-[165px]" />

            {/* Gradient border wrapper */}
            <div className="relative rounded-[32px] p-[6px] bg-gradient-to-br from-[#3CA7E9] to-[#2C52BF]">
              {/* Image container */}
              <div className="rounded-[26px] overflow-hidden bg-white">
                <img
                  src={content?.imageUrl ?? FALL_BACK_CONTENT?.imageUrl}
                  alt="Group discussion"
                  className="h-[300px] w-[300px] md:h-[500px] md:w-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurEducatorsSection;
