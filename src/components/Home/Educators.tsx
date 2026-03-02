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
  qualificationTitle: "Every Addify Academy instructor is",
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
    <section className="relative w-full min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-12 overflow-hidden">
      {/* Yellow decorative circle behind image */}
      <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] bg-[#FCD34D] rounded-full -z-10 hidden md:block" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Title */}
            <div>
              <h2 className="mb-2 md:mb-3 text-poppins font-bold text-[24px] sm:text-[28px] md:text-[36px] lg:text-5xl leading-tight tracking-normal">
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
              <p className="text-[#4D4D4D] text-nunito font-normal text-[12px] sm:text-[13px] md:text-sm leading-relaxed tracking-normal">
                {content?.description ?? FALL_BACK_CONTENT?.description}
              </p>
            </div>

            {/* Qualifications Section */}
            <div>
              <h3 className="text-[#4D4D4D] mb-3 md:mb-4 text-poppins font-bold text-[14px] sm:text-[16px] md:text-lg leading-tight tracking-normal">
                {content?.qualificationTitle ??
                  FALL_BACK_CONTENT?.qualificationTitle}
              </h3>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {content?.qualification?.map((qual, index) => (
                  <span
                    key={index}
                    className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-[#1F4FD8] text-white rounded-full shadow-md hover:bg-[#1D4ED8] transition-colors duration-300 text-nunito font-normal text-[10px] sm:text-[11px] md:text-sm leading-tight tracking-tight"
                  >
                    {qual}
                  </span>
                )) ??
                  FALL_BACK_CONTENT?.qualification?.map((qual, index) => (
                    <span
                      key={index}
                      className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-[#1F4FD8] text-white rounded-full shadow-md hover:bg-[#1D4ED8] transition-colors duration-300 text-nunito font-normal text-[10px] sm:text-[11px] md:text-sm leading-tight tracking-tight"
                    >
                      {qual}
                    </span>
                  ))}
              </div>
            </div>

            {/* Matching Criteria Section */}
            <div>
              <h3 className="text-[#4D4D4D] mb-3 md:mb-4 text-poppins font-bold text-[14px] sm:text-[16px] md:text-lg leading-tight tracking-normal">
                {content?.criteriaTitle ?? FALL_BACK_CONTENT?.criteriaTitle}
              </h3>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {content?.criteria?.map((criterion, index) => (
                  <span
                    key={index}
                    className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-white border-2 border-[#1F4FD8] text-[#1F4FD8] rounded-full shadow-sm hover:bg-blue-50 transition-colors duration-300 text-nunito font-normal text-[10px] sm:text-[11px] md:text-sm leading-tight tracking-tight"
                  >
                    {criterion}
                  </span>
                )) ??
                  FALL_BACK_CONTENT?.criteria?.map((criterion, index) => (
                    <span
                      key={index}
                      className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-white border-2 border-[#1F4FD8] text-[#1F4FD8] rounded-full shadow-sm hover:bg-blue-50 transition-colors duration-300 text-nunito font-normal text-[10px] sm:text-[11px] md:text-sm leading-tight tracking-tight"
                    >
                      {criterion}
                    </span>
                  ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 md:pt-4 w-full relative">
              <button
                onClick={() => {
                  const el = document.getElementById('coming-soon-educators');
                  if (el) { el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 2000); }
                }}
                className="w-full md:w-auto px-8 md:px-10 py-3 md:py-4 bg-[#FFC83D] hover:bg-[#FBBF24] text-gray-900 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-poppins font-semibold text-[14px] md:text-sm leading-tight tracking-normal"
              >
                Get Started Today
              </button>
              <div id="coming-soon-educators" className="hidden absolute left-1/2 -translate-x-1/2 -top-10 md:-top-12 bg-[#1C1C28] text-white text-xs md:text-sm font-poppins font-semibold px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-lg whitespace-nowrap z-50">
                🚀 Coming Soon!
              </div>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="relative flex justify-center items-center h-full overflow-hidden mt-8 lg:mt-0">
            {/* Yellow background shape */}
            <div className="absolute -right-8 sm:-right-10 md:-right-12 top-[60%] sm:top-[55%] md:top-1/2 -translate-y-1/2 w-[320px] h-[100px] sm:w-[400px] sm:h-[120px] md:w-[550px] md:h-[250px] lg:w-[700px] lg:h-[344px] bg-[#FFC83D] rounded-bl-[100px] sm:rounded-bl-[130px] md:rounded-bl-[165px] -z-10" />

            {/* Gradient border wrapper */}
            <div className="relative rounded-[20px] sm:rounded-[24px] md:rounded-[32px] p-[4px] sm:p-[5px] md:p-[6px] bg-gradient-to-br from-[#3CA7E9] to-[#2C52BF]">
              {/* Image container */}
              <div className="rounded-[16px] sm:rounded-[20px] md:rounded-[26px] overflow-hidden bg-white">
                <img
                  src={content?.imageUrl ?? FALL_BACK_CONTENT?.imageUrl}
                  alt="Group discussion"
                  className="h-[250px] w-[250px] sm:h-[320px] sm:w-[320px] md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px] object-cover"
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
