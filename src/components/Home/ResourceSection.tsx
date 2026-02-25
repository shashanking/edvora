'use client';

import React, { useEffect, useState } from 'react';

interface ResourceItem {
  title: string;
  iconUrl: string;
}

interface ResourceSection {
  title: string;
  iconUrl: string;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  itemBgColor: string;
  itemBorderColor: string;
  itemIconBg: string;
  items: ResourceItem[];
  dividerBgColor: string;
}

type ResourceSectionPage = {
  title: string;
  description: string;
  resourceCard: ResourceSection[];
}

const resources: ResourceSection[] = [
  {
    title: 'E-books & Guides',
    iconUrl: './book.png',
    bgColor: 'bg-gradient-to-br from-[#1F4FD833] via-[#1F4FD833] via-30% to-transparent',
    iconBgColor: 'bg-[#1F4FD8]',
    iconColor: 'text-white',
    itemBgColor: 'transparent',
    itemBorderColor: 'border-[#1F4FD8]',
    itemIconBg: 'bg-blue-100',
    dividerBgColor: 'bg-gradient-to-r from-[#2C52BF] to-[#3CA7E900]',
    items: [
      {
        title: '10 Common Math Mistakes Students Make',
        iconUrl: './cross.png',
      },
      {
        
        title: 'Science Study Strategies That Actually Work',
        iconUrl: './science-fill.png',
      },
      {
        title: 'Grammar Made Simple: A Quick Reference Guide',
        iconUrl: './text-grammar.png',
      },
    ],
  },
  {
    title: 'Video Library',
    iconUrl: './video-solid.png',
    bgColor: 'bg-gradient-to-br from-[#EEBF1833] via-[#EEBF1833] via-30% to-transparent',
    iconBgColor: 'bg-[#FFC83D]',
    iconColor: 'text-gray-900',
    itemBgColor: 'transparent',
    itemBorderColor: 'border-[#FFC83D]',
    itemIconBg: 'bg-[#4D4D4D]',
    dividerBgColor: 'bg-gradient-to-r from-[#FFC83D] to-transparent',
    items: [
      {
        
        title: 'Math concept explainers',
        iconUrl: './yellow_cross.png',
      },
      {
       
        title: 'Science experiment demonstrations',
        iconUrl: './flask.png',
      },
      {
        
        title: 'Public speaking tips',
        iconUrl: './microphone-speaking-solid.png',
      },
      {
        
        title: 'Study skills workshops',
        iconUrl: './skill-level-intermediate.png',
      },
    ],
  },
];

const FALL_BACK_CONTENT: ResourceSectionPage = {
  title: 'Learning Resources',
  description: 'Begin your journey toward knowledge and future success',
  resourceCard: resources,
};

