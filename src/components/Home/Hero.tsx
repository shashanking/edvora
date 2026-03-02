"use client";
import React, { useEffect } from "react";
import Navbar from "../core/NavBar";

type homeHero = {
  _id: string;
  mainTag: string;
  heading: string;
  tag: string;
  images: { url: string }[];
};

const Fall_BACK_CONTENT: homeHero = {
  _id: "",
  mainTag:
    "Certified Educators Across All Subjects | 500+ Students Transformed Globally",
  heading: "ADDIFY ACADEMY: Your Global Learning Partner",
  tag: "Master Any Subject with Expert-Led, Personalized 1-on-1 Learning",
  images: [
    { url: "./image 01.png" },
    { url: "./image 02.png" },
    { url: "./image 03.png" },
    { url: "./image 04.png" },
  ],
};

const FeaturesBar = () => {
  return (
    <section className="w-full bg-gradient-to-b from-[#102A72] to-[#1F4FD8] py-3 md:py-7 px-2 md:px-6 rounded-tl-[40px] rounded-tr-[40px] md:rounded-tl-[120px] md:rounded-tr-[120px] shadow-lg">
      <div className="max-w-[1400px] mx-auto">
        {/* Responsive layout - stack on mobile, grid with dividers on desktop */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 sm:gap-4 md:gap-4 lg:gap-8 items-center">
          {/* Academic Excellence */}
          <div className="flex flex-row items-center justify-center gap-2 md:gap-4">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 sm:h-8 sm:w-8 md:w-14 md:h-14">
                {/* Graduation cap */}
                <img src="./graduation-cap-solid.png" alt="" />
              </div>
            </div>
            <h3 className="font-bold text-center text-[10px] sm:text-[11px] md:text-[14px] lg:text-[20px] leading-tight tracking-normal text-white whitespace-normal">
              Academic Excellence
            </h3>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden lg:block w-[1px] h-16 rounded-[34px] bg-gradient-to-b from-[#FFFFFF00] via-[#FFFFFF] to-[#FFFFFF00]" />

          {/* Career Advancement */}
          <div className="flex flex-row items-center justify-center gap-2 md:gap-4">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 sm:h-8 sm:w-8 md:w-14 md:h-14">
                {/* Briefcase */}
                <img src="./tabler_briefcase-filled.png" alt="" />
              </div>
            </div>
            <h3 className="font-bold text-center text-[10px] sm:text-[11px] md:text-[14px] lg:text-[20px] leading-tight tracking-normal text-white whitespace-normal">
              Career Advancement
            </h3>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden lg:block w-[1px] h-16 rounded-[34px] bg-gradient-to-b from-[#FFFFFF00] via-[#FFFFFF] to-[#FFFFFF00]" />

          {/* Personality Development */}
          <div className="flex flex-row items-center justify-center gap-2 md:gap-4">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 sm:h-8 sm:w-8 md:w-14 md:h-14">
                {/* Health-Icon */}
                <img src="./health-care-2-remix.png" alt="" />
              </div>
            </div>
            <h3 className="font-bold text-center text-[10px] sm:text-[11px] md:text-[14px] lg:text-[20px] leading-tight tracking-normal text-white whitespace-normal">
              Personality Development
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};

const Hero = () => {
  const [content, setContent] = React.useState<homeHero | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const contentRes = await fetch("/api/home-hero");
        if (!contentRes.ok) {
          throw new Error("Failed to load podcast hero content");
        }

        const contentData = (await contentRes.json()) as homeHero;

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
    <section id="home" className="relative min-h-screen overflow-hidden px-4 md:px-8 lg:px-16 pb-28 sm:pb-32 md:pb-36 lg:pb-40">
      {/* Navbar */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <Navbar />
      </div>
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="./HeroBG.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Scattered stars */}
        {/* {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))} */}

        {/* Top-left corner crown */}
        <div className="absolute top-105 left-1 md:top-40 md:left-15 w-[80px] h-[80px]">
          <img src="./Crown.png" alt="" className="md:w-auto w-1/2" />
        </div>

        {/* Left decorative star (4-point) */}
        <div className="absolute bottom-[10%] md:bottom-[20%] left-[1%] w-[80px] h-[80px]">
          <img src="./star.png" alt="" className="w-1/4 md:w-auto" />
        </div>

        {/* Top-right decorative star (4-point with sparkle) */}
        <div className="absolute top-[15%] md:top-[12%] right-[1%] w-[80px] h-[80px]">
          <img src="./star.png" alt="" className="w-1/2 md:w-auto" />
        </div>

        {/* Bottom-right decorative triangle outline */}
        <div className="absolute bottom-[49%] md:bottom-[30%] right-[4%] w-[80px] h-[80px]">
          <img src="./Triangle.png" alt="" className="w-1/2 md:w-auto" />
        </div>

        {/* Right side bright vertical line */}
        {/* <div className="absolute top-0 right-[30%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#60A5FA] to-transparent opacity-30" /> */}
      </div>

      <div className="relative z-10 mx-auto py-12 md:py-16 lg:py-20 mt-8 md:mt-10">
        <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-8 mb-8 md:mb-0 items-center justify-center">
          {/* Left content */}
          <div className="space-y-4 md:space-y-6 w-full md:w-auto">
            {/* Top badge */}
            <div className="flex justify-start mb-4 md:mb-8">
              <div className="inline-flex items-center px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm">
                {/* <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L14.5 9H22L16 14L18.5 21L12 16L5.5 21L8 14L2 9H9.5L12 2Z"
                fill="#FCD34D"
                stroke="#FCD34D"
                strokeWidth="0.5"
              />
            </svg> */}
                <span
                  className="text-white/90 font-inter font-light text-[8px] sm:text-[10px] md:text-[16px] lg:text-[20px] leading-tight tracking-normal
"
                >
                  {content?.mainTag ?? Fall_BACK_CONTENT?.mainTag}
                </span>
              </div>
            </div>
            <h1 className="leading-tight text-[24px] sm:text-[28px] md:text-[40px] lg:text-[56px] w-fit">
              <div
                className="font-poppins font-extrabold leading-tight md:leading-none tracking-normal text-white
"
              >
                {content?.heading?.split(" ")?.map((word, index) => (
                  <span
                    key={index}
                    className={`${index >= 4 ? "text-[#E2531F]" : "text-white"}`}
                  >
                    {word}{" "}
                  </span>
                )) ??
                  Fall_BACK_CONTENT?.heading?.split(" ")?.map((word, index) => (
                    <span
                      key={index}
                      className={`${index >= 4 ? "text-[#E2531F]" : "text-white"}`}
                    >
                      {word}{" "}
                    </span>
                  ))}
              </div>
            </h1>

            <p className="text-white/90 text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-normal max-w-[560px] leading-relaxed">
              {content?.tag ?? Fall_BACK_CONTENT?.tag}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 pt-2">
              <a
                href="#contact"
                className="group relative inline-flex items-center justify-between gap-2 px-7 py-3.5 bg-[#1F4FD8] hover:bg-[#1D4ED8] text-white rounded-full text-[16px] transition-all duration-300 shadow-lg font-semibold text-base leading-6 tracking-normal w-full md:w-auto
"
              >
                {/* Hover layer */}
                

                <span className="relative z-10 group-hover:text-white transition-colors duration-300">Book free Trial</span>
                <div className="w-6.5 h-6.5 z-10  bg-[#FFFFFF] rounded-full flex items-center justify-center">
                  <img src="./arrow-up-line.png" alt="" className="group-hover:rotate-45 transition-transform duration-300" />
                </div>
              </a>

              <a
                href="#young-learners"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-[#FFC83D] hover:bg-[#FBBF24] text-gray-900 rounded-full text-[16px] transition-all duration-300 shadow-lg font-semibold text-base leading-6 tracking-normal w-full md:w-auto
"
              >
                Explore Programs
              </a>
            </div>
          </div>

          {/* Right content - Student images grid */}
          <div className="relative h-[280px] w-[280px] sm:h-[350px] sm:w-[350px] md:h-[450px] md:w-[450px] lg:h-[599px] lg:w-[599px] mt-6 md:mt-10">
            {/* Decorative curved arrow pointing to images */}
            <div className="absolute -bottom-20 left-16 sm:-bottom-24 sm:left-20 md:-left-20 md:top-24 lg:-left-76 lg:top-90 md:-translate-y-1/2 w-[80px] h-[70px] sm:w-[120px] sm:h-[100px] md:w-[180px] md:h-[150px] lg:w-[220px] lg:h-[190px]">
              <img src="./Arrow 2.png" alt="" className="w-full h-full object-contain" />
            </div>

            {/* Top-left decorative white swirl */}
            <div className="absolute -z-10 top-0 -left-[15%] md:-left-[20%] w-[60px] h-[50px] sm:w-[80px] sm:h-[70px] md:w-[120px] md:h-[100px] lg:w-[150px] lg:h-[120px]">
              <img
                src="./Shape 1 snake 1.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            {/* Student cards grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 max-w-full shrink-0">
              {/* Top-left - Pink circle (Girl with red shirt) */}
              <div className="aspect-square rounded-full bg-gradient-to-br from-[#FFB5C0] to-[#FFA3B5] overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                  <img
                    src={
                      content?.images[0]?.url ??
                      Fall_BACK_CONTENT?.images[0]?.url
                    }
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Top-right - Yellow rounded rectangle (Boy with backpack) */}
              <div
                className="aspect-square bg-gradient-to-br from-[#FCD34D] to-[#FDB022] overflow-hidden relative "
                style={{ clipPath: "circle(98% at 5% 97%)" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={
                      content?.images[2]?.url ??
                      Fall_BACK_CONTENT?.images[2]?.url
                    }
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Bottom-left - Light blue rounded rectangle (Girl with notebook) */}
              <div className="aspect-square rounded-[32px] bg-gradient-to-br from-[#A5E5F0] to-[#7DD3E8] overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                  <img
                    src={
                      content?.images[1]?.url ??
                      Fall_BACK_CONTENT?.images[1]?.url
                    }
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Bottom-right - Blue rounded rectangle (Boy with books) */}
              <div
                className="aspect-square rounded-[32px] bg-gradient-to-br from-[#3B5BA5] to-[#2948A8] overflow-hidden relative"
                style={{ clipPath: "circle(98% at 3% 5%)" }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
                  <img
                    src={
                      content?.images[3]?.url ??
                      Fall_BACK_CONTENT?.images[3]?.url
                    }
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center w-full px-4 z-20">
        <FeaturesBar />
      </div>
      <div></div>
    </section>
  );
};

export default Hero;
