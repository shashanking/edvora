'use client';
import React, { useEffect, useState } from 'react';

type DemoCardContent = {
  heading: string;
  description: string;
  imageUrl: string;
  features: string[];
}

const features = [
    'No payment required',
    'One-to-one session',
    'Friendly and pressure-free',
  ];

  const FALL_BACK_CONTENT: DemoCardContent = {
    heading: 'Not Sure If It\'s Right for Your Child? Try a Free Demo.',
    description: 'Experience our teaching style and see how comfortable your child feels speaking English.',
    imageUrl: './DemoImage.png',
    features: features,
  }

const DemoCardSection: React.FC = () => {
  const [content,setContent] = useState<DemoCardContent | null>(null);

  useEffect(() => {
      let mounted = true;
  
      const load = async () => {
        try {
          const contentRes = await fetch("/api/demoCard");
          if (!contentRes.ok) {
            throw new Error("Failed to load Overview content");
          }
  
          const contentData = (await contentRes.json()) as DemoCardContent;
  
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
    <section className="w-full relative bg-gradient-to-br from-gray-50 to-white py-12 md:py-16 px-4 md:px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl bg-[#FFC83D]">
          {/* Two-tone background with diagonal split */}
          <div className="grid lg:grid-cols-2 min-h-[350px] md:min-h-[450px] lg:min-h-[400px]">
            {/* Left side - Blue background with curved edge */}
            <div className="bg-gradient-to-br from-[#3B82F6] to-[#1F4FD8] overflow-hidden rounded-br-[200px] sm:rounded-br-[280px] md:rounded-br-[350px] lg:rounded-tr-[350px] lg:rounded-br-none h-[280px] sm:h-[320px] md:h-[400px] lg:h-auto relative">
              {/* Curved diagonal edge */}
              {/* <div className="absolute top-0 right-0 bottom-0 w-32">
              </div> */}

              {/* Image placeholder */}
              <div className="absolute -top-8 sm:-top-12 md:-top-20 lg:-top-33.5 -left-4 sm:-left-8 md:-left-12 lg:-left-20 flex items-end justify-center lg:justify-start px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-8 overflow-hidden rounded-br-[200px] sm:rounded-br-[280px] md:rounded-br-[350px]">
                <img src={`${content?.imageUrl ?? FALL_BACK_CONTENT?.imageUrl}`} alt="" className='h-[320px] sm:h-[400px] md:h-[480px] lg:h-[590px] rounded-br-[200px] sm:rounded-br-[280px] md:rounded-br-[350px] object-cover' />
              </div>
            </div>

            {/* Right side - Yellow background with content */}
            <div className="bg-[#FFC83D] px-6 md:px-8 lg:px-12 py-6 md:py-8 lg:py-12 flex flex-col justify-center">
              <div className="space-y-4 md:space-y-6">
                {/* Heading */}
                <h2 className="text-poppins font-bold text-[20px] sm:text-[24px] md:text-[36px] lg:text-5xl leading-tight tracking-normal">
                  {
                    content?.heading?.split(" ")?.map((word, index) => (
                      <span key={index} className={`${index < content?.heading?.split(" ").length-2 ? 'text-[#2B2B2B]' : 'text-[#1F4FD8]'}`}>
                        {word}{" "}
                      </span>
                    )) ?? FALL_BACK_CONTENT?.heading?.split(" ")?.map((word, index) => (
                      <span key={index} className={`${index < FALL_BACK_CONTENT?.heading?.split(" ").length-2 ? 'text-[#2B2B2B]' : 'text-[#1F4FD8]'}`}>
                        {word}{" "}
                      </span>
                    ))
                  }
                </h2>

                {/* Description */}
                <p className="text-[#4D4D4D] text-nunito font-normal text-[12px] sm:text-[13px] md:text-sm leading-relaxed tracking-tight">
                  {content?.description ?? FALL_BACK_CONTENT?.description}
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {content?.features?.map((feature, index) => (
                    <span
                      key={index}
                      className="px-4 sm:px-5 py-1.5 sm:py-2 bg-white text-[#2B2B2B] rounded-full shadow-sm text-poppins font-medium text-[10px] sm:text-[11px] md:text-sm leading-tight tracking-normal"
                    >
                      {feature}
                    </span>
                  )) ?? FALL_BACK_CONTENT?.features?.map((feature, index) => (
                    <span
                      key={index}
                      className="px-4 sm:px-5 py-1.5 sm:py-2 bg-white text-[#2B2B2B] rounded-full shadow-sm text-poppins font-medium text-[10px] sm:text-[11px] md:text-sm leading-tight tracking-normal"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-2 md:pt-4">
                  <a href="#contact" className="group relative inline-flex items-center justify-between gap-2 px-7 py-3.5 bg-[#1F4FD8] hover:bg-[#1D4ED8] text-white rounded-full text-[16px] transition-all duration-300 shadow-lg font-semibold text-base leading-6 tracking-normal w-full md:w-auto
">
                {/* Hover layer */}
                
                <span className='group-hover:text-white z-10'>Book free Trial</span>
                <div
                  className="w-6.5 h-6.5 z-10 bg-[#FFFFFF] rounded-full flex items-center justify-center"
                >
                  <img src="./arrow-up-line.png" alt="" className='group-hover:rotate-45 transition-all duration-300' />
                </div>
              </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoCardSection;