'use client';
import React, { useEffect, useState } from "react";

type AboutHome = {
  heading: string;
  description: string;
  image: string;
};

const Fall_BACK_CONTENT: AboutHome = {
  heading: "ABOUT ADDIFY ACADEMY",
  description: `Addify Academy is your dedicated partner in academic and professional growth. We specialize in closing learning gaps across multiple subjects and unlocking the most confident version of you through customized, one-on-one instruction. 

Whether you're mastering English, Mathematics, Science, refining your communication skills, building executive presence, or preparing for critical exams—we provide expert guidance tailored to your unique learning needs at every milestone of your educational journey. 

Our Promise: No generic courses. No crowded classrooms. Just you, your goals, and a subject-specialist mentor committed to your success.`, 
  image: "./About.jpg",
}

const AboutSection: React.FC = () => {
  const [content, setContent] = useState<AboutHome | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      let mounted = true;
  
      const load = async () => {
        try {
          const contentRes = await fetch("/api/about-home");
          if (!contentRes.ok) {
            throw new Error("Failed to load podcast hero content");
          }
  
          const contentData = (await contentRes.json()) as AboutHome;
  
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
    <section id="about" className="relative w-full min-h-screen bg-[#1F4FD8] overflow-hidden pt-0 pb-12 md:pb-16 lg:pb-20 px-4 md:px-6 lg:px-16">
      {/* Decorative Elements */}
      {/* Top-left puzzle pieces */}
      <div className="absolute top-0 left-0">
        <img src="./Puzzle 1.png" alt="" className="h-[70px] w-[64px] md:h-[169px] md:w-[147px]" />
      </div>

      {/* Top-right graduation cap outline */}
      <div className="absolute top-5 right-3 md:top-3 md:-right-2 block">
        <img src="./Hat 1.png" alt="" className="h-[70px] w-[76px]"  />
      </div>

      {/* Bottom-right atom/science icon */}
      <div className="absolute bottom-20 -right-10">
        <img src="./Atom 1.png" alt="" className="w-[91px] h-[91px] md:h-[209px] md:w-[209px]" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 pt-12 md:pt-16 lg:pt-20">
        <div className="flex flex-col-reverse md:grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left side - Images with curved yellow background */}
          <div className="relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px]">
            {/* Yellow curved background - using clip-path for organic shape */}
            <div className="absolute -z-10 inset-0 top-[30%] -left-12 sm:-left-20 md:-left-8 lg:-left-16">
              <div className="w-[300px] sm:w-[350px] md:w-full h-1/2 bg-[#FFC83D] rounded-br-[100px] sm:rounded-br-[130px] md:rounded-br-[165px]" />
            </div>

            {/* Student images grid - pill/capsule shaped containers */}
            <div className="flex gap-1.5 sm:gap-2 absolute top-[15%] -right-8 sm:-right-16 md:right-20">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-[60px] sm:w-[80px] md:w-[120px] h-[220px] sm:h-[280px] md:h-[420px] rounded-full bg-cover bg-no-repeat
      ${i === 1 || i === 3 ? "translate-y-[30px] sm:translate-y-[40px]" : ""}
    `}
                  style={{
                    backgroundImage: `url(${content?.image ?? Fall_BACK_CONTENT.image})`,
                    backgroundPosition: `${i * 33}% center`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            <h2
              className="font-poppins font-extrabold text-[24px] sm:text-[28px] md:text-[36px] lg:text-[46px] leading-tight tracking-normal flex flex-wrap gap-2 md:gap-4
"
            >
              {
                content?.heading?.split(" ")?.map((word, index) => (
                  <span
                    key={index}
                    className={`${
                      index === 0 ? "text-white" : "text-[#FFC83D]"
                    }`}
                  >
                    {word}{" "}
                  </span>
                )) ?? Fall_BACK_CONTENT.heading?.split(" ")?.map((word, index) => (
                  <span
                    key={index}
                    className={`${
                      index === 0 ? "text-white" : "text-[#FFC83D]"
                    }`}
                  >
                    {word}{" "}
                  </span>
                ))
              }
            </h2>

            <div className="space-y-4 md:space-y-5 lg:space-y-6">
              <p
                className="text-white/95 text-[12px] sm:text-[13px] md:text-base lg:text-[17px] font-nunito font-normal leading-relaxed tracking-normal
"
              >
                {
                  content?.description?.split("\n")?.map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  )) ?? Fall_BACK_CONTENT.description?.split("\n")?.map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))
                }
              </p>
            </div>

            <div className="pt-2 md:pt-4">
              <a
                href="#contact"
                className="inline-block w-full md:w-auto px-8 md:px-9 py-3 md:py-4 bg-[#FFC83D] hover:bg-[#FBBF24] text-[#2B2B2B] rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-poppins font-semibold text-[14px] md:text-[18px] lg:text-[20px] leading-tight tracking-normal text-center
"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
