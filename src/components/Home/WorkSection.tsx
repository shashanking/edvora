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
    <section className="relative w-full min-h-screen py-20 px-6 lg:px-12 overflow-hidden">
      {/* Decorative ruler - top right */}
      <div className="absolute top-5 md:top-4 -right-27 md:right-6 z-20">
        <img src="./scale 1.png" alt="" className='w-1/2 md:w-2/3' />
      </div>

      {/* Decorative paperclip - bottom left */}
      <div className="absolute bottom-40 md:bottom-16 left-0">
       <img src="./clip 1.png" alt="" className='w-1/2 md:w-2/3' />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left side */}
          <div className='flex flex-col md:flex-row items-center gap-16 h-full'>

            {/* Steps */}
            <div className="space-y-8 relative">
              {content?.card.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-6 p-px rounded-2xl transition-all duration-300 ${index%2==0 ? "bg-gradient-to-r from-[#1F4FD8] to-[#FFFFFF]" : "bg-gradient-to-l from-[#1F4FD8] to-[#FFFFFF]"}`}
                >
                  {/* Content card */}
                  <div
                    className={`flex-1 rounded-2xl p-6 shadow-lg hover:shadow-xl
                      bg-white transition-all duration-300 ${index===isActiveIndex ? index%2==0 ? "bg-linear-to-r from-[#1F4FD833] to-[#FFFFFF00]" : "bg-linear-to-l from-[#1F4FD833] to-[#FFFFFF00]" : "bg-white"} border border-gradient-to-r from-[#1F4FD833] to-[#FFFFFF00]`}
                  >
                    <h3 className="text-[#1F4FD8] mb-3 font-semibold text-base leading-none">
                      {step?.title}
                    </h3>
                    <p className="text-[#4D4D4D] font-normal text-[12px] md:text-base leading-none">
                      {step?.description}
                    </p>
                  </div>
                </div>
              )) ?? FALLBACK_CONTENT.card.map((step, index) => (
                <div
                  key={step._id}
                  className={`flex items-start gap-6`}
                >
                  {/* Content card */}
                  <div
                    className={`flex-1 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300  border border-gradient-to-r from-[#1F4FD833] to-[#FFFFFF00]`}
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
            <div className='relative md:ml-8 flex items-center justify-center relative h-full md:w-fit w-full'>
              <div className='absolute w-full z-10 flex md:flex-col items-center justify-between md:justify-center gap-8'>
                {
                  Array.from({ length: steps.length }).map((_, index) => (
                    <div key={index} className={`h-10 w-10 md:h-20 md:w-20 rounded-full border-4 md:border-8 border-[#1F4FD8] flex items-center justify-center text-[20px] md:text-[48px] font-poppins font-semibold text-[#1F4FD8] font-bold ${isActiveIndex === index ? "bg-[#1F4FD8] text-white" : "bg-white"}`}>{index+1}</div>
                  ))
                }
                  </div>
                    <div className=' w-full h-1  md:h-full md:w-1 bg-gradient-to-r from-[#2C52BF00] via-[#2C52BF] to-[#2C52BF00] md:bg-gradient-to-b from-[#2C52BF00] via-[#2C52BF] to-[#2C52BF00]'></div>
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

              <div className='w-full relative'>
                <button
                  onClick={() => {
                    const el = document.getElementById('coming-soon-work');
                    if (el) { el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 2000); }
                  }}
                  className="px-10 py-4 w-full md:w-auto bg-[#FFC83D] hover:bg-[#FBBF24] text-[#2B2B2B] rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-poppins font-semibold text-[12px] md:text-sm leading-none leading-100% tracking-normal"
                >
                  Get Started Today
                </button>
                <div id="coming-soon-work" className="hidden absolute left-1/2 -translate-x-1/2 -top-12 bg-[#1C1C28] text-white text-sm font-poppins font-semibold px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap z-50">
                  🚀 Coming Soon!
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default HowItWorksSection;