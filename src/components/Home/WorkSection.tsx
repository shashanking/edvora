'use client';

import React, { use, useEffect, useState } from 'react';

type Card = {
  _id: string;
  title: string;
  description: string;
  alignment: 'left' | 'right';
}

type HowItWorks = {
  heading: string;
  description: string;
  card: Card[];
}

const steps: Card[] = [
    {
      _id: "1",
      title: 'Free Assessment',
      description: 'Book a 45-minute evaluation where we identify your current level, learning gaps, and goals across any subject.',
      alignment: 'left',
    },
    {
      _id: "2",
      title: 'Personalized Plan',
      description: 'Receive a customized curriculum designed by subject specialists specifically for your needs.',
      alignment: 'right',
    },
    {
      _id: "3",
      title: 'Start Learning',
      description: 'Begin 1-on-1 live sessions with your dedicated subject expert at times that suit you.',
      alignment: 'left',
    },
  ];

const FALLBACK_CONTENT: HowItWorks = {
  heading: "How It Works",
  description: "Learn how we can help you succeed in your studies.",
  card: steps
}

const HowItWorksSection: React.FC = () => {
  const [content, setContent] = useState<HowItWorks | null>(null);
  const [isActiveIndex, setIsActiveIndex] = useState<number>(0);

  useEffect(() => {
      let mounted = true;
  
      const load = async () => {
        try {
          const contentRes = await fetch("/api/howItWorks");
          if (!contentRes.ok) {
            throw new Error("Failed to load Overview content");
          }
  
          const contentData = (await contentRes.json()) as HowItWorks;
  
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
  let i = 0;

  const interval = setInterval(() => {
    setIsActiveIndex(i);
    i = (i + 1) % steps.length; // reset to 0 when reaches end
  }, 2000);

  return () => clearInterval(interval);
}, [steps.length]);

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-20 px-6 lg:px-12 overflow-hidden">
      {/* Decorative ruler - top right */}
      <div className="absolute top-16 right-12 hidden lg:block">
      </div>

      {/* Decorative paperclip - bottom left */}
      <div className="absolute bottom-16 left-8 hidden lg:block">
       
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left side */}
          <div className='flex items-center gap-16 h-full'>

            {/* Steps */}
            <div className="space-y-8 relative">
              {content?.card.map((step, index) => (
                <div
                  key={step._id}
                  className={`flex items-start gap-6 ${
                    index==0 ? 'ml-12' : ''
                  }`}
                >
                  {/* Content card */}
                  <div
                    className={`flex-1 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                      step.alignment === 'right' ? 'md:mr-12' : 'md:ml-12'
                    } ${index===isActiveIndex ? "bg-linear-to-r from-[#1F4FD833] to-[#FFFFFF00]" : ""} border border-gradient-to-r from-[#1F4FD833] to-[#FFFFFF00]`}
                  >
                    <h3 className="text-[#1F4FD8] mb-3 font-semibold text-base leading-none">
                      {step.title}
                    </h3>
                    <p className="text-[#4D4D4D] font-normal text-[12px] md:text-base leading-none">
                      {step.description}
                    </p>
                  </div>
                </div>
              )) ?? FALLBACK_CONTENT.card.map((step, index) => (
                <div
                  key={step._id}
                  className={`flex items-start gap-6 ${
                    index==0 ? 'ml-12' : ''
                  }`}
                >
                  {/* Content card */}
                  <div
                    className={`flex-1 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                      step.alignment === 'right' ? 'md:mr-12' : 'md:ml-12'
                    } ${index===FALLBACK_CONTENT?.card?.length-1 ? "bg-linear-to-r from-[#1F4FD833] to-[#FFFFFF00]" : ""} border border-gradient-to-r from-[#1F4FD833] to-[#FFFFFF00]`}
                  >
                    <h3 className="text-[#1F4FD8] mb-3 font-semibold text-base leading-none">
                      {step.title}
                    </h3>
                    <p className="text-[#4D4D4D] font-normal text-base leading-none">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className='relative ml-8 flex items-center justify-center relative h-full w-fit '>
              <div className='absolute z-10 flex flex-col items-center gap-8'>
                {
                  Array.from({ length: steps.length }).map((_, index) => (
                    <div key={index} className={`h-20 w-20 rounded-full border-8 border-[#1F4FD8] flex items-center justify-center text-[48px] font-poppins font-semibold text-[#1F4FD8] font-bold ${isActiveIndex === index ? "bg-[#1F4FD8] text-white" : ""}`}>{index+1}</div>
                  ))
                }
              </div>
                <div className='absolute left-1 h-full w-1 bg-gradient-to-b from-[#2C52BF00] via-[#2C52BF] to-[#2C52BF00]'></div>
              </div>
          </div>

          {/* Right side - Title and CTA */}
          <div className="flex flex-col justify-center items-center h-full lg:pl-12">
            <div className="space-y-8 w-full">
              <div>
                <h2 className="text-[20px] md:text-5xl mb-4 text-poppins font-bold leading-none tracking-normal text-center md:text-start">
                  {
                    content?.heading?.split(" ").map((word, index) => (
                      <span key={index} className={`${index === 2 ? "text-[#1F4FD8]" : "text-[#2B2B2B]"}`}>
                        {word}{" "}
                      </span>
                    )) ?? FALLBACK_CONTENT.heading?.split(" ").map((word, index) => (
                      <span key={index} className={`${index === 2 ? "text-[#1F4FD8]" : "text-[#2B2B2B]"}`}>
                        {word}{" "}
                      </span>
                    ))
                  }
                </h2>
                <p className="text-[#4D4D4D] text-nunito font-normal text-[12px] md:text-sm leading-none leading-100% tracking-normal text-center md:text-start">
                  {content?.description ?? FALLBACK_CONTENT.description}
                </p>
              </div>

              <div className='w-full'>
                <button className="px-10 py-4 w-full md:w-auto bg-[#FFC83D] hover:bg-[#FBBF24] text-[#2B2B2B] rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-poppins font-semibold text-[12px] md:text-sm leading-none leading-100% tracking-normal">
                  Get Started Today
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default HowItWorksSection;