export default function LearningResourcesSection() {
  const [content,setContent] = useState<ResourceSectionPage | null>(null);
  
    useEffect(() => {
        let mounted = true;
    
        const load = async () => {
          try {
            const contentRes = await fetch("/api/resource");
            if (!contentRes.ok) {
              throw new Error("Failed to load Overview content");
            }
    
            const contentData = (await contentRes.json()) as ResourceSectionPage;
    
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
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="mb-4 text-center text-[#2B2B2B] font-poppins font-extrabold text-[20px] md:text-5xl leading-none tracking-normal">
            {
              content?.title?.split(" ").map((word, index) => ( 
                <span key={index} className={index === 1 ? "text-[#1F4FD8]" : ""}>
                  {word}{" "}
                </span>
              )) ?? FALL_BACK_CONTENT?.title?.split(" ").map((word, index) => (
                <span key={index} className={index === 1 ? "text-[#1F4FD8]" : ""}>
                  {word}{" "}
                </span>
              ))
            }
          </h2>
          <p className="text-[#4D4D4D] text-center font-nunito-sans text-[12px] md:text-base leading-100% tracking-normal">
            {content?.description ?? FALL_BACK_CONTENT?.description}
          </p>
        </div>

        {/* Resource Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {content?.resourceCard?.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className={`${sectionIndex==0 ? "bg-gradient-to-br from-[#1F4FD833] via-[#1F4FD833] via-30% to-transparent" : "bg-gradient-to-br from-[#EEBF1833] via-[#EEBF1833] via-30% to-transparent"} rounded-3xl p-8 shadow-sm flex flex-col gap-4`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-4 md:mb-4">
                <div
                  className={`${sectionIndex==0 ? "bg-[#1F4FD8]" : "bg-[#FFC83D]"} ${section?.iconColor} w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl shadow-md`}
                >
                  <img src={section?.iconUrl} alt="" className='w-6 h-6 md:w-auto md:h-auto' />
                </div>
                <h3
                  className={`text-center font-poppins font-semibold text-[24px] md:text-2xl leading-100% tracking-normal ${
                    sectionIndex === 0 ? 'text-[#1F4FD8]' : 'text-[#2B2B2B]'
                  }`}
                >
                  {section?.title}
                </h3>
              </div>

              {/* Divider */}
              <div
                className={`${sectionIndex==0 ? "bg-gradient-to-r from-[#2C52BF] to-[#3CA7E900]" : "bg-gradient-to-r from-[#FFC83D] to-transparent"} h-[2px] rounded-[24px]`}
              ></div>

              {/* Items List */}
              <div className="space-y-4">
                {section?.items?.map((item,index) => (
                  <div
                    key={index}
                    className={`bg-transparent border-2 ${sectionIndex==0 ? "border-[#1F4FD8]": "border-[#FFC83D]"} rounded-2xl p-2 md:p-4 flex items-center gap-2 md:gap-4 hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <div
                      className={`${
                        sectionIndex === 0
                          ? 'bg-blue-100'
                          : 'bg-[#4D4D4D]'
                      } w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}
                    >
                      <img src={item?.iconUrl} alt="" className='w-4 md:w-auto' />
                    </div>
                    <p className="text-[#2B2B2B] leading-tight md:text-center font-nunito-sans font-semibold text-[14px] md:text-base leading-100% tracking-normal">
                      {item?.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )) ?? FALL_BACK_CONTENT?.resourceCard?.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className={`${section?.bgColor} rounded-3xl p-8 shadow-sm flex flex-col gap-4`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`${section?.iconBgColor} ${section?.iconColor} w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-md`}
                >
                  <img src={section?.iconUrl} alt="" />
                </div>
                <h3
                  className={`text-center font-poppins font-semibold text-2xl leading-100% tracking-normal ${
                    sectionIndex === 0 ? 'text-[#1F4FD8]' : 'text-[#2B2B2B]'
                  }`}
                >
                  {section?.title}
                </h3>
              </div>

              {/* Divider */}
              <div
                className={`${section?.dividerBgColor} h-[2px] rounded-[24px]`}
              ></div>

              {/* Items List */}
              <div className="space-y-4">
                {section?.items?.map((item,index) => (
                  <div
                    key={index}
                    className={`${section?.itemBgColor} border-2 ${section?.itemBorderColor} rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <div
                      className={`${
                        sectionIndex === 0
                          ? section?.itemIconBg
                          : section?.itemIconBg
                      } w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}
                    >
                      <img src={item?.iconUrl} alt="" />
                    </div>
                    <p className="text-[#2B2B2B] leading-tight text-center font-nunito-sans font-semibold text-base leading-100% tracking-normal">
                      {item?.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center relative">
          <button
            onClick={() => {
              const el = document.getElementById('coming-soon-resource');
              if (el) { el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 2000); }
            }}
            className="bg-[#FFC83D] hover:bg-yellow-500 text-[#2B2B2B] px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-poppins font-semibold text-sm leading-cap leading-100% tracking-normal"
          >
            View All
          </button>
          <div id="coming-soon-resource" className="hidden absolute left-1/2 -translate-x-1/2 -top-12 bg-[#1C1C28] text-white text-sm font-poppins font-semibold px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap z-50">
            🚀 Coming Soon!
          </div>
        </div>
      </div>
    </div>
  );
}