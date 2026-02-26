'use client';

import { title } from 'process';
import React, { useEffect, useState } from 'react';

interface PricingFactor {
  label: string;
}

interface ProgramFeature {
  text: string;
}

type Pricing = {
  title: string;
  description: string;
  priceTitle: string;
  priceLabel: string[];
  programmeTitle: string;
  programmeFeature: string[];
}

const pricingFactors = [
  'Subject complexity',
  'Session frequency',
  'Program duration',
  'Number of subjects',
];

const programFeatures = [
  'Personalized curriculum based on assessment' ,
  '1-on-1 live subject-specialist instruction' ,
  'Digital learning materials and resources' ,
  'Progress tracking and detailed reports' ,
  '24/7 support access' ,
  'Homework help and exam preparation' ,
];

const FALL_BACK_CONTENT = {
  title: "Investment in Your Future",
  description: "Flexible Packages Tailored to Your Needs",
  priceTitle: "Pricing varies by",
  priceLabel: pricingFactors,
  programmeTitle: "All programs include",
  programmeFeature: programFeatures
}

export default function PricingSection() {
  const [content,setContent] = useState<Pricing | null>(null);

  useEffect(() => {
        let mounted = true;
    
        const load = async () => {
          try {
            const contentRes = await fetch("/api/pricing");
            if (!contentRes.ok) {
              throw new Error("Failed to load Overview content");
            }
    
            const contentData = (await contentRes.json()) as Pricing;
    
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
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Pricing Card */}
        <div className="relative md:bg-gradient-to-r bg-gradient-to-b md:from-[#FFF048] from-[#2C52BF] via-[#3CA7E9] md:to-[#2C52BF] to-[#FFF048] rounded-[3rem] overflow-hidden shadow-2xl">
          {/* Diagonal Split Background */}
          <div className="absolute inset-0">
            <div className="absolute md:w-[750px] h-1/2 md:h-full top-1/2 md:top-0 inset-0 md:bg-gradient-to-r bg-gradient-to-t from-[#FFF048] to-[#FBC948] md:rounded-br-[250px] md:rounded-tr-[250px] rounded-tl-[180px] md:rounded-tl-none rounded-tr-[180px]"></div>
            
          </div>

          {/* Content Container */}
          <div className="relative flex flex-col-reverse md:flex-row gap-32 md:gap-8 p-12 lg:p-16">
            {/* Left Side - Yellow Section */}
            <div className="text-gray-900 md:w-[638px]">
              {/* Heading */}
              <h2 className="md:mb-4 text-[#2B2B2B] font-poppins font-bold text-[20px] md:text-5xl leading-cap leading-100% tracking-normal">
                {
                  content?.title?.split(" ").map((word, index) => (
                    <span key={index} className={`${index == content?.title?.split(" ").length - 1 ? "text-[#1F4FD8]" : ""}`}>{word} </span>
                  )) ?? FALL_BACK_CONTENT?.title?.split(" ").map((word, index) => (
                    <span key={index} className={`${index == FALL_BACK_CONTENT?.title?.split(" ").length - 1 ? "text-[#1F4FD8]" : ""}`}>{word} </span>
                  ))
                }
              </h2>
              <p className="text-[#4D4D4D] mb-2 md:mb-8 font-nunito-sans font-normal text-[12px] md:text-base leading-cap leading-100% tracking-normal">
                {content?.description ?? FALL_BACK_CONTENT?.description}
              </p>

              {/* Pricing Factors */}
              <div className="mb-10">
                <h3 className="text-[#4D4D4D] mb-2 md:mb-4 font-nunito-sans font-bold text-[14px] md:text-xl leading-cap leading-100% tracking-normal">
                  {content?.priceTitle ?? FALL_BACK_CONTENT?.priceTitle}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {content?.priceLabel?.map((factor,index) => (
                    <span
                      key={index}
                      className="bg-[#FFFFFF] text-[#2B2B2B] px-5 py-2.5 rounded-full shadow-sm font-poppins font-medium text-[10px] md:text-sm leading-cap leading-100% tracking-normal"
                    >
                      {factor}
                    </span>
                  )) ?? FALL_BACK_CONTENT?.priceLabel?.map((factor,index) => (
                    <span
                      key={index}
                      className="bg-[#FFFFFF] text-[#2B2B2B] px-5 py-2.5 rounded-full shadow-sm font-poppins font-medium text-sm leading-cap leading-100% tracking-normal"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <a href="#contact" className="group w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 md:px-8 py-2 md:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-3">
                <span className="">Book Free Consultation</span>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                  <img src="./arrow-up-line.png" alt="" />
                </div>
              </a>
            </div>

            {/* Right Side - Blue Section */}
            <div className="text-white md:absolute md:right-20 flex flex-col justify-center gap-3">
              <h3 className=" w-full font-poppins font-bold text-[16px] md:text-lg leading-cap leading-100% tracking-normal">{content?.programmeTitle ?? FALL_BACK_CONTENT?.programmeTitle}</h3>
              <ul className="space-y-5">
                {content?.programmeFeature?.map((feature,index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-white mt-0.5 flex-shrink-0 font-poppins font-medium text-[12px] md:text-lg leading-cap leading-100% tracking-normal">
                      •
                    </span>
                    <span className="text-white leading-relaxed font-poppins font-medium text-[12px] md:text-lg leading-cap leading-100% tracking-normal">
                      {feature}
                    </span>
                  </li>
                )) ?? FALL_BACK_CONTENT?.programmeFeature?.map((feature,index) => (
                   <li key={index} className="flex items-start gap-1">
                    <span className="text-white mt-0.5 flex-shrink-0 font-poppins font-medium text-[12px] md:text-lg leading-cap leading-100% tracking-normal">
                      •
                    </span>
                    <span className="text-white leading-relaxed font-poppins font-medium text-[12px] md:text-lg leading-cap leading-100% tracking-normal">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}