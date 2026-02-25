"use client";

import React, { useEffect, useState } from "react";

type Testimonial = {
  name: string;
  imageUrl: string;
  rating: number;
  category: string;
  description: string;
  subtitle: string;
  globalIndex?: number;
};

type TestimonialPage = {
  heading: string;
  description: string;
  card: Testimonial[];
};

const testimonials: Testimonial[] = [
  {
    name: "Emma White",
    imageUrl: "./Ellipse 8.png",
    rating: 5,
    category: "Mathematics",
    description:
      "My daughter went from failing algebra to getting an A in just 4 months. The personalized attention made all the difference.",
    subtitle: "Parent of a 7-year-old",
  },
  {
    name: "Priya M",
    imageUrl: "Ellipse 10.png",
    rating: 5,
    category: "Professional Skills",
    description:
      "Within 6 months, I went from fumbling in meetings to presenting confidently to C-suite executives.",
    subtitle: "Priya M., Marketing Manager",
  },
  {
    name: "Amir K",
    imageUrl: "Ellipse 5.png",
    rating: 4,
    category: "Science",
    description:
      "Addify Academy's chemistry tutor made complex concepts so simple. I finally understood stoichiometry and aced my GCSE!",
    subtitle: "Amir K., Student, Age 15",
  },
  {
    name: "Sarah L",
    imageUrl: "Ellipse 11.png",
    rating: 5,
    category: "Mathematics",
    description:
      "My daughter went from failing algebra to getting an A in just 4 months. The personalized attention made all the difference.",
    subtitle: "Sarah L., Parent, London",
  },
  {
    name: "Mike Angelo",
    imageUrl: "Ellipse 9.png",
    rating: 4,
    category: "Mathematics",
    description:
      "My daughter went from failing algebra to getting an A in just 4 months. The personalized attention made all the difference.",
    subtitle: "Parent of a 7-year-old",
  },
];

const FALL_BACK_CONTENT: TestimonialPage = {
  heading: "Success Stories Across All Subjects",
  description: "What Parents Say",
  card: testimonials,
};

export default function TestimonialSection() {
  const visibleTestimonials = 5;
const centerSlot = Math.floor(visibleTestimonials / 2);
  const [currentIndex, setCurrentIndex] = useState(centerSlot);
  const [content, setContent] = useState<TestimonialPage | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const contentRes = await fetch("/api/testimonials");
        if (!contentRes.ok) {
          throw new Error("Failed to load Overview content");
        }

        const contentData = (await contentRes.json()) as TestimonialPage;

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

 const handleNext = () => {
  const total = (content?.card ?? FALL_BACK_CONTENT.card).length;
  setCurrentIndex((prev) => (prev + 1) % total);
};

const handlePrev = () => {
  const total = (content?.card ?? FALL_BACK_CONTENT.card).length;
  setCurrentIndex((prev) => (prev - 1 + total) % total);
};

  const getDisplayedTestimonials = () => {
  const data = content?.card ?? FALL_BACK_CONTENT.card;
  const total = data.length;

  const result = [];

  for (let i = 0; i < visibleTestimonials; i++) {
    const offset = i - centerSlot;
    let index = currentIndex + offset;

    // wrap around (optional). Remove this if you want stop at edges
    if (index < 0) index += total;
    if (index >= total) index -= total;

    result.push({
      ...data[index],
      globalIndex: index,
      slotIndex: i, // UI slot position
    });
  }

  return result;
};

  const displayedTestimonials = getDisplayedTestimonials();

  return (
    <div className="w-full min-h-screen bg-white py-20 px-4 relative overflow-hidden">
      {/* Decorative graduation cap */}
      <div className="absolute top-22 md:top-10 right-0">
        <img src="./Hat 1.png" alt="" className="w-[90px] md:w-auto" />
      </div>

      {/* Decorative letters */}
      <div className="absolute bottom-5 left-0 text-8xl font-bold">
        <img src="./ABC1.png" alt="" className="w-32.5 md:w-auto" />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="mb-4 font-poppins font-bold text-[#2B2B2B] text-[20px] md:text-6xl leading-none text-center">
            Success <span className="text-[#1F4FD8]">Stories</span> Across All
            Subjects
          </h2>
          <p className="text-[#4D4D4D] font-nunito-sans text-[12px] md:text-base leading-normal text-center">
            What Parents Say
          </p>
        </div>

        {/* Avatar row */}
        <div className="flex justify-center items-center gap-4 mb-12">
          {displayedTestimonials?.map((testimonial, index) => {
            const isActive = testimonial.slotIndex === centerSlot;
            const distanceFromCenter = Math.abs(testimonial.slotIndex - centerSlot);
            return (
              <div
                key={index}
                className={`rounded-full shrink-0 flex items-center justify-center text-3xl transition-all duration-300 ${
                  isActive
                    ? "h-20 w-20 md:w-40 md:h-40 border-4 border-[#1F4FD8]"
                    : distanceFromCenter === 1
                      ? "h-12 w-12 md:w-30 md:h-30"
                      : "w-8 h-8 md:w-24 md:h-24"
                }`}
              >
                <img
                  src={testimonial.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}
        </div>

        {/* Testimonial cards */}
        <div className="flex items-center justify-center overflow-hidden gap-6 mb-12">
          {displayedTestimonials?.map((testimonial, index) => {
            const isActive = testimonial.slotIndex === centerSlot;
            return (
              <div
                key={index}
                className={`bg-white w-50 md:w-107.5 rounded-2xl p-5 gap-4 shadow-sm transition-all duration-300 shrink-0  ${isActive ? "border-2 border-blue-600" : "border border-gray-200 opacity-70"}`}
              >
                {/* Card header */}
                <div className="flex items-center gap-4 md:mb-6">
                  <div className="w-9 h-9 md:w-15 md:h-15 rounded-full flex items-center justify-center text-2xl">
                    <img src={testimonial.imageUrl} alt="" />
                  </div>
                  <div>
                    <h3 className=" text-[#2B2B2B] font-poppins text-[14px] md:text-lg leading-normal">
                      {testimonial.name}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < testimonial.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#2C52BF] to-transparent mb-6" />

                {/* Card content */}
                <div>
                  <h4 className="hidden md:block font-semibold text-[#4D4D4D] mb-3 font-nunito-sans text-lg leading-6">
                    {testimonial.category}
                  </h4>
                  <p className="text-[#4D4D4D] mb-4 font-nunito-sans text-[12px] md:text-base leading-6">
                    {testimonial.description}
                  </p>
                  <p className="text-[#4D4D4D] font-nunito-sans text-[12px] md:text-base font-bold leading-6">
                    — {testimonial.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-14 h-14 rounded-full bg-[#1F4FD8] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous testimonials"
          >
            <img src="./leftArrow.png" alt="" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === testimonials.length - 1}
            className="w-14 h-14 rounded-full bg-[#1F4FD8] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next testimonials"
          >
            <img src="./rightArrow.png" alt="" />
          </button>
        </div>
      </div>
    </div>
  );
}
